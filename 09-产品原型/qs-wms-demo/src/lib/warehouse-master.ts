import type { WarehouseMaster } from '@/types/wms'

const COUNTRY_LABEL: Record<string, string> = {
  HK: '中国香港',
  US: '美国',
  DE: '德国',
}

export function formatWarehouseFullAddress(w: Pick<WarehouseMaster, 'countryCode' | 'state' | 'city' | 'district' | 'address1' | 'address2' | 'postalCode'>): string {
  const parts = [
    COUNTRY_LABEL[w.countryCode] ?? w.countryCode,
    w.state,
    w.city,
    w.district,
    w.address1,
    w.address2,
    w.postalCode,
  ].filter((p) => p && String(p).trim())
  return parts.join(' · ') || '-'
}

export interface WarehouseMasterFormErrors {
  code?: string
  name?: string
  timezone?: string
  currency?: string
  countryCode?: string
  city?: string
  address1?: string
  contactEmail?: string
}

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

export function validateWarehouseMasterForm(
  input: Pick<
    WarehouseMaster,
    'code' | 'name' | 'timezone' | 'currency' | 'countryCode' | 'city' | 'address1' | 'contactEmail'
  >,
): WarehouseMasterFormErrors {
  const errors: WarehouseMasterFormErrors = {}
  const code = input.code.trim()
  if (!code) errors.code = 'required'
  else if (!CODE_PATTERN.test(code)) errors.code = 'invalid'
  if (!input.name.trim()) errors.name = 'required'
  if (!input.timezone) errors.timezone = 'required'
  if (!input.currency) errors.currency = 'required'
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
