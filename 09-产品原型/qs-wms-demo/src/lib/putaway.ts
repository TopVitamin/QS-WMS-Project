import type { PutawayOrder, PutawayPlanLine } from '@/types/inbound'
import type { InventoryRecord, Location } from '@/types/wms'
import { compareLocation } from './outbound-pick-route'

/** 上架单是否还在作业中（未提交） */
export function isPutawayOrderOpen(order: PutawayOrder): boolean {
  return order.status !== 'COMPLETED'
}

/** 当前仓库未提交的上架单：上架中排前，其余按创建时间 */
export function listOpenPutawayOrders(orders: PutawayOrder[], warehouseCode: string): PutawayOrder[] {
  return orders
    .filter((o) => o.warehouseCode === warehouseCode && isPutawayOrderOpen(o))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'PUTAWAYING' ? -1 : 1
      return a.createdAt.localeCompare(b.createdAt)
    })
}

/** 应上架数量：不传行号时汇总全单，传 `skuCode` 时按商品汇总 */
export function planQty(order: PutawayOrder, skuCode?: string): number {
  return order.planLines.filter((l) => !skuCode || l.skuCode === skuCode).reduce((s, l) => s + l.planQty, 0)
}

/**
 * 已录数量＝已保存的实际明细合计（含已提交；已完成单等于应上架）。
 * 传 `planLineNo` 时只算该应上架行（同SKU多批次必须按行算，不能按 `skuCode` 合并）。
 */
export function recordedQty(order: PutawayOrder, planLineNo?: number): number {
  return order.actualLines
    .filter((a) => planLineNo === undefined || a.planLineNo === planLineNo)
    .reduce((s, a) => s + a.qty, 0)
}

/** 还没落位的数量：全单（或某应上架行）的应上架 − 已录 */
export function remainingQty(order: PutawayOrder, planLineNo?: number): number {
  if (planLineNo === undefined) return Math.max(0, planQty(order) - recordedQty(order))
  const planLine = order.planLines.find((l) => l.lineNo === planLineNo)
  if (!planLine) return 0
  return Math.max(0, planLine.planQty - recordedQty(order, planLineNo))
}

/** 每个应上架行已录＝应上架，才能提交（主 PRD 第三节第 4 条） */
export function isFullyRecorded(order: PutawayOrder): boolean {
  return order.planLines.every((l) => recordedQty(order, l.lineNo) === l.planQty)
}

/** 已上架数量：只统计已提交的整张上架单，不能用已录代替（上架单主PRD 第二节） */
export function submittedQty(order: PutawayOrder): number {
  return order.status === 'COMPLETED' ? planQty(order) : 0
}

/** 上架单去重商品数（列表 SKU 数列） */
export function skuKindCount(order: PutawayOrder): number {
  return new Set(order.planLines.map((l) => l.skuCode)).size
}

/** 未提交上架单还在暂存库位的件数（工作台、首页「待上架」） */
export function pendingPutawayQty(order: PutawayOrder): number {
  return isPutawayOrderOpen(order) ? planQty(order) : 0
}

export function findLocation(locations: Location[], warehouseCode: string, code: string): Location | undefined {
  const key = code.trim().toUpperCase()
  return locations.find((l) => l.warehouseCode === warehouseCode && l.code.toUpperCase() === key)
}

function fitsQuality(order: PutawayOrder, location: Location): boolean {
  if (order.qualityType === 'DEFECTIVE') return location.type === 'DEFECT'
  /** 退货来源良品只放存储库位；入库来源良品放存储或拣货 */
  if (order.sourceType === 'RETURN') return location.type === 'STORAGE'
  return location.type === 'STORAGE' || location.type === 'PICK'
}

/** 一货位一货主：已有其他货主库存，或其他货主未提交的落位 */
function occupiedByOtherOwner(
  order: PutawayOrder,
  locationCode: string,
  inventory: InventoryRecord[],
  putawayOrders: PutawayOrder[],
): boolean {
  return (
    inventory.some(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === locationCode &&
        r.customerId !== order.customerId &&
        r.onHandQty > 0,
    ) ||
    putawayOrders.some(
      (p) =>
        p.putawayNo !== order.putawayNo &&
        p.warehouseCode === order.warehouseCode &&
        p.customerId !== order.customerId &&
        isPutawayOrderOpen(p) &&
        p.actualLines.some((a) => !a.submitted && a.locationCode === locationCode),
    )
  )
}

