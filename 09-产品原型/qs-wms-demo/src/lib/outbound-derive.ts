import { openTask, taskOrderNos } from '@/mock/outbound-actions'
import type {
  OutboundData,
  OutboundItem,
  OutboundOrder,
  OutboundPickTask,
  OutboundPutback,
  OutboundWave,
  PickLine,
  WaveStatus,
} from '@/types/outbound'

/** 本类型数量是否允许进入待出库（不含未完成任务、包裹信息等提交校验） */
export function outboundConfirmQtyReady(order: OutboundOrder): boolean {
  const shortAllowed = order.type === 'FBA' || order.type === 'WHOLESALE'
  let verifiedTotal = 0
  for (const i of order.items) {
    if (i.verifiedQty !== i.pickedQty) return false
    verifiedTotal += i.verifiedQty
    if (!shortAllowed && i.verifiedQty !== i.demandQty) return false
  }
  return verifiedTotal > 0
}

/** 出库单头状态推导（宏观架构 §3.1、出库单主PRD §7.4） */
export function deriveOutboundOrderStatus(
  order: OutboundOrder,
  tasks: OutboundPickTask[],
): OutboundOrder['status'] {
  if (order.status === 'SHIPPED' || order.status === 'CANCELLED') return order.status
  const related = tasks.filter((t) => taskOrderNos(t).includes(order.no))
  if (related.length === 0) return 'PENDING_HANDLE'
  if (related.some(openTask)) return 'PENDING_PICK'
  if (order.items.some((i) => i.pickedQty > i.verifiedQty)) return 'PENDING_VERIFY'
  if (outboundConfirmQtyReady(order)) return 'PENDING_SHIPMENT'
  return 'PENDING_PICK'
}

/**
 * 出库页面派生口径（出库单主PRD §7.3、§6.4；各对象 Demo PRD 第二节）。
 * 页面只调用这里的函数，不在组件里手算数量或拼按钮条件。
 */

export const sum = <T>(rows: T[], value: (row: T) => number) => rows.reduce((n, r) => n + value(r), 0)

export interface OrderLineQty {
  demand: number
  /** 其他出库不计订单占用，为 undefined */
  reserved?: number
  shortage?: number
  picked: number
  waiting: number
  verified: number
  /** 未出库为 undefined */
  shipped?: number
  unshipped?: number
}

export function lineQty(order: OutboundOrder, item: OutboundItem): OrderLineQty {
  const other = order.type === 'OTHER'
  const shippedState = order.status === 'SHIPPED'
  return {
    demand: item.demandQty,
    reserved: other ? undefined : item.reservedQty,
    shortage: other ? undefined : Math.max(0, item.demandQty - item.reservedQty),
    picked: item.pickedQty,
    waiting: Math.max(0, (other ? item.demandQty : item.reservedQty) - item.pickedQty),
    verified: item.verifiedQty,
    shipped: shippedState ? item.shippedQty : undefined,
    unshipped: shippedState ? item.demandQty - item.shippedQty : undefined,
  }
}

/** 订单品种类型：按 SKU 行数与需求量推导（与 OMS 波次筛选口径一致） */
export type OrderComposition = 'SINGLE_SINGLE' | 'SINGLE_MULTI' | 'MULTI_MIX'

export function orderComposition(order: OutboundOrder): OrderComposition {
  if (order.items.length > 1) return 'MULTI_MIX'
  const line = order.items[0]
  if (!line || line.demandQty <= 1) return 'SINGLE_SINGLE'
  return 'SINGLE_MULTI'
}

export function orderTotals(order: OutboundOrder): OrderLineQty {
  const lines = order.items.map((i) => lineQty(order, i))
  const opt = (pick: (l: OrderLineQty) => number | undefined) =>
    lines.some((l) => pick(l) === undefined) ? undefined : sum(lines, (l) => pick(l) ?? 0)
  return {
    demand: sum(lines, (l) => l.demand),
    reserved: opt((l) => l.reserved),
    shortage: opt((l) => l.shortage),
    picked: sum(lines, (l) => l.picked),
    waiting: sum(lines, (l) => l.waiting),
    verified: sum(lines, (l) => l.verified),
    shipped: opt((l) => l.shipped),
    unshipped: opt((l) => l.unshipped),
  }
}

