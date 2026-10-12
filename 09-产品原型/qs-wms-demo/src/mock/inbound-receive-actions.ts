import { isWorkContainerUsedOnInbound } from '@/lib/inbound-receipt-container'
import { lineUnreceivedQty, recomputeInboundOrder, stagingLocationCode } from '@/lib/inbound-derive'
import { nextDocNo } from '@/lib/doc-no'
import type {
  ContainerReceiptLineInput,
  InboundException,
  PutawayOrder,
  ReceiptContainerInput,
  ReceiptRecord,
  ReceiptRecordLine,
} from '@/types/inbound'
import type { InboundOrder, InventoryLog } from '@/types/wms'
import type { SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string }

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function log(entry: Omit<InventoryLog, 'id' | 'createdAt'>): InventoryLog {
  return { id: uid('IL'), createdAt: new Date().toISOString(), ...entry }
}

function appendPutawayPlan(
  orders: PutawayOrder[],
  input: {
    inboundNo: string
    warehouseCode: string
    customerId: string
    receiptNo: string
    containerNo?: string
    qualityType: 'GOOD' | 'DEFECTIVE'
    skuCode: string
    qty: number
    ts: string
  },
): PutawayOrder[] {
  if (input.qty <= 0) return orders
  /** 按「容器 × 品质」拆单；无容器收货按「本次收货记录 × 品质」合并（宏观架构 2.1.1） */
  const idx = orders.findIndex(
    (p) =>
      p.inboundNo === input.inboundNo &&
      p.qualityType === input.qualityType &&
      (p.containerNo ?? '') === (input.containerNo ?? '') &&
      p.receiptNo === input.receiptNo &&
      p.status !== 'COMPLETED',
  )
  if (idx >= 0) {
    const po = orders[idx]
    const planLines = [...po.planLines]
    const lineIdx = planLines.findIndex((l) => l.skuCode === input.skuCode)
    if (lineIdx >= 0) {
      planLines[lineIdx] = { ...planLines[lineIdx], planQty: planLines[lineIdx].planQty + input.qty }
    } else {
      planLines.push({ lineNo: planLines.length + 1, skuCode: input.skuCode, planQty: input.qty })
    }
    const next = [...orders]
    next[idx] = { ...po, planLines, receiptNo: input.receiptNo }
    return next
  }
  return [
    ...orders,
    {
      putawayNo: nextDocNo('PA', orders.map((o) => o.putawayNo), input.ts),
      inboundNo: input.inboundNo,
      warehouseCode: input.warehouseCode,
      customerId: input.customerId,
      receiptNo: input.receiptNo,
      containerNo: input.containerNo,
      qualityType: input.qualityType,
      status: 'PENDING',
      planLines: [{ lineNo: 1, skuCode: input.skuCode, planQty: input.qty }],
      actualLines: [],
      createdAt: input.ts,
    },
  ]
}

const sum = (lines: ReceiptRecordLine[], pick: (l: ReceiptRecordLine) => number) =>
  lines.reduce((total, l) => total + pick(l), 0)

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
      lines: c.lines,
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
  }

  /** R04：同一 SKU 历史实收＋拒收，加本次各容器合计，不得超过预计 */
  const activityBySku = new Map<string, number>()
  for (const c of containers) {
    for (const line of c.lines) {
      if (!order.items.some((i) => i.skuCode === line.skuCode)) return { ok: false, errorKey: 'error.skuNotInOrder' }
      const rejectedQty = line.rejectedQty ?? 0
      if ([line.goodQty, line.defectQty, rejectedQty].some((n) => !Number.isInteger(n) || n < 0)) {
        return { ok: false, errorKey: 'error.qtyInvalid' }
      }
      const activity = line.goodQty + line.defectQty + rejectedQty
      if (activity <= 0) return { ok: false, errorKey: 'error.qtyInvalid' }
      if (rejectedQty > 0 && !line.rejectReason) return { ok: false, errorKey: 'inbound.receive.rejectReasonRequired' }
      activityBySku.set(line.skuCode, (activityBySku.get(line.skuCode) ?? 0) + activity)
    }
  }
  for (const [skuCode, activity] of activityBySku) {
    const item = order.items.find((i) => i.skuCode === skuCode)!
    if (activity > lineUnreceivedQty(item)) return { ok: false, errorKey: 'inbound.receive.overRemain' }
  }

  const ts = new Date().toISOString()
  const stagingCode = stagingLocationCode(state.locations, order.warehouseCode)
  const receiptNo = nextDocNo('RC', (state.receiptRecords ?? []).map((r) => r.receiptNo), ts)
  const receiptLines: ReceiptRecordLine[] = containers
    .flatMap((c) => c.lines.map((line) => ({ line, containerNo: c.containerNo })))
    .map(({ line, containerNo }, i) => {
      const rejectedQty = line.rejectedQty ?? 0
      return {
        lineNo: i + 1,
        skuCode: line.skuCode,
        containerNo,
        receivedQty: line.goodQty + line.defectQty,
        rejectedQty,
        goodQty: line.goodQty,
        defectQty: line.defectQty,
        rejectReason: rejectedQty > 0 ? line.rejectReason : undefined,
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

  const upsertStagingStock = (skuCode: string, qualityType: 'GOOD' | 'DEFECTIVE', qty: number) => {
    if (qty <= 0) return
    const locked = qualityType === 'DEFECTIVE' ? qty : 0
    const idx = inventory.findIndex(
      (r) =>
        r.warehouseCode === order.warehouseCode &&
        r.locationCode === stagingCode &&
        r.skuCode === skuCode &&
        r.customerId === order.customerId &&
        r.qualityType === qualityType,
    )
    if (idx >= 0) {
      inventory[idx] = {
        ...inventory[idx],
        onHandQty: inventory[idx].onHandQty + qty,
        lockedQty: inventory[idx].lockedQty + locked,
      }
    } else {
      inventory.push({
        id: uid('INV'),
        warehouseCode: order.warehouseCode,
        locationCode: stagingCode,
        customerId: order.customerId,
        skuCode,
        qualityType,
        onHandQty: qty,
        lockedQty: locked,
        firstInboundAt: ts,
      })
    }
  }

  for (const line of receiptLines) {
    /** 收货确认即按实收、按品质进入收货暂存库位库存（不良品品质锁定） */
    upsertStagingStock(line.skuCode, 'GOOD', line.goodQty)
    upsertStagingStock(line.skuCode, 'DEFECTIVE', line.defectQty)

    const plan = {
      inboundNo,
      warehouseCode: order.warehouseCode,
      customerId: order.customerId,
      receiptNo,
      containerNo: line.containerNo,
      skuCode: line.skuCode,
      ts,
    }
    putawayOrders = appendPutawayPlan(putawayOrders, { ...plan, qualityType: 'GOOD', qty: line.goodQty })
    putawayOrders = appendPutawayPlan(putawayOrders, { ...plan, qualityType: 'DEFECTIVE', qty: line.defectQty })

    if (line.receivedQty > 0) {
      inventoryLogs.unshift(
        log({
          warehouseCode: order.warehouseCode,
          type: 'RECEIVE',
          refNo: inboundNo,
          skuCode: line.skuCode,
          customerId: order.customerId,
          locationCode: stagingCode,
          qtyChange: line.receivedQty,
          operator,
        }),
      )
    }
  }

  return {
    ok: true,
    patch: {
      inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? updatedOrder : o)),
      receiptRecords: [receipt, ...(state.receiptRecords ?? [])],
      inboundExceptions: [...exceptions, ...(state.inboundExceptions ?? [])],
      putawayOrders,
      inventory,
      inventoryLogs,
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
