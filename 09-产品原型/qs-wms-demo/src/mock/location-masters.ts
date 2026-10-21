import type { LocationMaster } from '@/types/wms'

const ts = '2026-10-05T10:00:00.000Z'

export function createLocationMasters(): LocationMaster[] {
  const base = {
    createdAt: ts,
    createdBy: 'system',
    updatedAt: ts,
    updatedBy: 'system',
  }
  return [
    {
      warehouseCode: 'US-LA-01',
      zoneCode: 'Z-PICK',
      zoneType: 'PICK',
      code: 'P-B-01',
      status: 'ENABLED',
      allowMixSku: true,
      allowMixBatch: false,
      productForms: ['SMALL'],
      occupyingCustomerId: 'C10031',
      remark: '拣货位样例（有占用，停用应失败）',
      ...base,
    },
    {
      warehouseCode: 'US-LA-01',
      zoneCode: 'Z-STORE',
      zoneType: 'STORAGE',
      code: 'S-A-01',
      status: 'ENABLED',
      allowMixSku: true,
      allowMixBatch: true,
      productForms: ['LARGE'],
      remark: '存储位样例（空闲）',
      ...base,
    },
    {
      warehouseCode: 'US-LA-01',
      zoneCode: 'Z-PICK',
      zoneType: 'PICK',
      code: 'P-B-OFF',
      status: 'DISABLED',
      allowMixSku: false,
      allowMixBatch: false,
      productForms: [],
      remark: '停用样例',
      ...base,
    },
    {
      warehouseCode: 'HK-WH-01',
      zoneCode: 'Z-HK-PICK',
      zoneType: 'PICK',
      code: 'P-B-01',
      status: 'ENABLED',
      allowMixSku: true,
      allowMixBatch: false,
      productForms: [],
      remark: '跨仓同编码样例（R02）',
      ...base,
    },
  ]
}
