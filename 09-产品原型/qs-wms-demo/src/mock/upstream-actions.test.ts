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
      containers: [
        {
          containerNo: 'RT-BOX-01',
          lines: [{ skuCode: order.items[0].skuCode, goodQty: 3, defectQty: 0, rejectedQty: 1, rejectReason: '外包装严重破损' }],
        },
      ],
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
      containers: [{ bulkPiece: true, lines: [{ skuCode: another.items[0].skuCode, goodQty: 1, defectQty: 0 }] }],
      operator: 'tester',
    })
    expect(useDb.getState().cancelReturnOrder(another.returnNo).ok).toBe(false)
  })

  it('退货收货超过剩余预计数量被拒绝', () => {
    const order = useDb.getState().returnOrders[0]
    const result = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      containers: [
        { bulkPiece: true, lines: [{ skuCode: order.items[0].skuCode, goodQty: order.items[0].plannedQty + 1, defectQty: 0 }] },
      ],
      operator: 'tester',
    })
    expect(result).toEqual({ ok: false, errorKey: 'return.error.overRemain' })
  })
})

describe('退货收货补齐（多容器、派送失败、SN 核对）', () => {
  beforeEach(resetDb)

  it('多容器一次提交生成一条收货记录，按容器×品质生成上架单', () => {
    const order = useDb.getState().returnOrders[0]
    const sku = order.items[0].skuCode
    const result = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      containers: [
        { containerNo: 'RT-BOX-A', lines: [{ skuCode: sku, goodQty: 1, defectQty: 0 }] },
        { containerNo: 'RT-BOX-B', lines: [{ skuCode: sku, goodQty: 1, defectQty: 1 }] },
      ],
      operator: 'tester',
    })
    expect(result).toEqual({ ok: true })
    const receipt = useDb.getState().returnReceipts[0]
    expect(receipt.lines.map((l) => l.containerNo)).toEqual(['RT-BOX-A', 'RT-BOX-B'])
    const putaways = useDb.getState().putawayOrders.filter(
      (p) => p.sourceType === 'RETURN' && p.sourceNo === order.returnNo,
    )
    expect(putaways.map((p) => `${p.containerNo}:${p.qualityType}`).sort()).toEqual([
      'RT-BOX-A:GOOD',
      'RT-BOX-B:DEFECTIVE',
      'RT-BOX-B:GOOD',
    ])
  })

  it('同一容器号不能在一次提交里重复，也不能在本单重复使用', () => {
    const order = useDb.getState().returnOrders[0]
    const sku = order.items[0].skuCode
    const dup = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      containers: [
        { containerNo: 'RT-BOX-A', lines: [{ skuCode: sku, goodQty: 1, defectQty: 0 }] },
        { containerNo: 'rt-box-a', lines: [{ skuCode: sku, goodQty: 1, defectQty: 0 }] },
      ],
      operator: 'tester',
    })
    expect(dup).toEqual({ ok: false, errorKey: 'return.error.containerDuplicated' })

    const first = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      containers: [{ containerNo: 'RT-BOX-A', lines: [{ skuCode: sku, goodQty: 1, defectQty: 0 }] }],
      operator: 'tester',
    })
    expect(first).toEqual({ ok: true })
    const again = useDb.getState().receiveReturn({
      returnNo: order.returnNo,
      containers: [{ containerNo: 'RT-BOX-A', lines: [{ skuCode: sku, goodQty: 1, defectQty: 0 }] }],
      operator: 'tester',
    })
    expect(again).toMatchObject({ ok: false, errorKey: 'return.error.containerAlreadyUsed' })
  })

  it('派送失败扫原 B2C 出库单建退货单，按已发数量生成明细', () => {
    const outbound = useDb.getState().outboundOrders.find((o) => o.status === 'SHIPPED' && o.type === 'B2C')!
    const result = useDb.getState().createDeliveryFailedReturn({ outboundNo: outbound.no, operator: 'tester' })
    expect(result.ok).toBe(true)
    const order = useDb.getState().returnOrders.find((o) => o.returnNo === result.returnNo)!
    expect(order.sourceType).toBe('DELIVERY_FAILED')
    expect(order.originalOutboundNo).toBe(outbound.no)
    expect(order.items.map((i) => i.plannedQty)).toEqual(outbound.items.filter((i) => i.shippedQty > 0).map((i) => i.shippedQty))
  })

  it('有原出库 SN 依据时，不一致的 SN 只能拒收', () => {
    const state = useDb.getState()
    const outbound = state.outboundOrders.find((o) => o.status === 'SHIPPED' && o.type === 'B2C')!
    const sku = 'SN-DEMO-01'
    useDb.setState({
      outboundOrders: state.outboundOrders.map((o) =>
        o.no === outbound.no
          ? { ...o, items: o.items.map((i, idx) => (idx === 0 ? { ...i, skuCode: sku } : i)) }
          : o,
      ),
      outboundVerifications: [
        ...state.outboundVerifications,
        {
          no: `VF-${outbound.no}-TEST`,
          orderNo: outbound.no,
          method: 'PACK',
          containerType: 'PACKAGE',
          containerNo: 'PKG-TEST',
          lines: [{ assignmentId: 'A-TEST', itemNo: 1, skuCode: sku, qty: 1, effectiveQty: 1, serialNos: ['SN00000001'] }],
          at: new Date().toISOString(),
          operator: 'seed',
        },
      ],
    })
    const forecast = useDb.getState().mockReturnForecast({
      customerId: outbound.customerId,
      warehouseCode: outbound.warehouseCode,
      sourceType: 'CUSTOMER',
      upstreamNo: 'OMS-RT-SN-TEST',
      skuCode: sku,
      plannedQty: 1,
      originalOutboundNo: outbound.no,
    })
    expect(forecast.ok).toBe(true)

    const mismatch = useDb.getState().receiveReturn({
      returnNo: forecast.returnNo!,
      containers: [{ bulkPiece: true, lines: [{ skuCode: sku, goodQty: 1, defectQty: 0, goodSerialNos: ['SN99999999'] }] }],
      operator: 'tester',
    })
    expect(mismatch).toMatchObject({ ok: false, errorKey: 'return.error.snMismatchRejectOnly' })

    const rejected = useDb.getState().receiveReturn({
      returnNo: forecast.returnNo!,
      containers: [
        {
          bulkPiece: true,
          lines: [
            {
              skuCode: sku,
              goodQty: 0,
              defectQty: 0,
              rejectedQty: 1,
              rejectReason: 'SN核对不一致',
              rejectedSerialNos: ['SN99999999'],
            },
          ],
        },
      ],
      operator: 'tester',
    })
    expect(rejected).toEqual({ ok: true })
    const receipt = useDb.getState().returnReceipts.find((r) => r.returnNo === forecast.returnNo)!
    expect(receipt.lines[0].serialCheckBasis).toBe('ORIGINAL_OUTBOUND')
    expect(receipt.lines[0].rejectedSerialNos).toEqual(['SN99999999'])
  })
})

