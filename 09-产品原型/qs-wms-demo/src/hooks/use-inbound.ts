import { useCallback } from 'react'
import { useDb } from '@/mock/db'
import {
  confirmReceiptClose as confirmReceiptCloseAction,
  getInbound,
  listInbounds,
  listReceivableInbounds,
  mockPushInboundInstruction as mockPushAction,
  submitContainerReceipt as submitContainerReceiptAction,
  submitReceipt as submitReceiptAction,
} from '@/services/inbound'

export function useInbound() {
  const inbounds = useDb((s) => s.inbounds)
  const putawayOrders = useDb((s) => s.putawayOrders ?? [])
  const customers = useDb((s) => s.customers)

  const confirmReceiptClose = useCallback((inboundNo: string, operator = 'admin') => confirmReceiptCloseAction(inboundNo, operator), [])
  const mockPushInboundInstruction = useCallback(
    (input: Parameters<typeof mockPushAction>[0]) => mockPushAction(input),
    [],
  )
  const submitReceipt = useCallback(
    (input: Parameters<typeof submitReceiptAction>[0]) => submitReceiptAction(input),
    [],
  )
  const submitContainerReceipt = useCallback(
    (input: Parameters<typeof submitContainerReceiptAction>[0]) => submitContainerReceiptAction(input),
    [],
  )

  const dbSlice = { inbounds, putawayOrders }

  return {
    inbounds: listInbounds(dbSlice),
    customers,
    getOrder: (no: string) => getInbound(no, dbSlice),
    listInbounds: () => listInbounds(dbSlice),
    confirmReceiptClose,
    mockPushInboundInstruction,
    submitReceipt,
    submitContainerReceipt,
  }
}

export function useReceivableInbounds(warehouseCode: string) {
  const inbounds = useDb((s) => s.inbounds)
  const putawayOrders = useDb((s) => s.putawayOrders ?? [])
  return listReceivableInbounds(warehouseCode, { inbounds, putawayOrders })
}
