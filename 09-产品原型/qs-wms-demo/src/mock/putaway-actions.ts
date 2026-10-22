import { serialsInWarehouse, updateSerialStocks } from '@/lib/serial-stock'
import { stagingLocationCode, syncInboundPutawayFromOrders } from '@/lib/inbound-derive'
import { syncReturnPutawayFromOrders } from '@/lib/return-derive'
import { countingStocktake } from '@/lib/inventory-derive'
import { balanceLog, pairLogs } from '@/lib/inventory-ledger'
import { findLocation, isFullyRecorded, remainingQty, validatePutawayLocation } from '@/lib/putaway'
import type { PutawayActualLine, PutawayOrder } from '@/types/inbound'
import type { InventoryLog, InventoryRecord } from '@/types/wms'
import { syncPutawayContainers } from './container-actions'
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
  const serialNos = input.serialNos?.map((sn) => sn.trim().toUpperCase()).filter(Boolean)
  if (serialNos) {
    if (serialNos.length !== input.qty) return { ok: false, errorKey: 'pdaPutaway.error.serialMismatch' }
    const used = new Set(order.actualLines.flatMap((a) => a.serialNos ?? []))
    if (serialNos.some((sn) => used.has(sn))) return { ok: false, errorKey: 'pdaPutaway.error.serialDuplicated' }
    if (
      serialNos.some(
        (sn) =>
          !serialsInWarehouse(
            state,
            order.warehouseCode,
            order.customerId,
            planLine.skuCode,
            order.qualityType,
          ).includes(sn),
      )
    ) {
      return { ok: false, errorKey: 'pdaPutaway.error.serialNotInStock' }
    }
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

/**
 * 撤销一条未提交的落位；删光落位时回到待上架（上架单主PRD 第二节）。
 * 定位键是实际明细行号：SN 商品每次保存各追加一条，同库位同一应上架行可有多条，按「库位 + 应上架行」会删错。
 */
export function applyRemovePutawayLine(
  state: SeedData,
  input: { putawayNo: string; actualLineNo: number },
): PatchResult & { removed?: PutawayActualLine } {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  const removed = order.actualLines.find((a) => !a.submitted && a.lineNo === input.actualLineNo)
  if (!removed) return { ok: false, errorKey: 'pdaPutaway.error.lineNotFound' }
  const actualLines = order.actualLines.filter((a) => a !== removed)
  const next: PutawayOrder = { ...order, actualLines, status: actualLines.length > 0 ? 'PUTAWAYING' : 'PENDING' }
  return { ok: true, order: next, removed, patch: { putawayOrders: replaceOrder(state, next) } }
}

/**
 * 提交上架单：每个应上架行已录＝应上架；逐条把收货暂存库位库存移到目标货位（不良品同时移动品质锁定量），
 * 写库存流水；上架单已完成；来源入库单已上架＝已提交上架单合计并重算状态（上架单主PRD 第三节）。
 */
export function applySubmitPutawayOrder(state: SeedData, input: { putawayNo: string; operator: string }): PatchResult {
  const found = findOpenOrder(state, input.putawayNo)
  if ('errorKey' in found) return { ok: false, errorKey: found.errorKey }
  const order = found
  if (order.actualLines.length === 0 || !isFullyRecorded(order))
    return { ok: false, errorKey: 'pdaPutaway.error.planMismatch' }
  if (
    order.planLines.some((l) =>
      countingStocktake(state.inventoryCounts, order.warehouseCode, order.customerId, l.skuCode),
    )
  )
    return { ok: false, errorKey: 'outbound.error.countFrozen' }
  for (const line of order.actualLines) {
    const locationError = validatePutawayLocation(order, line.locationCode, state)
    if (locationError) return { ok: false, errorKey: locationError }
  }

  const ts = new Date().toISOString()
  const receivingStaging = state.warehouseMasters.find((w) => w.code === order.warehouseCode)?.receivingStagingLocation
  const stagingCode =
    order.stagingLocationCode || stagingLocationCode(state.locations, order.warehouseCode, receivingStaging)
  const defective = order.qualityType === 'DEFECTIVE'
  const inventory: InventoryRecord[] = [...state.inventory]
  const logs: InventoryLog[] = []

  for (const line of order.actualLines) {
    const locked = defective ? line.qty : 0
    const plan = order.planLines.find((p) => p.lineNo === line.planLineNo)!
    const stagingIdx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === stagingCode &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === order.qualityType &&
        r.batchNo === plan.batchNo &&
        r.expiryDate === plan.expiryDate,
    )
    if (stagingIdx < 0 || inventory[stagingIdx].onHandQty < line.qty)
      return { ok: false, errorKey: 'pdaPutaway.error.stockInsufficient' }
    let stagingRow: InventoryRecord | undefined
    let removed = 0
    if (stagingIdx >= 0) {
      const row = inventory[stagingIdx]
      stagingRow = {
        ...row,
        onHandQty: row.onHandQty - line.qty,
        lockedQty: row.lockedQty - locked,
        serialNos: line.serialNos?.length ? row.serialNos?.filter((sn) => !line.serialNos?.includes(sn)) : undefined,
      }
      removed = row.onHandQty - stagingRow.onHandQty
      inventory[stagingIdx] = stagingRow
    }
    const targetIdx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === line.locationCode &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === order.qualityType &&
        r.batchNo === plan.batchNo &&
        r.expiryDate === plan.expiryDate,
    )
    let targetRow: InventoryRecord
    if (targetIdx >= 0) {
      const row = inventory[targetIdx]
      targetRow = {
        ...row,
        onHandQty: row.onHandQty + line.qty,
        lockedQty: row.lockedQty + locked,
        serialNos: [...(row.serialNos ?? []), ...(line.serialNos ?? [])],
      }
      inventory[targetIdx] = targetRow
    } else {
      targetRow = {
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
      }
      inventory.unshift(targetRow)
    }
    /** 上架移库：收货暂存库位减、目标库位加两行流水，同一动作标识成对关联 */
    const meta = {
      type: 'PUTAWAY' as const,
      refNo: order.sourceNo,
      jobNo: order.putawayNo,
      sourceType: order.sourceType === 'INBOUND' ? ('INBOUND' as const) : ('RETURN' as const),
      sourceLineNo: plan.receiptLineNo || undefined,
      serialNos: line.serialNos?.length ? line.serialNos : undefined,
      operator: input.operator,
      createdAt: ts,
    }
    const plus = balanceLog(targetRow, line.qty, { ...meta, id: uid('LOG') })
    if (stagingRow) {
      const minus = balanceLog(stagingRow, -removed, { ...meta, id: uid('LOG') })
      pairLogs(minus, plus, `${order.putawayNo}#${line.lineNo}`)
      logs.push(minus)
    }
    logs.push(plus)
  }

  const next: PutawayOrder = {
    ...order,
    status: 'COMPLETED',
    actualLines: order.actualLines.map((a) => ({ ...a, submitted: true })),
    submittedAt: ts,
    submittedBy: input.operator,
  }
  const putawayOrders = replaceOrder(state, next)
  /** 来源业务进度：入库单或退货单，二者只更新对应来源 */
  const inbounds =
    order.sourceType === 'INBOUND'
      ? state.inbounds.map((o) =>
          o.inboundNo === order.sourceNo ? { ...syncInboundPutawayFromOrders(o, putawayOrders), updatedAt: ts } : o,
        )
      : state.inbounds
  const returnOrders =
    order.sourceType === 'RETURN'
      ? state.returnOrders.map((o) =>
          o.returnNo === order.sourceNo ? syncReturnPutawayFromOrders(o, putawayOrders) : o,
        )
      : state.returnOrders
  return {
    ok: true,
    order: next,
    patch: {
      putawayOrders,
      inventory,
      inbounds,
      returnOrders,
      inventoryLogs: [...state.inventoryLogs, ...logs],
      serialStocks: updateSerialStocks(state, logs),
      containers: syncPutawayContainers(state.containers ?? [], next, input.operator, ts),
    },
  }
}

