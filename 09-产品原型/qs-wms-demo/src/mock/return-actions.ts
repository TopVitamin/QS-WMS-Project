import { nextDocNo } from '@/lib/doc-no'
import { balanceLog } from '@/lib/inventory-ledger'
import { recomputeReturnOrder, returnLineUnreceived } from '@/lib/return-derive'
import type { PutawayOrder } from '@/types/inbound'
import type { InventoryLog, InventoryRecord } from '@/types/wms'
import type {
  ReturnException,
  ReturnOrder,
  ReturnReceiptLine,
  ReturnReceiptRecord,
  ReturnReceiveLineInput,
} from '@/types/return'
import type { SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string; params?: Record<string, string | number> }

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

function appendReturnPutawayPlan(
  orders: PutawayOrder[],
  input: {
    returnNo: string
    warehouseCode: string
    customerId: string
    receiptNo: string
    stagingLocationCode: string
    containerNo?: string
    qualityType: 'GOOD' | 'DEFECTIVE'
    skuCode: string
    qty: number
    receiptLineNo: number
    batchNo?: string
    productionDate?: string
    expiryDate?: string
    at: string
  },
): PutawayOrder[] {
  if (input.qty <= 0) return orders
  const idx = orders.findIndex(
    (p) =>
      p.sourceType === 'RETURN' &&
      p.sourceNo === input.returnNo &&
      p.qualityType === input.qualityType &&
      (p.containerNo ?? '') === (input.containerNo ?? '') &&
      p.receiptNo === input.receiptNo &&
      p.status !== 'COMPLETED',
  )
  const planLine = {
    skuCode: input.skuCode,
    planQty: input.qty,
    receiptLineNo: input.receiptLineNo,
    batchNo: input.batchNo,
    productionDate: input.productionDate,
    expiryDate: input.expiryDate,
  }
  if (idx >= 0) {
    const po = orders[idx]
    const lines = [...po.planLines]
    const lineIdx = lines.findIndex(
      (l) => l.skuCode === input.skuCode && (l.batchNo ?? '') === (input.batchNo ?? ''),
    )
    if (lineIdx >= 0) lines[lineIdx] = { ...lines[lineIdx], planQty: lines[lineIdx].planQty + input.qty }
    else lines.push({ lineNo: lines.length + 1, ...planLine })
    const next = [...orders]
    next[idx] = { ...po, planLines: lines }
    return next
  }
  return [
    ...orders,
    {
      putawayNo: nextDocNo('PA', orders.map((o) => o.putawayNo), input.at),
      sourceType: 'RETURN',
      sourceNo: input.returnNo,
      warehouseCode: input.warehouseCode,
      customerId: input.customerId,
      receiptNo: input.receiptNo,
      stagingLocationCode: input.stagingLocationCode,
      containerNo: input.containerNo,
      qualityType: input.qualityType,
      status: 'PENDING',
      planLines: [{ lineNo: 1, ...planLine }],
      actualLines: [],
      createdAt: input.at,
    },
  ]
}

