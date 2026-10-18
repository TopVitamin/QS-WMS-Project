import { FILTER_ALL } from '@/lib/master-data'
import type { OutboundOrder, OutboundPickTask, OutboundPutback, OutboundWave } from '@/types/outbound'

/** 出库四个列表的筛选匹配：顶栏仓库 + 各 Demo PRD 列表页 FilterBar 表 */

/** 单号筛选：包含匹配，支持空格分词多号 */
export function matchesDocNo(value: string | undefined, raw: string): boolean {
  const keywords = raw.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return true
  const no = (value ?? '').toUpperCase()
  return keywords.some((k) => no.includes(k))
}

function contains(value: string | undefined, raw: string): boolean {
  const q = raw.trim().toLowerCase()
  return !q || (value ?? '').toLowerCase().includes(q)
}

function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

const anyOf = (value: string, filter: string) => filter === FILTER_ALL || value === filter

export interface OrderListFilters {
  no: string
  upstream: string
  type: string
  customerId: string
  createdFrom: string
  createdTo: string
  inbound: string
}
export const emptyOrderListFilters: OrderListFilters = {
  no: '',
  upstream: '',
  type: FILTER_ALL,
  customerId: FILTER_ALL,
  createdFrom: '',
  createdTo: '',
  inbound: '',
}
export function matchOrder(o: OutboundOrder, warehouseCode: string, f: OrderListFilters) {
  return (
    o.warehouseCode === warehouseCode &&
    matchesDocNo(o.no, f.no) &&
    contains(o.upstreamNo, f.upstream) &&
    anyOf(o.type, f.type) &&
    anyOf(o.customerId, f.customerId) &&
    inDateRange(o.createdAt, f.createdFrom, f.createdTo) &&
    (!f.inbound.trim() || contains(o.originalInboundNo, f.inbound))
  )
}

export interface WaveListFilters {
  no: string
  orderNo: string
  customerId: string
}
export const emptyWaveListFilters: WaveListFilters = { no: '', orderNo: '', customerId: FILTER_ALL }
export function matchWave(w: OutboundWave, warehouseCode: string, f: WaveListFilters) {
  return (
    w.warehouseCode === warehouseCode &&
    matchesDocNo(w.no, f.no) &&
    (!f.orderNo.trim() || w.members.some((m) => matchesDocNo(m, f.orderNo))) &&
    anyOf(w.customerId, f.customerId)
  )
}

export interface TaskListFilters {
  no: string
  orderNo: string
  source: string
  customerId: string
}
export const emptyTaskListFilters: TaskListFilters = {
  no: '',
  orderNo: '',
  source: FILTER_ALL,
  customerId: FILTER_ALL,
}
export function matchTask(t: OutboundPickTask, warehouseCode: string, f: TaskListFilters) {
  const orderNos = [
    t.orderNo,
    ...t.lines.flatMap((l) => l.shares.map((p) => p.orderNo)),
    ...t.assignments.map((a) => a.orderNo),
  ]
  return (
    t.warehouseCode === warehouseCode &&
    matchesDocNo(t.no, f.no) &&
    (!f.orderNo.trim() || orderNos.some((n) => matchesDocNo(n, f.orderNo))) &&
    anyOf(t.source, f.source) &&
    anyOf(t.customerId, f.customerId)
  )
}

export interface PutbackListFilters {
  no: string
  orderNo: string
  reason: string
  customerId: string
}
export const emptyPutbackListFilters: PutbackListFilters = {
  no: '',
  orderNo: '',
  reason: FILTER_ALL,
  customerId: FILTER_ALL,
}
export function matchPutback(p: OutboundPutback, warehouseCode: string, f: PutbackListFilters) {
  return (
    p.warehouseCode === warehouseCode &&
    matchesDocNo(p.no, f.no) &&
    contains(p.orderNo, f.orderNo) &&
    anyOf(p.reason, f.reason) &&
    anyOf(p.customerId, f.customerId)
  )
}
