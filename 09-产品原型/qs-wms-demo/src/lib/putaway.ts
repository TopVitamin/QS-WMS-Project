import type { PutawayOrder } from '@/types/inbound'
import type { InventoryRecord, Location } from '@/types/wms'

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

export function planQty(order: PutawayOrder, skuCode?: string): number {
  return order.planLines.filter((l) => !skuCode || l.skuCode === skuCode).reduce((s, l) => s + l.planQty, 0)
}

/** 已录（保存 + 已提交）的实际上架数量 */
export function recordedQty(order: PutawayOrder, skuCode?: string): number {
  return order.actualLines.filter((a) => !skuCode || a.skuCode === skuCode).reduce((s, a) => s + a.qty, 0)
}

/** 还没落位的数量（应上架 − 已录） */
export function remainingQty(order: PutawayOrder, skuCode?: string): number {
  return Math.max(0, planQty(order, skuCode) - recordedQty(order, skuCode))
}

/** 每个应上架行已录＝应上架，才能提交（入库业务设计 §6.3） */
export function isFullyRecorded(order: PutawayOrder): boolean {
  return order.planLines.every((l) => recordedQty(order, l.skuCode) === l.planQty)
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
  return order.qualityType === 'DEFECTIVE' ? location.type === 'DEFECT' : location.type === 'STORAGE' || location.type === 'PICK'
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

/** 目标货位校验；通过返回 null，否则返回文案 key（PDA 上架 PRD §4） */
export function validatePutawayLocation(
  order: PutawayOrder,
  code: string,
  ctx: PutawayLocationContext,
): string | null {
  const location = findLocation(ctx.locations, order.warehouseCode, code)
  if (!location) return 'pdaPutaway.error.locationNotFound'
  if (location.type === 'STAGING') return 'pdaPutaway.error.staging'
  if (!fitsQuality(order, location)) {
    return order.qualityType === 'DEFECTIVE' ? 'pdaPutaway.error.defectOnly' : 'pdaPutaway.error.goodToDefect'
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
