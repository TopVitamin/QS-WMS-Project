import { containerIdOf } from '@/lib/container-id'
import type { SeedData } from './seed'

const UNKNOWN = '__UNKNOWN_CONTAINER__'

/**
 * v36→v37：只从原始收货、退货、上架与配对移库流水回填容器。
 * 有散件/未知来源或多个容器证据的库存行保持无容器，避免给已合并库存猜归属。
 */
export function migrateContainerReferences(persisted: unknown): unknown {
  if (!persisted || typeof persisted !== 'object') return persisted
  const state = persisted as Partial<SeedData>
  const receiptRecords = state.receiptRecords ?? []
  const returnReceipts = state.returnReceipts ?? []
  const putawayOrders = state.putawayOrders ?? []
  const logs = state.inventoryLogs ?? []
  const evidence = new Map<string, Set<string>>()
  const moveSources = new Map<string, Set<string>>()
  const add = (inventoryId: string | undefined, containerId?: string) => {
    if (!inventoryId) return
    const set = evidence.get(inventoryId) ?? new Set<string>()
    set.add(containerId ?? UNKNOWN)
    evidence.set(inventoryId, set)
  }
  const logById = new Map(logs.map((log) => [log.id, log]))

  logs.filter((log) => log.level !== 'SKU' && log.inventoryId && log.qtyChange > 0).forEach((log) => {
    if (log.type === 'RECEIVE' && log.jobNo && log.sourceLineNo !== undefined) {
      const receipt = receiptRecords.find((r) => r.receiptNo === log.jobNo)
      const line = receipt?.lines.find((l) => l.lineNo === log.sourceLineNo)
      add(log.inventoryId, line ? line.containerId ?? containerIdOf(receipt!.warehouseCode, line.containerNo) : undefined)
      return
    }
    if (log.type === 'PUTAWAY' && log.jobNo) {
      const order = putawayOrders.find((p) => p.putawayNo === log.jobNo)
      add(log.inventoryId, order ? order.containerId ?? containerIdOf(order.warehouseCode, order.containerNo) : undefined)
      return
    }
    if (log.type === 'RETURN' && log.jobNo) {
      const receipt = returnReceipts.find((r) => r.receiptNo === log.jobNo)
      const candidates = receipt?.lines.filter((line) =>
        line.skuCode === log.skuCode &&
        (line.batchNo ?? '') === (log.batchNo ?? '') &&
        (log.qualityType === 'DEFECTIVE' ? line.defectQty : line.goodQty) >= log.qtyChange,
      ) ?? []
      const ids = new Set(candidates.map((line) => line.containerId ?? containerIdOf(receipt!.warehouseCode, line.containerNo) ?? UNKNOWN))
      add(log.inventoryId, ids.size === 1 ? [...ids][0] : undefined)
      return
    }
    if (log.type === 'MOVE' || log.type === 'QUALITY') {
      const paired = log.pairedLogId ? logById.get(log.pairedLogId) : undefined
      const sourceId = paired?.inventoryId
      const sources = moveSources.get(log.inventoryId!) ?? new Set<string>()
      if (sourceId) sources.add(sourceId)
      moveSources.set(log.inventoryId!, sources)
      return
    }
    // 拣货、返库、盘点新增等正向入账不能据此推断原始容器。
    add(log.inventoryId)
  })

  for (let pass = 0; pass < logs.length; pass += 1) {
    let changed = false
    moveSources.forEach((sources, inventoryId) => {
      const target = evidence.get(inventoryId) ?? new Set<string>()
      sources.forEach((sourceId) => evidence.get(sourceId)?.forEach((id) => target.add(id)))
      if (target.size !== (evidence.get(inventoryId)?.size ?? 0)) changed = true
      if (target.size) evidence.set(inventoryId, target)
    })
    if (!changed) break
  }

  const inventory = (state.inventory ?? []).map((row) => {
    const ids = evidence.get(row.id)
    const containerId = ids?.size === 1 ? [...ids][0] : undefined
    return { ...row, containerId: containerId === UNKNOWN ? undefined : containerId }
  })
  const inventoryById = new Map(inventory.map((row) => [row.id, row]))
  return {
    ...state,
    receiptRecords: receiptRecords.map((receipt) => ({
      ...receipt,
      lines: receipt.lines.map((line) => ({
        ...line,
        containerId: line.containerId ?? containerIdOf(receipt.warehouseCode, line.containerNo),
      })),
    })),
    returnReceipts: returnReceipts.map((receipt) => ({
      ...receipt,
      lines: receipt.lines.map((line) => ({
        ...line,
        containerId: line.containerId ?? containerIdOf(receipt.warehouseCode, line.containerNo),
      })),
    })),
    putawayOrders: putawayOrders.map((order) => ({
      ...order,
      containerId: order.containerId ?? containerIdOf(order.warehouseCode, order.containerNo),
    })),
    inventory,
    inventoryLogs: logs.map((log) => ({ ...log, containerId: inventoryById.get(log.inventoryId ?? '')?.containerId })),
  }
}
