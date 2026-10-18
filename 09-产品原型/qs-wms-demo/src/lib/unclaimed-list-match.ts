import type { UnclaimedRecord } from '@/types/inbound'

export interface UnclaimedListFilters {
  registerNo: string
  trackingNo: string
  cartonMark: string
  containerNo: string
  registeredFrom: string
  registeredTo: string
}

export const emptyUnclaimedListFilters: UnclaimedListFilters = {
  registerNo: '',
  trackingNo: '',
  cartonMark: '',
  containerNo: '',
  registeredFrom: '',
  registeredTo: '',
}

function matchDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

const includesAny = (values: string[], raw: string) => {
  const keyword = raw.trim().toLowerCase()
  return values.some((v) => v.toLowerCase().includes(keyword))
}

/** 列表筛选：只限当前仓库（无主货登记主PRD 第四节） */
export function matchUnclaimedListFilters(
  record: UnclaimedRecord,
  warehouseCode: string,
  filters: UnclaimedListFilters,
): boolean {
  if (record.warehouseCode !== warehouseCode) return false
  if (filters.registerNo && !record.registerNo.toLowerCase().includes(filters.registerNo.trim().toLowerCase())) {
    return false
  }
  if (filters.trackingNo && !includesAny(record.trackingNos, filters.trackingNo)) return false
  if (filters.cartonMark && !includesAny(record.cartonMarks, filters.cartonMark)) return false
  if (filters.containerNo && !(record.containerNo ?? '').toLowerCase().includes(filters.containerNo.trim().toLowerCase())) {
    return false
  }
  if (!matchDateRange(record.registeredAt, filters.registeredFrom, filters.registeredTo)) return false
  return true
}
