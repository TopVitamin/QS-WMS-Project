/** 主数据列表筛选项「全部」占位值（Select） */
export const FILTER_ALL = '__all'

/** 仓库 + 业务编码类主数据（货位、库区）在 URL 上区分仓 */
export function parseWarehouseScopeQuery(search: string): string | undefined {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  return params.get('wh') || undefined
}

export function masterCompositeRowId(warehouseCode: string, code: string): string {
  return `${warehouseCode}::${code}`
}

export function sortByUpdatedAtDesc<T extends { updatedAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** 与 i18n 中 `masterWarehouse` / `masterZone` / `masterLocation` 等命名空间对齐 */
export type MasterDataI18nScope =
  | 'masterWarehouse'
  | 'masterZone'
  | 'masterLocation'
  | 'masterCustomer'
  | 'masterSku'
  | 'masterCarrier'
  | 'masterChannel'

export function skuMasterRowId(ownerCode: string, code: string): string {
  return `${ownerCode}::${code}`
}
