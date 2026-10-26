import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaStep } from '@/hooks/use-pda-step'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { defaultVerifySession, normalizeVerifySession, toVerifyQty, verifyRows } from '@/lib/outbound-verify'
import { beep } from '@/lib/scan-beep'
import { useDb, useLookups } from '@/mock/db'
import { pdaSessionKey, usePdaOutboundSession } from '@/stores/pda-outbound-session'
import { useSettings } from '@/stores/settings'
import type { WebVerifySession } from '@/stores/web-verify-session'
import type { OutboundCommand, OutboundOrder } from '@/types/outbound'

export const VERIFY_STEPS = ['list', 'scan', 'pack'] as const

const live = (o: OutboundOrder) => o.status !== 'SHIPPED' && o.status !== 'CANCELLED'

/**
 * PDA 复核各步共用的数据与动作（《PDA复核前端Demo版PRD》）：按原单逐件扫商品或序列号计数，
 * 扫齐后自动进入装箱，提交成一条复核记录。行、默认装箱与校验与复核工作台共用 lib/outbound-verify。
 */
export function useVerifyFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(VERIFY_STEPS, 'list')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const orders = useDb((s) => s.outboundOrders)
  const outboundPickTasks = useDb((s) => s.outboundPickTasks)
  const outboundVerifications = useDb((s) => s.outboundVerifications)
  const containers = useDb((s) => s.containers)
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const { customerCode, sku } = useLookups()
  const { confirm } = useConfirm()
  const sessions = usePdaOutboundSession((s) => s.verify)
  const setVerify = usePdaOutboundSession((s) => s.setVerify)

  const verifiable = useCallback(
    (o: OutboundOrder) => o.warehouseCode === warehouseCode && live(o) && toVerifyQty(o) > 0,
    [warehouseCode],
  )
  const openOrders = useMemo(
    () => orders.filter(verifiable).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [orders, verifiable],
  )
  const findOrder = useCallback(
    (no?: string) => (no ? orders.find((o) => o.no === no && o.warehouseCode === warehouseCode) : undefined),
    [orders, warehouseCode],
  )

  const records = useCallback(
    (order: OutboundOrder) => outboundVerifications.filter((v) => v.orderNo === order.no && !v.deleted),
    [outboundVerifications],
  )
  const sessionOf = useCallback(
    (order: OutboundOrder): WebVerifySession =>
      normalizeVerifySession(
        order,
        records(order),
        sessions[pdaSessionKey(warehouseCode, order.no)] ?? defaultVerifySession(order, records(order)),
      ),
    [records, sessions, warehouseCode],
  )
  const saveSession = useCallback(
    (order: OutboundOrder, session?: WebVerifySession) => setVerify(pdaSessionKey(warehouseCode, order.no), session),
    [setVerify, warehouseCode],
  )
  const rowsOf = useCallback(
    (order: OutboundOrder, session: WebVerifySession) =>
      verifyRows({ outboundPickTasks, outboundVerifications, skuMasters }, order, session.lines),
    [outboundPickTasks, outboundVerifications, skuMasters],
  )
  /** 扫码处理时读最新的本次复核与行：连续快扫时组件可能还没重渲染，不能拿旧数量 +1 */
  const liveOf = useCallback(
    (order: OutboundOrder) => {
      const db = useDb.getState()
      const session =
        normalizeVerifySession(
          order,
          db.outboundVerifications.filter((v) => v.orderNo === order.no && !v.deleted),
          usePdaOutboundSession.getState().verify[pdaSessionKey(warehouseCode, order.no)],
        )
      return { session, rows: verifyRows(db, order, session.lines) }
    },
    [warehouseCode],
  )

  const resolveSku = useCallback(
    (order: OutboundOrder, code: string, skuCodes: string[]) =>
      resolveInboundSkuScan(code, skuCodes, {
        ownerCode: customerCode(order.customerId),
        skuBarcodes: skuBarcodes.filter((b) => b.status === 'ENABLED'),
        primaryBarcode: (s) => skuMasters.find((m) => m.customerId === order.customerId && m.code === s)?.primaryBarcode,
      }),
    [customerCode, skuBarcodes, skuMasters],
  )

  const run = useCallback((command: OutboundCommand) => useDb.getState().outboundAction(command, operator), [operator])

  const notice = useCallback(
    (title: string, description?: string) => {
      beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 订单为什么不能复核（与复核工作台同一组文案） */
  const unavailableReason = useCallback(
    (order?: OutboundOrder) => {
      if (!order || order.warehouseCode !== warehouseCode) return t('outbound.ui.stationReasonNotFound')
      if (order.status === 'SHIPPED') return t('outbound.ui.stationReasonShipped')
      if (order.status === 'CANCELLED') return t('outbound.ui.stationReasonCancelled')
      return t('outbound.ui.stationReasonNothing')
    },
    [t, warehouseCode],
  )

  return {
    t,
    nav,
    warehouseCode,
    containers,
    orders,
    openOrders,
    verifiable,
    findOrder,
    records,
    sessionOf,
    saveSession,
    rowsOf,
    liveOf,
    resolveSku,
    skuName: (code: string, customerId?: string) => sku(code, customerId)?.name,
    run,
    notice,
    confirm,
    unavailableReason,
  }
}

export type VerifyFlow = ReturnType<typeof useVerifyFlow>