export interface PutawayPlacementInput {
  planLineNo: number
  locationCode: string
  qty: number
  serialNos?: string[]
}

/**
 * Web 端上架「确认上架」：本次录的落位逐条保存后整单提交，全部成功才生效（上架单主PRD 第四节）。
 * 与 PDA 是同一组动作（保存、提交），只是在内存里连着做：任何一条落位或提交不过，什么都不写，
 * `failedIndex` 指出第几条落位不过（提交不过时为空），已保存的落位和库存都不变。
 */
export function applyConfirmPutawayEntry(
  state: SeedData,
  input: { putawayNo: string; placements: PutawayPlacementInput[]; operator: string },
): PatchResult & { failedIndex?: number } {
  let next = state
  for (const [index, placement] of input.placements.entries()) {
    const saved = applySavePutawayLine(next, { putawayNo: input.putawayNo, ...placement })
    if (!saved.ok) return { ...saved, failedIndex: index }
    next = { ...next, ...saved.patch }
  }
  return applySubmitPutawayOrder(next, { putawayNo: input.putawayNo, operator: input.operator })
}

/** 供测试与 PDA 展示：某应上架行已保存的落位明细 */
export function actualLinesOfPlanLine(order: PutawayOrder, planLineNo: number): PutawayActualLine[] {
  return order.actualLines.filter((a) => a.planLineNo === planLineNo)
}
