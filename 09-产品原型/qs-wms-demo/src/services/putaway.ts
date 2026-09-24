import { useDb, type DbState } from '@/mock/db'
import type { Location, PutawayTask } from '@/types/wms'
import type { ActionResult } from './types'

export function listPutawayTasks(db: Pick<DbState, 'putawayTasks'> = useDb.getState()): PutawayTask[] {
  return db.putawayTasks
}

export function listPendingPutawayTasks(
  warehouseCode: string,
  db: Pick<DbState, 'putawayTasks'> = useDb.getState(),
): PutawayTask[] {
  return db.putawayTasks.filter((t) => t.warehouseCode === warehouseCode && t.status !== 'COMPLETED')
}

export function getPutawayTask(putawayNo: string, db: Pick<DbState, 'putawayTasks'> = useDb.getState()): PutawayTask | undefined {
  return db.putawayTasks.find((t) => t.putawayNo === putawayNo)
}

export function listLocationsByWarehouse(
  warehouseCode: string,
  db: Pick<DbState, 'locations'> = useDb.getState(),
): Location[] {
  return db.locations.filter((l) => l.warehouseCode === warehouseCode)
}

export function putaway(input: {
  putawayNo: string
  locationCode: string
  qty: number
  operator: string
}): ActionResult {
  return useDb.getState().putaway(input)
}

export function getPutawayActions() {
  const { putaway: putawayAction } = useDb.getState()
  return { putaway: putawayAction }
}