/** 退货收货：一次提交生成一条退货收货记录；良品/不良分别生成共用上架单 */
export function applyReturnReceipt(
  state: SeedData,
  input: {
    returnNo: string
    containerNo?: string
    lines: ReturnReceiveLineInput[]
    operator: string
  },
): ActionResult & { patch?: Partial<SeedData> } {
  const order = state.returnOrders.find((o) => o.returnNo === input.returnNo)
  if (!order) return { ok: false, errorKey: 'return.error.notFound' }
  if (order.status === 'CANCELLED') return { ok: false, errorKey: 'return.error.cancelled' }
  if (order.status === 'COMPLETED') return { ok: false, errorKey: 'return.error.completed' }
  const lines = input.lines.filter((l) => l.goodQty + l.defectQty + (l.rejectedQty ?? 0) > 0)
  if (!lines.length) return { ok: false, errorKey: 'return.error.empty' }

  const existingSerials = new Set(state.inventory.flatMap((r) => r.serialNos ?? []))
  const submittedSerials = new Set<string>()
  for (const line of lines) {
    const item = order.items.find((i) => i.skuCode === line.skuCode)
    if (!item) return { ok: false, errorKey: 'return.error.skuNotInOrder' }
    if ([line.goodQty, line.defectQty, line.rejectedQty ?? 0].some((n) => !Number.isInteger(n) || n < 0)) {
      return { ok: false, errorKey: 'error.qtyInvalid' }
    }
    if (line.goodQty + line.defectQty + (line.rejectedQty ?? 0) > returnLineUnreceived(item)) {
      return { ok: false, errorKey: 'return.error.overRemain' }
    }
    if ((line.rejectedQty ?? 0) > 0 && !line.rejectReason) return { ok: false, errorKey: 'return.error.rejectReason' }
    const master = state.skuMasters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)
    if (master?.batchEnabled && !line.batchNo?.trim()) return { ok: false, errorKey: 'return.error.batchRequired' }
    if (master?.expiryEnabled && !line.expiryDate?.trim()) return { ok: false, errorKey: 'return.error.expiryRequired' }
    const goodSerials = (line.goodSerialNos ?? []).map((sn) => sn.trim().toUpperCase()).filter(Boolean)
    const defectSerials = (line.defectSerialNos ?? []).map((sn) => sn.trim().toUpperCase()).filter(Boolean)
    if (master?.snEnabled) {
      if (goodSerials.length !== line.goodQty || defectSerials.length !== line.defectQty) {
        return { ok: false, errorKey: 'return.error.serialCount' }
      }
      for (const sn of [...goodSerials, ...defectSerials]) {
        if (existingSerials.has(sn) || submittedSerials.has(sn)) {
          return { ok: false, errorKey: 'return.error.serialDuplicated', params: { serialNo: sn } }
        }
        submittedSerials.add(sn)
      }
    }
  }

  const at = new Date().toISOString()
  const stagingLocation =
    state.warehouseMasters.find((w) => w.code === order.warehouseCode)?.receivingStagingLocation ?? 'STAGE-IN-01'
  const receiptNo = nextDocNo('RR', state.returnReceipts.map((r) => r.receiptNo), at)
  const receiptLines: ReturnReceiptLine[] = lines.map((line, i) => ({
    lineNo: i + 1,
    skuCode: line.skuCode,
    containerNo: input.containerNo?.trim() || undefined,
    receivedQty: line.goodQty + line.defectQty,
    rejectedQty: line.rejectedQty ?? 0,
    goodQty: line.goodQty,
    defectQty: line.defectQty,
    rejectReason: (line.rejectedQty ?? 0) > 0 ? line.rejectReason : undefined,
    batchNo: line.batchNo?.trim() || undefined,
    productionDate: line.productionDate,
    expiryDate: line.expiryDate,
    goodSerialNos: line.goodSerialNos?.map((sn) => sn.trim().toUpperCase()).filter(Boolean),
    defectSerialNos: line.defectSerialNos?.map((sn) => sn.trim().toUpperCase()).filter(Boolean),
  }))

  const updatedOrder: ReturnOrder = recomputeReturnOrder({
    ...order,
    items: order.items.map((item) => {
      const hits = receiptLines.filter((l) => l.skuCode === item.skuCode)
      return {
        ...item,
        receivedQty: item.receivedQty + hits.reduce((n, l) => n + l.receivedQty, 0),
        goodQty: item.goodQty + hits.reduce((n, l) => n + l.goodQty, 0),
        defectQty: item.defectQty + hits.reduce((n, l) => n + l.defectQty, 0),
        rejectedQty: item.rejectedQty + hits.reduce((n, l) => n + l.rejectedQty, 0),
      }
    }),
    updatedAt: at,
  })

  const exceptions: ReturnException[] = []
  receiptLines
    .filter((l) => l.rejectedQty > 0)
    .forEach((l) => {
      exceptions.push({
        exceptionNo: nextDocNo(
          'EX',
          [...state.returnExceptions.map((e) => e.exceptionNo), ...exceptions.map((e) => e.exceptionNo)],
          at,
        ),
        returnNo: order.returnNo,
        type: 'REJECT',
        skuCode: l.skuCode,
        qty: l.rejectedQty,
        reason: l.rejectReason,
        receiptNo,
        createdAt: at,
      })
    })

  const inventory: InventoryRecord[] = [...state.inventory]
  const inventoryLogs: InventoryLog[] = [...state.inventoryLogs]
  const upsert = (line: ReturnReceiptLine, qualityType: 'GOOD' | 'DEFECTIVE', qty: number, serialNos?: string[]) => {
    if (qty <= 0) return
    const idx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === stagingLocation &&
        r.customerId === order.customerId &&
        r.skuCode === line.skuCode &&
        r.qualityType === qualityType &&
        (r.batchNo ?? '') === (line.batchNo ?? '') &&
        (r.expiryDate ?? '') === (line.expiryDate ?? ''),
    )
    let row: InventoryRecord
    if (idx >= 0) {
      row = {
        ...inventory[idx],
        onHandQty: inventory[idx].onHandQty + qty,
        lockedQty: inventory[idx].lockedQty + (qualityType === 'DEFECTIVE' ? qty : 0),
        serialNos: serialNos?.length ? [...(inventory[idx].serialNos ?? []), ...serialNos] : inventory[idx].serialNos,
      }
      inventory[idx] = row
    } else {
      row = {
        id: uid('INV'),
        warehouseCode: order.warehouseCode,
        locationCode: stagingLocation,
        customerId: order.customerId,
        skuCode: line.skuCode,
        qualityType,
        batchNo: line.batchNo,
        expiryDate: line.expiryDate,
        serialNos: serialNos?.length ? serialNos : undefined,
        onHandQty: qty,
        lockedQty: qualityType === 'DEFECTIVE' ? qty : 0,
        firstInboundAt: at,
      }
      inventory.push(row)
    }
    inventoryLogs.push(
      balanceLog(row, qty, {
        id: uid('LOG'),
        type: 'RETURN',
        refNo: order.returnNo,
        jobNo: receiptNo,
        sourceType: 'RETURN',
        operator: input.operator,
        createdAt: at,
        serialNos: serialNos?.length ? serialNos : undefined,
      }),
    )
  }

  let putawayOrders = state.putawayOrders
  for (const line of receiptLines) {
    upsert(line, 'GOOD', line.goodQty, line.goodSerialNos)
    upsert(line, 'DEFECTIVE', line.defectQty, line.defectSerialNos)
    putawayOrders = appendReturnPutawayPlan(putawayOrders, {
      returnNo: order.returnNo,
      warehouseCode: order.warehouseCode,
      customerId: order.customerId,
      receiptNo,
      stagingLocationCode: stagingLocation,
      containerNo: line.containerNo,
      qualityType: 'GOOD',
      skuCode: line.skuCode,
      qty: line.goodQty,
      receiptLineNo: line.lineNo,
      batchNo: line.batchNo,
      productionDate: line.productionDate,
      expiryDate: line.expiryDate,
      at,
    })
    putawayOrders = appendReturnPutawayPlan(putawayOrders, {
      returnNo: order.returnNo,
      warehouseCode: order.warehouseCode,
      customerId: order.customerId,
      receiptNo,
      stagingLocationCode: stagingLocation,
      containerNo: line.containerNo,
      qualityType: 'DEFECTIVE',
      skuCode: line.skuCode,
      qty: line.defectQty,
      receiptLineNo: line.lineNo,
      batchNo: line.batchNo,
      productionDate: line.productionDate,
      expiryDate: line.expiryDate,
      at,
    })
  }

  const receipt: ReturnReceiptRecord = {
    receiptNo,
    returnNo: order.returnNo,
    warehouseCode: order.warehouseCode,
    customerId: order.customerId,
    stagingLocationCode: stagingLocation,
    operator: input.operator,
    receivedAt: at,
    lines: receiptLines,
  }

  return {
    ok: true,
    patch: {
      returnOrders: state.returnOrders.map((o) => (o.returnNo === order.returnNo ? updatedOrder : o)),
      returnReceipts: [receipt, ...state.returnReceipts],
      returnExceptions: [...exceptions, ...state.returnExceptions],
      putawayOrders,
      inventory,
      inventoryLogs,
    },
  }
}
