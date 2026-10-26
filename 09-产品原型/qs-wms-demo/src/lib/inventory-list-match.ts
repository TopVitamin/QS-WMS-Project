import { ledgerChange } from '@/lib/inventory-ledger'
import type { BalanceRow, SerialRow, SkuStockRow } from '@/lib/inventory-derive'
import { FILTER_ALL } from '@/lib/master-data'
import { moveSummary } from '@/lib/inventory-derive'
import type { InventoryCount, StockMove } from '@/types/inventory'
import type { InventoryLog } from '@/types/wms'

/** 库存管理四个列表的筛选匹配：各 Demo PRD 的 FilterBar 表；仓库由顶栏限定，调用方先按仓库取数 */

/** 编码、名称空格分词包含：任一分词命中即可（与单号多号筛选一致） */
export function matchesKeyword(values: (string | undefined)[], raw: string): boolean {
  const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return true
  const hay = values.map((v) => (v ?? '').toLowerCase())
  return tokens.some((token) => hay.some((v) => v.includes(token)))
}

const contains = (value: string | undefined, raw: string) => {
  const q = raw.trim().toLowerCase()
  return !q || (value ?? '').toLowerCase().includes(q)
}
const prefix = (value: string, raw: string) => {
  const q = raw.trim().toUpperCase()
  return !q || value.toUpperCase().startsWith(q) || value.toUpperCase() === q
}
const anyOf = (value: string | undefined, filter: string) => filter === FILTER_ALL || value === filter

