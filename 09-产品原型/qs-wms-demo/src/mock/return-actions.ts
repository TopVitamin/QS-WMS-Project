import { warehouseSerialStocks, serialStockId, updateSerialStocks } from '@/lib/serial-stock'
import { nextDocNo } from '@/lib/doc-no'
import { receiptContainerIssue, upsertReceivingContainers } from './container-actions'
import { balanceLog } from '@/lib/inventory-ledger'
import { recomputeReturnOrder, returnLineUnreceived } from '@/lib/return-derive'
import type { PutawayOrder } from '@/types/inbound'
import type { InventoryLog, InventoryRecord } from '@/types/wms'
import type {
  ReturnException,
  ReturnOrder,
  ReturnReceiptContainerInput,
  ReturnReceiptLine,
  ReturnReceiptRecord,
} from '@/types/return'
import type { SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string; params?: Record<string, string | number> }

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/** 去空格、转大写并去重；SN 按原值比较，不做大小写改写以外的处理 */
export const normalizeSerials = (serials?: string[]) => [
  ...new Set((serials ?? []).map((sn) => sn.trim().toUpperCase()).filter(Boolean)),
]

/** 本退货单下该作业容器是否已提交过收货（容器在本单不可重复使用） */
export function isWorkContainerUsedOnReturn(
  receipts: ReturnReceiptRecord[],
  returnNo: string,
  containerNo: string,
): boolean {
  const key = containerNo.trim().toUpperCase()
  if (!key) return false
  return receipts.some(
    (r) =>
      r.returnNo === returnNo &&
      [r.containerNo, ...r.lines.map((l) => l.containerNo)].some((c) => (c?.trim().toUpperCase() ?? '') === key),
  )
}

/**
 * 原出库已发出、可用于退货核对的 SN。
 * 优先取有效复核记录，其次取拣货任务的有效分配；没有原出库或没有 SN 依据时返回 undefined。
 */
