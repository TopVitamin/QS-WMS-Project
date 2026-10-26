import type { DbState } from './db'
import { currentOperator } from './current-operator'
import { carrierHasEnabledChannels } from '@/lib/carrier-master'
import { channelHasOpenReferences } from '@/lib/channel-master'
import { customerHasInventory, customerHasOpenWork } from '@/lib/customer-master'
import { isLocationOccupied, zoneTypeToLocationType, type LocationWorkReferences } from '@/lib/location-master'
import { cannotDisableTrace, findSkuMaster, hasOpenSkuWork, hasSkuStock } from '@/lib/sku-master'
import { blockingLocationCodes } from '@/lib/zone-master'
import type {
  CarrierMaster,
  ChannelMaster,
  CustomerMaster,
  LocationMaster,
  ProductFormFactor,
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

const SKU_AUDIT_FIELDS = [
  ['name', '商品名称'],
  ['nameEn', '英文名称'],
  ['spec', '规格型号'],
  ['unit', '计量单位'],
  ['productForm', '商品形态'],
  ['isBattery', '是否带电'],
  ['snEnabled', 'SN管理'],
  ['snFormat', 'SN格式'],
  ['batchEnabled', '批次管理'],
  ['expiryEnabled', '效期管理'],
  ['shelfLifeDays', '保质期（天）'],
  ['inboundDays', '收货剩余效期（天）'],
  ['nearExpiryDays', '临期阈值（天）'],
  ['expiredDays', '过期阈值（天）'],
  ['grossWeightKg', '毛重（kg）'],
  ['netWeightKg', '净重（kg）'],
  ['lengthCm', '长度（cm）'],
  ['widthCm', '宽度（cm）'],
  ['heightCm', '高度（cm）'],
] as const satisfies readonly (readonly [keyof SkuMaster, string])[]

function skuAuditValue(key: keyof SkuMaster, value: unknown): string {
  if (value == null || value === '') return '—'
  if (key === 'productForm') {
    const forms: Record<ProductFormFactor, string> = { SMALL: '轻小件', LARGE: '大件', IRREGULAR: '异形' }
    return forms[value as ProductFormFactor] ?? String(value)
  }
  if (['isBattery', 'snEnabled', 'batchEnabled', 'expiryEnabled'].includes(key)) return value ? '是' : '否'
  return String(value)
}

function locationWorkReferences(state: DbState): LocationWorkReferences {
  return {
    inbounds: state.inbounds,
    receiptRecords: state.receiptRecords,
    returnOrders: state.returnOrders,
    returnReceipts: state.returnReceipts,
    putawayOrders: state.putawayOrders,
    outboundPickTasks: state.outboundPickTasks,
    outboundPutbacks: state.outboundPutbacks,
    inventoryCounts: state.inventoryCounts,
  }
}

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
      /** 作业端仍用 Warehouse 投影；主数据保存后同步时区、币别、单位与暂存位，避免“改了资料作业不生效” */
      const warehouses = get().warehouses.map((w) =>
        w.code === code
          ? {
              ...w,
              countryCode: next.countryCode,
              timezone: next.timezone,
              currency: next.currency,
              unitSystem: next.unitSystem,
              defaultReceiptMethod: next.defaultReceiptMethod,
              receivingStagingLocation: next.receivingStagingLocation,
              outboundStagingLocation: next.outboundStagingLocation,
            }
          : w,
      )
      set({ warehouseMasters: list, warehouses })
      return { ok: true }
    },

    /** 一期四仓预置，不提供业务侧新增；保留 action 以便直接调用时也能被拒绝 */
    createWarehouseMaster: () => ({ ok: false, errorKey: 'masterWarehouse.error.createDisabled' }),

    /** 仓库状态一期只读展示，四仓默认启用；不提供业务侧启停 */
    setWarehouseMasterStatus: () => ({ ok: false, errorKey: 'masterWarehouse.error.statusReadOnly' }),

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
        /** 作业端仍读 locations；主数据新增后立即投影，避免“新建货位上架不到” */
        locations: [
          ...get().locations.filter((l) => !(l.warehouseCode === warehouseCode && l.code === code)),
          {
            code,
            warehouseCode,
            zone: zone.code,
            type: zoneTypeToLocationType(row.zoneType),
            status: row.status,
          },
        ],
      })
      return { ok: true }
    },

    updateLocationMaster: (warehouseCode, code, patch) => {
      const idx = get().locationMasters.findIndex((l) => l.warehouseCode === warehouseCode && l.code === code)
      if (idx < 0) return { ok: false, errorKey: 'masterLocation.notFound' }
      const prev = get().locationMasters[idx]
      const state = get()
      const occupied = isLocationOccupied(prev, state.inventory, locationWorkReferences(state))
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
      const locations = get().locations.map((l) =>
        l.warehouseCode === warehouseCode && l.code === code
          ? {
              ...l,
              zone: next.zoneCode,
              type: zoneTypeToLocationType(next.zoneType),
              status: next.status,
            }
          : l,
      )
      set({ locationMasters: list, locations })
      return { ok: true }
    },

    setLocationMasterStatus: (warehouseCode, code, status) => {
      const idx = get().locationMasters.findIndex((l) => l.warehouseCode === warehouseCode && l.code === code)
      if (idx < 0) return { ok: false, errorKey: 'masterLocation.notFound' }
      const prev = get().locationMasters[idx]
      if (prev.status === status) return { ok: true }
      const state = get()
      if (status === 'DISABLED' && isLocationOccupied(prev, state.inventory, locationWorkReferences(state))) {
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
      const locations = get().locations.map((l) =>
        l.warehouseCode === warehouseCode && l.code === code ? { ...l, status } : l,
      )
      set({ locationMasters: list, locations })
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
      const state = get()
      const inventory = state.inventory
      const locations = state.locationMasters
      const work = locationWorkReferences(state)
      const blocked = blockingLocationCodes(prev, locations, inventory, work).length > 0

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
        const state = get()
        const codes = blockingLocationCodes(
          prev,
          state.locationMasters,
          state.inventory,
          locationWorkReferences(state),
        )
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
      if (status === 'DISABLED') {
        const state = get()
        if (
          customerHasInventory(prev, state.inventory) ||
          customerHasOpenWork(prev, {
            inbounds: state.inbounds,
            putawayOrders: state.putawayOrders,
            returnOrders: state.returnOrders,
            outboundOrders: state.outboundOrders,
            outboundPickTasks: state.outboundPickTasks,
            outboundPutbacks: state.outboundPutbacks,
            inventoryCounts: state.inventoryCounts,
          })
        ) {
          return { ok: false, errorKey: 'masterCustomer.error.disableOccupied' }
        }
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
      const operator = currentOperator()
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
        updatedAt: nowIso(),
        updatedBy: operator,
      }
      const changedFields = SKU_AUDIT_FIELDS.flatMap(([key, label]) =>
        Object.is(prev[key], next[key])
          ? []
          : [`${label}：${skuAuditValue(key, prev[key])} → ${skuAuditValue(key, next[key])}`],
      )
      const list = [...get().skuMasters]
      list[idx] = next
      /** 作业侧仍用旧 Sku 投影；商品资料保存后同步名称、条码与仓内尺重，避免“改了商品作业不生效” */
      const skus = get().skus.map((s) =>
        s.customerId === next.customerId && s.code === next.code
          ? {
              ...s,
              name: next.name,
              barcode: next.primaryBarcode ?? s.barcode,
              ...(next.grossWeightKg != null ? { weightG: Math.round(next.grossWeightKg * 1000) } : {}),
              ...(next.lengthCm != null ? { lengthCm: next.lengthCm } : {}),
              ...(next.widthCm != null ? { widthCm: next.widthCm } : {}),
              ...(next.heightCm != null ? { heightCm: next.heightCm } : {}),
            }
          : s,
      )
      const auditLogs = changedFields.length
        ? [
            ...state.auditLogs,
            {
              id: uid('AUD'),
              refType: 'MASTER' as const,
              refNo: `${ownerCode}/${code}`,
              action: 'SKU_MASTER_EDIT' as const,
              operator,
              detail: changedFields.join('；'),
              createdAt: next.updatedAt,
            },
          ]
        : state.auditLogs
      set({ skuMasters: list, skus, auditLogs })
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
      const skus = get().skus.map((s) =>
        s.customerId === master.customerId && s.code === master.code ? { ...s, barcode: primary ?? '' } : s,
      )

      set({ skuBarcodes: barcodes, skuMasters: masters, skus })
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

      const primaryForOwner = masters.find((m) => m.ownerCode === prev.ownerCode && m.code === prev.skuCode)?.primaryBarcode
      const skus = get().skus.map((s) =>
        s.code === prev.skuCode && get().skuMasters.some((m) => m.ownerCode === prev.ownerCode && m.code === prev.skuCode && m.customerId === s.customerId)
          ? { ...s, barcode: primaryForOwner ?? '' }
          : s,
      )
      set({ skuBarcodes: barcodes, skuMasters: masters, skus })
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
      const locked = channelHasOpenReferences(code, get().outboundOrders)
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
      if (status === 'DISABLED' && channelHasOpenReferences(code, get().outboundOrders)) {
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
