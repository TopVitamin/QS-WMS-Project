import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaStep } from '@/hooks/use-pda-step'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { beep } from '@/lib/scan-beep'
import { useDb, useLookups } from '@/mock/db'
import { pdaSessionKey, usePdaOutboundSession, type PdaPickCount } from '@/stores/pda-outbound-session'
import { useSettings } from '@/stores/settings'
import type { OutboundCommand, OutboundPutback, PutbackLine } from '@/types/outbound'

export const RETURN_STEPS = ['list', 'work', 'done'] as const

/** 能放返库货的库区类型（返库上架单主PRD §三.1）；品质、货主、混放在保存时由动作再校验 */
const RETURN_ZONES = ['PICK', 'STORAGE', 'DEFECT']

/**
 * PDA 返库上架各步共用的数据与动作（《PDA返库上架前端Demo版PRD》）：
 * 按建议库位一站一站放回，扫库位确认目标，扫商品计数，数满自动保存落位并跳到下一站；全部保存后整单提交才移库。
 */
export function useReturnFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(RETURN_STEPS, 'list')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const putbacks = useDb((s) => s.outboundPutbacks)
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  const { customerCode, sku } = useLookups()
  const { confirm } = useConfirm()
  const counts = usePdaOutboundSession((s) => s.putback)
  const setPutback = usePdaOutboundSession((s) => s.setPutback)

  /** 本仓未完成的返库上架单：上架中在前，其余按创建时间倒序 */
  const openPutbacks = useMemo(
    () =>
      putbacks
        .filter((p) => p.warehouseCode === warehouseCode && p.status !== 'COMPLETED')
        .sort(
          (a, b) =>
            Number(b.status === 'PUTAWAYING') - Number(a.status === 'PUTAWAYING') ||
            b.createdAt.localeCompare(a.createdAt),
        ),
    [putbacks, warehouseCode],
  )

  const findPutback = useCallback(
    (no?: string) => (no ? putbacks.find((p) => p.no === no && p.warehouseCode === warehouseCode) : undefined),
    [putbacks, warehouseCode],
  )
  const latestPutback = useCallback(
    (no: string) => useDb.getState().outboundPutbacks.find((p) => p.no === no && p.warehouseCode === warehouseCode),
    [warehouseCode],
  )

  const master = useCallback(
    (p: OutboundPutback, skuCode: string) => skuMasters.find((m) => m.customerId === p.customerId && m.code === skuCode),
    [skuMasters],
  )

  const resolveSku = useCallback(
    (p: OutboundPutback, code: string, skuCodes: string[]) =>
      resolveInboundSkuScan(code, skuCodes, {
        ownerCode: customerCode(p.customerId),
        skuBarcodes: skuBarcodes.filter((b) => b.status === 'ENABLED'),
        primaryBarcode: (s) => master(p, s)?.primaryBarcode,
      }),
    [customerCode, master, skuBarcodes],
  )

  /** 扫到的库位：本仓存在、启用，且是存储／拣货／不良隔离库位才返回 */
  const targetOf = useCallback(
    (code: string): { code: string; usable: boolean } | undefined => {
      const key = code.trim().toUpperCase()
      const m = locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code.toUpperCase() === key)
      if (m) return { code: m.code, usable: m.status === 'ENABLED' && RETURN_ZONES.includes(m.zoneType) }
      const legacy = locations.find((l) => l.warehouseCode === warehouseCode && l.code.toUpperCase() === key)
      return legacy ? { code: legacy.code, usable: RETURN_ZONES.includes(legacy.type) } : undefined
    },
    [locationMasters, locations, warehouseCode],
  )

  /** 本行还没落位的序列号（按应返库清单顺序） */
  const serialsLeft = useCallback((line: PutbackLine) => {
    const placed = (line.placements ?? []).flatMap((pl) => pl.serialNos)
    return line.serialNos.filter((sn) => !placed.includes(sn))
  }, [])

  const countOf = useCallback(
    (p: OutboundPutback): PdaPickCount | undefined => counts[pdaSessionKey(warehouseCode, p.no)],
    [counts, warehouseCode],
  )
  const setCount = useCallback(
    (p: OutboundPutback, count?: PdaPickCount) => setPutback(pdaSessionKey(warehouseCode, p.no), count),
    [setPutback, warehouseCode],
  )
  /** 扫码处理时读最新计数：连续快扫时组件可能还没重渲染 */
  const liveCountOf = useCallback(
    (no: string): PdaPickCount | undefined => usePdaOutboundSession.getState().putback[pdaSessionKey(warehouseCode, no)],
    [warehouseCode],
  )

  const run = useCallback((command: OutboundCommand) => useDb.getState().outboundAction(command, operator), [operator])

  const notice = useCallback(
    (title: string, description?: string) => {
      beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 重录本行落位：清掉本行已保存的目标与数量，不动库存（需确认） */
  const redoLine = useCallback(
    async (p: OutboundPutback, line: PutbackLine) => {
      const ok = await confirm({
        title: t('outbound.redoReturn'),
        description: t('outbound.redoReturnConfirm', {
          sku: line.skuCode,
          count: line.savedQty,
          location: (line.placements ?? []).map((pl) => pl.location).join(t('common.listSeparator')),
        }),
        confirmText: t('outbound.redoReturn'),
        variant: 'destructive',
      })
      if (!ok) return false
      const res = run({ type: 'RESET_PUTBACK_LINE', no: p.no, lineId: line.id })
      if (!res.ok) {
        void notice(t('outbound.redoReturn'), t(res.errorKey, res.params))
        return false
      }
      return true
    },
    [confirm, notice, run, t],
  )

  return {
    t,
    nav,
    warehouseCode,
    openPutbacks,
    findPutback,
    latestPutback,
    skuName: (code: string) => sku(code)?.name,
    master,
    isSn: (line: PutbackLine) => line.serialNos.length > 0,
    resolveSku,
    targetOf,
    serialsLeft,
    countOf,
    setCount,
    liveCountOf,
    run,
    notice,
    confirm,
    redoLine,
  }
}

export type ReturnFlow = ReturnType<typeof useReturnFlow>
