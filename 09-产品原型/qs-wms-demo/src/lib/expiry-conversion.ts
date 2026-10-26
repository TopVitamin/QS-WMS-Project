import { expiryLevel, locationUsage, orderReservedTotals, stockKey, warehouseLocalDate } from '@/lib/inventory-derive'
import { balanceLog, pairLogs } from '@/lib/inventory-ledger'
import type { InventoryRecord, QualityType } from '@/types/wms'
import type { SeedData } from '@/mock/seed'

/** 按仓库当地日期，把已过期、未分配且不受盘点冻结的良品转为不良品。 */
export function applyExpiredConversions(state: SeedData, at: string): number {
  const reserved = orderReservedTotals(state.outboundOrders)
  const goodTotals = new Map<string, number>()
  state.inventory.forEach((r) => {
    if (r.qualityType !== 'GOOD') return
    const key = stockKey(r.warehouseCode, r.customerId, r.skuCode)
    goodTotals.set(key, (goodTotals.get(key) ?? 0) + r.onHandQty)
  })
  const available = new Map<string, number>()
  goodTotals.forEach((qty, key) => available.set(key, Math.max(0, qty - (reserved.get(key) ?? 0))))

  const localDates = new Map<string, string>()
  const masterFor = (r: InventoryRecord) =>
    state.skuMasters.find((m) => m.customerId === r.customerId && m.code === r.skuCode)
  const sync = (r: InventoryRecord) => {
    r.lockedQty = r.qualityType === 'DEFECTIVE' ? r.onHandQty : 0
  }
  let convertedQty = 0
  const candidates = [...state.inventory]

  for (const from of candidates) {
    if (from.qualityType !== 'GOOD' || from.onHandQty <= 0) continue
    const usage = locationUsage(state, from.warehouseCode, from.locationCode)
    if (usage !== 'PICK' && usage !== 'STORAGE') continue
    if (
      state.inventoryCounts.some(
        (c) =>
          c.status === 'COUNTING' &&
          c.warehouseCode === from.warehouseCode &&
          c.skus.some((k) => k.customerId === from.customerId && k.skuCode === from.skuCode),
      )
    ) continue

    const master = masterFor(from)
    if (!master?.expiryEnabled || !from.expiryDate) continue
    let today = localDates.get(from.warehouseCode)
    if (!today) {
      const timezone = state.warehouses.find((w) => w.code === from.warehouseCode)?.timezone ?? 'UTC'
      today = warehouseLocalDate(timezone, new Date(at))
      localDates.set(from.warehouseCode, today)
    }
    if (expiryLevel(from.expiryDate, master, today) !== 'EXPIRED') continue

    const key = stockKey(from.warehouseCode, from.customerId, from.skuCode)
    const skuAvailable = available.get(key) ?? 0
    const unallocated = Math.max(0, from.onHandQty - (from.allocatedQty ?? 0))
    const qty = Math.min(unallocated, skuAvailable)
    if (qty <= 0) continue

    let to = state.inventory.find(
      (r) =>
        r.id !== from.id &&
        r.warehouseCode === from.warehouseCode &&
        r.customerId === from.customerId &&
        r.skuCode === from.skuCode &&
        r.locationCode === from.locationCode &&
        (r.containerId ?? '') === (from.containerId ?? '') &&
        r.qualityType === 'DEFECTIVE' &&
        (r.batchNo ?? '') === (from.batchNo ?? '') &&
        (r.productionDate ?? '') === (from.productionDate ?? '') &&
        (r.expiryDate ?? '') === (from.expiryDate ?? ''),
    )
    if (!to) {
      to = {
        id: `INV-INV-${at}-${state.inventory.length}`,
        warehouseCode: from.warehouseCode,
        customerId: from.customerId,
        skuCode: from.skuCode,
        locationCode: from.locationCode,
        containerId: from.containerId,
        qualityType: 'DEFECTIVE' as QualityType,
        batchNo: from.batchNo,
        productionDate: from.productionDate,
        expiryDate: from.expiryDate,
        onHandQty: 0,
        lockedQty: 0,
        allocatedQty: 0,
        serialNos: [],
        firstInboundAt: from.firstInboundAt,
      }
      state.inventory.push(to)
    }

    from.onHandQty -= qty
    to.onHandQty += qty
    // 没有逐件核实SN时不把任何具体SN归到某一品质/库存行。
    from.serialNos = undefined
    to.serialNos = undefined
    sync(from)
    sync(to)

    const actionId = `EXPIRY-${from.id}-${at}-${state.inventoryLogs.length}`
    const meta = {
      operator: 'SYSTEM',
      createdAt: at,
      terminal: 'SYSTEM' as const,
      type: 'QUALITY' as const,
      refNo: '',
      sourceType: 'NONE' as const,
      reasonCode: 'EXPIRED' as const,
      ownerNotice: 'NOT_REQUIRED' as const,
    }
    const minus = balanceLog(from, -qty, {
      id: `LOG-EXP-${at}-${state.inventoryLogs.length}`,
      ...meta,
    })
    state.inventoryLogs.push(minus)
    const plus = balanceLog(to, qty, {
      id: `LOG-EXP-${at}-${state.inventoryLogs.length}`,
      ...meta,
    })
    state.inventoryLogs.push(plus)
    pairLogs(minus, plus, actionId)
    available.set(key, skuAvailable - qty)
    convertedQty += qty
  }

  return convertedQty
}