describe('OMS Mock 基础资料推送', () => {
  beforeEach(resetDb)

  it('推送启用商品被接受，停用货主被拒绝并留痕', () => {
    const accepted = useDb.getState().mockPushMasterData({ masterType: 'SKU', ownerCode: 'ANKR', skuCode: 'CABLE-01' })
    expect(accepted).toEqual({ ok: true })
    expect(useDb.getState().masterMessages[0]).toMatchObject({ masterType: 'SKU', status: 'ACCEPTED' })

    const rejected = useDb.getState().mockPushMasterData({ masterType: 'OWNER', ownerCode: 'KIDO' })
    expect(rejected).toMatchObject({ ok: false, errorKey: 'masterPush.error.ownerInvalid' })
    expect(useDb.getState().masterMessages[0]).toMatchObject({ masterType: 'OWNER', status: 'REJECTED' })
    expect(useDb.getState().auditLogs[0].action).toBe('MASTER_MOCK_PUSH')
  })
})

describe('一期演示数据覆盖', () => {
  beforeEach(resetDb)

  it('自营货主、大件/异形/带电商品和美东/德国库区货位有种子', () => {
    const s = useDb.getState()
    expect(s.skuMasters.some((m) => m.ownerCode === 'OWNER-SELF' && m.code === 'OWNER-SELF-001')).toBe(true)
    expect(s.inbounds.some((o) => o.customerId === 'SELF-001')).toBe(true)
    expect(s.skuMasters.find((m) => m.code === 'BIG-01')?.productForm).toBe('LARGE')
    expect(s.skuMasters.find((m) => m.code === 'ODD-01')?.productForm).toBe('IRREGULAR')
    expect(s.skuMasters.find((m) => m.code === 'BATT-01')?.isBattery).toBe(true)
    expect(s.zoneMasters.some((z) => z.warehouseCode === 'US-NJ-01')).toBe(true)
    expect(s.zoneMasters.some((z) => z.warehouseCode === 'DE-FRA-01')).toBe(true)
    expect(s.locationMasters.some((l) => l.warehouseCode === 'US-NJ-01')).toBe(true)
    expect(s.locationMasters.some((l) => l.warehouseCode === 'DE-FRA-01')).toBe(true)
  })
})

describe('退货结果重试', () => {
  beforeEach(resetDb)

  it('失败结果重试沿用原结果，不重复上架或扣库', () => {
    const order = useDb.getState().returnOrders[0]
    const state = useDb.getState()
    useDb.setState({
      returnResults: [
        {
          sequence: 1,
          returnNo: order.returnNo,
          upstreamNo: order.upstreamNo,
          sourceType: order.sourceType,
          sourceAssociationNo: order.originalOutboundNo ?? order.platformReturnNo ?? order.upstreamNo,
          status: 'FAILED',
          attempts: 1,
          items: [{
            skuCode: order.items[0].skuCode,
            plannedQty: 0,
            receivedQty: 0,
            goodQty: 0,
            defectQty: 0,
            rejectedQty: 0,
            shortQty: 0,
            putawayQty: 0,
          }],
          at: new Date().toISOString(),
        },
        ...state.returnResults,
      ],
    })
    expect(useDb.getState().retryReturnResult(order.returnNo)).toEqual({ ok: true })
    const result = useDb.getState().returnResults.find((r) => r.returnNo === order.returnNo)!
    expect(result.status).toBe('SENT')
    expect(result.attempts).toBe(2)
    expect(useDb.getState().putawayOrders.filter((p) => p.sourceNo === order.returnNo)).toHaveLength(0)
  })
})
