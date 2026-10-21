import { describe, expect, it } from 'vitest'
import { applySavePutawayLine } from '@/mock/putaway-actions'
import { createSeedData } from '@/mock/seed'
import type { PutawayOrder } from '@/types/inbound'
import { NO_SUGGESTED_STOP, putawayStops } from './putaway'

const seed = () => {
  const s = createSeedData()
  return { s, ctx: { locations: s.locations, inventory: s.inventory, putawayOrders: s.putawayOrders } }
}
const shape = (stops: ReturnType<typeof putawayStops>) =>
  stops.map((st) => [st.location, st.lines.map((l) => `${l.skuCode}${l.batchNo ? `/${l.batchNo}` : ''}`)])

describe('PDA 上架路径（按推荐库位逐站）', () => {
  it('0011 一个容器三种商品分两站：A-01-01 线材，B-01-03 两个新商品', () => {
    const { s, ctx } = seed()
    const order = s.putawayOrders.find((p) => p.putawayNo === 'PA-20261011-0001')!
    expect(order.status).toBe('PENDING')
    expect(shape(putawayStops(order, ctx))).toEqual([
      ['A-01-01', ['CABLE-01']],
      ['B-01-03', ['ANKR-001', 'ANKR-002']],
    ])
  })

  it('只排还没落满的行；保存落位不动库存，剩下的站和推荐不变', () => {
    const { s, ctx } = seed()
    const res = applySavePutawayLine(s, { putawayNo: 'PA-20261011-0001', locationCode: 'A-01-01', planLineNo: 1, qty: 2 })
    expect(res.ok).toBe(true)
    const saved = res.order!
    expect(shape(putawayStops(saved, { ...ctx, putawayOrders: res.patch!.putawayOrders! }))).toEqual([
      ['B-01-03', ['ANKR-001', 'ANKR-002']],
    ])
  })

  it('同商品多批次在同一站，按应上架行分开', () => {
    const { s, ctx } = seed()
    const order = s.putawayOrders.find((p) => p.putawayNo === 'PA-20261005-0001')!
    expect(shape(putawayStops(order, ctx))).toEqual([['A-01-01', ['CABLE-01/BATCH-2026-A', 'CABLE-01/BATCH-2026-B']]])
  })

  it('没有推荐库位的行归到最后一站', () => {
    const { s, ctx } = seed()
    const base = s.putawayOrders.find((p) => p.putawayNo === 'PA-20261004-0002')!
    /** 不良隔离库位只有 DEFECT-01，且已有线材不良品：新商品找不到推荐库位 */
    const order: PutawayOrder = {
      ...base,
      planLines: [
        { lineNo: 1, receiptLineNo: 1, skuCode: 'ANKR-001', planQty: 1 },
        { lineNo: 2, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 2 },
      ],
    }
    expect(shape(putawayStops(order, ctx))).toEqual([
      ['DEFECT-01', ['CABLE-01']],
      [NO_SUGGESTED_STOP, ['ANKR-001']],
    ])
  })
})
