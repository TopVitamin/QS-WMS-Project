import { useMemo } from 'react'
import { create } from 'zustand'
import { applyOutboundAction, outboundAuditRef } from './outbound-actions'
import { applyInventoryAction, inventoryAuditRef, type InventoryTerminal } from './inventory-actions'
import type { InventoryCommand } from '@/types/inventory'
import type { OutboundCommand } from '@/types/outbound'
import { persist } from 'zustand/middleware'
import { findSkuMaster } from '@/lib/sku-master'
import { canConfirmReceiptClose, recomputeInboundOrder, syncInboundPutawayFromOrders } from '@/lib/inbound-derive'
import type {
  AuditLog,
  CarrierMaster,
  ChannelMaster,
  CustomerMaster,
  InboundOrder,
  LocationMaster,
  Sku,
  SkuMaster,
  UsageStatus,
  WarehouseMaster,
  ZoneMaster,
} from '@/types/wms'
import type {
  ContainerReceiptLineInput,
  InboundMessage,
  InboundMessageAction,
  InboundResult,
  NewSkuRecord,
  ReceiptContainerInput,
  UnclaimedRecord,
} from '@/types/inbound'
import { applyContainerReceipt, applyReceipt } from './inbound-receive-actions'
import {
  applyConfirmPutawayEntry,
  applyRemovePutawayLine,
  applySavePutawayLine,
  applySubmitPutawayOrder,
  type PutawayPlacementInput,
} from './putaway-actions'
import { applySubmitNewSkuMeasure, type SubmitNewSkuMeasureInput } from './new-sku-actions'
import { applyRegisterUnclaimed, type RegisterUnclaimedInput } from './unclaimed-actions'
import { applyReturnReceipt } from './return-actions'
import { recomputeReturnOrder } from '@/lib/return-derive'
import { createSeedData, type SeedData } from './seed'
import type { ReturnOrder, ReturnReceiveLineInput } from '@/types/return'
import { nextDocNo } from '@/lib/doc-no'
import { currentOperator } from './current-operator'
import { createMasterActions } from './master-actions'

// SeedData includes receiptRecords / putawayOrders / inboundExceptions

type ActionResult = { ok: true } | { ok: false; errorKey: string; params?: Record<string, string | number> }

export interface MockPushInboundInput {
  customerId: string
  warehouseCode: string
  bizType: InboundOrder['bizType']
  upstreamNo: string
  /** 完整 Mock 台用 items；保留 skuCode/plannedQty 兼容旧的单行快速推单 */
  items?: { skuCode: string; plannedQty: number }[]
  skuCode?: string
  plannedQty?: number
  arrivalMethod?: InboundOrder['arrivalMethod']
  containerNo?: string
  trackingNos?: string
  etaAt?: string
}

