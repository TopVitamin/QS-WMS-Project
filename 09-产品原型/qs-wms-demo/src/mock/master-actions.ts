import type { DbState } from './db'
import { currentOperator } from './current-operator'
import { carrierHasEnabledChannels } from '@/lib/carrier-master'
import { channelHasOpenReferences } from '@/lib/channel-master'
import { customerHasInventory } from '@/lib/customer-master'
import { isLocationOccupied } from '@/lib/location-master'
import { cannotDisableTrace, findSkuMaster, hasOpenSkuWork, hasSkuStock } from '@/lib/sku-master'
import { blockingLocationCodes } from '@/lib/zone-master'
import type {
  CarrierMaster,
  ChannelMaster,
  CustomerMaster,
  LocationMaster,
  SkuMaster,
  WarehouseMaster,
  ZoneMaster,
} from '@/types/wms'

type MasterActions = Pick<
  DbState,
  | 'updateWarehouseMaster'
  | 'createWarehouseMaster'
  | 'setWarehouseMasterStatus'
  | 'createLocationMaster'
  | 'updateLocationMaster'
  | 'setLocationMasterStatus'
  | 'createZoneMaster'
  | 'updateZoneMaster'
  | 'setZoneMasterStatus'
  | 'updateCustomerMaster'
  | 'setCustomerMasterStatus'
  | 'updateSkuMaster'
  | 'setSkuMasterStatus'
  | 'saveSkuBarcode'
  | 'setSkuBarcodeStatus'
  | 'createCarrierMaster'
  | 'updateCarrierMaster'
  | 'setCarrierMasterStatus'
  | 'createChannelMaster'
  | 'updateChannelMaster'
  | 'setChannelMasterStatus'
>

const nowIso = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * 基础资料写入（仓库、库区、货位、货主、商品、承运商、渠道）。
 * 从 mock/db.ts 的 store 闭包里抽出来，store 只负责注入 get/set，主数据规则单独维护。
 */
export function createMasterActions(get: () => DbState, set: (patch: Partial<DbState>) => void): MasterActions {
  return {
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
        updatedBy: currentOperator(),
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
        createdBy: currentOperator(),
        updatedAt: now,
        updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
      }
      const list = [...get().warehouseMasters]
      list[idx] = next
      set({ warehouseMasters: list })
      return { ok: true }
    },

    createLocationMaster: (input) => {
      const warehouseCode = input.warehouseCode.trim()
      const code = input.code.trim()
      const zone = get().zoneMasters.find((z) => z.code === input.zoneCode && z.warehouseCode === warehouseCode)
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
        createdBy: currentOperator(),
        updatedAt: now,
        updatedBy: currentOperator(),
      }
      set({
        locationMasters: [...get().locationMasters, row].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      })
      return { ok: true }
    },

    updateLocationMaster: (warehouseCode, code, patch) => {
      const idx = get().locationMasters.findIndex((l) => l.warehouseCode === warehouseCode && l.code === code)
      if (idx < 0) return { ok: false, errorKey: 'masterLocation.notFound' }
      const prev = get().locationMasters[idx]
      const occupied = isLocationOccupied(prev, get().inventory)
      let nextZoneCode = prev.zoneCode
      let nextZoneType = prev.zoneType
      if (patch.zoneCode && patch.zoneCode !== prev.zoneCode) {
        if (occupied) return { ok: false, errorKey: 'masterLocation.error.occupiedChangeZone' }
        const zone = get().zoneMasters.find((z) => z.code === patch.zoneCode && z.warehouseCode === warehouseCode)
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
        updatedBy: currentOperator(),
      }
      const list = [...get().locationMasters]
      list[idx] = next
      set({ locationMasters: list })
      return { ok: true }
    },

    setLocationMasterStatus: (warehouseCode, code, status) => {
      const idx = get().locationMasters.findIndex((l) => l.warehouseCode === warehouseCode && l.code === code)
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
        updatedBy: currentOperator(),
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
        createdBy: currentOperator(),
        updatedAt: now,
        updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
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
            updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
      }
      const masters = [...get().customerMasters]
      masters[idx] = next
      const customers = get().customers.map((c) => (c.id === next.id ? { ...c, name: next.name } : c))
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
        updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
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
        const putawayOrders = get().putawayOrders
        if (
          hasSkuStock(inv, prev.customerId, prev.code) ||
          hasOpenSkuWork(inbounds, putawayOrders, prev.customerId, prev.code) ||
          get().outboundOrders.some(
            (o) =>
              o.customerId === prev.customerId &&
              !['SHIPPED', 'CANCELLED'].includes(o.status) &&
              o.items.some((i) => i.skuCode === prev.code),
          )
        ) {
          return { ok: false, errorKey: 'masterSku.error.disableBlocked' }
        }
      }
      const next: SkuMaster = {
        ...prev,
        status,
        updatedAt: nowIso(),
        updatedBy: currentOperator(),
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
            b.ownerCode === input.ownerCode && b.skuCode === input.skuCode && b.isPrimary && b.status === 'ENABLED',
        )?.barcode ?? undefined

      const masters = get().skuMasters.map((m) => {
        if (m.ownerCode !== input.ownerCode || m.code !== input.skuCode) return m
        return {
          ...m,
          primaryBarcode: primary,
          updatedAt: now,
          updatedBy: currentOperator(),
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
        const primary = barcodes.find(
          (b) => b.ownerCode === prev.ownerCode && b.skuCode === prev.skuCode && b.isPrimary && b.status === 'ENABLED',
        )?.barcode
        masters = masters.map((m) => {
          if (m.ownerCode !== prev.ownerCode || m.code !== prev.skuCode) return m
          return { ...m, primaryBarcode: primary, updatedAt: now, updatedBy: currentOperator() }
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
        createdBy: currentOperator(),
        updatedAt: now,
        updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
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
        updatedBy: currentOperator(),
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
        createdBy: currentOperator(),
        updatedAt: now,
        updatedBy: currentOperator(),
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
      const locked =
        channelHasOpenReferences(code, get().packages) ||
        get().outboundOrders.some((o) => o.channelCode === code && !['SHIPPED', 'CANCELLED'].includes(o.status))
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
        updatedBy: currentOperator(),
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
      if (
        status === 'DISABLED' &&
        (channelHasOpenReferences(code, get().packages) ||
          get().outboundOrders.some((o) => o.channelCode === code && !['SHIPPED', 'CANCELLED'].includes(o.status)))
      ) {
        return { ok: false, errorKey: 'masterChannel.error.disableReferenced' }
      }
      const next: ChannelMaster = {
        ...prev,
        status,
        updatedAt: nowIso(),
        updatedBy: currentOperator(),
      }
      const list = [...get().channelMasters]
      list[idx] = next
      set({ channelMasters: list })
      return { ok: true }
    },
  }
}
