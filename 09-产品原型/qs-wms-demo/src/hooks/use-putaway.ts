import { useCallback, useMemo } from 'react'
import { useDb } from '@/mock/db'
import {
  listLocationsByWarehouse,
  listPendingPutawayTasks,
  listPutawayTasks,
  putaway as putawayAction,
} from '@/services/putaway'

export function usePutaway(warehouseCode: string) {
  const tasks = useDb((s) => s.putawayTasks)
  const locations = useDb((s) => s.locations)

  const pendingTasks = useMemo(() => listPendingPutawayTasks(warehouseCode, { putawayTasks: tasks }), [tasks, warehouseCode])
  const warehouseLocations = useMemo(() => listLocationsByWarehouse(warehouseCode, { locations }), [locations, warehouseCode])

  const putaway = useCallback(
    (input: { putawayNo: string; locationCode: string; qty: number; operator: string }) => putawayAction(input),
    [],
  )

  return {
    tasks: listPutawayTasks({ putawayTasks: tasks }),
    pendingTasks,
    locations: warehouseLocations,
    putaway,
  }
}