export function originalOutboundSerialSet(state: SeedData, order: ReturnOrder): Set<string> | undefined {
  if (!order.originalOutboundNo) return undefined
  const outbound = state.outboundOrders.find((o) => o.no === order.originalOutboundNo)
  if (!outbound) return undefined
  const set = new Set<string>()
  state.outboundVerifications
    .filter((v) => v.orderNo === outbound.no && !v.deleted)
    .forEach((v) => v.lines.forEach((l) => l.serialNos.forEach((sn) => set.add(sn.trim().toUpperCase()))))
  state.outboundPickTasks
    .filter((t) => t.orderNo === outbound.no)
    .forEach((t) => t.assignments.forEach((a) => a.activeSerialNos.forEach((sn) => set.add(sn.trim().toUpperCase()))))
  return set.size ? set : undefined
}

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
    const lineIdx = lines.findIndex((l) => l.skuCode === input.skuCode && (l.batchNo ?? '') === (input.batchNo ?? ''))
    if (lineIdx >= 0) lines[lineIdx] = { ...lines[lineIdx], planQty: lines[lineIdx].planQty + input.qty }
    else lines.push({ lineNo: lines.length + 1, ...planLine })
    const next = [...orders]
    next[idx] = { ...po, planLines: lines }
    return next
  }
  return [
    ...orders,
    {
      putawayNo: nextDocNo(
        'PA',
        orders.map((o) => o.putawayNo),
        input.at,
      ),
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

/**
 * 退货收货：一次提交生成一条退货收货记录，明细按容器、SKU、批次／效期拆行；
 * 实收按容器×品质生成共用上架单。SN 商品有原出库可对核时，良品/不良品 SN
 * 必须来自原出库已发出清单；不一致的 SN 只能计入拒收。
 */
export function applyReturnReceipt(
  state: SeedData,
  input: {
    returnNo: string
    containers: ReturnReceiptContainerInput[]
    operator: string
  },
): ActionResult & { patch?: Partial<SeedData> } {
  const order = state.returnOrders.find((o) => o.returnNo === input.returnNo)
  if (!order) return { ok: false, errorKey: 'return.error.notFound' }
  if (order.status === 'CANCELLED') return { ok: false, errorKey: 'return.error.cancelled' }
  if (order.status === 'COMPLETED') return { ok: false, errorKey: 'return.error.completed' }

  const containers = input.containers
    .map((c) => ({
      containerNo: c.bulkPiece ? undefined : c.containerNo?.trim() || undefined,
      bulkPiece: Boolean(c.bulkPiece),
      lines: c.lines.filter((l) => l.goodQty + l.defectQty + (l.rejectedQty ?? 0) > 0),
    }))
    .filter((c) => c.lines.length > 0)

  if (!containers.length) return { ok: false, errorKey: 'return.error.empty' }
  if (containers.filter((c) => c.bulkPiece).length > 1) {
    return { ok: false, errorKey: 'return.error.containerDuplicated' }
  }

  const seenContainers = new Set<string>()
  for (const c of containers) {
    if (!c.bulkPiece && !c.containerNo) return { ok: false, errorKey: 'return.error.containerRequired' }
    const key = c.containerNo?.toUpperCase() ?? '__BULK__'
    if (seenContainers.has(key)) return { ok: false, errorKey: 'return.error.containerDuplicated' }
    seenContainers.add(key)
    if (c.containerNo && isWorkContainerUsedOnReturn(state.returnReceipts, order.returnNo, c.containerNo)) {
      return { ok: false, errorKey: 'return.error.containerAlreadyUsed', params: { no: c.containerNo } }
    }
    if (c.containerNo) {
      const issue = receiptContainerIssue(state.containers ?? [], order.warehouseCode, order.customerId, c.containerNo)
      if (issue) return { ok: false, errorKey: issue }
    }
  }

  const shippedSerials = originalOutboundSerialSet(state, order)
  const existingSerials = new Set(
    warehouseSerialStocks(state)
      .filter((r) => r.status === 'IN_STOCK')
      .map(serialStockId),
  )
  const submittedSerials = new Set<string>()

  for (const container of containers) {
    for (const line of container.lines) {
      const item = order.items.find((i) => i.skuCode === line.skuCode)
      if (!item) return { ok: false, errorKey: 'return.error.skuNotInOrder' }
      if ([line.goodQty, line.defectQty, line.rejectedQty ?? 0].some((n) => !Number.isInteger(n) || n < 0)) {
        return { ok: false, errorKey: 'error.qtyInvalid' }
      }
      if (line.goodQty + line.defectQty + (line.rejectedQty ?? 0) > returnLineUnreceived(item)) {
        return { ok: false, errorKey: 'return.error.overRemain' }
      }
      if ((line.rejectedQty ?? 0) > 0 && !line.rejectReason) {
        return { ok: false, errorKey: 'return.error.rejectReason' }
      }
      const master = state.skuMasters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)
      if (master?.batchEnabled && !line.batchNo?.trim()) return { ok: false, errorKey: 'return.error.batchRequired' }
      if (master?.expiryEnabled && !line.expiryDate?.trim()) {
        return { ok: false, errorKey: 'return.error.expiryRequired' }
      }

      if (master?.snEnabled) {
        const goodSerials = normalizeSerials(line.goodSerialNos)
        const defectSerials = normalizeSerials(line.defectSerialNos)
        const rejectedSerials = normalizeSerials(line.rejectedSerialNos)
        if (goodSerials.length !== line.goodQty || defectSerials.length !== line.defectQty) {
          return { ok: false, errorKey: 'return.error.serialCount' }
        }
        if (rejectedSerials.length !== (line.rejectedQty ?? 0)) {
          return { ok: false, errorKey: 'return.error.serialCount' }
        }
        if (shippedSerials) {
          const mismatch = [...goodSerials, ...defectSerials].find((sn) => !shippedSerials.has(sn))
          if (mismatch) {
            return { ok: false, errorKey: 'return.error.snMismatchRejectOnly', params: { serialNo: mismatch } }
          }
        }
        for (const sn of [...goodSerials, ...defectSerials, ...rejectedSerials]) {
          if (
            existingSerials.has(serialStockId({ customerId: order.customerId, skuCode: line.skuCode, serialNo: sn })) ||
            submittedSerials.has(`${line.skuCode}::${sn}`)
          ) {
            return { ok: false, errorKey: 'return.error.serialDuplicated', params: { serialNo: sn } }
          }
          submittedSerials.add(`${line.skuCode}::${sn}`)
        }
      }
    }
  }

  const at = new Date().toISOString()
  const stagingLocation =
    state.warehouseMasters.find((w) => w.code === order.warehouseCode)?.receivingStagingLocation ?? 'STAGE-IN-01'
  const receiptNo = nextDocNo(
    'RR',
    state.returnReceipts.map((r) => r.receiptNo),
    at,
  )
  const flatLines = containers.flatMap((c) => c.lines.map((line) => ({ line, containerNo: c.containerNo })))
  const receiptLines: ReturnReceiptLine[] = flatLines.map(({ line, containerNo }, i) => {
    const master = state.skuMasters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)
    const goodSerialNos = master?.snEnabled ? normalizeSerials(line.goodSerialNos) : undefined
    const defectSerialNos = master?.snEnabled ? normalizeSerials(line.defectSerialNos) : undefined
    const rejectedSerialNos = master?.snEnabled ? normalizeSerials(line.rejectedSerialNos) : undefined
    return {
      lineNo: i + 1,
      skuCode: line.skuCode,
      containerNo,
      receivedQty: line.goodQty + line.defectQty,
      rejectedQty: line.rejectedQty ?? 0,
      goodQty: line.goodQty,
      defectQty: line.defectQty,
      rejectReason: (line.rejectedQty ?? 0) > 0 ? line.rejectReason : undefined,
      batchNo: line.batchNo?.trim() || undefined,
      productionDate: line.productionDate,
      expiryDate: line.expiryDate,
      goodSerialNos,
      defectSerialNos,
      rejectedSerialNos,
      serialCheckBasis: master?.snEnabled ? (shippedSerials ? 'ORIGINAL_OUTBOUND' : 'NO_REFERENCE') : undefined,
    }
  })

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

  const containerNos = [...new Set(containers.map((c) => c.containerNo).filter((c): c is string => Boolean(c)))]
  const receipt: ReturnReceiptRecord = {
    receiptNo,
    returnNo: order.returnNo,
    warehouseCode: order.warehouseCode,
    customerId: order.customerId,
    containerNo: containerNos.length === 1 ? containerNos[0] : undefined,
    stagingLocationCode: stagingLocation,
    operator: input.operator,
    receivedAt: at,
    lines: receiptLines,
  }

  const nextContainers = upsertReceivingContainers(state.containers ?? [], {
    warehouseCode: order.warehouseCode,
    customerId: order.customerId,
    containerNos: containers.map((c) => c.containerNo).filter((no): no is string => Boolean(no)),
    operator: input.operator,
    at,
  })
  return {
    ok: true,
    patch: {
      returnOrders: state.returnOrders.map((o) => (o.returnNo === order.returnNo ? updatedOrder : o)),
      returnReceipts: [receipt, ...state.returnReceipts],
      returnExceptions: [...exceptions, ...state.returnExceptions],
      putawayOrders,
      inventory,
      inventoryLogs,
      serialStocks: updateSerialStocks(state, inventoryLogs.slice(state.inventoryLogs.length)),
      containers: nextContainers,
    },
  }
}

