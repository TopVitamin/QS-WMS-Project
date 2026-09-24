import { useDb, type DbState } from '@/mock/db'
import { convertMoney } from '@/lib/format'
import type { CurrencyCode, Customer, InventoryRecord, Location, Money, Sku } from '@/types/wms'

export interface InventoryFilters {
  keyword: string
  customerId: string
  quality: string
}

export interface StockSummary {
  skus: number
  qty: number
  locations: number
  value: Money
}

export function listInventory(db: Pick<DbState, 'inventory'> = useDb.getState()): InventoryRecord[] {
  return db.inventory
}

export function listLocations(db: Pick<DbState, 'locations'> = useDb.getState()): Location[] {
  return db.locations
}

export function listCustomers(db: Pick<DbState, 'customers'> = useDb.getState()): Customer[] {
  return db.customers
}

export function listInventoryByWarehouse(
  warehouseCode: string,
  filters: InventoryFilters,
  skuLookup: (code: string) => Sku | undefined,
  db: Pick<DbState, 'inventory'> = useDb.getState(),
): InventoryRecord[] {
  const keyword = filters.keyword.trim().toUpperCase()
  return db.inventory.filter((r) => {
    if (r.warehouseCode !== warehouseCode || r.onHandQty <= 0) return false
    if (filters.customerId !== '__all' && r.customerId !== filters.customerId) return false
    if (filters.quality !== '__all' && r.qualityType !== filters.quality) return false
    if (!keyword) return true
    const s = skuLookup(r.skuCode)
    return r.skuCode.includes(keyword) || r.locationCode.includes(keyword) || !!s?.barcode.includes(keyword)
  })
}

export function getStockSummary(
  rows: InventoryRecord[],
  skuLookup: (code: string) => Sku | undefined,
  displayCurrency: CurrencyCode,
): StockSummary {
  const value = rows.reduce((acc, r) => {
    const s = skuLookup(r.skuCode)
    return s ? acc + convertMoney({ ...s.declaredValue, amount: s.declaredValue.amount * r.onHandQty }, displayCurrency).amount : acc
  }, 0)
  return {
    skus: new Set(rows.map((r) => r.skuCode)).size,
    qty: rows.reduce((a, r) => a + r.onHandQty, 0),
    locations: new Set(rows.map((r) => r.locationCode)).size,
    value: { amount: value, currency: displayCurrency },
  }
}
