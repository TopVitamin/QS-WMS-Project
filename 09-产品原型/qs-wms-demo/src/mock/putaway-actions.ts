import { stagingLocationCode, syncInboundPutawayFromOrders } from '@/lib/inbound-derive'
import { findLocation, isFullyRecorded, remainingQty, validatePutawayLocation } from '@/lib/putaway'
import type { PutawayActualLine, PutawayOrder } from '@/types/inbound'
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

function nextActualLineNo(order: PutawayOrder): number {
  return order.actualLines.reduce((max, a) => Math.max(max, a.lineNo), 0) + 1
}

/**
 * 保存落位：追加或累加一条未提交的实际上架明细；只记进度，不动库存（上架单主PRD 第三节）。
 * 定位键是「目标库位 + 应上架行号」，不能只按 SKU 合并不同批次行。
 */
export function applySavePutawayLine(
  state: SeedData,
  input: { putawayNo: string; locationCode: string; planLineNo: number; qty: number; serialNos?: string[] },
): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  if (!Number.isInteger(input.qty) || input.qty <= 0) return { ok: false, errorKey: 'error.qtyInvalid' }
  const planLine = order.planLines.find((l) => l.lineNo === input.planLineNo)
  if (!planLine) return { ok: false, errorKey: 'pdaPutaway.error.lineNotFound' }
  if (input.qty > remainingQty(order, planLine.lineNo)) return { ok: false, errorKey: 'pdaPutaway.error.overRemain' }
  const serialNos = input.serialNos?.filter(Boolean)
  if (serialNos && serialNos.length !== input.qty) return { ok: false, errorKey: 'pdaPutaway.error.serialMismatch' }
  if (serialNos) {
    const used = new Set(order.actualLines.flatMap((a) => a.serialNos ?? []))
    if (serialNos.some((sn) => used.has(sn))) return { ok: false, errorKey: 'pdaPutaway.error.serialDuplicated' }
  }
  const locationError = validatePutawayLocation(order, input.locationCode, state)
  if (locationError) return { ok: false, errorKey: locationError }
  const locationCode = findLocation(state.locations, order.warehouseCode, input.locationCode)!.code

  const actualLines = [...order.actualLines]
  const idx = actualLines.findIndex(
    (a) => !a.submitted && a.locationCode === locationCode && a.planLineNo === input.planLineNo,
  )
  if (idx >= 0 && !serialNos) {
    actualLines[idx] = { ...actualLines[idx], qty: actualLines[idx].qty + input.qty }
  } else {
    actualLines.push({
      lineNo: nextActualLineNo(order),
      planLineNo: planLine.lineNo,
      locationCode,
      skuCode: planLine.skuCode,
      qty: input.qty,
      serialNos,
      submitted: false,
    })
  }

  const next: PutawayOrder = { ...order, actualLines, status: 'PUTAWAYING' }
  return { ok: true, order: next, patch: { putawayOrders: replaceOrder(state, next) } }
}

/** 撤销一条未提交的落位；没有落位时回到待上架（删光明细仍保持上架中） */
export function applyRemovePutawayLine(
  state: SeedData,
  input: { putawayNo: string; locationCode: string; planLineNo: number },
): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  const idx = order.actualLines.findIndex(
    (a) => !a.submitted && a.locationCode === input.locationCode && a.planLineNo === input.planLineNo,
  )
  if (idx < 0) return { ok: false, errorKey: 'pdaPutaway.error.lineNotFound' }
  const actualLines = order.actualLines.filter((_, i) => i !== idx)
  const next: PutawayOrder = { ...order, actualLines, status: actualLines.length > 0 ? 'PUTAWAYING' : 'PENDING' }
  return { ok: true, order: next, patch: { putawayOrders: replaceOrder(state, next) } }
}

/**
 * 提交上架单：每个应上架行已录＝应上架；逐条把收货暂存库位库存移到目标货位（不良品同时移动品质锁定量），
 * 写库存流水；上架单已完成；来源入库单已上架＝已提交上架单合计并重算状态（上架单主PRD 第三节）。
 */
export function applySubmitPutawayOrder(
  state: SeedData,
  input: { putawayNo: string; operator: string },
): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  if (order.actualLines.length === 0 || !isFullyRecorded(order)) return { ok: false, errorKey: 'pdaPutaway.error.planMismatch' }
  if (state.inventoryCounts.some(p => p.status === 'COUNTING' && p.warehouseCode === order.warehouseCode && p.customerId === order.customerId && order.planLines.some(l => l.skuCode === p.skuCode))) return { ok: false, errorKey: 'outbound.error.countFrozen' }
  for (const line of order.actualLines) {
    const locationError = validatePutawayLocation(order, line.locationCode, state)
    if (locationError) return { ok: false, errorKey: locationError }
  }

  const ts = new Date().toISOString()
  const stagingCode = order.stagingLocationCode || stagingLocationCode(state.locations, order.warehouseCode)
  const defective = order.qualityType === 'DEFECTIVE'
  const inventory: InventoryRecord[] = [...state.inventory]
  const logs: InventoryLog[] = []

  for (const line of order.actualLines) {
    const locked = defective ? line.qty : 0
    const plan = order.planLines.find(p => p.lineNo === line.planLineNo)!
    const stagingIdx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === stagingCode &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === order.qualityType && r.batchNo === plan.batchNo && r.expiryDate === plan.expiryDate,
    )
    if (stagingIdx >= 0) {
      const row = inventory[stagingIdx]
      inventory[stagingIdx] = {
        ...row,
        onHandQty: Math.max(0, row.onHandQty - line.qty),
        lockedQty: Math.max(0, row.lockedQty - locked),
        serialNos: row.serialNos?.filter(sn => !line.serialNos?.includes(sn)),
      }
    }
    const targetIdx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === line.locationCode &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === order.qualityType && r.batchNo === plan.batchNo && r.expiryDate === plan.expiryDate,
    )
    if (targetIdx >= 0) {
      const row = inventory[targetIdx]
      inventory[targetIdx] = { ...row, onHandQty: row.onHandQty + line.qty, lockedQty: row.lockedQty + locked, serialNos: [...(row.serialNos ?? []), ...(line.serialNos ?? [])] }
    } else {
      inventory.unshift({
        id: uid('INV'),
        warehouseCode: order.warehouseCode,
        locationCode: line.locationCode,
        customerId: order.customerId,
        skuCode: line.skuCode,
        qualityType: order.qualityType,
        batchNo: plan.batchNo,
        expiryDate: plan.expiryDate,
        serialNos: line.serialNos,
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
      refNo: order.sourceNo,
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
  /** 退货来源的上架单不改入库单进度 */
  const inbounds =
    order.sourceType === 'INBOUND'
      ? state.inbounds.map((o) =>
          o.inboundNo === order.sourceNo ? { ...syncInboundPutawayFromOrders(o, putawayOrders), updatedAt: ts } : o,
        )
      : state.inbounds
  return {
    ok: true,
    order: next,
    patch: { putawayOrders, inventory, inbounds, inventoryLogs: [...logs, ...state.inventoryLogs] },
  }
}

/** 供测试与 PDA 展示：某应上架行已保存的落位明细 */
export function actualLinesOfPlanLine(order: PutawayOrder, planLineNo: number): PutawayActualLine[] {
  return order.actualLines.filter((a) => a.planLineNo === planLineNo)
}
