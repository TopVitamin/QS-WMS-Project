import { warehouseSerialStocks, serialStockId, updateSerialStocks } from '@/lib/serial-stock'
import { isWorkContainerUsedOnInbound } from '@/lib/inbound-receipt-container'
import { lineUnreceivedQty, recomputeInboundOrder, stagingLocationCode } from '@/lib/inbound-derive'
import { countingStocktake } from '@/lib/inventory-derive'
import { balanceLog } from '@/lib/inventory-ledger'
import { isNewSku } from '@/lib/new-sku'
import { nextDocNo } from '@/lib/doc-no'
import { containerIdOf } from '@/lib/container-id'
import { completeExpiryDatePair } from '@/lib/expiry-date'
import { snapshotPutawayRecommendation, type PutawayLocationContext } from '@/lib/putaway'
import { receiptContainerIssue, upsertReceivingContainers } from './container-actions'
import type {
  ContainerReceiptLineInput,
  InboundException,
  PutawayOrder,
  PutawayPlanLine,
  ReceiptContainerInput,
  ReceiptRecord,
  ReceiptRecordLine,
} from '@/types/inbound'
import type { InboundOrder, InventoryLog, InventoryRecord } from '@/types/wms'
import type { SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string; params?: Record<string, string | number> }

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

const sum = (lines: ReceiptRecordLine[], pick: (l: ReceiptRecordLine) => number) =>
  lines.reduce((total, l) => total + pick(l), 0)

function appendPutawayPlan(
  orders: PutawayOrder[],
  input: {
    inboundNo: string
    warehouseCode: string
    customerId: string
    receiptNo: string
    stagingLocationCode: string
    containerNo?: string
    containerId?: string
    qualityType: 'GOOD' | 'DEFECTIVE'
    skuCode: string
    qty: number
    receiptLineNo: number
    batchNo?: string
    productionDate?: string
    expiryDate?: string
    putawayRecommendTiming?: import('@/types/wms').PutawayRecommendTiming
    recommendationContext: Omit<PutawayLocationContext, 'putawayOrders'>
    ts: string
  },
): PutawayOrder[] {
  if (input.qty <= 0) return orders
  /** 按「容器 × 品质」拆单；无容器收货按「本次收货记录 × 品质」合并（宏观架构 2.1.1） */
  const idx = orders.findIndex(
    (p) =>
      p.sourceType === 'INBOUND' &&
      p.sourceNo === input.inboundNo &&
      p.qualityType === input.qualityType &&
      (p.containerNo ?? '') === (input.containerNo ?? '') &&
      p.receiptNo === input.receiptNo &&
      p.status !== 'COMPLETED',
  )
  const planLine: Omit<PutawayPlanLine, 'lineNo'> = {
    skuCode: input.skuCode,
    planQty: input.qty,
    receiptLineNo: input.receiptLineNo,
    batchNo: input.batchNo,
    productionDate: input.productionDate,
    expiryDate: input.expiryDate,
  }
  if (idx >= 0) {
    const po = orders[idx]
    const timing = po.putawayRecommendTiming ?? input.putawayRecommendTiming
    const baseOrder = { ...po, putawayRecommendTiming: timing }
    const planLines = [...po.planLines]
    /** 同SKU不同批次各占一行，不能按商品合并 */
    const lineIdx = planLines.findIndex(
      (l) =>
        l.skuCode === input.skuCode &&
        (l.batchNo ?? '') === (input.batchNo ?? '') &&
        (l.productionDate ?? '') === (input.productionDate ?? '') &&
        (l.expiryDate ?? '') === (input.expiryDate ?? ''),
    )
    if (lineIdx >= 0) {
      planLines[lineIdx] = { ...planLines[lineIdx], planQty: planLines[lineIdx].planQty + input.qty }
    } else {
      const nextLine: PutawayPlanLine = { ...planLine, lineNo: planLines.length + 1 }
      planLines.push(
        snapshotPutawayRecommendation(baseOrder, nextLine, {
          ...input.recommendationContext,
          putawayOrders: orders,
        }),
      )
    }
    const next = [...orders]
    next[idx] = { ...baseOrder, planLines, receiptNo: input.receiptNo }
    return next
  }
  const created: PutawayOrder = {
      putawayNo: nextDocNo(
        'PA',
        orders.map((o) => o.putawayNo),
        input.ts,
      ),
      sourceType: 'INBOUND',
      sourceNo: input.inboundNo,
      warehouseCode: input.warehouseCode,
      customerId: input.customerId,
      receiptNo: input.receiptNo,
      stagingLocationCode: input.stagingLocationCode,
      putawayRecommendTiming: input.putawayRecommendTiming,
      containerNo: input.containerNo,
      containerId: input.containerId,
      qualityType: input.qualityType,
      status: 'PENDING',
      planLines: [{ ...planLine, lineNo: 1 }],
      actualLines: [],
      createdAt: input.ts,
    }
  created.planLines = created.planLines.map((line) =>
    snapshotPutawayRecommendation(created, line, {
      ...input.recommendationContext,
      putawayOrders: orders,
    }),
  )
  return [...orders, created]
}

