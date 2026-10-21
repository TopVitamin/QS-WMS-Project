import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { beep } from '@/lib/scan-beep'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaStep } from '@/hooks/use-pda-step'
import { usePutaway } from '@/hooks/use-putaway'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { findSkuMaster } from '@/lib/sku-master'
import { useDb, useLookups } from '@/mock/db'
import { putawaySessionKey, usePdaPutawaySession, type PdaPutawayCount } from '@/stores/pda-putaway-session'
import { useSettings } from '@/stores/settings'
import type { PutawayActualLine, PutawayOrder, PutawayPlanLine } from '@/types/inbound'

export const PUTAWAY_STEPS = ['list', 'work', 'done'] as const

/**
 * PDA 上架各步共用的数据与动作（《PDA上架前端Demo版PRD》）：
 * 按推荐库位一站一站放，扫库位到站、扫商品计数，数满自动保存落位并跳到下一站；全部落完后提交上架单。
 * 保存、撤销、提交与 Web 端上架共用 savePutawayLine / removePutawayLine / submitPutawayOrder。
 */
export function usePutawayFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(PUTAWAY_STEPS, 'list')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const putaway = usePutaway(warehouseCode)
  const { removePutawayLine } = putaway
  const { customerCode, customerName, sku } = useLookups()
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const inventory = useDb((s) => s.inventory)
  const { confirm } = useConfirm()
  const counts = usePdaPutawaySession((s) => s.counts)
  const setSessionCount = usePdaPutawaySession((s) => s.setCount)

  const findOrder = useCallback(
    (putawayNo?: string) =>
      putawayNo
        ? putaway.putawayOrders.find((p) => p.putawayNo === putawayNo && p.warehouseCode === warehouseCode)
        : undefined,
    [putaway.putawayOrders, warehouseCode],
  )
  /** 最新上架单（动作刚写入 store、组件还没重渲染时用） */
  const latestOrder = useCallback(
    (putawayNo: string) =>
      useDb.getState().putawayOrders.find((p) => p.putawayNo === putawayNo && p.warehouseCode === warehouseCode),
    [warehouseCode],
  )
  /** 最新的库位校验与推荐上下文（扫码处理用） */
  const liveLocationContext = useCallback(() => {
    const s = useDb.getState()
    return { locations: s.locations, inventory: s.inventory, putawayOrders: s.putawayOrders }
  }, [])

  /** 商品解析与收货一致：SKU 编码 → 货主条码 → 主条码；范围默认是本上架单的商品 */
  const resolveSkuIn = useCallback(
    (order: PutawayOrder, code: string, skuCodes = order.planLines.map((l) => l.skuCode)) =>
      resolveInboundSkuScan(code, skuCodes, {
        ownerCode: customerCode(order.customerId),
        skuBarcodes,
        primaryBarcode: (s) => sku(s)?.barcode,
      }),
    [customerCode, sku, skuBarcodes],
  )

  const master = useCallback(
    (order: PutawayOrder, skuCode: string) => findSkuMaster(skuMasters, customerCode(order.customerId), skuCode),
    [customerCode, skuMasters],
  )
  const isSn = useCallback(
    (order: PutawayOrder, line: PutawayPlanLine) => Boolean(master(order, line.skuCode)?.snEnabled),
    [master],
  )
  /** 模拟扫码用的商品条码：主条码，没有时用 SKU 编码 */
  const barcodeOf = useCallback(
    (order: PutawayOrder, skuCode: string) => master(order, skuCode)?.primaryBarcode ?? sku(skuCode)?.barcode ?? skuCode,
    [master, sku],
  )

  /** 本行还能落位的实收 SN：来源暂存库存上的序列号，去掉本单已保存落位用过的；收货没采集 SN 时为空 */
  const serialPool = useCallback(
    (order: PutawayOrder, line: PutawayPlanLine) => {
      const used = new Set(order.actualLines.flatMap((a) => a.serialNos ?? []))
      return inventory
        .filter(
          (r) =>
            r.warehouseCode === order.warehouseCode &&
            r.locationCode === order.stagingLocationCode &&
            r.customerId === order.customerId &&
            r.skuCode === line.skuCode &&
            r.qualityType === order.qualityType &&
            r.batchNo === line.batchNo &&
            r.expiryDate === line.expiryDate,
        )
        .flatMap((r) => r.serialNos ?? [])
        .filter((sn) => !used.has(sn))
    },
    [inventory],
  )

  /**
   * 扫到的码能不能记为本行的 SN（上架单主PRD 第三节第 5 条）：有实收 SN 时必须是其中之一；
   * 收货没采集 SN 时按商品资料的 SN 规则认，没配规则照收（与 Web 端上架手录一致）。重复由调用方和保存动作再拦。
   */
  const acceptsSerial = useCallback(
    (order: PutawayOrder, line: PutawayPlanLine, code: string) => {
      if (!isSn(order, line)) return false
      const pool = serialPool(order, line)
      if (pool.length > 0) return pool.includes(code)
      const format = master(order, line.skuCode)?.snFormat?.trim()
      if (!format) return true
      try {
        return new RegExp(format).test(code)
      } catch {
        return false
      }
    },
    [isSn, master, serialPool],
  )

  const countOf = useCallback(
    (order: PutawayOrder): PdaPutawayCount | undefined => counts[putawaySessionKey(warehouseCode, order.putawayNo)],
    [counts, warehouseCode],
  )
  const setCount = useCallback(
    (order: PutawayOrder, count?: PdaPutawayCount) =>
      setSessionCount(putawaySessionKey(warehouseCode, order.putawayNo), count),
    [setSessionCount, warehouseCode],
  )
  /** 扫码处理时读最新计数：连续快扫时组件可能还没重渲染 */
  const liveCountOf = useCallback(
    (putawayNo: string): PdaPutawayCount | undefined =>
      usePdaPutawaySession.getState().counts[putawaySessionKey(warehouseCode, putawayNo)],
    [warehouseCode],
  )

  /** 业务阻断：必须点「知道了」（规范 §5） */
  const notice = useCallback(
    (title: string, description?: string) => {
      beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 撤销一条未提交的落位（需确认）：只删进度不动库存，该行剩余回到路径上 */
  const undoPlacement = useCallback(
    async (order: PutawayOrder, line: PutawayActualLine) => {
      const ok = await confirm({
        title: t('pdaPutaway.undoTitle'),
        description: t('pdaPutaway.undoDesc', { location: line.locationCode, sku: line.skuCode, qty: line.qty }),
        confirmText: t('pdaPutaway.undo'),
        variant: 'destructive',
      })
      if (!ok) return
      const res = removePutawayLine({ putawayNo: order.putawayNo, actualLineNo: line.lineNo, operator })
      if (!res.ok) void notice(t('pdaPutaway.undo'), t(res.errorKey))
    },
    [confirm, notice, operator, removePutawayLine, t],
  )

  const containerLabel = useCallback((order: PutawayOrder) => order.containerNo ?? t('inbound.bulkPiece'), [t])

  return {
    t,
    nav,
    operator,
    ...putaway,
    customerName,
    skuName: (code: string) => sku(code)?.name,
    findOrder,
    latestOrder,
    liveLocationContext,
    resolveSkuIn,
    master,
    isSn,
    barcodeOf,
    serialPool,
    acceptsSerial,
    countOf,
    setCount,
    liveCountOf,
    notice,
    confirm,
    undoPlacement,
    containerLabel,
  }
}

export type PutawayFlow = ReturnType<typeof usePutawayFlow>