export interface PutawayLocationContext {
  locations: Location[]
  inventory: InventoryRecord[]
  putawayOrders: PutawayOrder[]
}

/** 目标货位校验；通过返回 null，否则返回文案 key（上架单主PRD 第三节、PDA 上架 PRD §4） */
export function validatePutawayLocation(
  order: PutawayOrder,
  code: string,
  ctx: PutawayLocationContext,
): string | null {
  const location = findLocation(ctx.locations, order.warehouseCode, code)
  if (!location) return 'pdaPutaway.error.locationNotFound'
  if (location.status === 'DISABLED') return 'pdaPutaway.error.locationDisabled'
  if (location.type === 'STAGING') return 'pdaPutaway.error.staging'
  if (location.type === 'EXCEPTION') return 'pdaPutaway.error.exception'
  if (!fitsQuality(order, location)) {
    return order.qualityType === 'DEFECTIVE'
      ? 'pdaPutaway.error.defectOnly'
      : order.sourceType === 'RETURN'
        ? 'pdaPutaway.error.returnStorageOnly'
        : 'pdaPutaway.error.goodToDefect'
  }
  if (occupiedByOtherOwner(order, location.code, ctx.inventory, ctx.putawayOrders)) return 'pdaPutaway.error.otherOwner'
  return null
}

/**
 * 推荐货位：先找同货主、同商品、同品质已有库存的适配货位；没有则取第一个空闲货位
 * （良品取存储货位，不良品取不良隔离货位）。找不到返回 undefined。
 */
export function suggestPutawayLocation(
  order: PutawayOrder,
  skuCode: string | undefined,
  ctx: PutawayLocationContext,
): string | undefined {
  const usable = (code: string) => validatePutawayLocation(order, code, ctx) === null
  const sameStock = ctx.inventory.find(
    (r) =>
      r.warehouseCode === order.warehouseCode &&
      r.customerId === order.customerId &&
      (!skuCode || r.skuCode === skuCode) &&
      r.qualityType === order.qualityType &&
      r.onHandQty > 0 &&
      usable(r.locationCode),
  )
  if (sameStock) return sameStock.locationCode
  const emptyType = order.qualityType === 'DEFECTIVE' ? 'DEFECT' : 'STORAGE'
  const empty = ctx.locations.find(
    (l) =>
      l.warehouseCode === order.warehouseCode &&
      l.type === emptyType &&
      usable(l.code) &&
      !ctx.inventory.some((r) => r.warehouseCode === order.warehouseCode && r.locationCode === l.code && r.onHandQty > 0),
  )
  return empty?.code
}

/** 没有推荐库位的应上架行归到最后一站，用这个键表示（路由参数 `at` 也用它）；到站时扫任一可用库位 */
export const NO_SUGGESTED_STOP = '*'

export interface PutawayStop {
  /** 推荐库位，或 `NO_SUGGESTED_STOP` */
  location: string
  lines: PutawayPlanLine[]
}

/**
 * PDA 上架路径（《PDA作业端设计规范》§4.6）：还没落满的应上架行按推荐库位分组，按库位编号自然顺序排
 * （A-01-02 在 A-01-10 前）；没有推荐库位的行排在最后一站。保存不动库存，推荐在作业中保持不变。
 */
export function putawayStops(order: PutawayOrder, ctx: PutawayLocationContext): PutawayStop[] {
  const map = new Map<string, PutawayPlanLine[]>()
  for (const line of order.planLines) {
    if (remainingQty(order, line.lineNo) <= 0) continue
    const location = suggestPutawayLocation(order, line.skuCode, ctx) ?? NO_SUGGESTED_STOP
    map.set(location, [...(map.get(location) ?? []), line])
  }
  return [...map.entries()]
    .sort(
      ([a], [b]) =>
        Number(a === NO_SUGGESTED_STOP) - Number(b === NO_SUGGESTED_STOP) || compareLocation(a, b),
    )
    .map(([location, lines]) => ({ location, lines }))
}