/** 与出库单相关的拣货任务：按单、补拣直接关联，波次任务按份额或归属关联 */
export function orderTasks(db: Pick<OutboundData, 'outboundPickTasks'>, no: string) {
  return db.outboundPickTasks.filter(
    (t) => taskOrderNos(t).includes(no) || t.assignments.some((a) => a.orderNo === no),
  )
}

/** 波次任务只取本单份额；按单任务取整单 */
export function taskQtyForOrder(task: OutboundPickTask, no: string) {
  if (task.source !== 'WAVE') return taskTotals(task)
  const planned = sum(task.lines, (l) => sum(l.shares.filter((p) => p.orderNo === no), (p) => p.qty))
  const picked = sum(
    task.assignments.filter((a) => a.orderNo === no),
    (a) => a.pickedQty,
  )
  return { planned, picked, reported: 0, short: 0 }
}

export const lineShort = (l: PickLine) => Math.max(0, l.shortageQty - (l.replacedQty ?? 0))

export function taskTotals(task: OutboundPickTask) {
  return {
    planned: sum(task.lines, (l) => l.plannedQty),
    picked: sum(task.lines, (l) => l.pickedQty),
    reported: sum(task.lines, (l) => l.shortageQty),
    short: sum(task.lines, lineShort),
  }
}

/** 任务挂在哪张单据上：波次任务指波次，其余指出库单 */
export function taskOwnerDoc(task: OutboundPickTask): { kind: 'waves' | 'orders'; no: string } | undefined {
  if (task.source === 'WAVE' && task.waveNo) return { kind: 'waves', no: task.waveNo }
  if (task.orderNo) return { kind: 'orders', no: task.orderNo }
  return undefined
}

function wavePickTasks(wave: OutboundWave, tasks: OutboundPickTask[]): OutboundPickTask[] {
  const linked = tasks.filter((t) => t.source === 'WAVE' && t.waveNo === wave.no)
  if (linked.length) return linked
  const legacy = tasks.find((t) => t.no === wave.taskNo)
  return legacy ? [legacy] : []
}

/** 波次头状态（宏观架构 §3.4）：计划与下发段；拣货进度见拣货任务 */
export function waveStatus(wave: OutboundWave, tasks: OutboundPickTask[]): WaveStatus {
  if (wave.status === 'CANCELLED') return 'CANCELLED'
  const T = wavePickTasks(wave, tasks)
  const terminal = (s: OutboundPickTask['status']) => s === 'COMPLETED' || s === 'CLOSED'
  if (T.length > 0 && T.every((t) => terminal(t.status))) return 'COMPLETED'
  if (wave.status === 'ALLOCATED') return 'ALLOCATED'
  return 'RELEASED'
}

export const putbackExpected = (p: OutboundPutback) => sum(p.lines, (l) => l.qty)
/** 已保存（作业进度）：只在作业页（PDA 返库、Web 端返库）展示，列表与详情不展示 */
export const putbackSaved = (p: OutboundPutback) => sum(p.lines, (l) => l.savedQty)
/** 已返库只认整单提交（返库上架单主PRD 第四节） */
export const putbackReturned = (p: OutboundPutback) => (p.status === 'COMPLETED' ? putbackExpected(p) : 0)

export function putbackPlacements(p: OutboundPutback) {
  return p.lines.flatMap((l, i) => {
    const placements = l.placements?.length
      ? l.placements
      : l.targetLocation && l.savedQty
        ? [{ location: l.targetLocation, qty: l.savedQty, serialNos: [] as string[] }]
        : []
    return placements.map((pl, j) => ({
      id: `${l.id}-${j}`,
      planLineNo: i + 1,
      skuCode: l.skuCode,
      location: pl.location,
      qty: pl.qty,
      serialNos: pl.serialNos,
    }))
  })
}

type Db = Pick<OutboundData, 'outboundPickTasks' | 'outboundVerifications' | 'outboundResults'>

/** 有效实拣（可退拣）的归属 */
export function activeAssignments(db: Pick<OutboundData, 'outboundPickTasks'>, no: string) {
  return db.outboundPickTasks.flatMap((t) =>
    t.assignments
      .filter((a) => a.orderNo === no && a.activeQty > 0)
      .map((a) => ({ ...a, taskNo: t.no, line: t.lines.find((l) => l.id === a.lineId)! })),
  )
}

