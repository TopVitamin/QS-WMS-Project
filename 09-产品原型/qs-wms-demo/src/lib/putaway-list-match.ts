import { FILTER_ALL } from '@/lib/master-data'
import type { PutawayOrder, PutawaySourceType } from '@/types/inbound'

export interface PutawayListFilters {
  putawayNo: string
  sourceNo: string
  containerNo: string
  customerId: string
  qualityType: string
  sourceType: string
  createdFrom: string
  createdTo: string
  submittedFrom: string
  submittedTo: string
}

export const emptyPutawayListFilters: PutawayListFilters = {
  putawayNo: '',
  sourceNo: '',
  containerNo: '',
  customerId: FILTER_ALL,
  qualityType: FILTER_ALL,
  sourceType: FILTER_ALL,
  createdFrom: '',
  createdTo: '',
  submittedFrom: '',
  submittedTo: '',
}

export const PUTAWAY_SOURCE_TYPES: PutawaySourceType[] = ['INBOUND', 'RETURN']

function matchDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

/** 单号筛选：包含匹配，支持空格分词多号 */
function matchesDocNo(value: string, raw: string): boolean {
  const keywords = raw.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return true
  const no = value.toUpperCase()
  return keywords.some((k) => no.includes(k))
}

/** 列表筛选：对齐字段详细稿「可筛选」列 + 顶栏仓库；无容器收货单不命中容器号 */
export function matchPutawayListFilters(
  order: PutawayOrder,
  warehouseCode: string,
  filters: PutawayListFilters,
): boolean {
  if (order.warehouseCode !== warehouseCode) return false
  if (!matchesDocNo(order.putawayNo, filters.putawayNo)) return false
  if (filters.sourceNo && !order.sourceNo.toLowerCase().includes(filters.sourceNo.trim().toLowerCase())) return false
  if (filters.containerNo) {
    const container = (order.containerNo ?? '').toLowerCase()
    if (!container.includes(filters.containerNo.trim().toLowerCase())) return false
  }
  if (filters.customerId !== FILTER_ALL && order.customerId !== filters.customerId) return false
  if (filters.qualityType !== FILTER_ALL && order.qualityType !== filters.qualityType) return false
  if (filters.sourceType !== FILTER_ALL && order.sourceType !== filters.sourceType) return false
  if (!matchDateRange(order.createdAt, filters.createdFrom, filters.createdTo)) return false
  if (!matchDateRange(order.submittedAt, filters.submittedFrom, filters.submittedTo)) return false
  return true
}
