import type { NewSkuRecord, UnclaimedRecord } from '@/types/inbound'

/**
 * 新品维护固定种子（新品维护 Demo PRD 第九节）：
 * 一条英制仓（美西仓）维护、带来源入库单；一条公制仓（法兰克福仓）独立维护。
 * ANKR 的 CABLE-01 已维护（种子入库单里可收），SN-DEMO-01 未维护（作为新品演示阻断）。
 */
export function createNewSkuSeed(): NewSkuRecord[] {
  return [
    {
      recordNo: 'NS-20261004-0001',
      customerId: 'C10028',
      skuCode: 'CABLE-01',
      warehouseCode: 'US-LA-01',
      sourceInboundNo: 'RK-20261002-0003',
      lengthCm: 15,
      widthCm: 8,
      heightCm: 2,
      grossWeightKg: 0.08,
      photos: [],
      remark: '与预报高度差 0.2cm',
      maintainedBy: 'pda.user',
      maintainedAt: '2026-10-04T09:00:00.000Z',
      requestId: 'seed-ns-0001',
    },
    {
      recordNo: 'NS-20261005-0001',
      customerId: 'C10031',
      skuCode: 'HOMY-003',
      warehouseCode: 'DE-FRA-01',
      lengthCm: 28,
      widthCm: 18.5,
      heightCm: 12,
      grossWeightKg: 1.256,
      photos: [],
      maintainedBy: 'web.user',
      maintainedAt: '2026-10-05T10:20:00.000Z',
      requestId: 'seed-ns-0002',
    },
  ]
}

/** 无主货登记固定种子（无主货登记 Demo PRD 第八节）：美西仓两条、美东仓一条 */
export function createUnclaimedSeed(): UnclaimedRecord[] {
  return [
    {
      registerNo: 'UG-20261008-0001',
      status: 'HOLDING',
      warehouseCode: 'US-LA-01',
      trackingNos: ['1Z999AA10123456784', '1Z999AA10123456785'],
      cartonMarks: ['FBA15XYZ0001'],
      cartonQty: 3,
      description: '白色纸箱，无发件人信息，外箱印有 "Fragile"',
      photos: [],
      registeredBy: 'pda.user',
      registeredAt: '2026-10-08T15:40:00.000Z',
      requestId: 'seed-ug-0001',
    },
    {
      registerNo: 'UG-20261009-0001',
      status: 'HOLDING',
      warehouseCode: 'US-LA-01',
      trackingNos: [],
      cartonMarks: ['FBA15XYZ0002', 'FBA15XYZ0003'],
      containerNo: 'MSCU7788990',
      cartonQty: 2,
      description: '整柜到件，箱唛对不上任何预报',
      photos: [],
      registeredBy: 'web.user',
      registeredAt: '2026-10-09T11:05:00.000Z',
      requestId: 'seed-ug-0002',
    },
    {
      registerNo: 'UG-20261009-0002',
      status: 'HOLDING',
      warehouseCode: 'US-NJ-01',
      trackingNos: ['1Z999AA10123456790'],
      cartonMarks: [],
      cartonQty: 1,
      description: '面单模糊，认不出货主',
      photos: [],
      registeredBy: 'pda.user',
      registeredAt: '2026-10-09T16:20:00.000Z',
      requestId: 'seed-ug-0003',
    },
  ]
}
