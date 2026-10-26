import { useMemo } from 'react'
import { useDb } from '@/mock/db'

/** 返回仍在执行的单据与作业引用，避免占用中的库位被停用或换区。 */
export function useLocationWorkReferences() {
  const inbounds = useDb((s) => s.inbounds)
  const receiptRecords = useDb((s) => s.receiptRecords)
  const returnOrders = useDb((s) => s.returnOrders)
  const returnReceipts = useDb((s) => s.returnReceipts)
  const putawayOrders = useDb((s) => s.putawayOrders)
  const outboundPickTasks = useDb((s) => s.outboundPickTasks)
  const outboundPutbacks = useDb((s) => s.outboundPutbacks)
  const inventoryCounts = useDb((s) => s.inventoryCounts)

  return useMemo(
    () => ({
      inbounds,
      receiptRecords,
      returnOrders,
      returnReceipts,
      putawayOrders,
      outboundPickTasks,
      outboundPutbacks,
      inventoryCounts,
    }),
    [inbounds, inventoryCounts, outboundPickTasks, outboundPutbacks, putawayOrders, receiptRecords, returnOrders, returnReceipts],
  )
}
