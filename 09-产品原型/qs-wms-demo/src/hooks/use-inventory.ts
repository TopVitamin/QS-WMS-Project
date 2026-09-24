import { useMemo } from 'react'
import { useDb, useLookups } from '@/mock/db'
import { getStockSummary, listCustomers, listInventoryByWarehouse, listLocations, type InventoryFilters } from '@/services/inventory'
import { useSettings } from '@/stores/settings'

export function useInventory(filters: InventoryFilters) {
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const displayCurrency = useSettings((s) => s.displayCurrency)
  const inventory = useDb((s) => s.inventory)
  const locations = useDb((s) => s.locations)
  const customers = useDb((s) => s.customers)
  const { sku } = useLookups()

  const rows = useMemo(
    () => listInventoryByWarehouse(warehouseCode, filters, sku, { inventory }),
    [inventory, warehouseCode, filters, sku],
  )

  const summary = useMemo(() => getStockSummary(rows, sku, displayCurrency), [rows, sku, displayCurrency])

  return {
    rows,
    summary,
    locations: listLocations({ locations }),
    customers: listCustomers({ customers }),
    warehouseCode,
  }
}
