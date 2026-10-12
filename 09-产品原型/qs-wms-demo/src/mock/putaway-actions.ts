import { stagingLocationCode, syncInboundPutawayFromOrders } from '@/lib/inbound-derive'
import { findLocation, isFullyRecorded, remainingQty, validatePutawayLocation } from '@/lib/putaway'
import type { PutawayOrder } from '@/types/inbound'
import type { InventoryLog, InventoryRecord } from '@/types/wms'
import type { SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string }
type PatchResult = ActionResult & { patch?: Partial<SeedData>; order?: PutawayOrder }

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function findOpenOrder(state: SeedData, putawayNo: string): PutawayOrder | { errorKey: string } {
  const order = state.putawayOrders.find((p) => p.putawayNo === putawayNo)
  if (!order) return { errorKey: 'pdaPutaway.error.orderNotFound' }
  if (order.status === 'COMPLETED') return { errorKey: 'pdaPutaway.error.orderSubmitted' }
  return order
}

function replaceOrder(state: SeedData, next: PutawayOrder): PutawayOrder[] {
  return state.putawayOrders.map((p) => (p.putawayNo === next.putawayNo ? next : p))
}

/** 保存落位：追加或累加一条未提交的实际上架明细；只记进度，不动库存（主 PRD R10） */
export function applySavePutawayLine(
  state: SeedData,
  input: { putawayNo: string; locationCode: string; skuCode: string; qty: number },
): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  if (!Number.isInteger(input.qty) || input.qty <= 0) return { ok: false, errorKey: 'error.qtyInvalid' }
  if (!order.planLines.some((l) => l.skuCode === input.skuCode)) return { ok: false, errorKey: 'pdaPutaway.error.skuNotInOrder' }
  if (input.qty > remainingQty(order, input.skuCode)) return { ok: false, errorKey: 'pdaPutaway.error.overRemain' }
  const locationError = validatePutawayLocation(order, input.locationCode, state)
  if (locationError) return { ok: false, errorKey: locationError }
  const locationCode = findLocation(state.locations, order.warehouseCode, input.locationCode)!.code

  const actualLines = [...order.actualLines]
  const idx = actualLines.findIndex((a) => !a.submitted && a.locationCode === locationCode && a.skuCode === input.skuCode)
  if (idx >= 0) actualLines[idx] = { ...actualLines[idx], qty: actualLines[idx].qty + input.qty }
  else actualLines.push({ locationCode, skuCode: input.skuCode, qty: input.qty, submitted: false })

  const next: PutawayOrder = { ...order, actualLines, status: 'PUTAWAYING' }
  return { ok: true, order: next, patch: { putawayOrders: replaceOrder(state, next) } }
}

/** 撤销一条未提交的落位；没有落位时回到待上架 */
export function applyRemovePutawayLine(
  state: SeedData,
  input: { putawayNo: string; locationCode: string; skuCode: string },
): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  const idx = order.actualLines.findIndex(
    (a) => !a.submitted && a.locationCode === input.locationCode && a.skuCode === input.skuCode,
  )
  if (idx < 0) return { ok: false, errorKey: 'pdaPutaway.error.lineNotFound' }
  const actualLines = order.actualLines.filter((_, i) => i !== idx)
  const next: PutawayOrder = { ...order, actualLines, status: actualLines.length > 0 ? 'PUTAWAYING' : 'PENDING' }
  return { ok: true, order: next, patch: { putawayOrders: replaceOrder(state, next) } }
}

/**
 * 提交上架单：每个应上架行已录＝应上架；逐条把收货暂存库位库存移到目标货位（不良品同时移动品质锁定量），
 * 写库存流水；上架单已完成；入库单已上架＝已提交上架单合计并重算状态（主 PRD R10、§6.5）。
 */
export function applySubmitPutawayOrder(
  state: SeedData,
  input: { putawayNo: string; operator: string },
): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  if (order.actualLines.length === 0 || !isFullyRecorded(order)) return { ok: false, errorKey: 'pdaPutaway.error.planMismatch' }
  for (const line of order.actualLines) {
    const locationError = validatePutawayLocation(order, line.locationCode, state)
    if (locationError) return { ok: false, errorKey: locationError }
  }

  const ts = new Date().toISOString()
  const stagingCode = stagingLocationCode(state.locations, order.warehouseCode)
  const defective = order.qualityType === 'DEFECTIVE'
  const inventory: InventoryRecord[] = [...state.inventory]
  const logs: InventoryLog[] = []

  for (const line of order.actualLines) {
    const locked = defective ? line.qty : 0
    const stagingIdx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === stagingCode &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === order.qualityType,
    )
    if (stagingIdx >= 0) {
      const row = inventory[stagingIdx]
      inventory[stagingIdx] = {
        ...row,
        onHandQty: Math.max(0, row.onHandQty - line.qty),
        lockedQty: Math.max(0, row.lockedQty - locked),
      }
    }
    const targetIdx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === line.locationCode &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === order.qualityType,
    )
    if (targetIdx >= 0) {
      const row = inventory[targetIdx]
      inventory[targetIdx] = { ...row, onHandQty: row.onHandQty + line.qty, lockedQty: row.lockedQty + locked }
    } else {
      inventory.unshift({
        id: uid('INV'),
        warehouseCode: order.warehouseCode,
        locationCode: line.locationCode,
        customerId: order.customerId,
        skuCode: line.skuCode,
        qualityType: order.qualityType,
        onHandQty: line.qty,
        lockedQty: locked,
        firstInboundAt: ts,
      })
    }
    logs.push({
      id: uid('LOG'),
      createdAt: ts,
      warehouseCode: order.warehouseCode,
      type: 'PUTAWAY',
      refNo: order.inboundNo,
      skuCode: line.skuCode,
      customerId: order.customerId,
      locationCode: line.locationCode,
      qtyChange: line.qty,
      operator: input.operator,
    })
  }

  const next: PutawayOrder = {
    ...order,
    status: 'COMPLETED',
    actualLines: order.actualLines.map((a) => ({ ...a, submitted: true })),
    submittedAt: ts,
    submittedBy: input.operator,
  }
  const putawayOrders = replaceOrder(state, next)
  const inbounds = state.inbounds.map((o) =>
    o.inboundNo === order.inboundNo ? { ...syncInboundPutawayFromOrders(o, putawayOrders), updatedAt: ts } : o,
  )
  return {
    ok: true,
    order: next,
    patch: { putawayOrders, inventory, inbounds, inventoryLogs: [...logs, ...state.inventoryLogs] },
  }
}
