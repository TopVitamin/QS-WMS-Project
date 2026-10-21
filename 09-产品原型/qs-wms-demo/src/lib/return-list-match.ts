import { FILTER_ALL } from '@/lib/master-data'
import type { ReturnOrder } from '@/types/return'

export interface ReturnListFilters {
  returnNo: string
  upstreamNo: string
  customerId: string
  sourceType: string
  createdFrom: string
  createdTo: string
}

export const emptyReturnListFilters: ReturnListFilters = {
  returnNo: '',
  upstreamNo: '',
  customerId: FILTER_ALL,
  sourceType: FILTER_ALL,
  createdFrom: '',
  createdTo: '',
}

function inDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

export function matchReturn(order: ReturnOrder, warehouseCode: string, f: ReturnListFilters): boolean {
  const keyword = f.returnNo.trim().toUpperCase()
  if (keyword && !order.returnNo.toUpperCase().includes(keyword)) return false
  const upstream = f.upstreamNo.trim().toLowerCase()
  if (
    upstream &&
    !order.upstreamNo.toLowerCase().includes(upstream) &&
    !(order.originalOutboundNo ?? '').toLowerCase().includes(upstream) &&
    !(order.trackingNo ?? '').toLowerCase().includes(upstream)
  ) {
    return false
  }
  if (f.customerId !== FILTER_ALL && order.customerId !== f.customerId) return false
  if (f.sourceType !== FILTER_ALL && order.sourceType !== f.sourceType) return false
  return order.warehouseCode === warehouseCode && inDateRange(order.createdAt, f.createdFrom, f.createdTo)
}
