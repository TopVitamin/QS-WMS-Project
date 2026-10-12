import { FILTER_ALL } from '@/lib/master-data'
import type { InboundArrivalMethod, InboundOrder } from '@/types/inbound'

export interface InboundListFilters {
  inboundNo: string
  customerId: string
  bizType: string
  upstreamNo: string
  arrivalMethod: string
  containerNo: string
  trackingNo: string
  createdFrom: string
  createdTo: string
  completedFrom: string
  completedTo: string
}

export const emptyInboundListFilters: InboundListFilters = {
  inboundNo: '',
  customerId: FILTER_ALL,
  bizType: FILTER_ALL,
  upstreamNo: '',
  arrivalMethod: FILTER_ALL,
  containerNo: '',
  trackingNo: '',
  createdFrom: '',
  createdTo: '',
  completedFrom: '',
  completedTo: '',
}

function matchDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

/** 单号筛选：包含匹配，支持空格分词多号；只比对入库单号本身 */
function matchesInboundNo(order: InboundOrder, raw: string): boolean {
  const keywords = raw.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return true
  const no = order.inboundNo.toUpperCase()
  return keywords.some((k) => no.includes(k))
}

/** 列表筛选：对齐字段详细稿「可筛选」列 + 顶栏仓库 */
export function matchInboundListFilters(order: InboundOrder, warehouseCode: string, filters: InboundListFilters): boolean {
  if (order.warehouseCode !== warehouseCode) return false
  if (!matchesInboundNo(order, filters.inboundNo)) return false
  if (filters.customerId !== FILTER_ALL && order.customerId !== filters.customerId) return false
  if (filters.bizType !== FILTER_ALL && order.bizType !== filters.bizType) return false
  if (filters.upstreamNo && !order.upstreamNo.toLowerCase().includes(filters.upstreamNo.trim().toLowerCase())) return false
  if (filters.arrivalMethod !== FILTER_ALL && order.arrivalMethod !== filters.arrivalMethod) return false
  if (filters.containerNo && !(order.containerNo ?? '').toLowerCase().includes(filters.containerNo.trim().toLowerCase())) {
    return false
  }
  if (filters.trackingNo && !(order.trackingNos ?? '').toLowerCase().includes(filters.trackingNo.trim().toLowerCase())) {
    return false
  }
  if (!matchDateRange(order.createdAt, filters.createdFrom, filters.createdTo)) return false
  if (!matchDateRange(order.completedAt, filters.completedFrom, filters.completedTo)) return false
  return true
}

export const INBOUND_ARRIVAL_METHODS: InboundArrivalMethod[] = ['CONTAINER', 'LTL', 'EXPRESS', 'OTHER']
