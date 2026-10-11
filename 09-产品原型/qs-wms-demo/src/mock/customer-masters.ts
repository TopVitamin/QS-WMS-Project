import type { Customer, CustomerMaster } from '@/types/wms'

const ts = '2026-10-08T08:00:00.000Z'

const base = {
  createdAt: ts,
  createdBy: 'system',
  updatedAt: ts,
  updatedBy: 'system',
  lastSyncAt: ts,
}

/** 货主主数据种子（与入库/库存 customerId 对齐） */
export function createCustomerMasters(): CustomerMaster[] {
  return [
    {
      id: 'SELF-001',
      code: 'OWNER-SELF',
      name: 'QS 自营',
      ownerType: 'SELF',
      status: 'ENABLED',
      putawayRecommendTiming: 'AFTER_RECEIVE',
      upstreamOwnerId: 'MOCK-SELF-001',
      countryCode: 'HK',
      city: 'Hong Kong',
      address1: 'Demo self-operated owner',
      ...base,
    },
    {
      id: 'C10028',
      code: 'ANKR',
      name: 'Shenzhen Anker Trading',
      ownerType: 'EXTERNAL',
      status: 'ENABLED',
      putawayRecommendTiming: 'AT_PUTAWAY_SCAN',
      upstreamOwnerId: 'MOCK-ANKR',
      countryCode: 'CN',
      city: 'Shenzhen',
      address1: 'Nanshan District',
      ...base,
    },
    {
      id: 'C10031',
      code: 'HOMY',
      name: 'Homy Living Co., Ltd.',
      ownerType: 'EXTERNAL',
      status: 'ENABLED',
      putawayRecommendTiming: 'AT_PUTAWAY_SCAN',
      upstreamOwnerId: 'MOCK-OWNER-BUSY',
      remark: '演示 R06：有库存占用，停用应失败',
      countryCode: 'US',
      city: 'Los Angeles',
      address1: '123 Demo Blvd',
      ...base,
    },
    {
      id: 'C10045',
      code: 'PETX',
      name: 'PetX Supplies',
      ownerType: 'EXTERNAL',
      status: 'ENABLED',
      putawayRecommendTiming: 'NONE',
      upstreamOwnerId: 'MOCK-OWNER-IDLE',
      ...base,
    },
    {
      id: 'C10052',
      code: 'GLOW',
      name: 'Glow Beauty Tech',
      ownerType: 'EXTERNAL',
      status: 'ENABLED',
      putawayRecommendTiming: 'AFTER_RECEIVE',
      upstreamOwnerId: 'MOCK-GLOW',
      ...base,
    },
    {
      id: 'C10067',
      code: 'TRAK',
      name: 'TrailPeak Outdoor',
      ownerType: 'EXTERNAL',
      status: 'ENABLED',
      putawayRecommendTiming: 'AT_PUTAWAY_SCAN',
      upstreamOwnerId: 'MOCK-TRAK',
      ...base,
    },
    {
      id: 'C10073',
      code: 'KIDO',
      name: 'Kido Toys Intl.',
      ownerType: 'EXTERNAL',
      status: 'DISABLED',
      putawayRecommendTiming: 'NONE',
      upstreamOwnerId: 'MOCK-KIDO',
      remark: '已停用样例',
      ...base,
    },
  ]
}

export function customerMastersToLegacy(customers: CustomerMaster[]): Customer[] {
  return customers.map((c) => ({ id: c.id, code: c.code, name: c.name }))
}
