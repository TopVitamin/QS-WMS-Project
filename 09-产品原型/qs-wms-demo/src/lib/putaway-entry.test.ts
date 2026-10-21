import { describe, expect, it } from 'vitest'
import { applyConfirmPutawayEntry } from '@/mock/putaway-actions'
import { createSeedData } from '@/mock/seed'
import type { PutawayOrder, PutawayPlanLine } from '@/types/inbound'
import { suggestPutawayLocation, type PutawayLocationContext } from './putaway'
import {
  entryDrafts,
  entryGroups,
  entryPlacements,
  filledQty,
  firstEntryProblem,
  type EditedDrafts,
  type EntryDraft,
} from './putaway-entry'

const seed = () => {
  const s = createSeedData()
  const ctx = { locations: s.locations, inventory: s.inventory, putawayOrders: s.putawayOrders }
  const order = (no: string) => s.putawayOrders.find((p) => p.putawayNo === no)!
  return { s, ctx, order }
}
const noSerial = () => false
const draft = (id: string, locationCode: string, qty: string, serialText = ''): EntryDraft => ({
  id,
  locationCode,
  qty,
  serialText,
})

/** 每行都点了「用推荐」：默认落位的库位换成推荐库位 */
const useSuggestions = (o: PutawayOrder, ctx: PutawayLocationContext): EditedDrafts =>
  Object.fromEntries(
    [...entryDrafts(o, {})].map(([lineNo, rows]) => {
      const line = o.planLines.find((l) => l.lineNo === lineNo)!
      const location = suggestPutawayLocation(o, line.skuCode, ctx) ?? ''
      return [lineNo, rows.map((d) => ({ ...d, locationCode: location }))]
    }),
  )

describe('Web 端上架录入表', () => {
  it('没改过的行库位留空、数量填剩余；点了「用推荐」才能确认', () => {
    const { ctx, order } = seed()
    const o = order('PA-20261011-0001')
    const drafts = entryDrafts(o, {})
    expect([...drafts.values()].map((rows) => rows.map((d) => `${d.locationCode}×${d.qty}`))).toEqual([
      ['×2'],
      ['×1'],
      ['×6'],
    ])
    expect(firstEntryProblem(o, drafts, noSerial)).toMatchObject({ planLineNo: 1, key: 'missingLocation' })
    const filled = entryDrafts(o, useSuggestions(o, ctx))
    expect([...filled.values()].map((rows) => rows.map((d) => `${d.locationCode}×${d.qty}`))).toEqual([
      ['A-01-01×2'],
      ['B-01-03×1'],
      ['B-01-03×6'],
    ])
    expect(firstEntryProblem(o, filled, noSerial)).toBeUndefined()
  })

  it('PDA 已保存的落位算进合计，默认只补剩下的数量', () => {
    const { ctx, order } = seed()
    const o = order('PA-20261005-0001')
    const drafts = entryDrafts(o, useSuggestions(o, ctx))
    expect(drafts.get(1)!.map((d) => d.qty)).toEqual(['200'])
    expect(drafts.get(2)!.map((d) => d.qty)).toEqual(['300'])
    expect(firstEntryProblem(o, drafts, noSerial)).toBeUndefined()
    expect(filledQty(o, drafts)).toBe(800)
  })

  it('按行顺序报第一处问题：没填库位、数量不对、合计对不上', () => {
    const { order } = seed()
    const o = order('PA-20261005-0001')
    const base = (rows1: EntryDraft[]) =>
      new Map([
        [1, rows1],
        [2, [draft('b', 'A-01-01', '300')]],
      ])
    expect(firstEntryProblem(o, base([draft('a', ' ', '200')]), noSerial)).toEqual({
      planLineNo: 1,
      draftId: 'a',
      key: 'missingLocation',
      params: { sku: 'CABLE-01 · BATCH-2026-A' },
    })
    expect(firstEntryProblem(o, base([draft('a', 'A-01-01', '1.5')]), noSerial)?.key).toBe('qtyInvalid')
    /** 拆两个库位：已保存 300 + 150 + 30 = 480，应上架 500 */
    expect(firstEntryProblem(o, base([draft('a', 'A-01-01', '150'), draft('c', 'A-01-02', '30')]), noSerial)).toEqual({
      planLineNo: 1,
      key: 'sumMismatch',
      params: { sku: 'CABLE-01 · BATCH-2026-A', need: 500, got: 480 },
    })
  })

  it('SN 商品每条落位的序列号条数等于数量，拆开的每条各自校验', () => {
    const { order } = seed()
    const o = order('PA-20261011-0001')
    const isSerial = (line: PutawayPlanLine) => line.skuCode === 'ANKR-002'
    const drafts = new Map([
      [1, [draft('a', 'A-01-01', '2')]],
      [2, [draft('b', 'B-01-03', '1')]],
      [3, [draft('c', 'B-01-03', '4', 'SN1\nSN2\nSN3\nSN4'), draft('d', 'B-01-04', '2', 'SN5')]],
    ])
    expect(firstEntryProblem(o, drafts, isSerial)).toMatchObject({
      draftId: 'd',
      key: 'serialCount',
      params: { need: 2, got: 1 },
    })
    drafts.set(3, [drafts.get(3)![0], draft('d', 'B-01-04', '2', 'SN5, SN6')])
    expect(firstEntryProblem(o, drafts, isSerial)).toBeUndefined()
    expect(entryPlacements(o, drafts, isSerial).at(-1)).toMatchObject({ serialNos: ['SN5', 'SN6'], qty: 2 })
  })

  it('右侧清单按库位分组：PDA 已保存的在前，没填库位的单列', () => {
    const { order } = seed()
    const o = order('PA-20261005-0001')
    const drafts = new Map([
      [1, [draft('a', 'a-01-01', '150'), draft('c', '', '50')]],
      [2, [draft('b', 'A-01-01', '300')]],
    ])
    const { groups, pending } = entryGroups(o, drafts)
    expect(
      groups.map(
        (g) => `${g.location}:${g.items.map((i) => `${i.planLineNo}×${i.qty}${i.saved ? '(PDA)' : ''}`).join(',')}`,
      ),
    ).toEqual(['A-02-01:1×300(PDA)', 'A-01-01:1×150,2×300'])
    expect(pending).toEqual([{ planLineNo: 1, qty: 50 }])
    expect(filledQty(o, drafts)).toBe(750)
  })
})