export interface OrderActions {
  allocate: boolean
  reallocate: boolean
  verify: boolean
  unpick: boolean
  ship: boolean
  handover: boolean
  mockChange: boolean
  mockCancel: boolean
  manualCancel: boolean
  simulateResultFailure: boolean
  retryResult: boolean
}

/** 页头按钮唯一来源：出库单主PRD §6.4 状态—功能矩阵；不按角色裁剪，所有满足状态条件的动作默认可见 */
export function orderActions(order: OutboundOrder, db: Db): OrderActions {
  const organizer = true
  const worker = true
  const supervisor = true
  const t = orderTotals(order)
  const postHandle =
    order.status === 'PENDING_PICK' || order.status === 'PENDING_VERIFY' || order.status === 'PENDING_SHIPMENT'
  const live = order.status !== 'SHIPPED' && order.status !== 'CANCELLED'
  const result = db.outboundResults.find((r) => r.orderNo === order.no)
  return {
    allocate: order.status === 'PENDING_HANDLE' && organizer,
    reallocate:
      (order.status === 'PENDING_PICK' || order.status === 'PENDING_VERIFY') &&
      organizer &&
      ((t.shortage ?? 0) > 0 || t.waiting > 0),
    verify: postHandle && worker && t.picked > t.verified,
    unpick: postHandle && worker && activeAssignments(db, order.no).length > 0,
    ship: order.status === 'PENDING_SHIPMENT' && supervisor,
    handover: order.status === 'SHIPPED' && worker,
    mockChange: order.status === 'PENDING_HANDLE' && order.source === 'OMS' && order.type !== 'OTHER',
    mockCancel: live && order.source === 'OMS',
    manualCancel: live && order.source === 'MANUAL' && supervisor,
    simulateResultFailure: order.status === 'SHIPPED' && result?.status === 'SENT',
    retryResult: order.status === 'SHIPPED' && result?.status === 'FAILED',
  }
}

export type ShipProblem =
  | { key: 'openTask' }
  | { key: 'unverified'; picked: number; verified: number }
  | { key: 'short'; count: number }
  | { key: 'package' }

export interface ShipCheckLine {
  lineNo: number
  skuCode: string
  demand: number
  picked: number
  verified: number
  shipQty: number
  unshipped: number
  shortAllowed: boolean
  problem?: ShipProblem
}

/** 确认出库前逐行检查（出库单主PRD R10、R11）；结果只用于弹窗展示，提交仍由动作重新校验 */
export function shipCheck(order: OutboundOrder, db: Db) {
  const shortAllowed = order.type === 'FBA' || order.type === 'WHOLESALE'
  const hasOpenTask = orderTasks(db, order.no).some(openTask)
  const lines: ShipCheckLine[] = order.items.map((i) => {
    const base = {
      lineNo: i.lineNo,
      skuCode: i.skuCode,
      demand: i.demandQty,
      picked: i.pickedQty,
      verified: i.verifiedQty,
      shipQty: i.verifiedQty,
      unshipped: i.demandQty - i.verifiedQty,
      shortAllowed,
    }
    if (i.verifiedQty !== i.pickedQty)
      return { ...base, problem: { key: 'unverified' as const, picked: i.pickedQty, verified: i.verifiedQty } }
    if (!shortAllowed && i.pickedQty < i.demandQty)
      return { ...base, problem: { key: 'short' as const, count: i.demandQty - i.pickedQty } }
    return base
  })
  const packageMissing =
    order.type === 'B2C' &&
    db.outboundVerifications
      .filter((v) => v.orderNo === order.no && !v.deleted && v.lines.some((l) => l.effectiveQty > 0))
      .some((v) => v.containerType !== 'PACKAGE' || !v.containerNo || !v.trackingNo || !v.weightKg)
  const shipTotal = sum(lines, (l) => l.shipQty)
  const orderProblem: ShipProblem | undefined = hasOpenTask
    ? { key: 'openTask' }
    : packageMissing
      ? { key: 'package' }
      : undefined
  return {
    lines,
    orderProblem,
    shipTotal,
    ok: !orderProblem && shipTotal > 0 && lines.every((l) => !l.problem),
  }
}
