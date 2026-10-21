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
  const allReceived = order.items.every((l) => returnLineUnreceived(l) === 0)
  const allPutaway = order.items.every((l) => l.receivedQty === 0 || l.putawayQty >= l.receivedQty)
  const items = order.items.map((l) => {
    let status: ReturnOrderLine['status'] = 'PENDING_RECEIVE'
    if (l.receivedQty > 0) status = l.putawayQty >= l.receivedQty ? 'COMPLETED' : 'PUTAWAYING'
    if (l.receivedQty > 0 && l.putawayQty === 0) status = 'RECEIVING'
    if (l.receivedQty === 0 && returnLineUnreceived(l) === 0) status = 'COMPLETED'
    return { ...l, status }
  })
  let status: ReturnOrderStatus = 'PENDING_RECEIVE'
  if (totalReceived > 0) {
    if (allReceived && allPutaway) status = 'COMPLETED'
    else if (allReceived) status = 'PUTAWAYING'
    else status = 'RECEIVING'
  }
  const completedAt = status === 'COMPLETED' ? (order.completedAt ?? order.updatedAt) : undefined
  return { ...order, items, status, completedAt }
}

export function canReceiveReturn(order: ReturnOrder): boolean {
  if (order.status === 'CANCELLED' || order.status === 'COMPLETED') return false
  return order.items.some((l) => returnLineUnreceived(l) > 0)
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
export function syncReturnPutawayFromOrders(order: ReturnOrder, putawayOrders: PutawayOrder[]): ReturnOrder {
  const bySku = new Map<string, number>()
  putawayOrders
    .filter((p) => p.sourceType === 'RETURN' && p.sourceNo === order.returnNo && p.status === 'COMPLETED')
    .forEach((p) => p.actualLines.filter((a) => a.submitted).forEach((a) => bySku.set(a.skuCode, (bySku.get(a.skuCode) ?? 0) + a.qty)))
  return recomputeReturnOrder({
    ...order,
    items: order.items.map((l) => ({ ...l, putawayQty: Math.min(l.receivedQty, bySku.get(l.skuCode) ?? 0) })),
    updatedAt: new Date().toISOString(),
  })
}
