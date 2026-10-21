import type {
  InboundOrder,
  InboundOrderLine,
  InboundOrderStatus,
  InboundLineStatus,
  PutawayOrder,
} from '@/types/inbound'

export function lineUnreceivedQty(line: InboundOrderLine): number {
  return Math.max(0, line.plannedQty - line.receivedQty - line.rejectedQty)
}

export function isLineReceiptClosed(order: InboundOrder, line: InboundOrderLine): boolean {
  return lineUnreceivedQty(line) === 0 || order.receiptCloseFlag === 'CONFIRMED'
}

export function recomputeLineStatus(order: InboundOrder, line: InboundOrderLine): InboundLineStatus {
  /** 已取消：明细随单收口，不设已完成（宏观架构 §3.2） */
  if (order.status === 'CANCELLED') return 'CANCELLED'
  const receiptClosed = isLineReceiptClosed(order, line)
  if (!receiptClosed) {
    return line.receivedQty > 0 ? 'RECEIVING' : 'PENDING_RECEIVE'
  }
  if (line.receivedQty === 0) return 'COMPLETED'
  if (line.putawayQty < line.receivedQty) return 'PUTAWAYING'
  return 'COMPLETED'
}

export function sumLines(
  order: InboundOrder,
  pick: (line: InboundOrderLine) => number,
): number {
  return order.items.reduce((s, line) => s + pick(line), 0)
}

export function recomputeInboundOrder(order: InboundOrder): InboundOrder {
  if (order.status === 'CANCELLED') {
    const items = order.items.map((line) => ({
      ...line,
      status: recomputeLineStatus(order, line),
    }))
    return { ...order, items }
  }

  const items = order.items.map((line) => ({
    ...line,
    status: recomputeLineStatus(order, line),
  }))
  const totalReceived = sumLines({ ...order, items }, (l) => l.receivedQty)
  const allLinesReceiptClosed = items.every((line) => isLineReceiptClosed({ ...order, items }, line))
  const allLinesCompleted = items.every((l) => l.status === 'COMPLETED')

  let status: InboundOrderStatus = 'PENDING_RECEIVE'
  if (totalReceived > 0) {
    if (!allLinesReceiptClosed) status = 'RECEIVING'
    else if (!allLinesCompleted) status = 'PUTAWAYING'
    else status = 'COMPLETED'
  }

  let completedAt = order.completedAt
  if (status === 'COMPLETED' && !completedAt) {
    completedAt = order.updatedAt
  }
  if (status !== 'COMPLETED') {
    completedAt = undefined
  }

  return { ...order, items, status, completedAt }
}

/** 主 PRD §6.4 F07：待收货/收货中且仍有未收行时可收货 */
export function canReceiveInbound(order: InboundOrder): boolean {
  if (order.status === 'CANCELLED') return false
  if (order.receiptCloseFlag === 'CONFIRMED') return false
  if (order.status !== 'PENDING_RECEIVE' && order.status !== 'RECEIVING') return false
  return order.items.some((line) => lineUnreceivedQty(line) > 0)
}

/** 主 PRD R07：可展示「确认收货完结」 */
export function canConfirmReceiptClose(order: InboundOrder): boolean {
  if (order.status === 'CANCELLED') return false
  if (order.receiptCloseFlag === 'CONFIRMED') return false
  const totalReceived = sumLines(order, (l) => l.receivedQty)
  if (totalReceived <= 0) return false
  return order.items.some((line) => lineUnreceivedQty(line) > 0)
}

export function submittedPutawayQtyBySku(putawayOrders: PutawayOrder[], inboundNo: string): Map<string, number> {
  const map = new Map<string, number>()
  putawayOrders
    .filter((p) => p.sourceType === 'INBOUND' && p.sourceNo === inboundNo && p.status === 'COMPLETED')
    .forEach((po) => {
      po.actualLines
        .filter((a) => a.submitted)
        .forEach((a) => map.set(a.skuCode, (map.get(a.skuCode) ?? 0) + a.qty))
    })
  return map
}

export function syncInboundPutawayFromOrders(order: InboundOrder, putawayOrders: PutawayOrder[]): InboundOrder {
  const bySku = submittedPutawayQtyBySku(putawayOrders, order.inboundNo)
  const items = order.items.map((line) => ({
    ...line,
    putawayQty: bySku.get(line.skuCode) ?? line.putawayQty,
  }))
  return recomputeInboundOrder({ ...order, items })
}

export function receiptProgress(order: InboundOrder): { done: number; total: number; pct: number | null } {
  const total = sumLines(order, (l) => l.plannedQty)
  const done = sumLines(order, (l) => l.receivedQty)
  if (total <= 0) return { done, total, pct: null }
  return { done, total, pct: Math.round((done / total) * 100) }
}

export function putawayProgress(order: InboundOrder): { done: number; total: number; pct: number | null } {
  const total = sumLines(order, (l) => l.receivedQty)
  const done = sumLines(order, (l) => l.putawayQty)
  if (total <= 0) return { done, total, pct: null }
  return { done, total, pct: Math.round((done / total) * 100) }
}

export function skuKindCount(order: InboundOrder): number {
  return new Set(order.items.map((i) => i.skuCode)).size
}

/** 本仓收货暂存库位（每仓预置 STAGING 类型；找不到时退回约定编码） */
export function stagingLocationCode(
  locations: Array<{ code: string; warehouseCode: string; type: string }>,
  warehouseCode: string,
  preferredCode?: string,
): string {
  if (preferredCode?.trim()) return preferredCode.trim().toUpperCase()
  return (
    locations.find((l) => l.warehouseCode === warehouseCode && l.type === 'STAGING')?.code ?? 'STAGE-IN-01'
  )
}