describe('确认上架（逐条保存后整单提交，全部通过才生效）', () => {
  it('落位全部合法：整单完成，库存从暂存移到目标库位', () => {
    const { s, ctx, order } = seed()
    const o = order('PA-20261011-0001')
    const drafts = entryDrafts(o, useSuggestions(o, ctx))
    const res = applyConfirmPutawayEntry(s, {
      putawayNo: o.putawayNo,
      placements: entryPlacements(o, drafts, noSerial),
      operator: 'tester',
    })
    expect(res.ok).toBe(true)
    expect(res.order).toMatchObject({ status: 'COMPLETED', submittedBy: 'tester' })
    expect(res.order!.actualLines.map((a) => `${a.locationCode}:${a.skuCode}×${a.qty}`)).toEqual([
      'A-01-01:CABLE-01×2',
      'B-01-03:ANKR-001×1',
      'B-01-03:ANKR-002×6',
    ])
    const onHand = (location: string, skuCode: string) =>
      res
        .patch!.inventory!.filter(
          (r) => r.warehouseCode === o.warehouseCode && r.locationCode === location && r.skuCode === skuCode,
        )
        .reduce((n, r) => n + r.onHandQty, 0)
    const before = (location: string, skuCode: string) =>
      s.inventory
        .filter((r) => r.warehouseCode === o.warehouseCode && r.locationCode === location && r.skuCode === skuCode)
        .reduce((n, r) => n + r.onHandQty, 0)
    expect(onHand('B-01-03', 'ANKR-002') - before('B-01-03', 'ANKR-002')).toBe(6)
    expect(before('STAGE-IN-01', 'ANKR-002') - onHand('STAGE-IN-01', 'ANKR-002')).toBe(6)
  })

  it('中间一条库位不能放：指出第几条，什么都不写（前面的落位也不保存）', () => {
    const { s, order } = seed()
    const o = order('PA-20261011-0001')
    const res = applyConfirmPutawayEntry(s, {
      putawayNo: o.putawayNo,
      placements: [
        { planLineNo: 1, locationCode: 'A-01-01', qty: 2 },
        { planLineNo: 2, locationCode: 'STAGE-IN-01', qty: 1 },
        { planLineNo: 3, locationCode: 'B-01-03', qty: 6 },
      ],
      operator: 'tester',
    })
    expect(res).toMatchObject({ ok: false, errorKey: 'pdaPutaway.error.staging', failedIndex: 1 })
    expect(res.patch).toBeUndefined()
    expect(order('PA-20261011-0001')).toMatchObject({ status: 'PENDING', actualLines: [] })
  })

  it('落位都能放但合计不满：提交不过，failedIndex 为空', () => {
    const { s, order } = seed()
    const o = order('PA-20261011-0001')
    const res = applyConfirmPutawayEntry(s, {
      putawayNo: o.putawayNo,
      placements: [{ planLineNo: 1, locationCode: 'A-01-01', qty: 2 }],
      operator: 'tester',
    })
    expect(res).toMatchObject({ ok: false, errorKey: 'pdaPutaway.error.planMismatch' })
    expect(res.failedIndex).toBeUndefined()
  })
})