interface DbActions {
  outboundAction: (
    command: OutboundCommand,
    operator: string,
  ) => { ok: true; no?: string } | { ok: false; errorKey: string; params?: Record<string, string | number> }
  /** 库内动作（品质转换、移库、差异上报、盘点）：管理端与 PDA 共用，terminal 记入流水 */
  inventoryAction: (
    command: InventoryCommand,
    operator: string,
    terminal?: InventoryTerminal,
  ) => { ok: true; no?: string } | { ok: false; errorKey: string; params?: Record<string, string | number> }
  resetDemo: () => void
  confirmReceiptClose: (inboundNo: string, operator: string) => ActionResult
  mockPushInboundInstruction: (input: MockPushInboundInput) => ActionResult & { inboundNo?: string }
  /** 上游明细变更：仅待收货且零实收可变更 */
  mockChangeInboundInstruction: (input: {
    inboundNo: string
    messageId?: string
    version?: number
    items: { skuCode: string; plannedQty: number }[]
  }) => ActionResult
  /** 上游取消：仅整单零实收可受理 */
  mockCancelInboundInstruction: (input: {
    inboundNo: string
    messageId?: string
    version?: number
    reason?: string
  }) => ActionResult
  /** 重试入库完成结果回传（Demo 只重试已有结果） */
  retryInboundResult: (inboundNo: string) => ActionResult
  /** 退货收货（管理端与 PDA 共用）：生成退货收货记录、异常与共用上架单 */
  receiveReturn: (input: {
    returnNo: string
    containerNo?: string
    lines: ReturnReceiveLineInput[]
    operator: string
  }) => ActionResult
  /** OMS Mock 退货预报：同来源+上游退货号重复接收返回原单 */
  mockReturnForecast: (input: {
    customerId: string
    warehouseCode: string
    sourceType: ReturnOrder['sourceType']
    upstreamNo: string
    skuCode: string
    plannedQty: number
    trackingNo?: string
    originalOutboundNo?: string
  }) => ActionResult & { returnNo?: string }
  /** 上游取消退货单：仅整单零实收 */
  cancelReturnOrder: (returnNo: string, reason?: string) => ActionResult
  /** 收货提交（两端共用）：一次提交含 1～N 个容器，生成一条收货记录（主 PRD R16） */
  submitReceipt: (input: { inboundNo: string; containers: ReceiptContainerInput[]; operator: string }) => ActionResult
  /** 管理端收货作业台：单容器封装 */
  submitContainerReceipt: (input: {
    inboundNo: string
    containerNo?: string
    bulkPiece?: boolean
    lines: ContainerReceiptLineInput[]
    operator: string
  }) => ActionResult
  /** PDA 上架：保存落位，只记进度不动库存（上架单主PRD 第三节）；按应上架行号定位 */
  savePutawayLine: (input: {
    putawayNo: string
    locationCode: string
    planLineNo: number
    qty: number
    serialNos?: string[]
    operator: string
  }) => ActionResult
  /** PDA 上架：撤销一条未提交落位；按实际明细行号定位（同库位同行可有多条 SN 落位） */
  removePutawayLine: (input: { putawayNo: string; actualLineNo: number; operator: string }) => ActionResult
  /** PDA 上架：提交上架单，暂存库位库存移到目标货位 */
  submitPutawayOrder: (input: { putawayNo: string; operator: string }) => ActionResult
  /** Web 端上架：本次落位逐条保存后整单提交，全部成功才生效；failedIndex 指出第几条落位不过 */
  confirmPutawayEntry: (input: {
    putawayNo: string
    placements: PutawayPlacementInput[]
    operator: string
  }) => ActionResult & { failedIndex?: number }
  /** 新品量方提交（管理端量方弹窗与 PDA 量方屏共用） */
  submitNewSkuMeasure: (input: SubmitNewSkuMeasureInput) => ActionResult & {
    record?: NewSkuRecord
  }
  /** 无主货登记（管理端登记弹窗与 PDA 登记屏共用）；只写 unclaimedRecords */
  registerUnclaimed: (input: RegisterUnclaimedInput) => ActionResult & { record?: UnclaimedRecord }
  updateWarehouseMaster: (
    code: string,
    patch: Omit<WarehouseMaster, 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  createWarehouseMaster: (
    input: Omit<WarehouseMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  setWarehouseMasterStatus: (code: string, status: UsageStatus) => ActionResult
  createLocationMaster: (
    input: Omit<LocationMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  updateLocationMaster: (
    warehouseCode: string,
    code: string,
    patch: Partial<
      Omit<
        LocationMaster,
        'warehouseCode' | 'code' | 'zoneType' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
      >
    >,
  ) => ActionResult
  setLocationMasterStatus: (warehouseCode: string, code: string, status: UsageStatus) => ActionResult
  createZoneMaster: (input: Omit<ZoneMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => ActionResult
  updateZoneMaster: (
    warehouseCode: string,
    code: string,
    patch: Partial<Omit<ZoneMaster, 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>,
  ) => ActionResult
  setZoneMasterStatus: (warehouseCode: string, code: string, status: UsageStatus) => ActionResult
  updateCustomerMaster: (
    code: string,
    patch: Partial<
      Omit<
        CustomerMaster,
        | 'id'
        | 'code'
        | 'ownerType'
        | 'upstreamOwnerId'
        | 'lastSyncAt'
        | 'createdAt'
        | 'createdBy'
        | 'updatedAt'
        | 'updatedBy'
      >
    >,
  ) => ActionResult
  setCustomerMasterStatus: (code: string, status: UsageStatus) => ActionResult
  updateSkuMaster: (
    ownerCode: string,
    code: string,
    patch: Partial<
      Omit<
        SkuMaster,
        'ownerCode' | 'code' | 'customerId' | 'upstreamSkuId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
      >
    >,
  ) => ActionResult
  setSkuMasterStatus: (ownerCode: string, code: string, status: UsageStatus) => ActionResult
  saveSkuBarcode: (input: {
    id?: string
    ownerCode: string
    skuCode: string
    barcode: string
    isPrimary: boolean
    status: UsageStatus
  }) => ActionResult
  setSkuBarcodeStatus: (id: string, status: UsageStatus) => ActionResult
  createCarrierMaster: (
    input: Omit<CarrierMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  updateCarrierMaster: (
    code: string,
    patch: Omit<CarrierMaster, 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  setCarrierMasterStatus: (code: string, status: UsageStatus) => ActionResult
  createChannelMaster: (
    input: Omit<ChannelMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  updateChannelMaster: (
    code: string,
    patch: Omit<ChannelMaster, 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
  setChannelMasterStatus: (code: string, status: UsageStatus) => ActionResult
}

export type DbState = SeedData & DbActions

const nowIso = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

function nextInboundNo(inbounds: InboundOrder[]): string {
  return nextDocNo(
    'IB',
    inbounds.map((o) => o.inboundNo),
  )
}

/** 整单完成时生成一次结果；取消单不回传完成结果 */
function ensureInboundResults(state: SeedData): Pick<SeedData, 'inboundResults'> | undefined {
  const existing = new Set(state.inboundResults.map((r) => r.inboundNo))
  const added = state.inbounds
    .filter((o) => o.status === 'COMPLETED' && !existing.has(o.inboundNo))
    .map<InboundResult>((o) => ({
      inboundNo: o.inboundNo,
      upstreamNo: o.upstreamNo,
      status: 'SENT',
      attempts: 1,
      items: o.items.map((l) => ({
        skuCode: l.skuCode,
        receivedQty: l.receivedQty,
        rejectedQty: l.rejectedQty,
        putawayQty: l.putawayQty,
      })),
      at: nowIso(),
    }))
  return added.length ? { inboundResults: [...added, ...state.inboundResults] } : undefined
}

function inboundMessage(
  action: InboundMessageAction,
  upstreamNo: string,
  version: number,
  status: InboundMessage['status'],
  inboundNo?: string,
  errorKey?: string,
  params?: Record<string, string | number>,
): InboundMessage {
  return {
    id: uid(`MSG-${action}`),
    upstreamNo,
    version,
    action,
    status,
    inboundNo,
    errorKey,
    params,
    at: nowIso(),
  }
}

export const useDb = create<DbState>()(
  persist(
    (set, get) => {
      const auditLog = (entry: Omit<AuditLog, 'id' | 'createdAt'>) => ({
        id: uid('AUD'),
        createdAt: nowIso(),
        ...entry,
      })

      const appendAudit = (entry: Omit<AuditLog, 'id' | 'createdAt'>) => [auditLog(entry), ...get().auditLogs]
      const finalizeInboundResults = () => {
        const extra = ensureInboundResults(get())
        if (extra) set(extra)
      }
      const finalizeReturnResults = () => {
        const state = get()
        const existing = new Set(state.returnResults.map((r) => r.returnNo))
        const added = state.returnOrders
          .filter((o) => o.status === 'COMPLETED' && !existing.has(o.returnNo))
          .map((o) => ({
            returnNo: o.returnNo,
            upstreamNo: o.upstreamNo,
            status: 'SENT' as const,
            attempts: 1,
            items: o.items.map((l) => ({
              skuCode: l.skuCode,
              receivedQty: l.receivedQty,
              rejectedQty: l.rejectedQty,
              putawayQty: l.putawayQty,
            })),
            at: nowIso(),
          }))
        if (added.length) set({ returnResults: [...added, ...state.returnResults] })
      }

      return {
        ...createSeedData(),
        ...createMasterActions(get, set),
        outboundAction: (command, operator) => {
          const result = applyOutboundAction(get(), command, operator)
          if (result.patch)
            set({
              ...result.patch,
              auditLogs: result.ok
                ? appendAudit({ ...outboundAuditRef(get(), command, result.no), action: 'OUTBOUND_ACTION', operator })
                : get().auditLogs,
            })
          return result.ok
            ? { ok: true, no: result.no }
            : { ok: false, errorKey: result.errorKey, params: result.params }
        },

        inventoryAction: (command, operator, terminal = 'WEB') => {
          const result = applyInventoryAction(get(), command, operator, undefined, terminal)
          if (!result.ok) return { ok: false, errorKey: result.errorKey, params: result.params }
          set({
            ...result.patch,
            auditLogs: appendAudit({ ...inventoryAuditRef(command, result.no), action: 'INVENTORY_ACTION', operator }),
          })
          return { ok: true, no: result.no }
        },

        resetDemo: () => {
          const seed = createSeedData()
          set({
            ...seed,
            auditLogs: [
              auditLog({
                refType: 'SYSTEM',
                refNo: '-',
                action: 'DEMO_RESET',
                operator: currentOperator(),
              }),
              ...seed.auditLogs,
            ],
          })
        },

        confirmReceiptClose: (inboundNo, operator) => {
          const state = get()
          const order = state.inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          const synced = syncInboundPutawayFromOrders(order, state.putawayOrders)
          if (!canConfirmReceiptClose(synced)) return { ok: false, errorKey: 'inbound.receiptCloseStale' }
          if (synced.receiptCloseFlag === 'CONFIRMED') return { ok: true }
          const ts = nowIso()
          const next = recomputeInboundOrder({
            ...synced,
            receiptCloseFlag: 'CONFIRMED',
            receiptClosedBy: operator,
            receiptClosedAt: ts,
            updatedAt: ts,
          })
          set({
            inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? next : o)),
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_RECEIPT_CLOSE',
              operator,
            }),
          })
          finalizeInboundResults()
          return { ok: true }
        },

        mockPushInboundInstruction: (input) => {
          const state = get()
          if (!input.customerId) return { ok: false, errorKey: 'inbound.mock.ownerRequired' }
          if (!input.upstreamNo.trim()) return { ok: false, errorKey: 'inbound.mock.upstreamRequired' }
          const items =
            input.items?.length
              ? input.items
              : input.skuCode && input.plannedQty
                ? [{ skuCode: input.skuCode, plannedQty: input.plannedQty }]
                : []
          if (
            items.length === 0 ||
            new Set(items.map((i) => i.skuCode)).size !== items.length ||
            items.some((i) => !Number.isInteger(i.plannedQty) || i.plannedQty <= 0)
          ) {
            return { ok: false, errorKey: 'inbound.mock.qtyInvalid' }
          }
          const owner = state.customerMasters.find((c) => c.id === input.customerId)
          for (const item of items) {
            const sku = owner ? findSkuMaster(state.skuMasters, owner.code, item.skuCode) : undefined
            if (!sku || sku.status !== 'ENABLED') return { ok: false, errorKey: 'inbound.mock.skuInvalid' }
          }
          /** 按「来源＋业务类型＋上游单号」定位；重复指令返回原单，不新增 */
          const dup = state.inbounds.find(
            (o) =>
              o.customerId === input.customerId &&
              o.bizType === input.bizType &&
              o.upstreamNo === input.upstreamNo.trim(),
          )
          if (dup) return { ok: true, inboundNo: dup.inboundNo }

          const inboundNo = nextInboundNo(state.inbounds)
          const ts = nowIso()
          const order = recomputeInboundOrder({
            inboundNo,
            customerId: input.customerId,
            warehouseCode: input.warehouseCode,
            bizType: input.bizType,
            upstreamNo: input.upstreamNo.trim(),
            arrivalMethod: input.arrivalMethod,
            containerNo: input.containerNo,
            trackingNos: input.trackingNos,
            etaAt: input.etaAt,
            receiptCloseFlag: 'NOT_CONFIRMED',
            status: 'PENDING_RECEIVE',
            items: items.map((item, i) => ({
              lineNo: i + 1,
              skuCode: item.skuCode,
              plannedQty: item.plannedQty,
              receivedQty: 0,
              rejectedQty: 0,
              goodQty: 0,
              defectQty: 0,
              putawayQty: 0,
              status: 'PENDING_RECEIVE',
            })),
            createdAt: ts,
            updatedAt: ts,
          })
          set({
            inbounds: [order, ...state.inbounds],
            inboundMessages: [
              inboundMessage('CREATE', input.upstreamNo.trim(), 0, 'ACCEPTED', inboundNo),
              ...state.inboundMessages,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_MOCK_PUSH',
              operator: currentOperator(),
              detail: input.upstreamNo,
            }),
          })
          return { ok: true, inboundNo }
        },

        mockChangeInboundInstruction: ({ inboundNo, messageId, version = 1, items }) => {
          const state = get()
          const order = state.inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          const prior = messageId ? state.inboundMessages.find((m) => m.id === messageId) : undefined
          if (prior) return prior.status === 'ACCEPTED' ? { ok: true } : { ok: false, errorKey: prior.errorKey ?? 'inbound.changeBlocked' }
          const rejectChange = (errorKey: string) => {
            set({
              inboundMessages: [
                inboundMessage('CHANGE', order.upstreamNo, version, 'REJECTED', inboundNo, errorKey),
                ...state.inboundMessages,
              ],
            })
            return { ok: false, errorKey }
          }
          if (order.status !== 'PENDING_RECEIVE' || order.items.some((l) => l.receivedQty > 0 || l.rejectedQty > 0)) {
            return rejectChange('inbound.changeBlocked')
          }
          if (
            items.length === 0 ||
            new Set(items.map((i) => i.skuCode)).size !== items.length ||
            items.some((i) => !Number.isInteger(i.plannedQty) || i.plannedQty <= 0)
          ) {
            return rejectChange('inbound.changeInvalid')
          }
          for (const item of items) {
            const master = state.skuMasters.find((m) => m.customerId === order.customerId && m.code === item.skuCode)
            if (!master || master.status !== 'ENABLED') return rejectChange('inbound.changeSkuInvalid')
          }
          const ts = nowIso()
          const next: InboundOrder = recomputeInboundOrder({
            ...order,
            items: items.map((item, i) => ({
              lineNo: i + 1,
              skuCode: item.skuCode,
              plannedQty: item.plannedQty,
              receivedQty: 0,
              rejectedQty: 0,
              goodQty: 0,
              defectQty: 0,
              putawayQty: 0,
              status: 'PENDING_RECEIVE',
            })),
            updatedAt: ts,
          })
          set({
            inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? next : o)),
            inboundMessages: [
              inboundMessage('CHANGE', order.upstreamNo, version, 'ACCEPTED', inboundNo),
              ...state.inboundMessages,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_MOCK_CHANGE',
              operator: currentOperator(),
              detail: `${items.length} lines`,
            }),
          })
          return { ok: true }
        },

        mockCancelInboundInstruction: ({ inboundNo, messageId, version = 1, reason }) => {
          const state = get()
          const order = state.inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          const prior = messageId ? state.inboundMessages.find((m) => m.id === messageId) : undefined
          if (prior) return prior.status === 'ACCEPTED' ? { ok: true } : { ok: false, errorKey: prior.errorKey ?? 'inbound.cancelBlocked' }
          const received = order.items.reduce((n, l) => n + l.receivedQty, 0)
          if (received > 0) {
            set({
              inboundMessages: [
                inboundMessage('CANCEL', order.upstreamNo, version, 'REJECTED', inboundNo, 'inbound.cancelBlocked'),
                ...state.inboundMessages,
              ],
            })
            return { ok: false, errorKey: 'inbound.cancelBlocked' }
          }
          const ts = nowIso()
          const next = recomputeInboundOrder({
            ...order,
            status: 'CANCELLED',
            updatedAt: ts,
            remark: reason?.trim() || order.remark,
          })
          set({
            inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? next : o)),
            inboundMessages: [
              inboundMessage('CANCEL', order.upstreamNo, version, 'ACCEPTED', inboundNo),
              ...state.inboundMessages,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_MOCK_CANCEL',
              operator: currentOperator(),
              detail: reason,
            }),
          })
          return { ok: true }
        },

