import { useMemo } from 'react'
import { useDb } from '@/mock/db'
import {
  listLocationsByWarehouse,
  listPendingPutawayOrders,
  removePutawayLine,
  savePutawayLine,
  submitPutawayOrder,
} from '@/services/putaway'

export function usePutaway(warehouseCode: string) {
  const putawayOrders = useDb((s) => s.putawayOrders)
  const locations = useDb((s) => s.locations)
  const inventory = useDb((s) => s.inventory)

  const pendingOrders = useMemo(
    () => listPendingPutawayOrders(warehouseCode, { putawayOrders }),
    [putawayOrders, warehouseCode],
  )
  const warehouseLocations = useMemo(() => listLocationsByWarehouse(warehouseCode, { locations }), [locations, warehouseCode])

  return {
    putawayOrders,
    pendingOrders,
    locations: warehouseLocations,
    /** 货位校验与推荐所需的全量上下文 */
    locationContext: { locations, inventory, putawayOrders },
    savePutawayLine,
    removePutawayLine,
    submitPutawayOrder,
  }
}
