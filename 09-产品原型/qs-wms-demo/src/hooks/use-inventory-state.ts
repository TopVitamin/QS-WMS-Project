import { useMemo } from 'react'
import { useDb } from '@/mock/db'

/**
 * 库存派生与库内校验要用的业务数据（与管理端库存查询同一份，不另存余额）。PDA 库内作业共用；
 * 扫码处理请改读 useDb.getState()，动作刚写入时组件可能还没重渲染（《PDA作业端设计规范》§4.7）。
 */
export function useInventoryState() {
  const inventory = useDb((s) => s.inventory)
  const inventoryLogs = useDb((s) => s.inventoryLogs)
  const inventoryCounts = useDb((s) => s.inventoryCounts)
  const outboundOrders = useDb((s) => s.outboundOrders)
  const outboundPickTasks = useDb((s) => s.outboundPickTasks)
  const outboundPutbacks = useDb((s) => s.outboundPutbacks)
  const putawayOrders = useDb((s) => s.putawayOrders)
  const skuAllocationControls = useDb((s) => s.skuAllocationControls)
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  const warehouses = useDb((s) => s.warehouses)
  const stockMoves = useDb((s) => s.stockMoves)
  return useMemo(
    () => ({
      inventory,
      inventoryLogs,
      inventoryCounts,
      outboundOrders,
      outboundPickTasks,
      outboundPutbacks,
      putawayOrders,
      skuAllocationControls,
      skuMasters,
      skuBarcodes,
      locations,
      locationMasters,
      warehouses,
      stockMoves,
    }),
    [
      inventory,
      inventoryCounts,
      inventoryLogs,
      locationMasters,
      locations,
      outboundOrders,
      outboundPickTasks,
      outboundPutbacks,
      putawayOrders,
      skuAllocationControls,
      skuBarcodes,
      skuMasters,
      stockMoves,
      warehouses,
    ],
  )
}

export type InventoryState = ReturnType<typeof useInventoryState>
