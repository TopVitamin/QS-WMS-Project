import type { ReturnOrder } from '@/types/return'
import { recomputeReturnOrder } from '@/lib/return-derive'
import type { OutboundData } from '@/types/outbound'

/** 一期 Demo：三类来源各一条待收货退货单，现场从列表或 PDA 进入收货 */
export function createReturnSeed(outbound: Pick<OutboundData, 'outboundOrders' | 'outboundVerifications'>): ReturnOrder[] {
  const shipped = outbound.outboundOrders.find(
    (order) => order.warehouseCode === 'US-LA-01' && order.customerId === 'C10028' && order.type === 'B2C' && order.status === 'SHIPPED',
  )
  const shippedItem = shipped?.items.find((item) => item.shippedQty > 0)
  const trackingNo = outbound.outboundVerifications.find((v) => v.orderNo === shipped?.no && !v.deleted)?.trackingNo
  if (!shipped || !shippedItem || !trackingNo) throw new Error('return seed: shipped B2C order and tracking number required')
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
      shipped.no,
      shippedItem.skuCode,
      shippedItem.shippedQty,
      { originalOutboundNo: shipped.no, trackingNo },
    ),
    base(
      'RT-20261019-0003',
      'DE-FRA-01',
      'C10031',
      'PLATFORM',
      'OMS-RT-20261019-0003',
      'CABLE-01',
      3,
      { platformReturnNo: 'AMZ-RT-20261019-0003', trackingNo: '1Z999AA10123456703' },
    ),
  ]
}
