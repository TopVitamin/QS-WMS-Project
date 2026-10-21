import { useMemo } from 'react'
import { create } from 'zustand'
import { applyOutboundAction, outboundAuditRef } from './outbound-actions'
import { applyInventoryAction, inventoryAuditRef, type InventoryTerminal } from './inventory-actions'
import type { InventoryCommand } from '@/types/inventory'
import type { OutboundCommand, OutboundRole } from '@/types/outbound'
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
import type { ContainerReceiptLineInput, NewSkuRecord, ReceiptContainerInput, UnclaimedRecord } from '@/types/inbound'
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
import { createSeedData, type SeedData } from './seed'
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
  skuCode: string
  plannedQty: number
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
  setOutboundRole: (role: OutboundRole) => void
  resetDemo: () => void
  confirmReceiptClose: (inboundNo: string, operator: string) => ActionResult
  mockPushInboundInstruction: (input: MockPushInboundInput) => ActionResult & { inboundNo?: string }
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
    'RK',
    inbounds.map((o) => o.inboundNo),
  )
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

      return {
        ...createSeedData(),
        ...createMasterActions(get, set),
        setOutboundRole: (outboundRole) => set({ outboundRole }),
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
          return { ok: true }
        },

        mockPushInboundInstruction: (input) => {
          const state = get()
          if (!input.customerId) return { ok: false, errorKey: 'inbound.mock.ownerRequired' }
          if (!input.upstreamNo.trim()) return { ok: false, errorKey: 'inbound.mock.upstreamRequired' }
          if (input.plannedQty <= 0) return { ok: false, errorKey: 'inbound.mock.qtyInvalid' }
          const owner = state.customerMasters.find((c) => c.id === input.customerId)
          const sku = owner ? findSkuMaster(state.skuMasters, owner.code, input.skuCode) : undefined
          if (!sku || sku.status !== 'ENABLED') return { ok: false, errorKey: 'inbound.mock.skuInvalid' }
          const dup = state.inbounds.some(
            (o) => o.customerId === input.customerId && o.upstreamNo === input.upstreamNo.trim(),
          )
          if (dup) return { ok: false, errorKey: 'inbound.mockDuplicateUpstream' }

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
            items: [
              {
                lineNo: 1,
                skuCode: input.skuCode,
                plannedQty: input.plannedQty,
                receivedQty: 0,
                rejectedQty: 0,
                goodQty: 0,
                defectQty: 0,
                putawayQty: 0,
                status: 'PENDING_RECEIVE',
              },
            ],
            createdAt: ts,
            updatedAt: ts,
          })
          set({
            inbounds: [order, ...state.inbounds],
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
      version: 31,
      migrate: (_persisted: unknown, fromVersion: number) => {
        if (fromVersion < 31) return createSeedData() as unknown as typeof _persisted
        return _persisted
      },
      merge: (persisted, current) => {
        const next = { ...current, ...(persisted as object) } as typeof current
        const seed = createSeedData()
        const inbounds = next.inbounds ?? []
        const legacy = inbounds.length > 0 && !inbounds.some((o) => o.inboundNo.startsWith('RK-'))
        if (inbounds.length === 0 || legacy) {
          next.inbounds = seed.inbounds
          next.receiptRecords = seed.receiptRecords
          next.putawayOrders = seed.putawayOrders
          next.inboundExceptions = seed.inboundExceptions
        } else {
          next.receiptRecords = next.receiptRecords ?? seed.receiptRecords
          next.putawayOrders = next.putawayOrders ?? seed.putawayOrders
          next.inboundExceptions = next.inboundExceptions ?? seed.inboundExceptions
        }
        return next
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
        outboundRole: s.outboundRole,
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
        newSkuRecords: s.newSkuRecords,
        unclaimedRecords: s.unclaimedRecords,
        inventory: s.inventory,
        inventoryLogs: s.inventoryLogs,
        packages: s.packages,
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
    const skuMap = new Map(skus.map((s) => [s.code, s]))
    // 演示商品（如 CABLE-01）只存在于商品资料 skuMasters，展示时兜底其中文名与主条码
    skuMasters.forEach((m) => {
      const existing = skuMap.get(m.code)
      if (!existing) {
        skuMap.set(m.code, skuFromMaster(m))
      } else if (!existing.barcode && m.primaryBarcode) {
        skuMap.set(m.code, { ...existing, barcode: m.primaryBarcode })
      }
    })
    return {
      customerName: (id: string) => customerMap.get(id)?.name ?? id,
      customerCode: (id: string) => customerMap.get(id)?.code ?? id,
      sku: (code: string) => skuMap.get(code),
    }
  }, [customers, skus, skuMasters])
}
