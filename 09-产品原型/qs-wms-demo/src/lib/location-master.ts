import type { InventoryRecord, LocationMaster, ProductFormFactor, ZoneMaster, ZoneType } from '@/types/wms'

export const ZONE_TYPE_I18N: Record<ZoneType, string> = {
  STORAGE: 'masterLocation.zoneTypes.STORAGE',
  PICK: 'masterLocation.zoneTypes.PICK',
  STAGING: 'masterLocation.zoneTypes.STAGING',
  DEFECT_ISOLATION: 'masterLocation.zoneTypes.DEFECT_ISOLATION',
  EXCEPTION: 'masterLocation.zoneTypes.EXCEPTION',
}

export const PRODUCT_FORM_I18N: Record<ProductFormFactor, string> = {
  SMALL: 'masterLocation.productForm.SMALL',
  LARGE: 'masterLocation.productForm.LARGE',
  IRREGULAR: 'masterLocation.productForm.IRREGULAR',
}

export const PRODUCT_FORM_OPTIONS: ProductFormFactor[] = ['SMALL', 'LARGE', 'IRREGULAR']

export type LocationMasterFormErrors = Partial<
  Record<'zoneCode' | 'code' | 'status' | 'allowMixSku' | 'allowMixBatch' | 'putawaySequence' | 'pickSequence', string>
>

export function validateLocationMasterForm(form: LocationMaster): LocationMasterFormErrors {
  const errors: LocationMasterFormErrors = {}
  if (!form.zoneCode.trim()) errors.zoneCode = 'required'
  if (!form.code.trim()) errors.code = 'required'
  if (!form.status) errors.status = 'required'
  if (form.putawaySequence != null && (form.putawaySequence < 0 || !Number.isInteger(form.putawaySequence))) {
    errors.putawaySequence = 'invalid'
  }
  if (form.pickSequence != null && (form.pickSequence < 0 || !Number.isInteger(form.pickSequence))) {
    errors.pickSequence = 'invalid'
  }
  return errors
}

export function findZone(zones: ZoneMaster[], code: string): ZoneMaster | undefined {
  return zones.find((z) => z.code === code)
}

export function locationKey(row: Pick<LocationMaster, 'warehouseCode' | 'code'>): string {
  return `${row.warehouseCode}::${row.code}`
}

export function isLocationOccupied(
  loc: LocationMaster,
  inventory: InventoryRecord[],
): boolean {
  if (loc.occupyingCustomerId) return true
  return inventory.some(
    (r) => r.warehouseCode === loc.warehouseCode && r.locationCode === loc.code && r.onHandQty > 0,
  )
}

export function enabledZonesForWarehouse(zones: ZoneMaster[], warehouseCode: string): ZoneMaster[] {
  return zones.filter((z) => z.warehouseCode === warehouseCode && z.status === 'ENABLED')
}

export function hasAnyEnabledZone(zones: ZoneMaster[]): boolean {
  return zones.some((z) => z.status === 'ENABLED')
}

export function locationDetailPath(warehouseCode: string, code: string): string {
  return `/wms/master/locations/${encodeURIComponent(code)}?wh=${encodeURIComponent(warehouseCode)}`
}

export function locationEditPath(warehouseCode: string, code: string): string {
  return `/wms/master/locations/${encodeURIComponent(code)}/edit?wh=${encodeURIComponent(warehouseCode)}`
}

export { parseWarehouseScopeQuery as parseLocationWarehouse } from '@/lib/master-data'

/** 新增货位表单的初始值（新建默认启用，状态不在表单里维护） */
export function createEmptyLocationForm(warehouseCode = '', zoneCode = ''): LocationMaster {
  return {
    warehouseCode,
    zoneCode,
    zoneType: 'PICK',
    code: '',
    status: 'ENABLED',
    allowMixSku: true,
    allowMixBatch: false,
    productForms: [],
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  }
}
