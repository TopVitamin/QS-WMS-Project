import { useCallback } from 'react'
import { useDb } from '@/mock/db'
import {
  cancelInbound as cancelInboundAction,
  listCustomers,
  listInbounds,
  listReceivableInbounds,
  receiveInboundItem as receiveInboundItemAction,
  signInbound as signInboundAction,
} from '@/services/inbound'

export function useInbound() {
  const inbounds = useDb((s) => s.inbounds)
  const customers = useDb((s) => s.customers)

  const signInbound = useCallback((inboundNo: string) => signInboundAction(inboundNo), [])
  const cancelInbound = useCallback((inboundNo: string) => cancelInboundAction(inboundNo), [])
  const receiveInboundItem = useCallback(
    (input: { inboundNo: string; skuCode: string; goodQty: number; defectQty: number; operator: string }) =>
      receiveInboundItemAction(input),
    [],
  )

  return {
    inbounds,
    customers,
    listInbounds: () => listInbounds({ inbounds }),
    listCustomers: () => listCustomers({ customers }),
    signInbound,
    cancelInbound,
    receiveInboundItem,
  }
}

export function useReceivableInbounds(warehouseCode: string) {
  const inbounds = useDb((s) => s.inbounds)
  return listReceivableInbounds(warehouseCode, { inbounds })
}
