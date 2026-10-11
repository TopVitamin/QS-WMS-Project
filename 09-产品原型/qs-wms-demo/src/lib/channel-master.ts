import type { ChannelMaster, ChannelType, LogisticsIntegrationMode, OutboundPackage } from '@/types/wms'

export const CHANNEL_LIST_PATH = '/wms/master/channels'

export const CHANNEL_TYPE_OPTIONS: ChannelType[] = ['EXPRESS', 'TRUCK', 'PICKUP', 'OTHER']

export const INTEGRATION_MODE_OPTIONS: LogisticsIntegrationMode[] = ['OFFLINE_HANDOVER', 'API_RESERVED']

export function channelHasOpenReferences(channelCode: string, packages: OutboundPackage[]): boolean {
  return packages.some(
    (p) => p.channelCode === channelCode && p.status !== 'SHIPPED' && p.status !== 'CANCELLED',
  )
}

export interface ChannelMasterFormErrors {
  carrierCode?: string
  code?: string
  name?: string
  integrationMode?: string
}

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

export function validateChannelMasterForm(
  input: Pick<ChannelMaster, 'carrierCode' | 'code' | 'name' | 'integrationMode'>,
): ChannelMasterFormErrors {
  const errors: ChannelMasterFormErrors = {}
  if (!input.carrierCode?.trim()) errors.carrierCode = 'required'
  const code = input.code.trim()
  if (!code) errors.code = 'required'
  else if (!CODE_PATTERN.test(code)) errors.code = 'invalid'
  if (!input.name.trim()) errors.name = 'required'
  if (!input.integrationMode) errors.integrationMode = 'required'
  return errors
}

export function createEmptyChannelForm(
  defaultCarrierCode = '',
): Omit<ChannelMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> {
  return {
    carrierCode: defaultCarrierCode,
    code: '',
    name: '',
    channelType: 'EXPRESS',
    status: 'ENABLED',
    remark: '',
    integrationMode: 'OFFLINE_HANDOVER',
    externalProductCode: '',
  }
}
