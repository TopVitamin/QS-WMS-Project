import type { CarrierMaster, ChannelMaster } from '@/types/wms'

export const CARRIER_LIST_PATH = '/wms/master/carriers'

export function carrierDetailPath(code: string): string {
  return `/wms/master/carriers/${encodeURIComponent(code)}`
}

export function carrierShortDisplay(c: Pick<CarrierMaster, 'name' | 'shortName'>): string {
  const short = c.shortName?.trim()
  return short || c.name
}

export function carrierHasEnabledChannels(carrierCode: string, channels: ChannelMaster[]): boolean {
  return channels.some((ch) => ch.carrierCode === carrierCode && ch.status === 'ENABLED')
}

export interface CarrierMasterFormErrors {
  code?: string
  name?: string
  contactEmail?: string
}

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

export function validateCarrierMasterForm(
  input: Pick<CarrierMaster, 'code' | 'name' | 'contactEmail'>,
): CarrierMasterFormErrors {
  const errors: CarrierMasterFormErrors = {}
  const code = input.code.trim()
  if (!code) errors.code = 'required'
  else if (!CODE_PATTERN.test(code)) errors.code = 'invalid'
  if (!input.name.trim()) errors.name = 'required'
  if (input.contactEmail?.trim()) {
    const email = input.contactEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = 'invalid'
  }
  return errors
}

export function createEmptyCarrierForm(): Omit<
  CarrierMaster,
  'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
> {
  return {
    code: '',
    name: '',
    shortName: '',
    status: 'ENABLED',
    remark: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    externalCarrierCode: '',
  }
}
