import type { WarehouseMaster } from '@/types/wms'

/** 仓库、货主等对象共用的地址片段 */
export interface AddressParts {
  countryCode?: string
  state?: string
  city?: string
  district?: string
  address1?: string
  address2?: string
  postalCode?: string
}

/** 国家/地区的 i18n key；不在选项里的归为「其他」 */
export function countryLabelKey(countryCode?: string): string {
  return WAREHOUSE_COUNTRY_OPTIONS.find((c) => c.value === countryCode)?.labelKey ?? 'masterWarehouse.country.OTHER'
}

/**
 * 完整地址：国家/地区 · 州省 · 城市 · 区县 · 地址1 · 地址2 · 邮编。
 * 国家名由调用方用 t(countryLabelKey(code)) 翻译后传入；全部为空时返回空串，由调用方显示占位符。
 */
export function formatFullAddress(a: AddressParts, countryLabel?: string): string {
  return [countryLabel ?? a.countryCode, a.state, a.city, a.district, a.address1, a.address2, a.postalCode]
    .filter((p) => p && String(p).trim())
    .join(' · ')
}

export function formatWarehouseFullAddress(w: AddressParts, countryLabel?: string): string {
  return formatFullAddress(w, countryLabel)
}

export interface WarehouseMasterFormErrors {
  code?: string
  name?: string
  timezone?: string
  currency?: string
  unitSystem?: string
  defaultReceiptMethod?: string
  receivingStagingLocation?: string
  outboundStagingLocation?: string
  countryCode?: string
  city?: string
  address1?: string
  contactEmail?: string
}

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

export function validateWarehouseMasterForm(
  input: Pick<
    WarehouseMaster,
    | 'code'
    | 'name'
    | 'timezone'
    | 'currency'
    | 'unitSystem'
    | 'defaultReceiptMethod'
    | 'receivingStagingLocation'
    | 'outboundStagingLocation'
    | 'countryCode'
    | 'city'
    | 'address1'
    | 'contactEmail'
  >,
): WarehouseMasterFormErrors {
  const errors: WarehouseMasterFormErrors = {}
  const code = input.code.trim()
  if (!code) errors.code = 'required'
  else if (!CODE_PATTERN.test(code)) errors.code = 'invalid'
  if (!input.name.trim()) errors.name = 'required'
  if (!input.timezone) errors.timezone = 'required'
  if (!input.currency) errors.currency = 'required'
  if (!input.unitSystem) errors.unitSystem = 'required'
  if (!input.defaultReceiptMethod) errors.defaultReceiptMethod = 'required'
  if (!input.receivingStagingLocation.trim()) errors.receivingStagingLocation = 'required'
  if (!input.outboundStagingLocation.trim()) errors.outboundStagingLocation = 'required'
  if (
    input.receivingStagingLocation.trim() &&
    input.outboundStagingLocation.trim() &&
    input.receivingStagingLocation.trim().toUpperCase() === input.outboundStagingLocation.trim().toUpperCase()
  ) {
    errors.receivingStagingLocation = 'sameAsOutbound'
    errors.outboundStagingLocation = 'sameAsReceiving'
  }
  if (!input.countryCode) errors.countryCode = 'required'
  if (!input.city.trim()) errors.city = 'required'
  if (!input.address1.trim()) errors.address1 = 'required'
  if (input.contactEmail?.trim()) {
    const email = input.contactEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = 'invalid'
  }
  return errors
}

export const WAREHOUSE_TIMEZONE_OPTIONS = [
  'Asia/Hong_Kong',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/Berlin',
] as const

export const WAREHOUSE_COUNTRY_OPTIONS = [
  { value: 'HK', labelKey: 'masterWarehouse.country.HK' },
  { value: 'US', labelKey: 'masterWarehouse.country.US' },
  { value: 'DE', labelKey: 'masterWarehouse.country.DE' },
] as const

/** 新增仓库表单的初始值（新建默认启用，状态不在表单里维护） */
export function createEmptyWarehouseForm(): WarehouseMaster {
  return {
    code: '',
    name: '',
    timezone: WAREHOUSE_TIMEZONE_OPTIONS[0],
    currency: 'USD',
    status: 'ENABLED',
    unitSystem: 'metric',
    defaultReceiptMethod: 'CONTAINER',
    receivingStagingLocation: '',
    outboundStagingLocation: '',
    countryCode: 'HK',
    city: '',
    address1: '',
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  }
}
