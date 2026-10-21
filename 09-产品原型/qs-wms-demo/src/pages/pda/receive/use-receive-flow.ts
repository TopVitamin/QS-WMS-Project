import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { pdaToast as toast } from '@/lib/pda-toast'
import { beep } from '@/lib/scan-beep'
import { useConfirm } from '@/hooks/use-confirm'
import { useInbound, useReceivableInbounds } from '@/hooks/use-inbound'
import { usePdaStep } from '@/hooks/use-pda-step'
import { canReceiveInbound, lineUnreceivedQty } from '@/lib/inbound-derive'
import { resolveInboundSkuScan, validateInboundReceiveDraft } from '@/lib/inbound-receive'
import { isNewSku } from '@/lib/new-sku'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import {
  sessionLineCount,
  useReceiveSession,
  type ReceiveSessionBox,
  type ReceiveSessionLine,
} from '@/stores/pda-receive-session'

export const RECEIVE_STEPS = ['order', 'container', 'box', 'line', 'measure', 'submit'] as const
export type ReceiveStep = (typeof RECEIVE_STEPS)[number]

/** 扫到的码不是容器号时的类型（PDA 收货 PRD §3） */
export type NonContainerKind = 'inbound' | 'cabinet' | 'sku' | 'location'

/** 良品、不良品、拒收合计 */
export function lineTotals(lines: ReceiveSessionLine[]) {
  return lines.reduce(
    (s, l) => ({ good: s.good + l.goodQty, defect: s.defect + l.defectQty, rejected: s.rejected + l.rejectedQty }),
    { good: 0, defect: 0, rejected: 0 },
  )
}

/** PDA 收货各步共用的数据与动作（作业暂存、本次可收、商品解析、反馈） */
export function useReceiveFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(RECEIVE_STEPS, 'order')
  const session = useReceiveSession()
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const { getOrder, submitReceipt } = useInbound()
  const receivable = useReceivableInbounds(warehouse.code)
  const { customerCode, customerName, sku } = useLookups()
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const receipts = useDb((s) => s.receiptRecords)
  const inbounds = useDb((s) => s.inbounds)
  const locations = useDb((s) => s.locations)
  const skus = useDb((s) => s.skus)
  const skuMasters = useDb((s) => s.skuMasters)
  const newSkuRecords = useDb((s) => s.newSkuRecords)
  const { confirm } = useConfirm()

  const order = session.inboundNo ? getOrder(session.inboundNo) : undefined
  const orderReceivable = order ? canReceiveInbound(order) : false
  const lineCount = sessionLineCount(session.boxes)
  const ownerCode = order ? customerCode(order.customerId) : ''

  /** 本次作业中某 SKU 已录合计（良品＋不良＋拒收），可排除一个容器 */
  const sessionUsage = useCallback(
    (skuCode: string, excludeKey?: string) =>
      session.boxes
        .filter((b) => b.key !== excludeKey)
        .flatMap((b) => b.lines)
        .filter((l) => l.skuCode === skuCode)
        .reduce((s, l) => s + l.goodQty + l.defectQty + l.rejectedQty, 0),
    [session.boxes],
  )

  /** 本次可收（PDA 收货 PRD §4）：该行未收 − 本次作业其他容器已录 */
  const thisRemain = useCallback(
    (skuCode: string, boxKey?: string) => {
      const item = order?.items.find((i) => i.skuCode === skuCode)
      if (!item) return 0
      return Math.max(0, lineUnreceivedQty(item) - sessionUsage(skuCode, boxKey))
    },
    [order, sessionUsage],
  )

  const resolveSku = useCallback(
    (code: string) =>
      order
        ? resolveInboundSkuScan(
            code,
            order.items.map((i) => i.skuCode),
            { ownerCode, skuBarcodes, primaryBarcode: (s) => sku(s)?.barcode },
          )
        : undefined,
    [order, ownerCode, sku, skuBarcodes],
  )

  /** 本单该商品是否新品：无 NS 记录即新品，扫到先进入量方屏（PDA 新品量方 PRD §3） */
  const isNewSkuInOrder = useCallback(
    (skuCode: string) => (order ? isNewSku(newSkuRecords, order.customerId, skuCode) : false),
    [newSkuRecords, order],
  )


  const productCodes = useMemo(() => {
    const set = new Set<string>()
    skus.forEach((s) => [s.code, s.barcode].forEach((c) => c && set.add(c.toUpperCase())))
    skuMasters.forEach((m) => [m.code, m.primaryBarcode].forEach((c) => c && set.add(c.toUpperCase())))
    skuBarcodes.forEach((b) => set.add(b.barcode.toUpperCase()))
    return set
  }, [skuBarcodes, skuMasters, skus])
  const classifyNonContainer = useCallback(
    (code: string): NonContainerKind | undefined => {
      const key = code.trim().toUpperCase()
      if (inbounds.some((o) => o.inboundNo.toUpperCase() === key)) return 'inbound'
      if (inbounds.some((o) => o.containerNo?.toUpperCase() === key)) return 'cabinet'
      if (productCodes.has(key)) return 'sku'
      if (locations.some((l) => l.warehouseCode === warehouse.code && l.code.toUpperCase() === key)) return 'location'
      return undefined
    },
    [inbounds, locations, productCodes, warehouse.code],
  )

  /** 业务阻断：必须点「知道了」（规范 §5） */
  const notice = useCallback(
    (title: string, description?: string) => {
      beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 页面级扫码错误（扫码框自己会提示音，这里给没有扫码框的屏用） */
  const failScan = useCallback((message: string) => {
    beep(false)
    toast.error(message)
  }, [])

  /**
   * 校验一组容器（新增容器、提交前）：每个 SKU 的上限按「该行未收 − 其他容器」计算，
   * `scope` 为参与比较的容器（提交时只算勾选的容器）。
   */
  const validateBoxes = useCallback(
    (boxes: ReceiveSessionBox[], scope: ReceiveSessionBox[] = session.boxes) => {
      for (const box of boxes) {
        for (const line of box.lines) {
          const item = order?.items.find((i) => i.skuCode === line.skuCode)
          const others = scope
            .filter((b) => b.key !== box.key)
            .flatMap((b) => b.lines)
            .filter((l) => l.skuCode === line.skuCode)
            .reduce((s, l) => s + l.goodQty + l.defectQty + l.rejectedQty, 0)
          const limit = item ? Math.max(0, lineUnreceivedQty(item) - others) : 0
          const err = item
            ? validateInboundReceiveDraft({ ...line, receivedQty: line.goodQty + line.defectQty }, limit)
            : 'error.skuNotInOrder'
          if (err) return { box, skuCode: line.skuCode, errorKey: err }
        }
      }
      return null
    },
    [order, session.boxes],
  )

  const boxLabel = useCallback(
    (box: Pick<ReceiveSessionBox, 'bulkPiece' | 'containerNo'>) =>
      box.bulkPiece ? t('inbound.bulkPiece') : (box.containerNo ?? ''),
    [t],
  )

  return {
    t,
    nav,
    session,
    warehouse,
    operator,
    order,
    orderReceivable,
    receivable,
    lineCount,
    customerName,
    sku,
    receipts,
    thisRemain,
    resolveSku,
    isNewSkuInOrder,
    master: (code: string) => skuMasters.find((m) => m.customerId === order?.customerId && m.code === code),
    classifyNonContainer,
    notice,
    failScan,
    confirm,
    validateBoxes,
    boxLabel,
    submitReceipt,
  }
}

export type ReceiveFlow = ReturnType<typeof useReceiveFlow>