        retryInboundResult: (inboundNo) => {
          const state = get()
          const result = state.inboundResults.find((r) => r.inboundNo === inboundNo)
          if (!result) return { ok: false, errorKey: 'inbound.resultNotFound' }
          set({
            inboundResults: state.inboundResults.map((r) =>
              r.inboundNo === inboundNo ? { ...r, status: 'SENT', attempts: r.attempts + 1, at: nowIso() } : r,
            ),
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_RESULT_RETRY',
              operator: currentOperator(),
            }),
          })
          return { ok: true }
        },

        receiveReturn: ({ returnNo, containerNo, lines, operator }) => {
          const result = applyReturnReceipt(get(), { returnNo, containerNo, lines, operator })
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'RETURN',
              refNo: returnNo,
              action: 'RETURN_RECEIVE',
              operator,
              detail: `${lines.length} lines`,
            }),
          })
          finalizeReturnResults()
          return { ok: true }
        },

        mockReturnForecast: (input) => {
          const state = get()
          if (!input.upstreamNo.trim()) return { ok: false, errorKey: 'return.error.upstreamRequired' }
          if (!Number.isInteger(input.plannedQty) || input.plannedQty <= 0) {
            return { ok: false, errorKey: 'return.error.qtyInvalid' }
          }
          if (input.sourceType === 'DELIVERY_FAILED' && !input.originalOutboundNo?.trim()) {
            return { ok: false, errorKey: 'return.error.originalOutboundRequired' }
          }
          const customer = state.customerMasters.find((c) => c.id === input.customerId && c.status === 'ENABLED')
          const sku = customer
            ? state.skuMasters.find((m) => m.customerId === input.customerId && m.code === input.skuCode && m.status === 'ENABLED')
            : undefined
          if (!customer || !sku) return { ok: false, errorKey: 'return.error.skuInvalid' }
          const dup = state.returnOrders.find(
            (o) => o.sourceType === input.sourceType && o.upstreamNo === input.upstreamNo.trim(),
          )
          if (dup) return { ok: true, returnNo: dup.returnNo }
          const at = nowIso()
          const returnNo = nextDocNo('RT', state.returnOrders.map((o) => o.returnNo), at)
          const order: ReturnOrder = recomputeReturnOrder({
            returnNo,
            warehouseCode: input.warehouseCode,
            customerId: input.customerId,
            sourceType: input.sourceType,
            upstreamNo: input.upstreamNo.trim(),
            trackingNo: input.trackingNo?.trim() || undefined,
            originalOutboundNo: input.originalOutboundNo?.trim() || undefined,
            status: 'PENDING_RECEIVE',
            items: [
              {
                lineNo: 1,
                skuCode: input.skuCode,
                plannedQty: input.plannedQty,
                receivedQty: 0,
                goodQty: 0,
                defectQty: 0,
                rejectedQty: 0,
                putawayQty: 0,
                status: 'PENDING_RECEIVE',
              },
            ],
            createdAt: at,
            updatedAt: at,
          })
          set({
            returnOrders: [order, ...state.returnOrders],
            auditLogs: appendAudit({
              refType: 'RETURN',
              refNo: returnNo,
              action: 'RETURN_MOCK_FORECAST',
              operator: currentOperator(),
              detail: input.upstreamNo,
            }),
          })
          return { ok: true, returnNo }
        },

        cancelReturnOrder: (returnNo, reason) => {
          const state = get()
          const order = state.returnOrders.find((o) => o.returnNo === returnNo)
          if (!order) return { ok: false, errorKey: 'return.error.notFound' }
          if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
            return { ok: false, errorKey: 'return.error.cancelBlocked' }
          }
          if (order.items.some((l) => l.receivedQty > 0)) {
            return { ok: false, errorKey: 'return.error.cancelBlocked' }
          }
          const at = nowIso()
          const next = recomputeReturnOrder({
            ...order,
            status: 'CANCELLED',
            cancelledAt: at,
            cancelReason: reason?.trim() || undefined,
            updatedAt: at,
          })
          set({
            returnOrders: state.returnOrders.map((o) => (o.returnNo === returnNo ? next : o)),
            auditLogs: appendAudit({
              refType: 'RETURN',
              refNo: returnNo,
              action: 'RETURN_CANCEL',
              operator: currentOperator(),
              detail: reason,
            }),
          })
          return { ok: true }
        },

        submitReceipt: ({ inboundNo, containers, operator }) => {
          const result = applyReceipt(get(), { inboundNo, containers, operator })
          if (!result.ok) return result
          const boxes = containers.filter((c) => c.lines.length > 0)
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_RECEIVE',
              operator,
              detail: `${boxes.map((c) => (c.bulkPiece ? 'bulk' : c.containerNo)).join(', ')} · ${boxes.reduce((s, c) => s + c.lines.length, 0)} lines`,
            }),
          })
          finalizeInboundResults()
          return { ok: true }
        },

        submitContainerReceipt: ({ inboundNo, containerNo, bulkPiece, lines, operator }) => {
          const state = get()
          const result = applyContainerReceipt(state, { inboundNo, containerNo, bulkPiece, lines, operator })
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_RECEIVE',
              operator,
              detail: `container ${containerNo ?? 'bulk'} · ${lines.length} lines`,
            }),
          })
          finalizeInboundResults()
          return { ok: true }
        },

        savePutawayLine: ({ putawayNo, locationCode, planLineNo, qty, serialNos, operator }) => {
          const result = applySavePutawayLine(get(), { putawayNo, locationCode, planLineNo, qty, serialNos })
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'PUTAWAY',
              refNo: putawayNo,
              action: 'PUTAWAY_SAVE',
              operator,
              detail: `#${planLineNo} ×${qty} → ${locationCode.toUpperCase()}`,
            }),
          })
          return { ok: true }
        },

        removePutawayLine: ({ putawayNo, actualLineNo, operator }) => {
          const result = applyRemovePutawayLine(get(), { putawayNo, actualLineNo })
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'PUTAWAY',
              refNo: putawayNo,
              action: 'PUTAWAY_REMOVE',
              operator,
              detail: `#${result.removed!.planLineNo} @ ${result.removed!.locationCode}`,
            }),
          })
          return { ok: true }
        },

        submitPutawayOrder: ({ putawayNo, operator }) => {
          const result = applySubmitPutawayOrder(get(), { putawayNo, operator })
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'PUTAWAY',
              refNo: putawayNo,
              action: 'PUTAWAY',
              operator,
              detail: `${result.order!.actualLines.length} lines`,
            }),
          })
          finalizeInboundResults()
          finalizeReturnResults()
          return { ok: true }
        },

        confirmPutawayEntry: ({ putawayNo, placements, operator }) => {
          const result = applyConfirmPutawayEntry(get(), { putawayNo, placements, operator })
          if (!result.ok) return result
          /** 日志与分开操作时一致：每条落位一条保存，最后一条提交（新的在前） */
          const saves = placements.map((p) =>
            auditLog({
              refType: 'PUTAWAY',
              refNo: putawayNo,
              action: 'PUTAWAY_SAVE',
              operator,
              detail: `#${p.planLineNo} ×${p.qty} → ${p.locationCode.toUpperCase()}`,
            }),
          )
          const submit = auditLog({
            refType: 'PUTAWAY',
            refNo: putawayNo,
            action: 'PUTAWAY',
            operator,
            detail: `${result.order!.actualLines.length} lines`,
          })
          set({ ...result.patch, auditLogs: [submit, ...saves.reverse(), ...get().auditLogs] })
          finalizeInboundResults()
          finalizeReturnResults()
          return { ok: true }
        },

        submitNewSkuMeasure: (input) => {
          const result = applySubmitNewSkuMeasure(get(), input)
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: result.record.recordNo,
              action: 'NEW_SKU_MEASURE',
              operator: input.operator,
              detail: `${result.record.skuCode} · ${result.record.lengthCm}×${result.record.widthCm}×${result.record.heightCm} cm · ${result.record.grossWeightKg} kg`,
            }),
          })
          return { ok: true, record: result.record }
        },

        registerUnclaimed: (input) => {
          const result = applyRegisterUnclaimed(get(), input)
          if (!result.ok) return result
          set({
            ...result.patch,
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: result.record.registerNo,
              action: 'UNCLAIMED_REGISTER',
              operator: input.operator,
              detail: `${result.record.cartonQty} cartons · ${result.record.trackingNos.length + result.record.cartonMarks.length} clues`,
            }),
          })
          return { ok: true, record: result.record }
        },
      }
    },
    {
      name: 'qs-wms-demo-db',
      // 修改 seed.ts 或数据结构后把版本号 +1，浏览器里的旧演示数据会被替换为新种子
      /** 32：IB 单号、四仓主数据/作业同步、收货批次与 SN、退货单/上游消息 */
      version: 32,
      migrate: (_persisted: unknown, fromVersion: number) => {
        if (fromVersion < 32) return createSeedData() as unknown as typeof _persisted
        return _persisted
      },
      partialize: (s) => ({
        outboundOrders: s.outboundOrders,
        outboundWaves: s.outboundWaves,
        outboundPickTasks: s.outboundPickTasks,
        outboundVerifications: s.outboundVerifications,
        outboundPutbacks: s.outboundPutbacks,
        outboundHandovers: s.outboundHandovers,
        skuAllocationControls: s.skuAllocationControls,
        outboundMessages: s.outboundMessages,
        outboundResults: s.outboundResults,
        inventoryCounts: s.inventoryCounts,
        stockMoves: s.stockMoves,
        warehouses: s.warehouses,
        warehouseMasters: s.warehouseMasters,
        zoneMasters: s.zoneMasters,
        locationMasters: s.locationMasters,
        carrierMasters: s.carrierMasters,
        channelMasters: s.channelMasters,
        customerMasters: s.customerMasters,
        customers: s.customers,
        skus: s.skus,
        skuMasters: s.skuMasters,
        skuBarcodes: s.skuBarcodes,
        locations: s.locations,
        inbounds: s.inbounds,
        receiptRecords: s.receiptRecords,
        putawayOrders: s.putawayOrders,
        inboundExceptions: s.inboundExceptions,
        inboundMessages: s.inboundMessages,
        inboundResults: s.inboundResults,
        returnOrders: s.returnOrders,
        returnReceipts: s.returnReceipts,
        returnExceptions: s.returnExceptions,
        returnResults: s.returnResults,
        newSkuRecords: s.newSkuRecords,
        unclaimedRecords: s.unclaimedRecords,
        inventory: s.inventory,
        inventoryLogs: s.inventoryLogs,
        auditLogs: s.auditLogs,
      }),
    },
  ),
)