/** 派送失败退回：扫原 B2C 出库运单，按原单已发数量生成退货单并关联原出库 */
export function applyDeliveryFailedReturn(
  state: SeedData,
  input: { outboundNo: string; operator: string },
): ActionResult & { patch?: Partial<SeedData>; returnNo?: string } {
  const outboundNo = input.outboundNo.trim()
  if (!outboundNo) return { ok: false, errorKey: 'return.error.originalOutboundRequired' }
  const outbound = state.outboundOrders.find((o) => o.no.toUpperCase() === outboundNo.toUpperCase())
  if (!outbound) return { ok: false, errorKey: 'return.error.outboundNotFound' }
  if (outbound.type !== 'B2C') return { ok: false, errorKey: 'return.error.outboundNotB2C' }
  if (outbound.status !== 'SHIPPED') return { ok: false, errorKey: 'return.error.outboundNotShipped' }
  const active = state.returnOrders.find(
    (o) =>
      o.originalOutboundNo?.toUpperCase() === outbound.no.toUpperCase() &&
      o.status !== 'CANCELLED' &&
      o.status !== 'COMPLETED',
  )
  if (active) return { ok: true, returnNo: active.returnNo }

  const at = new Date().toISOString()
  const returnNo = nextDocNo(
    'RT',
    state.returnOrders.map((o) => o.returnNo),
    at,
  )
  const items = outbound.items
    .filter((i) => i.shippedQty > 0)
    .map((i, index) => ({
      lineNo: index + 1,
      skuCode: i.skuCode,
      plannedQty: i.shippedQty,
      receivedQty: 0,
      goodQty: 0,
      defectQty: 0,
      rejectedQty: 0,
      putawayQty: 0,
      status: 'PENDING_RECEIVE' as const,
    }))
  if (!items.length) return { ok: false, errorKey: 'return.error.outboundNothingShipped' }

  const order: ReturnOrder = recomputeReturnOrder({
    returnNo,
    warehouseCode: outbound.warehouseCode,
    customerId: outbound.customerId,
    sourceType: 'DELIVERY_FAILED',
    upstreamNo: outbound.no,
    originalOutboundNo: outbound.no,
    status: 'PENDING_RECEIVE',
    items,
    createdAt: at,
    updatedAt: at,
  })
  return {
    ok: true,
    returnNo,
    patch: { returnOrders: [order, ...state.returnOrders] },
  }
}