/**
 * 收货提交（两端共用，主 PRD R03/R04/R15/R16）：一次提交可含 1～N 个容器（无容器收货至多一组），
 * 生成**一条**收货记录，明细按「容器 × SKU」成行；拒收行生成入库异常；按「容器 × 品质」生成上架单。
 */
export function applyReceipt(
  state: SeedData,
  input: { inboundNo: string; containers: ReceiptContainerInput[]; operator: string },
): ActionResult & { patch?: Partial<SeedData> } {
  const { inboundNo, operator } = input

  const order = state.inbounds.find((o) => o.inboundNo === inboundNo)
  if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
  if (order.status === 'CANCELLED') return { ok: false, errorKey: 'inbound.receive.cancelled' }
  if (order.receiptCloseFlag === 'CONFIRMED') return { ok: false, errorKey: 'inbound.receiptCloseStale' }

  const containers = input.containers
    .map((c) => ({
      containerNo: c.bulkPiece ? undefined : c.containerNo?.trim() || undefined,
      bulkPiece: Boolean(c.bulkPiece),
      lines: c.lines.map((line) => ({ ...line })),
    }))
    .filter((c) => c.lines.length > 0)
  if (containers.length === 0) return { ok: false, errorKey: 'inbound.receive.emptySubmit' }

  const seen = new Set<string>()
  for (const c of containers) {
    if (!c.bulkPiece && !c.containerNo) return { ok: false, errorKey: 'inbound.receive.containerRequired' }
    const key = c.containerNo?.toUpperCase() ?? '__BULK__'
    if (seen.has(key)) return { ok: false, errorKey: 'inbound.receive.containerDuplicated' }
    seen.add(key)
    if (c.containerNo && isWorkContainerUsedOnInbound(state.receiptRecords ?? [], inboundNo, c.containerNo)) {
      return { ok: false, errorKey: 'inbound.receive.containerAlreadyUsedNo' }
    }
    if (c.containerNo) {
      const issue = receiptContainerIssue(state.containers ?? [], order.warehouseCode, order.customerId, c.containerNo)
      if (issue) return { ok: false, errorKey: issue }
    }
  }

  /** R04：同一 SKU 历史实收＋拒收，加本次各容器合计，不得超过预计；新品未维护阻断整次提交 */
  const activityBySku = new Map<string, number>()
  const existingSerials = new Set(
    warehouseSerialStocks(state)
      .filter((r) => r.status === 'IN_STOCK')
      .map(serialStockId),
  )
  const submittedSerials = new Set<string>()
  for (const c of containers) {
    for (const line of c.lines) {
      if (countingStocktake(state.inventoryCounts, order.warehouseCode, order.customerId, line.skuCode))
        return { ok: false, errorKey: 'outbound.error.countFrozen' }
      if (!order.items.some((i) => i.skuCode === line.skuCode)) return { ok: false, errorKey: 'error.skuNotInOrder' }
      if (isNewSku(state.newSkuRecords ?? [], order.customerId, line.skuCode)) {
        return { ok: false, errorKey: 'inbound.receive.newSkuBlocked', params: { skuCode: line.skuCode } }
      }
      const rejectedQty = line.rejectedQty ?? 0
      if ([line.goodQty, line.defectQty, rejectedQty].some((n) => !Number.isInteger(n) || n < 0)) {
        return { ok: false, errorKey: 'error.qtyInvalid' }
      }
      const activity = line.goodQty + line.defectQty + rejectedQty
      if (activity <= 0) return { ok: false, errorKey: 'error.qtyInvalid' }
      if (rejectedQty > 0 && !line.rejectReason) return { ok: false, errorKey: 'inbound.receive.rejectReasonRequired' }

      const master = state.skuMasters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)
      if (master?.batchEnabled && !line.batchNo?.trim()) return { ok: false, errorKey: 'inbound.receive.batchRequired' }
      if (master?.expiryEnabled) {
        const dates = completeExpiryDatePair(line, master.shelfLifeDays)
        if (!dates) return { ok: false, errorKey: 'inbound.receive.expiryDateOrProductionRequired' }
        if (dates.productionDate! > dates.expiryDate!) return { ok: false, errorKey: 'inbound.receive.dateOrderInvalid' }
        line.productionDate = dates.productionDate
        line.expiryDate = dates.expiryDate
      }
      const goodSerials = (line.goodSerialNos ?? []).map((sn) => sn.trim().toUpperCase()).filter(Boolean)
      const defectSerials = (line.defectSerialNos ?? []).map((sn) => sn.trim().toUpperCase()).filter(Boolean)
      if (master?.snEnabled) {
        if (goodSerials.length !== line.goodQty || defectSerials.length !== line.defectQty) {
          return { ok: false, errorKey: 'inbound.receive.serialCount' }
        }
        for (const sn of [...goodSerials, ...defectSerials]) {
          if (
            existingSerials.has(serialStockId({ customerId: order.customerId, skuCode: line.skuCode, serialNo: sn })) ||
            submittedSerials.has(`${line.skuCode}::${sn}`)
          ) {
            return { ok: false, errorKey: 'inbound.receive.serialDuplicated', params: { serialNo: sn } }
          }
          submittedSerials.add(`${line.skuCode}::${sn}`)
        }
      }
      activityBySku.set(line.skuCode, (activityBySku.get(line.skuCode) ?? 0) + activity)
    }
  }
  for (const [skuCode, activity] of activityBySku) {
    const item = order.items.find((i) => i.skuCode === skuCode)!
    if (activity > lineUnreceivedQty(item)) return { ok: false, errorKey: 'inbound.receive.overRemain' }
  }

  const ts = new Date().toISOString()
  const receivingStaging = state.warehouseMasters.find((w) => w.code === order.warehouseCode)?.receivingStagingLocation
  const stagingCode = stagingLocationCode(state.locations, order.warehouseCode, receivingStaging)
  const receiptNo = nextDocNo(
    'RC',
    (state.receiptRecords ?? []).map((r) => r.receiptNo),
    ts,
  )
  const receiptLines: ReceiptRecordLine[] = containers
    .flatMap((c) => c.lines.map((line) => ({ line, containerNo: c.containerNo })))
    .map(({ line, containerNo }, i) => {
      const rejectedQty = line.rejectedQty ?? 0
      return {
        lineNo: i + 1,
        skuCode: line.skuCode,
        containerNo,
        containerId: containerIdOf(order.warehouseCode, containerNo),
        receivedQty: line.goodQty + line.defectQty,
        rejectedQty,
        goodQty: line.goodQty,
        defectQty: line.defectQty,
        rejectReason: rejectedQty > 0 ? line.rejectReason : undefined,
        batchNo: line.batchNo?.trim() || undefined,
        productionDate: line.productionDate,
        expiryDate: line.expiryDate,
        goodSerialNos: line.goodSerialNos?.map((sn) => sn.trim().toUpperCase()).filter(Boolean),
        defectSerialNos: line.defectSerialNos?.map((sn) => sn.trim().toUpperCase()).filter(Boolean),
      }
    })

  const receipt: ReceiptRecord = {
    receiptNo,
    inboundNo,
    warehouseCode: order.warehouseCode,
    customerId: order.customerId,
    containerNo: containers.length === 1 ? containers[0].containerNo : undefined,
    stagingLocationCode: stagingCode,
    operator,
    receivedAt: ts,
    lines: receiptLines,
  }

  /** R11：拒收数量大于 0 的收货明细行各生成一条拒收类入库异常 */
  const exceptions: InboundException[] = []
  receiptLines
    .filter((line) => line.rejectedQty > 0)
    .forEach((line) => {
      exceptions.push({
        exceptionNo: nextDocNo(
          'EX',
          [...(state.inboundExceptions ?? []), ...exceptions].map((e) => e.exceptionNo),
          ts,
        ),
        inboundNo,
        type: 'REJECT',
        skuCode: line.skuCode,
        qty: line.rejectedQty,
        reason: line.rejectReason,
        receiptNo,
        createdAt: ts,
      })
    })

  let updatedOrder: InboundOrder = {
    ...order,
    firstArrivalAt: order.firstArrivalAt ?? ts,
    updatedAt: ts,
    items: order.items.map((item) => {
      const hits = receiptLines.filter((l) => l.skuCode === item.skuCode)
      if (hits.length === 0) return item
      return {
        ...item,
        receivedQty: item.receivedQty + sum(hits, (l) => l.receivedQty),
        rejectedQty: item.rejectedQty + sum(hits, (l) => l.rejectedQty),
        goodQty: item.goodQty + sum(hits, (l) => l.goodQty),
        defectQty: item.defectQty + sum(hits, (l) => l.defectQty),
      }
    }),
  }
  updatedOrder = recomputeInboundOrder(updatedOrder)

  let putawayOrders: PutawayOrder[] = state.putawayOrders ?? []
  const inventory = [...state.inventory]
  const inventoryLogs: InventoryLog[] = [...state.inventoryLogs]

  /** 收货确认按品质记入收货暂存库位，返回变化后的库存明细行，用来写流水 */
  const upsertStagingStock = (
    skuCode: string,
    qualityType: 'GOOD' | 'DEFECTIVE',
    qty: number,
    batchNo?: string,
    productionDate?: string,
    expiryDate?: string,
    serialNos?: string[],
    containerId?: string,
  ): InventoryRecord | undefined => {
    if (qty <= 0) return undefined
    const locked = qualityType === 'DEFECTIVE' ? qty : 0
    const idx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === stagingCode &&
        r.skuCode === skuCode &&
        r.customerId === order.customerId &&
        (r.containerId ?? '') === (containerId ?? '') &&
        r.qualityType === qualityType &&
        r.batchNo === batchNo &&
        r.productionDate === productionDate &&
        r.expiryDate === expiryDate,
    )
    if (idx >= 0) {
      inventory[idx] = {
        ...inventory[idx],
        onHandQty: inventory[idx].onHandQty + qty,
        lockedQty: inventory[idx].lockedQty + locked,
        ...(serialNos?.length ? { serialNos: [...(inventory[idx].serialNos ?? []), ...serialNos] } : {}),
      }
      return inventory[idx]
    }
    inventory.push({
      id: uid('INV'),
      warehouseCode: order.warehouseCode,
      locationCode: stagingCode,
      customerId: order.customerId,
      containerId,
      skuCode,
      qualityType,
      batchNo,
      productionDate,
      expiryDate,
      serialNos: serialNos?.length ? serialNos : undefined,
      onHandQty: qty,
      lockedQty: locked,
      firstInboundAt: ts,
    })
    return inventory[inventory.length - 1]
  }

  for (const line of receiptLines) {
    /** 收货确认即按实收、按品质进入收货暂存库位库存；正常品、不良品各记一行收货流水 */
    const receiveLog = (row: InventoryRecord | undefined, qty: number) => {
      if (!row) return
      inventoryLogs.push(
        balanceLog(row, qty, {
          id: uid('IL'),
          type: 'RECEIVE',
          refNo: inboundNo,
          jobNo: receiptNo,
          sourceType: 'INBOUND',
          sourceLineNo: line.lineNo,
          serialNos: row.qualityType === 'GOOD' ? line.goodSerialNos : line.defectSerialNos,
          operator,
          createdAt: ts,
        }),
      )
    }
    receiveLog(
      upsertStagingStock(
        line.skuCode,
        'GOOD',
        line.goodQty,
        line.batchNo,
        line.productionDate,
        line.expiryDate,
        line.goodSerialNos,
        line.containerId,
      ),
      line.goodQty,
    )
    receiveLog(
      upsertStagingStock(
        line.skuCode,
        'DEFECTIVE',
        line.defectQty,
        line.batchNo,
        line.productionDate,
        line.expiryDate,
        line.defectSerialNos,
        line.containerId,
      ),
      line.defectQty,
    )

    const plan = {
      inboundNo,
      warehouseCode: order.warehouseCode,
      customerId: order.customerId,
      receiptNo,
      stagingLocationCode: stagingCode,
      containerNo: line.containerNo,
      containerId: line.containerId,
      skuCode: line.skuCode,
      receiptLineNo: line.lineNo ?? 0,
      batchNo: line.batchNo,
      productionDate: line.productionDate,
      expiryDate: line.expiryDate,
      putawayRecommendTiming: state.customerMasters.find((m) => m.id === order.customerId)?.putawayRecommendTiming,
      recommendationContext: {
        locations: state.locations,
        inventory,
        locationMasters: state.locationMasters,
        skuMasters: state.skuMasters,
      },
      ts,
    }
    putawayOrders = appendPutawayPlan(putawayOrders, { ...plan, qualityType: 'GOOD', qty: line.goodQty })
    putawayOrders = appendPutawayPlan(putawayOrders, { ...plan, qualityType: 'DEFECTIVE', qty: line.defectQty })
  }

  const nextContainers = upsertReceivingContainers(state.containers ?? [], {
    warehouseCode: order.warehouseCode,
    customerId: order.customerId,
    containerNos: containers.map((c) => c.containerNo).filter((no): no is string => Boolean(no)),
    operator,
    at: ts,
  })
  return {
    ok: true,
    patch: {
      inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? updatedOrder : o)),
      receiptRecords: [receipt, ...(state.receiptRecords ?? [])],
      inboundExceptions: [...exceptions, ...(state.inboundExceptions ?? [])],
      putawayOrders,
      inventory,
      inventoryLogs,
      serialStocks: updateSerialStocks(state, inventoryLogs.slice(state.inventoryLogs.length)),
      containers: nextContainers,
    },
  }
}

/** 管理端收货作业台：每次提交一个容器（或无容器收货），是 `applyReceipt` 的单容器封装 */
export function applyContainerReceipt(
  state: SeedData,
  input: {
    inboundNo: string
    containerNo?: string
    bulkPiece?: boolean
    lines: ContainerReceiptLineInput[]
    operator: string
  },
): ActionResult & { patch?: Partial<SeedData> } {
  return applyReceipt(state, {
    inboundNo: input.inboundNo,
    operator: input.operator,
    containers: [{ containerNo: input.containerNo, bulkPiece: input.bulkPiece, lines: input.lines }],
  })
}
