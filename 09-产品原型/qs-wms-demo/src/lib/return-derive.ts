import type { PutawayOrder } from '@/types/inbound'
import type { ReturnOrder, ReturnOrderLine, ReturnOrderStatus } from '@/types/return'

export function returnLineUnreceived(line: ReturnOrderLine): number {
  return Math.max(0, line.plannedQty - line.receivedQty - line.rejectedQty)
}

export function sumReturnLines(order: ReturnOrder, pick: (line: ReturnOrderLine) => number): number {
  return order.items.reduce((n, line) => n + pick(line), 0)
}

export function recomputeReturnOrder(order: ReturnOrder): ReturnOrder {
  if (order.status === 'CANCELLED') {
    return { ...order, items: order.items.map((l) => ({ ...l, status: 'CANCELLED' })) }
  }
  const totalReceived = sumReturnLines(order, (l) => l.receivedQty)
  const receiveClosed = Boolean(order.receiveClosedAt)
  const allPutaway = order.items.every((l) => l.receivedQty === 0 || l.putawayQty >= l.receivedQty)
  const items = order.items.map((l) => {
    let status: ReturnOrderLine['status'] = 'PENDING_RECEIVE'
    const lineReceiveClosed = receiveClosed || returnLineUnreceived(l) === 0
    if (l.receivedQty > 0) status = l.putawayQty >= l.receivedQty ? (lineReceiveClosed ? 'COMPLETED' : 'RECEIVING') : 'PUTAWAYING'
    if (l.receivedQty === 0 && lineReceiveClosed) status = 'COMPLETED'
    return { ...l, status }
  })
  let status: ReturnOrderStatus = 'PENDING_RECEIVE'
  if (totalReceived > 0) {
    if (receiveClosed && allPutaway) status = 'COMPLETED'
    else if (receiveClosed) status = 'PUTAWAYING'
    else status = 'RECEIVING'
  }
  const completedAt = status === 'COMPLETED' ? (order.completedAt ?? order.updatedAt) : undefined
  return { ...order, items, status, completedAt }
}

export function canReceiveReturn(order: ReturnOrder): boolean {
  if (order.status === 'CANCELLED' || order.status === 'COMPLETED') return false
  if (order.receiveClosedAt) return false
  return order.items.some((l) => returnLineUnreceived(l) > 0)
}

export function canConfirmReturnReceiptClose(order: ReturnOrder): boolean {
  return (
    !order.receiveClosedAt &&
    order.status !== 'CANCELLED' &&
    order.status !== 'COMPLETED' &&
    sumReturnLines(order, (line) => line.receivedQty) > 0
  )
}

export function finalShortQty(order: ReturnOrder): number | undefined {
  if (!order.receiveClosedAt) return undefined
  return sumReturnLines(order, returnLineUnreceived)
}

export function returnReceiptProgress(order: ReturnOrder) {
  const total = sumReturnLines(order, (l) => l.plannedQty)
  const done = sumReturnLines(order, (l) => l.receivedQty + l.rejectedQty)
  return { done, total, pct: total ? Math.round((done / total) * 100) : null }
}

export function returnPutawayProgress(order: ReturnOrder) {
  const total = sumReturnLines(order, (l) => l.receivedQty)
  const done = sumReturnLines(order, (l) => l.putawayQty)
  return { done, total, pct: total ? Math.round((done / total) * 100) : null }
}

/** 共用上架单提交后，把已上架数量同步回退货单 */
export function syncReturnPutawayFromOrders(
  order: ReturnOrder,
  putawayOrders: PutawayOrder[],
  returnReceipts: import('@/types/return').ReturnReceiptRecord[],
): ReturnOrder {
  const byReturnLine = new Map<number, number>()
  const byLegacySku = new Map<string, number>()
  const receiptsByNo = new Map(returnReceipts.map((receipt) => [receipt.receiptNo, receipt]))
  putawayOrders
    .filter((p) => p.sourceType === 'RETURN' && p.sourceNo === order.returnNo && p.status === 'COMPLETED')
    .forEach((p) => {
      const receipt = receiptsByNo.get(p.receiptNo)
      p.actualLines
        .filter((actual) => actual.submitted)
        .forEach((actual) => {
          const planLine = p.planLines.find((line) => line.lineNo === actual.planLineNo)
          const receiptLine = receipt?.lines.find((line) => line.lineNo === planLine?.receiptLineNo)
          if (receiptLine?.returnLineNo !== undefined) {
            byReturnLine.set(
              receiptLine.returnLineNo,
              (byReturnLine.get(receiptLine.returnLineNo) ?? 0) + actual.qty,
            )
          } else {
            byLegacySku.set(actual.skuCode, (byLegacySku.get(actual.skuCode) ?? 0) + actual.qty)
          }
        })
    })
  const legacyRemaining = new Map(byLegacySku)
  return recomputeReturnOrder({
    ...order,
    items: order.items.map((line) => {
      const direct = byReturnLine.get(line.lineNo) ?? 0
      const legacy = Math.min(line.receivedQty, legacyRemaining.get(line.skuCode) ?? 0)
      legacyRemaining.set(line.skuCode, Math.max(0, (legacyRemaining.get(line.skuCode) ?? 0) - legacy))
      return { ...line, putawayQty: Math.min(line.receivedQty, direct + legacy) }
    }),
    updatedAt: new Date().toISOString(),
  })
}
