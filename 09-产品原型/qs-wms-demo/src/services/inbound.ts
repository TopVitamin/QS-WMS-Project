import { useDb, type DbState } from '@/mock/db'
import type { Customer, InboundOrder, InboundStatus } from '@/types/wms'
import type { ActionResult } from './types'

const RECEIVABLE_STATUSES: InboundStatus[] = ['PENDING', 'ARRIVED', 'RECEIVING', 'PARTIAL_PUT']

export const remainInboundItemQty = (item: InboundOrder['items'][number]) =>
  Math.max(0, item.plannedQty - item.receivedGoodQty - item.receivedDefectQty)

export function listInbounds(db: Pick<DbState, 'inbounds'> = useDb.getState()): InboundOrder[] {
  return db.inbounds
}

export function listInboundsByWarehouse(warehouseCode: string, db: Pick<DbState, 'inbounds'> = useDb.getState()): InboundOrder[] {
  return db.inbounds.filter((o) => o.warehouseCode === warehouseCode)
}

export function getInbound(inboundNo: string, db: Pick<DbState, 'inbounds'> = useDb.getState()): InboundOrder | undefined {
  return db.inbounds.find((o) => o.inboundNo === inboundNo)
}

export function listCustomers(db: Pick<DbState, 'customers'> = useDb.getState()): Customer[] {
  return db.customers
}

export function listReceivableInbounds(warehouseCode: string, db: Pick<DbState, 'inbounds'> = useDb.getState()): InboundOrder[] {
  return db.inbounds.filter(
    (o) =>
      o.warehouseCode === warehouseCode &&
      RECEIVABLE_STATUSES.includes(o.status) &&
      o.items.some((i) => remainInboundItemQty(i) > 0),
  )
}

export function signInbound(inboundNo: string): ActionResult {
  return useDb.getState().signInbound(inboundNo)
}

export function cancelInbound(inboundNo: string): ActionResult {
  return useDb.getState().cancelInbound(inboundNo)
}

export function receiveInboundItem(input: {
  inboundNo: string
  skuCode: string
  goodQty: number
  defectQty: number
  operator: string
}): ActionResult {
  return useDb.getState().receiveInboundItem(input)
}

export function getInboundActions() {
  const { signInbound: sign, cancelInbound: cancel, receiveInboundItem: receive } = useDb.getState()
  return { signInbound: sign, cancelInbound: cancel, receiveInboundItem: receive }
}
