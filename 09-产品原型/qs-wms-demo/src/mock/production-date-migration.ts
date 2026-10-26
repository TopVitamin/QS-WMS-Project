import type { SeedData } from './seed'

const UNKNOWN = '__UNKNOWN_PRODUCTION_DATE__'

/** v37→v38：仅按唯一原始收货/退货/上架或配对库存流水证据回填批次生产日期。 */
export function migrateInventoryProductionDates(persisted: unknown): unknown {
  if (!persisted || typeof persisted !== 'object') return persisted
  const state = persisted as Partial<SeedData>
  const logs = state.inventoryLogs ?? []
  const receiptRecords = state.receiptRecords ?? []
  const returnReceipts = state.returnReceipts ?? []
  const putawayOrders = state.putawayOrders ?? []
  const evidence = new Map<string, Set<string>>()
  const transferSources = new Map<string, Set<string>>()
  const logById = new Map(logs.map((log) => [log.id, log]))

  const add = (inventoryId: string | undefined, productionDate?: string) => {
    if (!inventoryId) return
    const dates = evidence.get(inventoryId) ?? new Set<string>()
    dates.add(productionDate?.trim() || UNKNOWN)
    evidence.set(inventoryId, dates)
  }
  for (const row of state.inventory ?? []) {
    if (row.productionDate) add(row.id, row.productionDate)
  }

  logs
    .filter((log) => log.level !== 'SKU' && log.inventoryId && log.qtyChange > 0)
    .forEach((log) => {
      if (log.type === 'RECEIVE' && log.jobNo) {
        const receipts = receiptRecords.filter((receipt) => receipt.receiptNo === log.jobNo)
        const candidates = receipts.flatMap((receipt) =>
          receipt.lines.filter(
            (line) =>
              line.skuCode === log.skuCode &&
              (log.sourceLineNo === undefined || line.lineNo === log.sourceLineNo) &&
              (line.batchNo ?? '') === (log.batchNo ?? '') &&
              (log.qualityType === 'DEFECTIVE' ? line.defectQty : line.goodQty) >= log.qtyChange,
          ),
        )
        if (candidates.length) candidates.forEach((line) => add(log.inventoryId, line.productionDate))
        else add(log.inventoryId)
        return
      }

      if (log.type === 'PUTAWAY' && log.jobNo) {
        const orders = putawayOrders.filter((order) => order.putawayNo === log.jobNo)
        const candidates = orders.flatMap((order) =>
          order.planLines.filter(
            (line) =>
              line.skuCode === log.skuCode &&
              (log.sourceLineNo === undefined || line.receiptLineNo === log.sourceLineNo) &&
              (line.batchNo ?? '') === (log.batchNo ?? '') &&
              (!log.qualityType || order.qualityType === log.qualityType),
          ),
        )
        if (candidates.length) candidates.forEach((line) => add(log.inventoryId, line.productionDate))
        else add(log.inventoryId)
        return
      }

      if (log.type === 'RETURN' && log.sourceType === 'RETURN' && log.jobNo) {
        const receipts = returnReceipts.filter((receipt) => receipt.receiptNo === log.jobNo)
        const candidates = receipts.flatMap((receipt) =>
          receipt.lines.filter(
            (line) =>
              line.skuCode === log.skuCode &&
              (log.sourceLineNo === undefined || line.lineNo === log.sourceLineNo) &&
              (line.batchNo ?? '') === (log.batchNo ?? '') &&
              (log.qualityType === 'DEFECTIVE' ? line.defectQty : line.goodQty) >= log.qtyChange,
          ),
        )
        if (candidates.length) candidates.forEach((line) => add(log.inventoryId, line.productionDate))
        else add(log.inventoryId)
        return
      }

      const paired = log.pairedLogId ? logById.get(log.pairedLogId) : undefined
      if (paired?.inventoryId) {
        const sources = transferSources.get(log.inventoryId!) ?? new Set<string>()
        sources.add(paired.inventoryId)
        transferSources.set(log.inventoryId!, sources)
        return
      }

      add(log.inventoryId)
    })

  for (let pass = 0; pass < logs.length; pass += 1) {
    let changed = false
    transferSources.forEach((sources, inventoryId) => {
      const target = evidence.get(inventoryId) ?? new Set<string>()
      const sizeBefore = target.size
      sources.forEach((sourceId) => evidence.get(sourceId)?.forEach((date) => target.add(date)))
      if (target.size > sizeBefore) changed = true
      if (target.size) evidence.set(inventoryId, target)
    })
    if (!changed) break
  }

  const inventory = (state.inventory ?? []).map((row) => {
    if (row.productionDate) return row
    const dates = evidence.get(row.id)
    if (!dates || dates.size !== 1) return row
    const [productionDate] = dates
    return productionDate === UNKNOWN ? row : { ...row, productionDate }
  })

  return { ...state, inventory }
}