export function inDateRange(iso: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true
  if (!iso) return false
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

export type StockView = 'sku' | 'balance' | 'serial'
export const STOCK_VIEWS: StockView[] = ['sku', 'balance', 'serial']

/** 用 type 而不是 interface：useListState 要求筛选是字符串字典 */
export type StockFilters = {
  keyword: string
  customerId: string
  qty: string
  changedFrom: string
  changedTo: string
  location: string
  quality: string
  expiry: string
  batch: string
  container: string
  allocatable: string
  sn: string
  serialStatus: string
}

export const emptyStockFilters: StockFilters = {
  keyword: '',
  customerId: FILTER_ALL,
  qty: FILTER_ALL,
  changedFrom: '',
  changedTo: '',
  location: '',
  quality: FILTER_ALL,
  expiry: FILTER_ALL,
  batch: '',
  container: '',
  allocatable: FILTER_ALL,
  sn: '',
  serialStatus: FILTER_ALL,
}

/** 视角切换只保留 SKU 和货主，清除上一视角专属条件 */
export const keepOnViewSwitch: (keyof StockFilters)[] = ['keyword', 'customerId']

type Name = (skuCode: string) => string | undefined

export function matchSkuStock(r: SkuStockRow, f: StockFilters, name: Name): boolean {
  if (!matchesKeyword([r.skuCode, name(r.skuCode)], f.keyword)) return false
  if (!anyOf(r.customerId, f.customerId)) return false
  if (!anyOf(r.qualityType, f.quality)) return false
  if (f.qty === 'HAS_ACTUAL' && r.actual <= 0) return false
  if (f.qty === 'ZERO_ACTUAL' && r.actual !== 0) return false
  if (f.qty === 'ZERO_AVAILABLE' && r.available !== 0) return false
  return inDateRange(r.lastChangedAt, f.changedFrom, f.changedTo)
}

export function matchBalance(b: BalanceRow, f: StockFilters, name: Name): boolean {
  const r = b.record
  if (!matchesKeyword([r.skuCode, name(r.skuCode)], f.keyword)) return false
  if (!anyOf(r.customerId, f.customerId)) return false
  if (!contains(r.locationCode, f.location)) return false
  if (!anyOf(r.qualityType, f.quality)) return false
  if (f.expiry !== FILTER_ALL && (b.expiry ?? 'NONE') !== f.expiry) return false
  if (!contains(r.batchNo, f.batch)) return false
  if (!contains(r.containerId, f.container)) return false
  if (f.allocatable === 'POSITIVE' && b.allocatable <= 0) return false
  if (f.allocatable === 'ZERO' && b.allocatable !== 0) return false
  return true
}

export function matchSerial(r: SerialRow, f: StockFilters, name: Name): boolean {
  if (f.sn.trim() && r.serialNo.toUpperCase() !== f.sn.trim().toUpperCase()) return false
  if (!matchesKeyword([r.skuCode, name(r.skuCode)], f.keyword)) return false
  if (!anyOf(r.customerId, f.customerId)) return false
  if (!anyOf(r.status, f.serialStatus)) return false
  return inDateRange(r.lastChangedAt, f.changedFrom, f.changedTo)
}

export interface LedgerFilters {
  no: string
  type: string
  sourceNo: string
  sku: string
  occurredFrom: string
  occurredTo: string
  customerId: string
  location: string
  batch: string
  sn: string
  quality: string
}

export const emptyLedgerFilters: LedgerFilters = {
  no: '',
  type: FILTER_ALL,
  sourceNo: '',
  sku: '',
  occurredFrom: '',
  occurredTo: '',
  customerId: FILTER_ALL,
  location: '',
  batch: '',
  sn: '',
  quality: FILTER_ALL,
}

export function matchLedger(l: InventoryLog, f: LedgerFilters, name: Name, displayNo: string): boolean {
  return (
    prefix(displayNo, f.no) &&
    anyOf(l.type, f.type) &&
    (!f.sourceNo.trim() || contains(l.refNo, f.sourceNo) || contains(l.jobNo, f.sourceNo)) &&
    matchesKeyword([l.skuCode, name(l.skuCode)], f.sku) &&
    inDateRange(l.createdAt, f.occurredFrom, f.occurredTo) &&
    anyOf(l.customerId, f.customerId) &&
    anyOf(l.qualityType, f.quality) &&
    contains(l.locationCode, f.location) &&
    contains(l.batchNo, f.batch) &&
    (!f.sn.trim() || Boolean(l.serialNos?.some((sn) => sn.toUpperCase() === f.sn.trim().toUpperCase())))
  )
}

/** 流水默认业务发生时间倒序；同一时刻按写入顺序倒序，成对流水相邻 */
export function sortLedger(logs: InventoryLog[]): InventoryLog[] {
  return logs
    .map((l, index) => ({ l, index }))
    .sort((a, b) => b.l.createdAt.localeCompare(a.l.createdAt) || b.index - a.index)
    .map(({ l }) => l)
}

/** 变化量排序按数值，不按格式化文本 */
export const ledgerSortValue = (l: InventoryLog) => ledgerChange(l)

export interface MoveFilters {
  no: string
  sku: string
  customerId: string
  source: string
  target: string
  submittedFrom: string
  submittedTo: string
  operator: string
}

export const emptyMoveFilters: MoveFilters = {
  no: '',
  sku: '',
  customerId: FILTER_ALL,
  source: '',
  target: '',
  submittedFrom: '',
  submittedTo: '',
  operator: FILTER_ALL,
}

export function matchMove(m: StockMove, f: MoveFilters, name: Name): boolean {
  const { sources, targets } = moveSummary(m)
  return (
    prefix(m.no, f.no) &&
    (!f.sku.trim() || m.lines.some((l) => matchesKeyword([l.skuCode, name(l.skuCode)], f.sku))) &&
    anyOf(m.customerId, f.customerId) &&
    (!f.source.trim() || sources.some((s) => contains(s, f.source))) &&
    (!f.target.trim() || targets.some((s) => contains(s, f.target))) &&
    inDateRange(m.submittedAt, f.submittedFrom, f.submittedTo) &&
    anyOf(m.operator, f.operator)
  )
}

export interface StocktakeFilters {
  no: string
  sku: string
  source: string
  createdBy: string
  createdFrom: string
  createdTo: string
}

export const emptyStocktakeFilters: StocktakeFilters = {
  no: '',
  sku: '',
  source: FILTER_ALL,
  createdBy: FILTER_ALL,
  createdFrom: '',
  createdTo: '',
}

export function matchStocktake(c: InventoryCount, f: StocktakeFilters, name: Name): boolean {
  return (
    prefix(c.no, f.no) &&
    (!f.sku.trim() || c.skus.some((k) => matchesKeyword([k.skuCode, name(k.skuCode)], f.sku))) &&
    anyOf(c.source, f.source) &&
    anyOf(c.createdBy, f.createdBy) &&
    inDateRange(c.createdAt, f.createdFrom, f.createdTo)
  )
}
