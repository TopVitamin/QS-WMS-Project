import type { LocationMaster, ZoneMaster, ZoneType } from '@/types/wms'
import { isLocationOccupied } from '@/lib/location-master'

export const ZONE_TYPE_I18N: Record<ZoneType, string> = {
  STORAGE: 'masterZone.zoneTypes.STORAGE',
  PICK: 'masterZone.zoneTypes.PICK',
  STAGING: 'masterZone.zoneTypes.STAGING',
  DEFECT_ISOLATION: 'masterZone.zoneTypes.DEFECT_ISOLATION',
  EXCEPTION: 'masterZone.zoneTypes.EXCEPTION',
}

export const ZONE_TYPE_OPTIONS: ZoneType[] = [
  'STORAGE',
  'PICK',
  'STAGING',
  'DEFECT_ISOLATION',
  'EXCEPTION',
]

export type ZoneMasterFormErrors = Partial<
  Record<'warehouseCode' | 'code' | 'name' | 'zoneType' | 'status', string>
>

export function validateZoneMasterForm(form: ZoneMaster): ZoneMasterFormErrors {
  const errors: ZoneMasterFormErrors = {}
  if (!form.warehouseCode.trim()) errors.warehouseCode = 'required'
  if (!form.code.trim()) errors.code = 'required'
  if (!form.name.trim()) errors.name = 'required'
  if (!form.zoneType) errors.zoneType = 'required'
  if (!form.status) errors.status = 'required'
  return errors
}

export function zoneDetailPath(warehouseCode: string, code: string): string {
  return `/wms/master/zones/${encodeURIComponent(code)}?wh=${encodeURIComponent(warehouseCode)}`
}

export function zoneEditPath(warehouseCode: string, code: string): string {
  return `/wms/master/zones/${encodeURIComponent(code)}/edit?wh=${encodeURIComponent(warehouseCode)}`
}

export { parseWarehouseScopeQuery as parseZoneWarehouse } from '@/lib/master-data'

export function findZone(zones: ZoneMaster[], warehouseCode: string, code: string): ZoneMaster | undefined {
  return zones.find((z) => z.warehouseCode === warehouseCode && z.code === code)
}

/** 下属货位是否存在 R07 所列占用（Demo 用 locationMasters + occupyingCustomerId / 库存） */
export function zoneHasBlockingOccupancy(
  zone: ZoneMaster,
  locations: LocationMaster[],
  inventory: import('@/types/wms').InventoryRecord[],
): boolean {
  return blockingLocationCodes(zone, locations, inventory).length > 0
}

export function blockingLocationCodes(
  zone: ZoneMaster,
  locations: LocationMaster[],
  inventory: import('@/types/wms').InventoryRecord[],
): string[] {
  return locations
    .filter((l) => l.warehouseCode === zone.warehouseCode && l.zoneCode === zone.code)
    .filter((l) => isLocationOccupied(l, inventory))
    .map((l) => l.code)
}

export function enabledWarehousesForZoneForm(warehouses: { code: string; name: string; status: string }[]) {
  return warehouses.filter((w) => w.status === 'ENABLED')
}

export function zoneHasAnyLocation(zone: ZoneMaster, locations: LocationMaster[]): boolean {
  return locations.some((l) => l.warehouseCode === zone.warehouseCode && l.zoneCode === zone.code)
}

export function hasEnabledWarehouse(warehouses: { code: string; status: string }[]): boolean {
  return warehouses.some((w) => w.status === 'ENABLED')
}

/** 新增库区表单的初始值（新建默认启用，状态不在表单里维护） */
export function createEmptyZoneForm(warehouseCode = ''): ZoneMaster {
  return {
    warehouseCode,
    code: '',
    name: '',
    zoneType: 'STORAGE',
    status: 'ENABLED',
    remark: '',
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  }
}
