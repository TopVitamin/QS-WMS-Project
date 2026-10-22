import type { SeedData } from '@/mock/seed'

/** 动作副本完成演算后统一校验；失败时调用方不得提交副本或写流水。 */
export function negativeInventoryIssue(s: Pick<SeedData, 'inventory' | 'outboundOrders'>) {
  const totals = new Map<string, { sku: string; actual: number; reserved: number }>()
  const keyOf = (r: { warehouseCode: string; customerId: string; skuCode: string }) =>
    `${r.warehouseCode}::${r.customerId}::${r.skuCode}`
  const ensure = (r: { warehouseCode: string; customerId: string; skuCode: string }) => {
    const key = keyOf(r)
    if (!totals.has(key)) totals.set(key, { sku: r.skuCode, actual: 0, reserved: 0 })
    return totals.get(key)!
  }
  for (const r of s.inventory) {
    if (
      !Number.isInteger(r.onHandQty) ||
      r.onHandQty < 0 ||
      (r.allocatedQty ?? 0) < 0 ||
      (r.allocatedQty ?? 0) > r.onHandQty ||
      r.lockedQty < 0
    )
      return { sku: r.skuCode, actual: r.onHandQty, reserved: r.allocatedQty ?? 0 }
    if (r.qualityType === 'GOOD') ensure(r).actual += r.onHandQty
  }
  for (const o of s.outboundOrders) {
    if (o.status === 'SHIPPED' || o.status === 'CANCELLED') continue
    for (const i of o.items) {
      if (!Number.isInteger(i.reservedQty) || i.reservedQty < 0)
        return { sku: i.skuCode, actual: 0, reserved: i.reservedQty }
      ensure({ ...o, skuCode: i.skuCode }).reserved += i.reservedQty
    }
  }
  return [...totals.values()].find((r) => r.reserved > r.actual)
}
