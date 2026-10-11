import type { CarrierMaster } from '@/types/wms'

const ts = '2026-10-01T08:00:00.000Z'
const ts2 = '2026-10-05T10:30:00.000Z'

export function createCarrierMasters(): CarrierMaster[] {
  return [
    {
      code: 'CAR-DHL',
      name: 'DHL Express（演示）',
      shortName: 'DHL',
      status: 'ENABLED',
      remark: '跨境快递演示承运商',
      contactName: 'DHL Demo Desk',
      contactPhone: '+49 228 4333112',
      contactEmail: 'demo-dhl@qs-wms.local',
      externalCarrierCode: 'EXT-DHL',
      createdAt: ts,
      createdBy: 'system',
      updatedAt: ts2,
      updatedBy: 'admin',
    },
    {
      code: 'CAR-UPS',
      name: 'UPS Ground & Air（演示）',
      shortName: 'UPS',
      status: 'ENABLED',
      contactName: 'UPS Account',
      contactPhone: '+1 800 742 5877',
      createdAt: ts,
      createdBy: 'system',
      updatedAt: ts,
      updatedBy: 'system',
    },
    {
      code: 'CAR-FEDEX',
      name: 'FedEx Home Delivery（演示）',
      shortName: 'FedEx',
      status: 'ENABLED',
      externalCarrierCode: 'FEDEX-DEMO',
      createdAt: ts,
      createdBy: 'system',
      updatedAt: ts,
      updatedBy: 'system',
    },
    {
      code: 'CAR-DPD',
      name: 'DPD Classic（演示）',
      shortName: 'DPD',
      status: 'DISABLED',
      remark: '演示停用承运商',
      createdAt: ts,
      createdBy: 'system',
      updatedAt: ts2,
      updatedBy: 'admin',
    },
  ]
}
