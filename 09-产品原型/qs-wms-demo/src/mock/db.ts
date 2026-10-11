import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { carrierHasEnabledChannels } from '@/lib/carrier-master'
import { channelHasOpenReferences } from '@/lib/channel-master'
import { isLocationOccupied } from '@/lib/location-master'
import {
  cannotDisableTrace,
  findSkuMaster,
  hasOpenSkuWork,
  hasSkuStock,
} from '@/lib/sku-master'
import { blockingLocationCodes } from '@/lib/zone-master'
import { customerHasInventory } from '@/lib/customer-master'
import type {
  AuditLog,
  CarrierMaster,
  ChannelMaster,
  CustomerMaster,
  InboundOrder,
  InventoryLogType,
  LocationMaster,
  PutawayTask,
  SkuMaster,
  UsageStatus,
  WarehouseMaster,
  ZoneMaster,
} from '@/types/wms'
import { createSeedData, type SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string }

interface DbActions {
  resetDemo: () => void
  signInbound: (inboundNo: string) => ActionResult
  cancelInbound: (inboundNo: string) => ActionResult
  receiveInboundItem: (input: {
    inboundNo: string
    skuCode: string
    goodQty: number
    defectQty: number
    operator: string
  }) => ActionResult
  putaway: (input: { putawayNo: string; locationCode: string; qty: number; operator: string }) => ActionResult
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
      Omit<LocationMaster, 'warehouseCode' | 'code' | 'zoneType' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
    >,
  ) => ActionResult
  setLocationMasterStatus: (warehouseCode: string, code: string, status: UsageStatus) => ActionResult
  createZoneMaster: (
    input: Omit<ZoneMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
  ) => ActionResult
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
        'id' | 'code' | 'ownerType' | 'upstreamOwnerId' | 'lastSyncAt' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
      >
    >,
  ) => ActionResult
  setCustomerMasterStatus: (code: string, status: UsageStatus) => ActionResult
  updateSkuMaster: (
    ownerCode: string,
    code: string,
    patch: Partial<
      Omit<SkuMaster, 'ownerCode' | 'code' | 'customerId' | 'upstreamSkuId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
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

function resolveInboundStatus(order: InboundOrder): InboundOrder['status'] {
  const planned = order.items.reduce((s, i) => s + i.plannedQty, 0)
  const received = order.items.reduce((s, i) => s + i.receivedGoodQty + i.receivedDefectQty, 0)
  const good = order.items.reduce((s, i) => s + i.receivedGoodQty, 0)
  const putaway = order.items.reduce((s, i) => s + i.putawayQty, 0)
  if (received >= planned && putaway >= good) return 'COMPLETED'
  if (putaway > 0) return 'PARTIAL_PUT'
  return 'RECEIVING'
}

export const useDb = create<DbState>()(
  persist(
    (set, get) => {
      const log = (entry: {
        warehouseCode: string
        type: InventoryLogType
        refNo: string
        skuCode: string
        customerId: string
        locationCode: string
        qtyChange: number
        operator: string
      }) => ({ id: uid('LOG'), createdAt: nowIso(), ...entry })

      const auditLog = (entry: Omit<AuditLog, 'id' | 'createdAt'>) => ({
        id: uid('AUD'),
        createdAt: nowIso(),
        ...entry,
      })

      const appendAudit = (entry: Omit<AuditLog, 'id' | 'createdAt'>) => [auditLog(entry), ...get().auditLogs]

      return {
        ...createSeedData(),

        resetDemo: () => {
          const seed = createSeedData()
          set({
            ...seed,
            auditLogs: [
              auditLog({
                refType: 'SYSTEM',
                refNo: '-',
                action: 'DEMO_RESET',
                operator: 'admin',
              }),
              ...seed.auditLogs,
            ],
          })
        },

        signInbound: (inboundNo) => {
          const order = get().inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          if (order.status !== 'PENDING') return { ok: false, errorKey: 'error.statusNotAllowed' }
          set({
            inbounds: get().inbounds.map((o) =>
              o.inboundNo === inboundNo ? { ...o, status: 'ARRIVED', updatedAt: nowIso() } : o,
            ),
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_SIGN',
              operator: 'admin',
            }),
          })
          return { ok: true }
        },

        cancelInbound: (inboundNo) => {
          const order = get().inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          if (order.status !== 'PENDING') return { ok: false, errorKey: 'error.statusNotAllowed' }
          set({
            inbounds: get().inbounds.map((o) =>
              o.inboundNo === inboundNo ? { ...o, status: 'CANCELLED', updatedAt: nowIso() } : o,
            ),
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_CANCEL',
              operator: 'admin',
            }),
          })
          return { ok: true }
        },

        receiveInboundItem: ({ inboundNo, skuCode, goodQty, defectQty, operator }) => {
          const state = get()
          const order = state.inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          if (!['PENDING', 'ARRIVED', 'RECEIVING', 'PARTIAL_PUT'].includes(order.status))
            return { ok: false, errorKey: 'error.statusNotAllowed' }
          const item = order.items.find((i) => i.skuCode === skuCode)
          if (!item) return { ok: false, errorKey: 'error.skuNotInOrder' }
          if (goodQty + defectQty <= 0) return { ok: false, errorKey: 'error.qtyInvalid' }

          const updatedOrder: InboundOrder = {
            ...order,
            updatedAt: nowIso(),
            items: order.items.map((i) =>
              i.skuCode === skuCode
                ? {
                    ...i,
                    receivedGoodQty: i.receivedGoodQty + goodQty,
                    receivedDefectQty: i.receivedDefectQty + defectQty,
                  }
                : i,
            ),
          }
          updatedOrder.status = resolveInboundStatus(updatedOrder)

          // 推荐货位：优先同 SKU 已有库存的货位，其次同仓第一个空货位
          const existing = state.inventory.find(
            (r) => r.warehouseCode === order.warehouseCode && r.skuCode === skuCode && r.qualityType === 'GOOD',
          )
          const occupied = new Set(state.inventory.filter((r) => r.warehouseCode === order.warehouseCode).map((r) => r.locationCode))
          const empty = state.locations.find(
            (l) => l.warehouseCode === order.warehouseCode && l.type !== 'STAGING' && l.type !== 'DEFECT' && !occupied.has(l.code),
          )
          const suggested = existing?.locationCode ?? empty?.code ?? 'B-01-01'

          let tasks: PutawayTask[] = state.putawayTasks
          if (goodQty > 0) {
            const open = tasks.find(
              (t) => t.inboundNo === inboundNo && t.skuCode === skuCode && t.status !== 'COMPLETED',
            )
            if (open) {
              tasks = tasks.map((t) => (t === open ? { ...t, planQty: t.planQty + goodQty } : t))
            } else {
              tasks = [...tasks]
              tasks.unshift({
                putawayNo: `PUT${Date.now().toString().slice(-10)}`,
                inboundNo,
                warehouseCode: order.warehouseCode,
                customerId: order.customerId,
                skuCode,
                qualityType: 'GOOD',
                planQty: goodQty,
                actualQty: 0,
                sourceLocationCode: 'STAGE-IN-01',
                suggestedLocationCode: suggested,
                status: 'PENDING',
                createdAt: nowIso(),
              })
            }
          }

          const inventory = [...state.inventory]
          if (defectQty > 0) {
            inventory.push({
              id: uid('INV'),
              warehouseCode: order.warehouseCode,
              locationCode: 'DEFECT-01',
              customerId: order.customerId,
              skuCode,
              qualityType: 'DEFECTIVE',
              onHandQty: defectQty,
              lockedQty: 0,
              firstInboundAt: nowIso(),
            })
          }

          set({
            inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? updatedOrder : o)),
            putawayTasks: tasks,
            inventory,
            inventoryLogs: [
              log({
                warehouseCode: order.warehouseCode,
                type: 'RECEIVE',
                refNo: inboundNo,
                skuCode,
                customerId: order.customerId,
                locationCode: 'STAGE-IN-01',
                qtyChange: goodQty + defectQty,
                operator,
              }),
              ...state.inventoryLogs,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_RECEIVE',
              operator,
              detail: `${skuCode} +${goodQty}${defectQty > 0 ? ` / defect +${defectQty}` : ''}`,
            }),
          })
          return { ok: true }
        },

        putaway: ({ putawayNo, locationCode, qty, operator }) => {
          const state = get()
          const task = state.putawayTasks.find((t) => t.putawayNo === putawayNo)
          if (!task) return { ok: false, errorKey: 'error.taskNotFound' }
          const location = state.locations.find((l) => l.warehouseCode === task.warehouseCode && l.code === locationCode)
          if (!location) return { ok: false, errorKey: 'error.locationNotFound' }
          const remain = task.planQty - task.actualQty
          if (qty <= 0 || qty > remain) return { ok: false, errorKey: 'error.qtyInvalid' }

          const actualQty = task.actualQty + qty
          const updatedTask: PutawayTask = {
            ...task,
            actualQty,
            actualLocationCode: locationCode,
            status: actualQty >= task.planQty ? 'COMPLETED' : 'DOING',
            completedAt: actualQty >= task.planQty ? nowIso() : undefined,
          }

          const inventory = [...state.inventory]
          const idx = inventory.findIndex(
            (r) =>
              r.warehouseCode === task.warehouseCode &&
              r.locationCode === locationCode &&
              r.skuCode === task.skuCode &&
              r.qualityType === task.qualityType,
          )
          if (idx >= 0) {
            inventory[idx] = { ...inventory[idx], onHandQty: inventory[idx].onHandQty + qty }
          } else {
            inventory.unshift({
              id: uid('INV'),
              warehouseCode: task.warehouseCode,
              locationCode,
              customerId: task.customerId,
              skuCode: task.skuCode,
              qualityType: task.qualityType,
              onHandQty: qty,
              lockedQty: 0,
              firstInboundAt: nowIso(),
            })
          }

          const inbounds = state.inbounds.map((o) => {
            if (o.inboundNo !== task.inboundNo) return o
            const next: InboundOrder = {
              ...o,
              updatedAt: nowIso(),
              items: o.items.map((i) => (i.skuCode === task.skuCode ? { ...i, putawayQty: i.putawayQty + qty } : i)),
            }
            next.status = resolveInboundStatus(next)
            return next
          })

          set({
            putawayTasks: state.putawayTasks.map((t) => (t.putawayNo === putawayNo ? updatedTask : t)),
            inventory,
            inbounds,
            inventoryLogs: [
              log({
                warehouseCode: task.warehouseCode,
                type: 'PUTAWAY',
                refNo: task.inboundNo,
                skuCode: task.skuCode,
                customerId: task.customerId,
                locationCode,
                qtyChange: qty,
                operator,
              }),
              ...state.inventoryLogs,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: task.inboundNo,
              action: 'PUTAWAY',
              operator,
              detail: `${task.skuCode} ×${qty} → ${locationCode}`,
            }),
          })
          return { ok: true }
        },

        updateWarehouseMaster: (code, patch) => {
          const idx = get().warehouseMasters.findIndex((w) => w.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterWarehouse.notFound' }
          const prev = get().warehouseMasters[idx]
          const next: WarehouseMaster = {
            ...prev,
            ...patch,
            code: prev.code,
            createdAt: prev.createdAt,
            createdBy: prev.createdBy,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().warehouseMasters]
          list[idx] = next
          set({ warehouseMasters: list })
          return { ok: true }
        },

        createWarehouseMaster: (input) => {
          const code = input.code.trim()
          if (get().warehouseMasters.some((w) => w.code === code)) {
            return { ok: false, errorKey: 'masterWarehouse.error.duplicateCode' }
          }
          const now = nowIso()
          const row: WarehouseMaster = {
            ...input,
            code,
            status: input.status ?? 'ENABLED',
            createdAt: now,
            createdBy: 'admin',
            updatedAt: now,
            updatedBy: 'admin',
          }
          set({
            warehouseMasters: [...get().warehouseMasters, row].sort((a, b) => a.code.localeCompare(b.code)),
          })
          return { ok: true }
        },

        setWarehouseMasterStatus: (code, status) => {
          const idx = get().warehouseMasters.findIndex((w) => w.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterWarehouse.notFound' }
          const prev = get().warehouseMasters[idx]
          if (prev.status === status) return { ok: true }
          const next: WarehouseMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().warehouseMasters]
          list[idx] = next
          set({ warehouseMasters: list })
          return { ok: true }
        },

        createLocationMaster: (input) => {
          const warehouseCode = input.warehouseCode.trim()
          const code = input.code.trim()
          const zone = get().zoneMasters.find(
            (z) => z.code === input.zoneCode && z.warehouseCode === warehouseCode,
          )
          if (!zone || zone.status !== 'ENABLED') {
            return { ok: false, errorKey: 'masterLocation.error.invalidZone' }
          }
          if (get().locationMasters.some((l) => l.warehouseCode === warehouseCode && l.code === code)) {
            return { ok: false, errorKey: 'masterLocation.error.duplicateCode' }
          }
          const now = nowIso()
          const row: LocationMaster = {
            ...input,
            warehouseCode,
            code,
            zoneCode: zone.code,
            zoneType: zone.zoneType,
            productForms: input.productForms ?? [],
            createdAt: now,
            createdBy: 'admin',
            updatedAt: now,
            updatedBy: 'admin',
          }
          set({
            locationMasters: [...get().locationMasters, row].sort((a, b) =>
              b.updatedAt.localeCompare(a.updatedAt),
            ),
          })
          return { ok: true }
        },

        updateLocationMaster: (warehouseCode, code, patch) => {
          const idx = get().locationMasters.findIndex(
            (l) => l.warehouseCode === warehouseCode && l.code === code,
          )
          if (idx < 0) return { ok: false, errorKey: 'masterLocation.notFound' }
          const prev = get().locationMasters[idx]
          const occupied = isLocationOccupied(prev, get().inventory)
          let nextZoneCode = prev.zoneCode
          let nextZoneType = prev.zoneType
          if (patch.zoneCode && patch.zoneCode !== prev.zoneCode) {
            if (occupied) return { ok: false, errorKey: 'masterLocation.error.occupiedChangeZone' }
            const zone = get().zoneMasters.find(
              (z) => z.code === patch.zoneCode && z.warehouseCode === warehouseCode,
            )
            if (!zone || zone.status !== 'ENABLED') {
              return { ok: false, errorKey: 'masterLocation.error.invalidZone' }
            }
            nextZoneCode = zone.code
            nextZoneType = zone.zoneType
          }
          const next: LocationMaster = {
            ...prev,
            ...patch,
            warehouseCode: prev.warehouseCode,
            code: prev.code,
            zoneCode: nextZoneCode,
            zoneType: nextZoneType,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().locationMasters]
          list[idx] = next
          set({ locationMasters: list })
          return { ok: true }
        },

        setLocationMasterStatus: (warehouseCode, code, status) => {
          const idx = get().locationMasters.findIndex(
            (l) => l.warehouseCode === warehouseCode && l.code === code,
          )
          if (idx < 0) return { ok: false, errorKey: 'masterLocation.notFound' }
          const prev = get().locationMasters[idx]
          if (prev.status === status) return { ok: true }
          if (status === 'DISABLED' && isLocationOccupied(prev, get().inventory)) {
            return { ok: false, errorKey: 'masterLocation.error.disableOccupied' }
          }
          const next: LocationMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().locationMasters]
          list[idx] = next
          set({ locationMasters: list })
          return { ok: true }
        },

        createZoneMaster: (input) => {
          const warehouseCode = input.warehouseCode.trim()
          const code = input.code.trim()
          const wh = get().warehouseMasters.find((w) => w.code === warehouseCode)
          if (!wh || wh.status !== 'ENABLED') {
            return { ok: false, errorKey: 'masterZone.error.invalidWarehouse' }
          }
          if (get().zoneMasters.some((z) => z.warehouseCode === warehouseCode && z.code === code)) {
            return { ok: false, errorKey: 'masterZone.error.duplicateCode' }
          }
          const now = nowIso()
          const row: ZoneMaster = {
            ...input,
            warehouseCode,
            code,
            status: input.status ?? 'ENABLED',
            remark: input.remark?.trim() || undefined,
            createdAt: now,
            createdBy: 'admin',
            updatedAt: now,
            updatedBy: 'admin',
          }
          set({
            zoneMasters: [...get().zoneMasters, row].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
          })
          return { ok: true }
        },

        updateZoneMaster: (warehouseCode, code, patch) => {
          const idx = get().zoneMasters.findIndex((z) => z.warehouseCode === warehouseCode && z.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterZone.notFound' }
          const prev = get().zoneMasters[idx]
          const inventory = get().inventory
          const locations = get().locationMasters
          const blocked = blockingLocationCodes(prev, locations, inventory).length > 0

          if (patch.warehouseCode && patch.warehouseCode !== prev.warehouseCode) {
            if (blocked) return { ok: false, errorKey: 'masterZone.error.occupiedChangeWarehouse' }
            const wh = get().warehouseMasters.find((w) => w.code === patch.warehouseCode)
            if (!wh || wh.status !== 'ENABLED') {
              return { ok: false, errorKey: 'masterZone.error.invalidWarehouse' }
            }
          }

          const nextWarehouse = patch.warehouseCode?.trim() || prev.warehouseCode
          if (
            nextWarehouse !== prev.warehouseCode &&
            get().zoneMasters.some((z) => z.warehouseCode === nextWarehouse && z.code === code)
          ) {
            return { ok: false, errorKey: 'masterZone.error.duplicateCode' }
          }
          const nextType = patch.zoneType ?? prev.zoneType
          const next: ZoneMaster = {
            ...prev,
            ...patch,
            warehouseCode: nextWarehouse,
            code: prev.code,
            zoneType: nextType,
            remark: patch.remark !== undefined ? patch.remark?.trim() || undefined : prev.remark,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const zoneList = [...get().zoneMasters]
          zoneList[idx] = next

          let locationList = locations
          if (nextType !== prev.zoneType || nextWarehouse !== prev.warehouseCode) {
            locationList = locations.map((l) => {
              if (l.warehouseCode !== prev.warehouseCode || l.zoneCode !== prev.code) return l
              return {
                ...l,
                warehouseCode: nextWarehouse,
                zoneType: nextType,
                updatedAt: nowIso(),
                updatedBy: 'admin',
              }
            })
          }

          set({ zoneMasters: zoneList, locationMasters: locationList })
          return { ok: true }
        },

        setZoneMasterStatus: (warehouseCode, code, status) => {
          const idx = get().zoneMasters.findIndex((z) => z.warehouseCode === warehouseCode && z.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterZone.notFound' }
          const prev = get().zoneMasters[idx]
          if (prev.status === status) return { ok: true }
          if (status === 'DISABLED') {
            const codes = blockingLocationCodes(prev, get().locationMasters, get().inventory)
            if (codes.length > 0) return { ok: false, errorKey: 'masterZone.error.disableOccupied' }
          }
          const next: ZoneMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().zoneMasters]
          list[idx] = next
          set({ zoneMasters: list })
          return { ok: true }
        },

        updateCustomerMaster: (code, patch) => {
          const idx = get().customerMasters.findIndex((c) => c.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterCustomer.notFound' }
          const prev = get().customerMasters[idx]
          const next: CustomerMaster = {
            ...prev,
            ...patch,
            name: patch.name?.trim() ?? prev.name,
            remark: patch.remark?.trim() || undefined,
            contactEmail: patch.contactEmail?.trim() || undefined,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const masters = [...get().customerMasters]
          masters[idx] = next
          const customers = get().customers.map((c) =>
            c.id === next.id ? { ...c, name: next.name } : c,
          )
          set({ customerMasters: masters, customers })
          return { ok: true }
        },

        setCustomerMasterStatus: (code, status) => {
          const idx = get().customerMasters.findIndex((c) => c.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterCustomer.notFound' }
          const prev = get().customerMasters[idx]
          if (prev.status === status) return { ok: true }
          if (prev.ownerType === 'SELF' && status === 'DISABLED') {
            return { ok: false, errorKey: 'masterCustomer.error.disableSelf' }
          }
          if (status === 'DISABLED' && customerHasInventory(prev, get().inventory)) {
            return { ok: false, errorKey: 'masterCustomer.error.disableOccupied' }
          }
          const next: CustomerMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const masters = [...get().customerMasters]
          masters[idx] = next
          set({ customerMasters: masters })
          return { ok: true }
        },

        updateSkuMaster: (ownerCode, code, patch) => {
          const idx = get().skuMasters.findIndex((m) => m.ownerCode === ownerCode && m.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterSku.notFound' }
          const prev = get().skuMasters[idx]
          const state = get()
          if (cannotDisableTrace(prev, patch, prev.customerId, state.inventory)) {
            return { ok: false, errorKey: 'masterSku.error.traceLocked' }
          }
          const next: SkuMaster = {
            ...prev,
            ...patch,
            ownerCode: prev.ownerCode,
            code: prev.code,
            customerId: prev.customerId,
            upstreamSkuId: prev.upstreamSkuId,
            name: patch.name !== undefined ? patch.name.trim() : prev.name,
            nameEn: patch.nameEn !== undefined ? patch.nameEn?.trim() || undefined : prev.nameEn,
            spec: patch.spec !== undefined ? patch.spec?.trim() || undefined : prev.spec,
            unit: patch.unit !== undefined ? patch.unit.trim() : prev.unit,
            remark: patch.remark !== undefined ? patch.remark?.trim() || undefined : prev.remark,
            snFormat: patch.snFormat !== undefined ? patch.snFormat?.trim() || undefined : prev.snFormat,
            qcFlowType: patch.qcFlowType !== undefined ? patch.qcFlowType?.trim() || undefined : prev.qcFlowType,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().skuMasters]
          list[idx] = next
          set({ skuMasters: list })
          return { ok: true }
        },

        setSkuMasterStatus: (ownerCode, code, status) => {
          const idx = get().skuMasters.findIndex((m) => m.ownerCode === ownerCode && m.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterSku.notFound' }
          const prev = get().skuMasters[idx]
          if (prev.status === status) return { ok: true }
          if (status === 'DISABLED') {
            const inv = get().inventory
            const inbounds = get().inbounds
            const tasks = get().putawayTasks
            if (
              hasSkuStock(inv, prev.customerId, prev.code) ||
              hasOpenSkuWork(inbounds, tasks, prev.customerId, prev.code)
            ) {
              return { ok: false, errorKey: 'masterSku.error.disableBlocked' }
            }
          }
          const next: SkuMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().skuMasters]
          list[idx] = next
          set({ skuMasters: list })
          return { ok: true }
        },

        saveSkuBarcode: (input) => {
          const master = findSkuMaster(get().skuMasters, input.ownerCode, input.skuCode)
          if (!master) return { ok: false, errorKey: 'masterSku.notFound' }
          const barcode = input.barcode.trim()
          if (!barcode) return { ok: false, errorKey: 'masterSku.error.required' }
          const all = get().skuBarcodes
          const dup = all.find((b) => b.barcode === barcode && b.id !== input.id)
          if (dup) return { ok: false, errorKey: 'masterSku.error.duplicateBarcode' }

          const now = nowIso()
          let barcodes = [...all]
          const idx = input.id ? barcodes.findIndex((b) => b.id === input.id) : -1

          if (idx >= 0) {
            const prev = barcodes[idx]
            barcodes[idx] = {
              ...prev,
              isPrimary: input.isPrimary,
              status: input.status,
              updatedAt: now,
            }
          } else {
            barcodes.push({
              id: uid('BC'),
              ownerCode: input.ownerCode,
              skuCode: input.skuCode,
              barcode,
              isPrimary: input.isPrimary,
              status: input.status,
              createdAt: now,
              updatedAt: now,
            })
          }

          if (input.isPrimary) {
            barcodes = barcodes.map((b) => {
              if (b.ownerCode === input.ownerCode && b.skuCode === input.skuCode) {
                return { ...b, isPrimary: b.barcode === barcode || (idx >= 0 && b.id === input.id) }
              }
              return b
            })
          }

          const primary =
            barcodes.find(
              (b) =>
                b.ownerCode === input.ownerCode &&
                b.skuCode === input.skuCode &&
                b.isPrimary &&
                b.status === 'ENABLED',
            )?.barcode ?? undefined

          const masters = get().skuMasters.map((m) => {
            if (m.ownerCode !== input.ownerCode || m.code !== input.skuCode) return m
            return {
              ...m,
              primaryBarcode: primary,
              updatedAt: now,
              updatedBy: 'admin',
            }
          })

          set({ skuBarcodes: barcodes, skuMasters: masters })
          return { ok: true }
        },

        setSkuBarcodeStatus: (id, status) => {
          const idx = get().skuBarcodes.findIndex((b) => b.id === id)
          if (idx < 0) return { ok: false, errorKey: 'masterSku.error.barcodeNotFound' }
          const prev = get().skuBarcodes[idx]
          const now = nowIso()
          const barcodes = [...get().skuBarcodes]
          barcodes[idx] = { ...prev, status, updatedAt: now }

          let masters = get().skuMasters
          if (prev.isPrimary) {
            const primary =
              barcodes.find(
                (b) =>
                  b.ownerCode === prev.ownerCode &&
                  b.skuCode === prev.skuCode &&
                  b.isPrimary &&
                  b.status === 'ENABLED',
              )?.barcode
            masters = masters.map((m) => {
              if (m.ownerCode !== prev.ownerCode || m.code !== prev.skuCode) return m
              return { ...m, primaryBarcode: primary, updatedAt: now, updatedBy: 'admin' }
            })
          }

          set({ skuBarcodes: barcodes, skuMasters: masters })
          return { ok: true }
        },

        createCarrierMaster: (input) => {
          const code = input.code.trim()
          if (get().carrierMasters.some((c) => c.code === code)) {
            return { ok: false, errorKey: 'masterCarrier.error.duplicateCode' }
          }
          const now = nowIso()
          const row: CarrierMaster = {
            ...input,
            code,
            status: input.status ?? 'ENABLED',
            createdAt: now,
            createdBy: 'admin',
            updatedAt: now,
            updatedBy: 'admin',
          }
          set({
            carrierMasters: [...get().carrierMasters, row].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
          })
          return { ok: true }
        },

        updateCarrierMaster: (code, patch) => {
          const idx = get().carrierMasters.findIndex((c) => c.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterCarrier.notFound' }
          const prev = get().carrierMasters[idx]
          const next: CarrierMaster = {
            ...prev,
            ...patch,
            code: prev.code,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().carrierMasters]
          list[idx] = next
          set({ carrierMasters: list })
          return { ok: true }
        },

        setCarrierMasterStatus: (code, status) => {
          const idx = get().carrierMasters.findIndex((c) => c.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterCarrier.notFound' }
          const prev = get().carrierMasters[idx]
          if (prev.status === status) return { ok: true }
          if (status === 'DISABLED' && carrierHasEnabledChannels(code, get().channelMasters)) {
            return { ok: false, errorKey: 'masterCarrier.error.disableHasEnabledChannels' }
          }
          const next: CarrierMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().carrierMasters]
          list[idx] = next
          set({ carrierMasters: list })
          return { ok: true }
        },

        createChannelMaster: (input) => {
          const code = input.code.trim()
          const carrier = get().carrierMasters.find((c) => c.code === input.carrierCode.trim())
          if (!carrier || carrier.status !== 'ENABLED') {
            return { ok: false, errorKey: 'masterChannel.error.invalidCarrier' }
          }
          if (get().channelMasters.some((ch) => ch.code === code)) {
            return { ok: false, errorKey: 'masterChannel.error.duplicateCode' }
          }
          const now = nowIso()
          const row: ChannelMaster = {
            ...input,
            code,
            carrierCode: input.carrierCode.trim(),
            status: input.status ?? 'ENABLED',
            createdAt: now,
            createdBy: 'admin',
            updatedAt: now,
            updatedBy: 'admin',
          }
          set({
            channelMasters: [...get().channelMasters, row].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
          })
          return { ok: true }
        },

        updateChannelMaster: (code, patch) => {
          const idx = get().channelMasters.findIndex((ch) => ch.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterChannel.notFound' }
          const prev = get().channelMasters[idx]
          const locked = channelHasOpenReferences(code, get().packages)
          let nextCarrier = prev.carrierCode
          if (patch.carrierCode && patch.carrierCode !== prev.carrierCode) {
            if (locked) return { ok: false, errorKey: 'masterChannel.error.carrierLocked' }
            const carrier = get().carrierMasters.find((c) => c.code === patch.carrierCode.trim())
            if (!carrier || carrier.status !== 'ENABLED') {
              return { ok: false, errorKey: 'masterChannel.error.invalidCarrier' }
            }
            nextCarrier = carrier.code
          }
          const next: ChannelMaster = {
            ...prev,
            ...patch,
            code: prev.code,
            carrierCode: nextCarrier,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().channelMasters]
          list[idx] = next
          set({ channelMasters: list })
          return { ok: true }
        },

        setChannelMasterStatus: (code, status) => {
          const idx = get().channelMasters.findIndex((ch) => ch.code === code)
          if (idx < 0) return { ok: false, errorKey: 'masterChannel.notFound' }
          const prev = get().channelMasters[idx]
          if (prev.status === status) return { ok: true }
          if (status === 'DISABLED' && channelHasOpenReferences(code, get().packages)) {
            return { ok: false, errorKey: 'masterChannel.error.disableReferenced' }
          }
          const next: ChannelMaster = {
            ...prev,
            status,
            updatedAt: nowIso(),
            updatedBy: 'admin',
          }
          const list = [...get().channelMasters]
          list[idx] = next
          set({ channelMasters: list })
          return { ok: true }
        },
      }
    },
    {
      name: 'qs-wms-demo-db',
      // 修改 seed.ts 或数据结构后把版本号 +1，浏览器里的旧演示数据会被替换为新种子
      version: 10,
      migrate: () => createSeedData(),
      partialize: (s) => ({
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
        putawayTasks: s.putawayTasks,
        inventory: s.inventory,
        inventoryLogs: s.inventoryLogs,
        packages: s.packages,
        auditLogs: s.auditLogs,
      }),
    },
  ),
)

/** 常用查找：用于表格渲染时把 ID 转成名称 */
export const useLookups = () => {
  const customers = useDb((s) => s.customers)
  const skus = useDb((s) => s.skus)
  return useMemo(() => {
    const customerMap = new Map(customers.map((c) => [c.id, c]))
    const skuMap = new Map(skus.map((s) => [s.code, s]))
    return {
      customerName: (id: string) => customerMap.get(id)?.name ?? id,
      customerCode: (id: string) => customerMap.get(id)?.code ?? id,
      sku: (code: string) => skuMap.get(code),
    }
  }, [customers, skus])
}
