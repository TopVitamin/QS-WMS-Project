import { useDb, type DbState } from '@/mock/db'
import { listOpenPutawayOrders } from '@/lib/putaway'
import type { PutawayOrder } from '@/types/inbound'
import type { Location } from '@/types/wms'
import type { ActionResult } from './types'

/** 当前仓库未提交的上架单（上架单是唯一上架对象，见 PDA 上架 PRD） */
export function listPendingPutawayOrders(
  warehouseCode: string,
  db: Pick<DbState, 'putawayOrders'> = useDb.getState(),
): PutawayOrder[] {
  return listOpenPutawayOrders(db.putawayOrders, warehouseCode)
}

export function getPutawayOrder(putawayNo: string, db: Pick<DbState, 'putawayOrders'> = useDb.getState()): PutawayOrder | undefined {
  return db.putawayOrders.find((p) => p.putawayNo === putawayNo)
}

export function listLocationsByWarehouse(
  warehouseCode: string,
  db: Pick<DbState, 'locations'> = useDb.getState(),
): Location[] {
  return db.locations.filter((l) => l.warehouseCode === warehouseCode)
}

export function savePutawayLine(input: Parameters<DbState['savePutawayLine']>[0]): ActionResult {
  return useDb.getState().savePutawayLine(input)
}

export function removePutawayLine(input: Parameters<DbState['removePutawayLine']>[0]): ActionResult {
  return useDb.getState().removePutawayLine(input)
}

export function submitPutawayOrder(input: Parameters<DbState['submitPutawayOrder']>[0]): ActionResult {
  return useDb.getState().submitPutawayOrder(input)
}

export function confirmPutawayEntry(
  input: Parameters<DbState['confirmPutawayEntry']>[0],
): ActionResult & { failedIndex?: number } {
  return useDb.getState().confirmPutawayEntry(input)
}