/** 常用查找：用于表格渲染时把 ID 转成名称 */
/** 商品主数据（含基础资料新模型）转成展示用 Sku；仓内规格字段缺失时按 0 兜底 */
function skuFromMaster(m: SkuMaster): Sku {
  return {
    code: m.code,
    customerId: m.customerId,
    name: m.name,
    barcode: m.primaryBarcode ?? '',
    weightG: Math.round((m.grossWeightKg ?? 0) * 1000),
    lengthCm: m.lengthCm ?? 0,
    widthCm: m.widthCm ?? 0,
    heightCm: m.heightCm ?? 0,
    declaredValue: { amount: 0, currency: 'USD' },
  }
}

export const useLookups = () => {
  const customers = useDb((s) => s.customers)
  const skus = useDb((s) => s.skus)
  const skuMasters = useDb((s) => s.skuMasters)
  return useMemo(() => {
    const customerMap = new Map(customers.map((c) => [c.id, c]))
    const key = (customerId: string, code: string) => `${customerId}::${code}`
    const skuMap = new Map(skus.map((s) => [key(s.customerId, s.code), s]))
    /**
     * 商品编码只在货主内唯一；作业对象都带货主，展示/扫码必须按货主取值。
     * 商品资料是主数据真源，同名 key 覆盖旧 Sku 投影的名称、条码和尺重。
     */
    skuMasters.forEach((m) => {
      const existing = skuMap.get(key(m.customerId, m.code))
      const projected = existing ?? skuFromMaster(m)
      skuMap.set(key(m.customerId, m.code), {
        ...projected,
        name: m.name,
        barcode: m.primaryBarcode ?? projected.barcode,
        ...(m.grossWeightKg != null ? { weightG: Math.round(m.grossWeightKg * 1000) } : {}),
        ...(m.lengthCm != null ? { lengthCm: m.lengthCm } : {}),
        ...(m.widthCm != null ? { widthCm: m.widthCm } : {}),
        ...(m.heightCm != null ? { heightCm: m.heightCm } : {}),
      })
    })
    /** 兼容只传编码的旧调用；同一编码跨货主时不返回名称，避免显示成另一个货主的商品 */
    const byCode = new Map<string, Sku>()
    const ambiguous = new Set<string>()
    skuMap.forEach((s) => {
      const existing = byCode.get(s.code)
      if (existing && existing.customerId !== s.customerId) ambiguous.add(s.code)
      else if (!existing) byCode.set(s.code, s)
    })
    ambiguous.forEach((code) => byCode.delete(code))
    const sku = (code: string, customerId?: string) =>
      (customerId ? skuMap.get(key(customerId, code)) : undefined) ?? byCode.get(code)
    return {
      customerName: (id: string) => customerMap.get(id)?.name ?? id,
      customerCode: (id: string) => customerMap.get(id)?.code ?? id,
      sku,
      skuByOwner: (customerId: string, code: string) => sku(code, customerId),
    }
  }, [customers, skus, skuMasters])
}
