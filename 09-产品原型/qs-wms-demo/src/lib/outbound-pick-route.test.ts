import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/mock/seed'
import type { PickLine } from '@/types/outbound'
import {
  compareLocation,
  currentAndNextStop,
  pickLinesInRouteOrder,
  pickLocationProgress,
  pickStops,
  putbackStops,
  replacementStops,
} from './outbound-pick-route'

const line = (id: string, locationCode: string, plannedQty: number, pickedQty = 0, shortageQty = 0): PickLine => ({
  id,
  inventoryId: `INV-${id}`,
  locationCode,
  skuCode: 'CABLE-01',
  qualityType: 'GOOD',
  plannedQty,
  pickedQty,
  shortageQty,
  shares: [],
})

describe('按库位作业路径', () => {
  it('库位按巷道编号自然顺序排，A-01-02 在 A-01-10 前', () => {
    expect(['A-01-10', 'B-01-01', 'A-01-02'].sort(compareLocation)).toEqual(['A-01-02', 'A-01-10', 'B-01-01'])
  })

  it('只把还有剩余的应拣行分站，同库位多行归一站', () => {
    const lines = [line('1', 'B-01-01', 2), line('2', 'A-01-02', 3, 3), line('3', 'A-01-01', 1), line('4', 'A-01-01', 4, 1, 1)]
    const stops = pickStops({ lines })
    expect(stops.map((s) => s.location)).toEqual(['A-01-01', 'B-01-01'])
    expect(stops[0].lines.map((l) => l.id)).toEqual(['3', '4'])
    expect(pickLocationProgress({ lines })).toEqual({ done: 1, total: 3 })
    expect(pickLinesInRouteOrder({ lines }).map((l) => l.id)).toEqual(['3', '4', '1', '2'])
  })

  it('已到达的站优先；没到达或已拣完时回到路径第一站，下一站循环取', () => {
    const stops = [{ location: 'A-01-01' }, { location: 'A-01-02' }, { location: 'B-01-01' }]
    expect(currentAndNextStop(stops, 'A-01-02')).toMatchObject({
      current: { location: 'A-01-02' },
      next: { location: 'B-01-01' },
      arrived: true,
    })
    expect(currentAndNextStop(stops, 'Z-99')).toMatchObject({ current: { location: 'A-01-01' }, arrived: false })
    expect(currentAndNextStop(stops, 'B-01-01').next).toEqual({ location: 'A-01-01' })
    expect(currentAndNextStop([{ location: 'A-01-01' }]).next).toBeUndefined()
  })

  it('换位提示只算新增或加量的应拣行', () => {
    const before = [line('1', 'A-01-01', 5, 3, 0)]
    const after = [line('1', 'A-01-01', 5, 3, 2), line('2', 'B-01-01', 2)]
    expect(replacementStops(before, after)).toEqual([{ location: 'B-01-01', qty: 2 }])
    expect(replacementStops(before, [line('1', 'A-01-01', 5, 3, 2)])).toEqual([])
  })
})

describe('洛杉矶仓按库位演示种子', () => {
  const seed = createSeedData()
  const la = (suffix: string) => `OB-20261015-${suffix}`

  it('0019 的拣货任务跨两个库位：先 A-01-01 线材，再 A-01-02 SN 商品', () => {
    const task = seed.outboundPickTasks.find((t) => t.orderNo === la('0019'))!
    expect(task.status).toBe('PENDING_PICK')
    expect(pickStops(task).map((s) => [s.location, s.lines.map((l) => `${l.skuCode}×${l.plannedQty}`)])).toEqual([
      ['A-01-01', ['CABLE-01×3']],
      ['A-01-02', ['SN-DEMO-01×1']],
    ])
  })

  it('0020 拣后取消：返库上架单两行分别建议回 A-01-01、A-01-02，SN 随行', () => {
    const putback = seed.outboundPutbacks.find((p) => p.orderNo === la('0020'))!
    expect(putback.status).toBe('PENDING')
    const stops = putbackStops(putback)
    expect(stops.map((s) => s.location)).toEqual(['A-01-01', 'A-01-02'])
    expect(stops[1].lines[0].serialNos).toHaveLength(1)
  })
})
