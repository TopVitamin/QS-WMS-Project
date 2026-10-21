import type { ReturnOrder } from '@/types/return'
import { recomputeReturnOrder } from '@/lib/return-derive'

/** 一期 Demo：三类来源各一条待收货退货单，现场从列表或 PDA 进入收货 */
export function createReturnSeed(): ReturnOrder[] {
  const base = (
    returnNo: string,
    warehouseCode: string,
    customerId: string,
    sourceType: ReturnOrder['sourceType'],
    upstreamNo: string,
    skuCode: string,
    plannedQty: number,
    extra?: Partial<ReturnOrder>,
  ): ReturnOrder =>
    recomputeReturnOrder({
      returnNo,
      warehouseCode,
      customerId,
      sourceType,
      upstreamNo,
      status: 'PENDING_RECEIVE',
      items: [
        {
          lineNo: 1,
          skuCode,
          plannedQty,
          receivedQty: 0,
          goodQty: 0,
          defectQty: 0,
          rejectedQty: 0,
          putawayQty: 0,
          status: 'PENDING_RECEIVE',
        },
      ],
      createdAt: '2026-10-19T08:00:00.000Z',
      updatedAt: '2026-10-19T08:00:00.000Z',
      ...extra,
    })

  return [
    base(
      'RT-20261019-0001',
      'US-LA-01',
      'C10028',
      'CUSTOMER',
      'OMS-RT-20261019-0001',
      'CABLE-01',
      5,
      { trackingNo: '1Z999AA10123456701' },
    ),
    base(
      'RT-20261019-0002',
      'US-LA-01',
      'C10028',
      'DELIVERY_FAILED',
      'OB-20261018-0002',
      'CABLE-01',
      2,
      { originalOutboundNo: 'OB-20261018-0002', trackingNo: '1Z999AA10123456702' },
    ),
    base(
      'RT-20261019-0003',
      'DE-FRA-01',
      'C10031',
      'PLATFORM',
      'OMS-RT-20261019-0003',
      'CABLE-01',
      3,
      { trackingNo: '1Z999AA10123456703' },
    ),
  ]
}
