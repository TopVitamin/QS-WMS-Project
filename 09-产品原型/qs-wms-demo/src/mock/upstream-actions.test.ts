import { beforeEach, describe, expect, it } from 'vitest'
import { useDb } from './db'
import { useSettings } from '@/stores/settings'

function resetDb() {
  localStorage.clear()
  useDb.getState().resetDemo()
  useSettings.setState({ operator: 'tester' })
}

describe('入库上游消息', () => {
  beforeEach(resetDb)

  it('完整 Mock 推送支持一张单多 SKU 与到货线索', () => {
    const result = useDb.getState().mockPushInboundInstruction({
      customerId: 'C10028',
      warehouseCode: 'US-LA-01',
      bizType: 'NORMAL',
      upstreamNo: 'OMS-IN-MULTI-001',
      items: [
        { skuCode: 'CABLE-01', plannedQty: 10 },
        { skuCode: 'SN-DEMO-01', plannedQty: 2 },
      ],
      arrivalMethod: 'LTL',
      containerNo: 'CONT-01',
      trackingNos: 'TRK-01',
      etaAt: '2026-10-22T08:00:00.000Z',
    })
    expect(result.ok).toBe(true)
    const order = useDb.getState().inbounds.find((o) => o.inboundNo === result.inboundNo)!
    expect(order.items).toHaveLength(2)
    expect(order.arrivalMethod).toBe('LTL')
    expect(order.containerNo).toBe('CONT-01')
    expect(order.etaAt).toBe('2026-10-22T08:00:00.000Z')
  })

  it('待收货零实收可变更明细，变更后预计数量重算', () => {
    const order = useDb.getState().inbounds.find((o) => o.status === 'PENDING_RECEIVE')!
    const before = order.items[0]
    const result = useDb.getState().mockChangeInboundInstruction({
      inboundNo: order.inboundNo,
      items: [{ skuCode: before.skuCode, plannedQty: before.plannedQty + 10 }],
    })
    expect(result).toEqual({ ok: true })
    const after = useDb.getState().inbounds.find((o) => o.inboundNo === order.inboundNo)!
    expect(after.items[0].plannedQty).toBe(before.plannedQty + 10)
    expect(useDb.getState().inboundMessages[0]).toMatchObject({
      inboundNo: order.inboundNo,
      action: 'CHANGE',
      status: 'ACCEPTED',
    })
  })

  it('全拒收零实收可由上游取消受理，整单及明细转已取消', () => {
    const order = useDb.getState().inbounds.find((o) => o.status === 'PENDING_RECEIVE')!
    const result = useDb.getState().mockCancelInboundInstruction({ inboundNo: order.inboundNo, reason: '全部拒收' })
    expect(result).toEqual({ ok: true })
    const after = useDb.getState().inbounds.find((o) => o.inboundNo === order.inboundNo)!
    expect(after.status).toBe('CANCELLED')
    expect(after.items.every((i) => i.status === 'CANCELLED')).toBe(true)
    expect(useDb.getState().inboundResults.some((r) => r.inboundNo === order.inboundNo)).toBe(false)
  })

  it('已有实收不能取消', () => {
    const withReceipt = useDb.getState().inbounds.find((o) => o.items.some((i) => i.receivedQty > 0))
    if (!withReceipt) return
    const result = useDb.getState().mockCancelInboundInstruction({ inboundNo: withReceipt.inboundNo })
    expect(result.ok).toBe(false)
  })
})

describe('退货收货', () => {
  beforeEach(resetDb)

  it('退货收货生成退货记录、拒收异常与退货来源上架单，并同步库存', () => {
    const order = useDb.getState().returnOrders[0]
    const result = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      containerNo: 'RT-BOX-01',
      lines: [{ skuCode: order.items[0].skuCode, goodQty: 3, defectQty: 0, rejectedQty: 1, rejectReason: 'DAMAGED' }],
      operator: 'tester',
    })
    expect(result).toEqual({ ok: true })
    const after = useDb.getState().returnOrders.find((o) => o.returnNo === order.returnNo)!
    expect(after.items[0].receivedQty).toBe(3)
    expect(after.items[0].rejectedQty).toBe(1)
    expect(useDb.getState().returnReceipts[0]).toMatchObject({ returnNo: order.returnNo })
    expect(useDb.getState().returnExceptions[0]).toMatchObject({ returnNo: order.returnNo, qty: 1 })
    const putaway = useDb.getState().putawayOrders.find((p) => p.sourceType === 'RETURN' && p.sourceNo === order.returnNo)!
    expect(putaway.planLines[0]).toMatchObject({ skuCode: order.items[0].skuCode, planQty: 3 })
    expect(
      useDb.getState().inventory.some(
        (r) =>
          r.warehouseCode === order.warehouseCode &&
          r.customerId === order.customerId &&
          r.skuCode === order.items[0].skuCode &&
          r.locationCode === 'STAGE-IN-01' &&
          r.onHandQty >= 3,
      ),
    ).toBe(true)
    expect(after.status).toBe('RECEIVING')
  })

  it('OMS Mock 退货预报生成退货单，重复预报返回原单', () => {
    const input = {
      customerId: 'C10028',
      warehouseCode: 'US-LA-01',
      sourceType: 'CUSTOMER' as const,
      upstreamNo: 'OMS-RT-TEST-001',
      skuCode: 'CABLE-01',
      plannedQty: 4,
    }
    const first = useDb.getState().mockReturnForecast(input)
    expect(first.ok).toBe(true)
    const second = useDb.getState().mockReturnForecast(input)
    expect(second).toEqual({ ok: true, returnNo: first.returnNo })
    expect(useDb.getState().returnOrders.filter((o) => o.upstreamNo === input.upstreamNo)).toHaveLength(1)
  })

  it('零实收退货单可取消，有实收后不能取消', () => {
    const order = useDb.getState().returnOrders[0]
    expect(useDb.getState().cancelReturnOrder(order.returnNo, 'test')).toEqual({ ok: true })
    expect(useDb.getState().returnOrders.find((o) => o.returnNo === order.returnNo)!.status).toBe('CANCELLED')

    const another = useDb.getState().returnOrders.find((o) => o.status === 'PENDING_RECEIVE')!
    useDb.getState().receiveReturn({
      returnNo: another.returnNo,
      lines: [{ skuCode: another.items[0].skuCode, goodQty: 1, defectQty: 0 }],
      operator: 'tester',
    })
    expect(useDb.getState().cancelReturnOrder(another.returnNo).ok).toBe(false)
  })

  it('退货收货超过剩余预计数量被拒绝', () => {
    const order = useDb.getState().returnOrders[0]
    const result = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      lines: [{ skuCode: order.items[0].skuCode, goodQty: order.items[0].plannedQty + 1, defectQty: 0 }],
      operator: 'tester',
    })
    expect(result).toEqual({ ok: false, errorKey: 'return.error.overRemain' })
  })
})
