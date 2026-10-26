import { warehouseSerialStocks, serialStockId, updateSerialStocks } from '@/lib/serial-stock'
import { nextDocNo } from '@/lib/doc-no'
import { containerIdOf } from '@/lib/container-id'
import { completeExpiryDatePair } from '@/lib/expiry-date'
import { snapshotPutawayRecommendation, type PutawayLocationContext } from '@/lib/putaway'
import { receiptContainerIssue, upsertReceivingContainers } from './container-actions'
import { balanceLog } from '@/lib/inventory-ledger'
import { recomputeReturnOrder, returnLineUnreceived, sumReturnLines } from '@/lib/return-derive'
import type { PutawayOrder, PutawayPlanLine } from '@/types/inbound'
import type { InventoryLog, InventoryRecord, PutawayRecommendTiming } from '@/types/wms'
import {
  isReturnRejectReason,
  RETURN_REJECT_REASON,
  type ReturnException,
  type ReturnOrder,
  type ReturnReceiptContainerInput,
  type ReturnReceiptLine,
  type ReturnReceiptRecord,
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
 * 原出库已发出、可用于退货核对的 SN，按 SKU 隔离身份范围。
 * 优先取有效复核记录，其次取拣货任务的有效分配；没有原出库或没有 SN 依据时返回 undefined。
 */
export function originalOutboundSerialSet(
  state: Pick<SeedData, 'outboundOrders' | 'outboundVerifications' | 'outboundPickTasks'>,
  order: ReturnOrder,
): Map<string, Set<string>> | undefined {
  if (!order.originalOutboundNo) return undefined
  const outbound = state.outboundOrders.find((o) => o.no === order.originalOutboundNo)
  if (!outbound) return undefined
  const serialsBySku = new Map<string, Set<string>>()
  const addSerials = (skuCode: string, serials: string[]) => {
    if (!serials.length) return
    const set = serialsBySku.get(skuCode) ?? new Set<string>()
    serials.forEach((sn) => set.add(sn.trim().toUpperCase()))
    serialsBySku.set(skuCode, set)
  }
  state.outboundVerifications
    .filter((v) => v.orderNo === outbound.no && !v.deleted)
    .forEach((v) => v.lines.forEach((l) => addSerials(l.skuCode, l.serialNos)))
  state.outboundPickTasks
    .filter((t) => t.orderNo === outbound.no)
    .forEach((t) => {
      const skuByLineId = new Map<string, string>(t.lines.map((line) => [line.id, line.skuCode] as const))
      t.assignments.forEach((assignment) => {
        const skuCode = skuByLineId.get(assignment.lineId)
        if (skuCode) addSerials(skuCode, assignment.activeSerialNos)
      })
    })
  return serialsBySku.size ? serialsBySku : undefined
}

/** 预览退货SN是否与已发原单不一致；无可核对原单时返回 false。 */
export function isReturnSerialMismatch(
  state: Pick<SeedData, 'outboundOrders' | 'outboundVerifications' | 'outboundPickTasks'>,
  order: ReturnOrder,
  skuCode: string,
  serialNos: string[],
): boolean {
  const expected = originalOutboundSerialSet(state, order)?.get(skuCode)
  if (!expected) return false
  return normalizeSerials(serialNos).some((serialNo) => !expected.has(serialNo))
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
    containerId?: string
    qualityType: 'GOOD' | 'DEFECTIVE'
    skuCode: string
    qty: number
    receiptLineNo: number
    batchNo?: string
    productionDate?: string
    expiryDate?: string
    putawayRecommendTiming?: PutawayRecommendTiming
    recommendationContext: Omit<PutawayLocationContext, 'putawayOrders'>
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
    const lines = [...po.planLines]
    const lineIdx = lines.findIndex(
      (l) =>
        l.skuCode === input.skuCode &&
        l.receiptLineNo === input.receiptLineNo &&
        (l.batchNo ?? '') === (input.batchNo ?? '') &&
        (l.productionDate ?? '') === (input.productionDate ?? '') &&
        (l.expiryDate ?? '') === (input.expiryDate ?? ''),
    )
    if (lineIdx >= 0) lines[lineIdx] = { ...lines[lineIdx], planQty: lines[lineIdx].planQty + input.qty }
    else {
      const nextLine: PutawayPlanLine = { ...planLine, lineNo: lines.length + 1 }
      lines.push(
        snapshotPutawayRecommendation(baseOrder, nextLine, {
          ...input.recommendationContext,
          putawayOrders: orders,
        }),
      )
    }
    const next = [...orders]
    next[idx] = { ...baseOrder, planLines: lines }
    return next
  }
  const created: PutawayOrder = {
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
      putawayRecommendTiming: input.putawayRecommendTiming,
      containerNo: input.containerNo,
      containerId: input.containerId,
      qualityType: input.qualityType,
      status: 'PENDING',
      planLines: [{ ...planLine, lineNo: 1 }],
      actualLines: [],
      createdAt: input.at,
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
  if (order.receiveClosedAt) return { ok: false, errorKey: 'return.error.receiptClosed' }

  const containers = input.containers
    .map((c) => ({
      containerNo: c.bulkPiece ? undefined : c.containerNo?.trim() || undefined,
      bulkPiece: Boolean(c.bulkPiece),
      lines: c.lines
        .filter((l) => l.goodQty + l.defectQty + (l.rejectedQty ?? 0) > 0)
        .map((line) => ({ ...line })),
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
  // 本次退货可按包裹行、容器、批次或效期拆行；分别校验预计行和原出库实发总量。
  const activityByReturnLine = new Map<number, number>()
  const activityBySku = new Map<string, number>()
  const serialEvidenceByLine = new Map<
    (typeof containers)[number]['lines'][number],
    {
      basis: 'ORIGINAL_OUTBOUND' | 'NO_REFERENCE'
      result: 'MATCHED' | 'NO_REFERENCE' | 'MISMATCH_REJECTED'
      mismatchSerialNos: string[]
      referenceSerialNos: string[]
    }
  >()
  const existingSerials = new Set(
    warehouseSerialStocks(state)
      .filter((r) => r.status === 'IN_STOCK')
      .map(serialStockId),
  )
  const submittedSerials = new Set<string>()

  for (const container of containers) {
    for (const line of container.lines) {
      const sameSkuLines = order.items.filter((i) => i.skuCode === line.skuCode)
      const item = line.returnLineNo
        ? sameSkuLines.find((i) => i.lineNo === line.returnLineNo)
        : sameSkuLines.length === 1
          ? sameSkuLines[0]
          : undefined
      if (!item) {
        return {
          ok: false,
          errorKey: sameSkuLines.length > 1 ? 'return.error.packageLineRequired' : 'return.error.skuNotInOrder',
        }
      }
      line.returnLineNo = item.lineNo
      if ([line.goodQty, line.defectQty, line.rejectedQty ?? 0].some((n) => !Number.isInteger(n) || n < 0)) {
        return { ok: false, errorKey: 'error.qtyInvalid' }
      }
      const activity = line.goodQty + line.defectQty + (line.rejectedQty ?? 0)
      activityByReturnLine.set(item.lineNo, (activityByReturnLine.get(item.lineNo) ?? 0) + activity)
      activityBySku.set(line.skuCode, (activityBySku.get(line.skuCode) ?? 0) + activity)
      const master = state.skuMasters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)
      if (master?.batchEnabled && !line.batchNo?.trim()) return { ok: false, errorKey: 'return.error.batchRequired' }
      if (master?.expiryEnabled) {
        const dates = completeExpiryDatePair(line, master.shelfLifeDays)
        if (!dates) return { ok: false, errorKey: 'return.error.expiryDateOrProductionRequired' }
        if (dates.productionDate! > dates.expiryDate!) return { ok: false, errorKey: 'return.error.dateOrderInvalid' }
        line.productionDate = dates.productionDate
        line.expiryDate = dates.expiryDate
      }

      let hasSnMismatch = false
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
        const originalSkuSerials = shippedSerials?.get(line.skuCode) ?? new Set<string>()
        const mismatchInReceived = [...goodSerials, ...defectSerials].find(
          (sn) => shippedSerials && !originalSkuSerials.has(sn),
        )
        if (mismatchInReceived) {
          return { ok: false, errorKey: 'return.error.snMismatchRejectOnly', params: { serialNo: mismatchInReceived } }
        }
        const mismatchSerialNos = shippedSerials
          ? rejectedSerials.filter((sn) => !originalSkuSerials.has(sn))
          : []
        if (mismatchSerialNos.length > 0 && mismatchSerialNos.length !== rejectedSerials.length) {
          return { ok: false, errorKey: 'return.error.snMismatchSeparate' }
        }
        const serialCheckBasis = shippedSerials ? 'ORIGINAL_OUTBOUND' : 'NO_REFERENCE'
        const serialCheckResult = !shippedSerials
          ? 'NO_REFERENCE'
          : mismatchSerialNos.length > 0
            ? 'MISMATCH_REJECTED'
            : 'MATCHED'
        serialEvidenceByLine.set(line, {
          basis: serialCheckBasis,
          result: serialCheckResult,
          mismatchSerialNos,
          referenceSerialNos: mismatchSerialNos.length ? [...originalSkuSerials].sort() : [],
        })
        if (mismatchSerialNos.length > 0) {
          hasSnMismatch = true
          line.rejectReason = RETURN_REJECT_REASON.SN_MISMATCH
        }
        if (shippedSerials) {
          // 良品和不良品SN已在上方核验；拒收SN保留用于差异追溯。
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
      if ((line.rejectedQty ?? 0) > 0) {
        if (!isReturnRejectReason(line.rejectReason)) return { ok: false, errorKey: 'return.error.rejectReason' }
        if ((line.rejectReason === RETURN_REJECT_REASON.SN_MISMATCH) !== hasSnMismatch) {
          return { ok: false, errorKey: 'return.error.rejectReason' }
        }
      }
    }
  }
  for (const [lineNo, activity] of activityByReturnLine) {
    const item = order.items.find((i) => i.lineNo === lineNo)!
    if (activity > returnLineUnreceived(item)) return { ok: false, errorKey: 'return.error.overRemain' }
  }
  if (order.sourceType === 'DELIVERY_FAILED' && order.originalOutboundNo) {
    const outbound = state.outboundOrders.find((o) => o.no === order.originalOutboundNo)
    if (!outbound) return { ok: false, errorKey: 'return.error.outboundNotFound' }
    for (const [skuCode, activity] of activityBySku) {
      const shippedQty = outbound.items
        .filter((line) => line.skuCode === skuCode)
        .reduce((sum, line) => sum + line.shippedQty, 0)
      const alreadyCounted = order.items
        .filter((line) => line.skuCode === skuCode)
        .reduce((sum, line) => sum + line.receivedQty + line.rejectedQty, 0)
      if (alreadyCounted + activity > shippedQty) {
        return { ok: false, errorKey: 'return.error.overOutboundShippedQty' }
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
      returnLineNo: line.returnLineNo,
      skuCode: line.skuCode,
      containerNo,
      containerId: containerIdOf(order.warehouseCode, containerNo),
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
      serialCheckBasis: master?.snEnabled ? serialEvidenceByLine.get(line)?.basis : undefined,
      serialCheckResult: master?.snEnabled ? serialEvidenceByLine.get(line)?.result : undefined,
      serialMismatchSerialNos: serialEvidenceByLine.get(line)?.mismatchSerialNos.length
        ? serialEvidenceByLine.get(line)?.mismatchSerialNos
        : undefined,
      serialReferenceSerialNos: serialEvidenceByLine.get(line)?.referenceSerialNos.length
        ? serialEvidenceByLine.get(line)?.referenceSerialNos
        : undefined,
    }
  })

  const updatedOrder: ReturnOrder = recomputeReturnOrder({
    ...order,
    items: order.items.map((item) => {
      const hits = receiptLines.filter((l) => l.returnLineNo === item.lineNo)
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
        (r.containerId ?? '') === (line.containerId ?? '') &&
        r.qualityType === qualityType &&
        (r.batchNo ?? '') === (line.batchNo ?? '') &&
        (r.productionDate ?? '') === (line.productionDate ?? '') &&
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
        containerId: line.containerId,
        skuCode: line.skuCode,
        qualityType,
        batchNo: line.batchNo,
        productionDate: line.productionDate,
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
      containerId: line.containerId,
      qualityType: 'GOOD',
      skuCode: line.skuCode,
      qty: line.goodQty,
      receiptLineNo: line.lineNo,
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
      at,
    })
    putawayOrders = appendReturnPutawayPlan(putawayOrders, {
      returnNo: order.returnNo,
      warehouseCode: order.warehouseCode,
      customerId: order.customerId,
      receiptNo,
      stagingLocationCode: stagingLocation,
      containerNo: line.containerNo,
      containerId: line.containerId,
      qualityType: 'DEFECTIVE',
      skuCode: line.skuCode,
      qty: line.defectQty,
      receiptLineNo: line.lineNo,
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

/** 操作人确认不再接收；已收数量大于0时把未收定型为最终短少。 */
export function applyReturnReceiptClose(
  state: SeedData,
  input: { returnNo: string; operator: string },
): ActionResult & { patch?: Partial<SeedData> } {
  const order = state.returnOrders.find((candidate) => candidate.returnNo === input.returnNo)
  if (!order) return { ok: false, errorKey: 'return.error.notFound' }
  if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
    return { ok: false, errorKey: 'return.error.receiptCloseBlocked' }
  }
  if (order.receiveClosedAt) return { ok: true }
  if (sumReturnLines(order, (line) => line.receivedQty) <= 0) {
    return { ok: false, errorKey: 'return.error.receiptCloseZeroBlocked' }
  }
  const at = new Date().toISOString()
  const updated = recomputeReturnOrder({
    ...order,
    receiveClosedBy: input.operator,
    receiveClosedAt: at,
    updatedAt: at,
  })
  return {
    ok: true,
    patch: { returnOrders: state.returnOrders.map((candidate) => candidate.returnNo === order.returnNo ? updated : candidate) },
  }
}

/** 派送失败退回：扫原 B2C 出库运单，按原包裹复核明细生成退货预计行。 */
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
  const packageRows = new Map<
    string,
    { skuCode: string; packageNo: string; verificationNo: string; outboundLineNo: number; qty: number }
  >()
  state.outboundVerifications
    .filter(
      (verification) =>
        verification.orderNo === outbound.no &&
        !verification.deleted &&
        verification.method === 'PACK' &&
        verification.containerType === 'PACKAGE' &&
        verification.containerNo.trim(),
    )
    .forEach((verification) => {
      verification.lines.forEach((line) => {
        if (line.effectiveQty <= 0) return
        const key = `${verification.containerNo.trim().toUpperCase()}::${line.itemNo}::${line.skuCode}`
        const current = packageRows.get(key)
        packageRows.set(key, {
          skuCode: line.skuCode,
          packageNo: verification.containerNo.trim(),
          verificationNo: current?.verificationNo ?? verification.no,
          outboundLineNo: line.itemNo,
          qty: (current?.qty ?? 0) + line.effectiveQty,
        })
      })
    })
  if (packageRows.size === 0) return { ok: false, errorKey: 'return.error.packageBasisMissing' }

  const packageQtyBySku = new Map<string, number>()
  for (const row of packageRows.values()) {
    packageQtyBySku.set(row.skuCode, (packageQtyBySku.get(row.skuCode) ?? 0) + row.qty)
  }
  const shippedBySku = new Map<string, number>()
  outbound.items.forEach((line) => {
    if (line.shippedQty > 0) shippedBySku.set(line.skuCode, (shippedBySku.get(line.skuCode) ?? 0) + line.shippedQty)
  })
  if (
    [...shippedBySku].some(([skuCode, qty]) => packageQtyBySku.get(skuCode) !== qty) ||
    [...packageQtyBySku].some(([skuCode]) => !shippedBySku.has(skuCode))
  ) {
    return { ok: false, errorKey: 'return.error.packageBasisMismatch' }
  }

  const items = [...packageRows.values()]
    .sort((a, b) => a.packageNo.localeCompare(b.packageNo) || a.outboundLineNo - b.outboundLineNo)
    .map((row, index) => ({
      lineNo: index + 1,
      skuCode: row.skuCode,
      originalPackageNo: row.packageNo,
      originalVerificationNo: row.verificationNo,
      originalOutboundLineNo: row.outboundLineNo,
      plannedQty: row.qty,
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
