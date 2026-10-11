import type { CustomerMaster, InventoryRecord, PutawayRecommendTiming } from '@/types/wms'

export const PUTAWAY_RECOMMEND_I18N: Record<PutawayRecommendTiming, string> = {
  NONE: 'masterCustomer.putaway.NONE',
  AFTER_RECEIVE: 'masterCustomer.putaway.AFTER_RECEIVE',
  AT_PUTAWAY_SCAN: 'masterCustomer.putaway.AT_PUTAWAY_SCAN',
}

export const PUTAWAY_RECOMMEND_OPTIONS: PutawayRecommendTiming[] = [
  'NONE',
  'AFTER_RECEIVE',
  'AT_PUTAWAY_SCAN',
]

export const OWNER_TYPE_I18N = {
  SELF: 'masterCustomer.ownerTypes.SELF',
  EXTERNAL: 'masterCustomer.ownerTypes.EXTERNAL',
} as const

export type CustomerMasterFormErrors = Partial<
  Record<'name' | 'putawayRecommendTiming' | 'contactEmail', string>
>

export function validateCustomerMasterForm(form: CustomerMaster): CustomerMasterFormErrors {
  const errors: CustomerMasterFormErrors = {}
  if (!form.name.trim()) errors.name = 'required'
  if (!form.putawayRecommendTiming) errors.putawayRecommendTiming = 'required'
  const email = form.contactEmail?.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = 'invalid'
  return errors
}

export function customerDetailPath(code: string, edit?: boolean): string {
  const base = `/wms/master/customers/${encodeURIComponent(code)}`
  return edit ? `${base}?edit=1` : base
}

export function formatCustomerFullAddress(c: CustomerMaster): string {
  const parts = [
    c.countryCode,
    c.state,
    c.city,
    c.district,
    c.address1,
    c.address2,
    c.postalCode,
  ].filter(Boolean)
  return parts.join(' · ') || '—'
}

export function customerHasInventory(customer: CustomerMaster, inventory: InventoryRecord[]): boolean {
  return inventory.some((r) => r.customerId === customer.id && r.onHandQty + (r.lockedQty ?? 0) > 0)
}
