import { serialsInWarehouse } from '@/lib/serial-stock'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaStep } from '@/hooks/use-pda-step'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { beep } from '@/lib/scan-beep'
import { useDb, useLookups } from '@/mock/db'
import { openTask } from '@/mock/outbound-actions'
import { pdaSessionKey, usePdaOutboundSession, type PdaPickCount } from '@/stores/pda-outbound-session'
import { useSettings } from '@/stores/settings'
import type { OutboundCommand, OutboundPickTask, PickLine } from '@/types/outbound'

export const PICK_STEPS = ['list', 'work', 'short', 'done'] as const

/**
 * PDA 拣货各步共用的数据与动作（《PDA拣货前端Demo版PRD》）：
 * 按库位一站一站拣，扫商品计数，数满自动确认下架并跳到下一站；全部拣完后提交任务。
 * 下架、缺货、提交都走 mock/db 的 outboundAction，与管理端拣货录入共用同一套校验。
 */
export function usePickFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(PICK_STEPS, 'list')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const tasks = useDb((s) => s.outboundPickTasks)
  const inventory = useDb((s) => s.inventory)
  const serialStocks = useDb((s) => s.serialStocks)
  const inventoryLogs = useDb((s) => s.inventoryLogs)
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  const { customerCode, sku } = useLookups()
  const { confirm } = useConfirm()
  const counts = usePdaOutboundSession((s) => s.pick)
  const setPick = usePdaOutboundSession((s) => s.setPick)

  /** 本仓未结束的任务：拣货中在前，其余按创建时间倒序 */
  const openTasks = useMemo(
    () =>
      tasks
        .filter((x) => x.warehouseCode === warehouseCode && openTask(x))
        .sort(
          (a, b) =>
            Number(b.status === 'PICKING') - Number(a.status === 'PICKING') || b.createdAt.localeCompare(a.createdAt),
        ),
    [tasks, warehouseCode],
  )

  const findTask = useCallback(
    (no?: string) => (no ? tasks.find((x) => x.no === no && x.warehouseCode === warehouseCode) : undefined),
    [tasks, warehouseCode],
  )

  const master = useCallback(
    (task: OutboundPickTask, skuCode: string) =>
      skuMasters.find((m) => m.customerId === task.customerId && m.code === skuCode),
    [skuMasters],
  )

  const isSn = useCallback(
    (task: OutboundPickTask, skuCode: string) => Boolean(master(task, skuCode)?.snEnabled),
    [master],
  )

  /** 商品识别与下架校验一致：SKU 编码 → 本货主启用条码 → 主条码 */
  const resolveSku = useCallback(
    (task: OutboundPickTask, code: string, skuCodes: string[]) =>
      resolveInboundSkuScan(code, skuCodes, {
        ownerCode: customerCode(task.customerId),
        skuBarcodes: skuBarcodes.filter((b) => b.status === 'ENABLED'),
        primaryBarcode: (s) => master(task, s)?.primaryBarcode,
      }),
    [customerCode, master, skuBarcodes],
  )

  /** 扫到的是不是本仓库位：返回库位编码（按库位资料原样大小写） */
  const locationOf = useCallback(
    (code: string) => {
      const key = code.trim().toUpperCase()
      return (
        locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code.toUpperCase() === key)?.code ??
        locations.find((l) => l.warehouseCode === warehouseCode && l.code.toUpperCase() === key)?.code
      )
    },
    [locationMasters, locations, warehouseCode],
  )

  /** 来源库存上还没被拣走的序列号（候选与校验用） */
  const lineSerials = useCallback(
    (line: PickLine) => {
      const row = inventory.find((r) => r.id === line.inventoryId)
      if (!row) return []
      const used = new Set(tasks.flatMap((task) => task.assignments.flatMap((a) => a.activeSerialNos)))
      return serialsInWarehouse(
        { inventory, inventoryLogs, serialStocks },
        warehouseCode,
        row.customerId,
        row.skuCode,
        row.qualityType,
      ).filter((sn) => !used.has(sn))
    },
    [inventory, inventoryLogs, serialStocks, tasks, warehouseCode],
  )

  const countOf = useCallback(
    (task: OutboundPickTask): PdaPickCount | undefined => counts[pdaSessionKey(warehouseCode, task.no)],
    [counts, warehouseCode],
  )
  const setCount = useCallback(
    (task: OutboundPickTask, count?: PdaPickCount) => setPick(pdaSessionKey(warehouseCode, task.no), count),
    [setPick, warehouseCode],
  )
  /** 扫码处理时读最新计数：连续快扫时组件可能还没重渲染 */
  const liveCountOf = useCallback(
    (no: string): PdaPickCount | undefined => usePdaOutboundSession.getState().pick[pdaSessionKey(warehouseCode, no)],
    [warehouseCode],
  )

  const run = useCallback((command: OutboundCommand) => useDb.getState().outboundAction(command, operator), [operator])

  /** 确认下架：每次新的确认标识，重复提交同一标识不会再扣库存 */
  const pick = useCallback(
    (task: OutboundPickTask, line: PickLine, qty: number, serialNos: string[]) =>
      run({
        type: 'PICK',
        no: task.no,
        lineId: line.id,
        location: line.locationCode,
        sku: line.skuCode,
        batch: line.batchNo,
        serialNos,
        qty,
        confirmationId: crypto.randomUUID(),
      }),
    [run],
  )

  /** 业务阻断：必须点「知道了」（规范 §5） */
  const notice = useCallback(
    (title: string, description?: string) => {
      beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 最新任务（动作刚写入 store，组件还没重渲染时用） */
  const latestTask = useCallback(
    (no: string) => useDb.getState().outboundPickTasks.find((x) => x.no === no && x.warehouseCode === warehouseCode),
    [warehouseCode],
  )

  return {
    t,
    nav,
    warehouseCode,
    openTasks,
    findTask,
    latestTask,
    skuName: (code: string, customerId?: string) => sku(code, customerId)?.name,
    master,
    isSn,
    resolveSku,
    locationOf,
    lineSerials,
    countOf,
    setCount,
    liveCountOf,
    run,
    pick,
    notice,
    confirm,
  }
}

export type PickFlow = ReturnType<typeof usePickFlow>
