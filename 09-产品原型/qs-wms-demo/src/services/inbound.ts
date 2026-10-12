import { lineUnreceivedQty, recomputeInboundOrder, syncInboundPutawayFromOrders } from '@/lib/inbound-derive'
import { useDb, type DbState } from '@/mock/db'
import type { Customer, InboundOrder, InboundOrderStatus } from '@/types/wms'

const RECEIVABLE_STATUSES: InboundOrderStatus[] = ['PENDING_RECEIVE', 'RECEIVING', 'PUTAWAYING']

export const remainInboundItemQty = (item: InboundOrder['items'][number]) => lineUnreceivedQty(item)

export function hydrateInbound(order: InboundOrder, db: Pick<DbState, 'putawayOrders'>): InboundOrder {
  return syncInboundPutawayFromOrders(recomputeInboundOrder(order), db.putawayOrders)
}

export function listInbounds(db: Pick<DbState, 'inbounds' | 'putawayOrders'> = useDb.getState()): InboundOrder[] {
  const putawayOrders = db.putawayOrders ?? []
  return (db.inbounds ?? []).map((o) => hydrateInbound(o, { putawayOrders }))
}

export function listInboundsByWarehouse(warehouseCode: string, db: Pick<DbState, 'inbounds' | 'putawayOrders'> = useDb.getState()): InboundOrder[] {
  return listInbounds(db).filter((o) => o.warehouseCode === warehouseCode)
}

export function getInbound(inboundNo: string, db: Pick<DbState, 'inbounds' | 'putawayOrders'> = useDb.getState()): InboundOrder | undefined {
  const raw = db.inbounds.find((o) => o.inboundNo === inboundNo)
  return raw ? hydrateInbound(raw, db) : undefined
}

export function listReceivableInbounds(warehouseCode: string, db: Pick<DbState, 'inbounds' | 'putawayOrders'> = useDb.getState()): InboundOrder[] {
  return listInboundsByWarehouse(warehouseCode, db).filter(
    (o) =>
      o.receiptCloseFlag !== 'CONFIRMED' &&
      RECEIVABLE_STATUSES.includes(o.status) &&
      o.items.some((i) => remainInboundItemQty(i) > 0),
  )
}

type ActionResult = { ok: true } | { ok: false; errorKey: string }

export function confirmReceiptClose(inboundNo: string, operator = 'admin'): ActionResult {
  return useDb.getState().confirmReceiptClose(inboundNo, operator)
}

export function mockPushInboundInstruction(input: Parameters<DbState['mockPushInboundInstruction']>[0]) {
  return useDb.getState().mockPushInboundInstruction(input)
}

/** 收货提交（两端共用）：一次提交含 1～N 个容器，生成一条收货记录 */
export function submitReceipt(input: Parameters<DbState['submitReceipt']>[0]): ActionResult {
  return useDb.getState().submitReceipt(input)
}

export function submitContainerReceipt(input: {
  inboundNo: string
  containerNo?: string
  bulkPiece?: boolean
  lines: import('@/types/inbound').ContainerReceiptLineInput[]
  operator: string
}): ActionResult {
  return useDb.getState().submitContainerReceipt(input)
}

export function getInboundActions() {
  const state = useDb.getState()
  return {
    confirmReceiptClose: state.confirmReceiptClose,
    mockPushInboundInstruction: state.mockPushInboundInstruction,
    submitReceipt: state.submitReceipt,
    submitContainerReceipt: state.submitContainerReceipt,
  }
}

export type { Customer }
