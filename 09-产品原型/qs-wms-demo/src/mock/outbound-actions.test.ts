import { describe, expect, it } from 'vitest'
import { resetOutboundSeedInventory } from './outbound-seed'
import { createSeedData, type SeedData } from './seed'
import { applyOutboundAction, emptyOutboundData, outboundAvailable, orderAssignments } from './outbound-actions'
import type { OutboundCommand, OutboundCreateInput, OutboundType } from '@/types/outbound'

const AT = '2026-10-15T09:00:00.000Z'
function fixture() {
  const s = createSeedData()
  Object.assign(s, emptyOutboundData())
  s.inventory = s.inventory.filter((r) => r.id.startsWith('INV-OUT-SEED-0-'))
  resetOutboundSeedInventory(s.inventory, 'US-LA-01', 0)
  s.inventoryLogs = []
  s.putawayOrders = []
  return s
}
function act(s: SeedData, c: OutboundCommand) {
  const result = applyOutboundAction(s, c, 'tester', AT)
  if (result.patch) Object.assign(s, result.patch)
  return result
}
function ok(s: SeedData, c: OutboundCommand) {
  const r = act(s, c)
  expect(r.ok, !r.ok ? r.errorKey : '').toBe(true)
  if (!r.ok) throw new Error(r.errorKey)
  return r.no!
}
function input(s: SeedData, type: OutboundType = 'B2C', sku = 'CABLE-01', qty = 3): OutboundCreateInput {
  return {
    type,
    warehouseCode: 'US-LA-01',
    customerId: 'C10028',
    source: 'OMS',
    upstreamNo: `UP-${s.outboundOrders.length}`,
    messageId: `M-${s.outboundMessages.length}`,
    version: 0,
    recipient: 'Demo',
    address: 'Demo address',
    originalInboundNo: type === 'PURCHASE_RETURN' ? 'IB-DEMO' : undefined,
    items: [{ skuCode: sku, qty }],
  }
}
function create(s: SeedData, type: OutboundType = 'B2C', sku = 'CABLE-01', qty = 3) {
  return ok(s, { type: 'CREATE', input: input(s, type, sku, qty) })
}
function pick(s: SeedData, no: string, qty?: number, id?: string) {
  const t = s.outboundPickTasks.find((t) => t.no === no)!
  const l = t.lines.find((l) => l.plannedQty > l.pickedQty + l.shortageQty)!
  const q = qty ?? l.plannedQty - l.pickedQty - l.shortageQty
  const sns = s.inventory.find((r) => r.id === l.inventoryId)?.serialNos?.slice(0, q) ?? []
  return ok(s, {
    type: 'PICK',
    no,
    lineId: l.id,
    location: l.locationCode,
    sku: l.skuCode,
    batch: l.batchNo,
    serialNos: sns,
    qty: q,
    confirmationId: id ?? `C-${s.inventoryLogs.length}`,
  })
}
function pickAll(s: SeedData, no: string) {
  while (s.outboundPickTasks.find((t) => t.no === no)!.lines.some((l) => l.plannedQty > l.pickedQty + l.shortageQty))
    pick(s, no)
  ok(s, { type: 'FINISH_PICK', no })
}
function verify(s: SeedData, no: string) {
  return ok(s, {
    type: 'VERIFY',
    no,
    method: 'PACK',
    containerType: 'PACKAGE',
    containerNo: `PKG-${no}`,
    weightKg: 0.5,
    lines: orderAssignments(s, no)
      .filter((a) => a.activeQty)
      .map((a) => ({ assignmentId: a.id, qty: a.activeQty, serialNos: a.activeSerialNos })),
  })
}
function total(s: SeedData) {
  return s.inventory.reduce((n, r) => n + r.onHandQty, 0)
}

describe('outbound inventory contract', () => {
  it('SN wave cancellation keeps the other order and supports split return placements without moving drafts', () => {
    const s = fixture()
    const a = create(s, 'B2C', 'SN-DEMO-01', 2),
      b = create(s, 'B2C', 'SN-DEMO-01', 2)
    const waveNo = ok(s, { type: 'WAVE', orderNos: [a, b] })
    const taskNo = s.outboundWaves.find((w) => w.no === waveNo)!.taskNo
    pick(s, taskNo, 3)
    const otherSn = orderAssignments(s, b)[0].activeSerialNos[0]
    ok(s, { type: 'CANCEL', no: a, messageId: 'sn-cancel', version: 1 })
    const pb = s.outboundPutbacks[0],
      line = pb.lines[0],
      stock = structuredClone(s.inventory)
    ok(s, { type: 'SAVE_PUTBACK', no: pb.no, lineId: line.id, location: 'A-01-02', qty: 1 })
    expect(act(s, { type: 'SUBMIT_PUTBACK', no: pb.no }).ok).toBe(false)
    ok(s, { type: 'RESET_PUTBACK_LINE', no: pb.no, lineId: line.id })
    ok(s, { type: 'SAVE_PUTBACK', no: pb.no, lineId: line.id, location: 'A-01-02', qty: 1 })
    ok(s, { type: 'SAVE_PUTBACK', no: pb.no, lineId: line.id, location: 'B-02-01', qty: 1 })
    expect(s.inventory).toEqual(stock)
    const actuals = s.outboundPutbacks[0].lines[0].placements!
    expect(actuals.map((p) => p.serialNos.length)).toEqual([1, 1])
    ok(s, { type: 'SUBMIT_PUTBACK', no: pb.no })
    expect(orderAssignments(s, b)[0].activeSerialNos).toEqual([otherSn])
    expect(s.inventory.find((r) => r.locationCode === 'B-02-01')!.serialNos).toEqual(actuals[1].serialNos)
    expect(s.inventory.flatMap((r) => r.serialNos ?? [])).toHaveLength(5)
  })
  it('return placement keeps the serial numbers actually scanned, in any order', () => {
    const s = fixture()
    const no = create(s, 'B2C', 'SN-DEMO-01', 2)
    const taskNo = ok(s, { type: 'ALLOCATE', no })
    pickAll(s, taskNo)
    ok(s, { type: 'CANCEL', no, messageId: 'sn-cancel-scan', version: 1 })
    const pb = s.outboundPutbacks[0]
    const line = pb.lines[0]
    const [first, second] = line.serialNos
    const save = (serialNos: string[], location = 'A-01-02') =>
      act(s, { type: 'SAVE_PUTBACK', no: pb.no, lineId: line.id, location, qty: serialNos.length, serialNos })
    expect(save(['SN-NOT-ON-LINE']).ok).toBe(false)
    expect(save([second]).ok).toBe(true)
    expect(save([second]).ok).toBe(false)
    expect(save([first], 'B-02-01').ok).toBe(true)
    expect(s.outboundPutbacks[0].lines[0].placements!.map((p) => p.serialNos)).toEqual([[second], [first]])
    ok(s, { type: 'SUBMIT_PUTBACK', no: pb.no })
    expect(s.inventory.find((r) => r.locationCode === 'B-02-01')!.serialNos).toEqual([first])
  })
  it('moves each scan immediately; finish does not move; shipment deducts once', () => {
    const s = fixture()
    const initial = total(s)
    const no = create(s)
    const t = ok(s, { type: 'ALLOCATE', no })
    expect(s.outboundOrders[0].status).toBe('PENDING_PICK')
    pick(s, t, 1)
    expect(s.outboundOrders[0].items[0].pickedQty).toBe(1)
    expect(s.inventory.filter((r) => r.locationCode === 'STAGE-OUT-01').reduce((n, r) => n + r.onHandQty, 0)).toBe(1)
    pick(s, t, 2)
    const moved = structuredClone(s.inventory)
    ok(s, { type: 'FINISH_PICK', no: t })
    expect(s.inventory).toEqual(moved)
    expect(total(s)).toBe(initial)
    verify(s, no)
    ok(s, { type: 'SHIP', no })
    expect(total(s)).toBe(initial - 3)
    expect(outboundAvailable(s, 'US-LA-01', 'C10028', 'CABLE-01')).toBe(35)
    expect(act(s, { type: 'SHIP', no }).ok).toBe(false)
    expect(total(s)).toBe(initial - 3)
  })
  it('rejects all B2C lines atomically if one SKU is short', () => {
    const s = fixture()
    const p = input(s)
    p.items.push({ skuCode: 'SN-DEMO-01', qty: 100 })
    expect(act(s, { type: 'CREATE', input: p }).ok).toBe(false)
    expect(s.outboundOrders).toHaveLength(0)
    expect(s.outboundMessages[0].status).toBe('REJECTED')
    expect(outboundAvailable(s, 'US-LA-01', 'C10028', 'CABLE-01')).toBe(38)
  })
  it('accepts partial reservation for FBA and closes once with unshipped quantity', () => {
    const s = fixture()
    const no = create(s, 'FBA', 'LOT-DEMO-01', 12)
    // The expired stored batch is defective; 8 normal units can be reserved and picked.
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(8)
    const task = ok(s, { type: 'ALLOCATE', no })
    pickAll(s, task)
    verify(s, no)
    ok(s, { type: 'SHIP', no })
    expect(s.outboundResults[0].items[0]).toEqual({ skuCode: 'LOT-DEMO-01', shippedQty: 8, unshippedQty: 4 })
    // 预占留作缺货追溯（缺货＝需求－预占＝4）；已出库单不再占可用量
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(8)
    const goodOnHand = s.inventory
      .filter((r) => r.warehouseCode === 'US-LA-01' && r.customerId === s.outboundOrders[0].customerId)
      .filter((r) => r.skuCode === 'LOT-DEMO-01' && r.qualityType === 'GOOD')
      .reduce((n, r) => n + r.onHandQty, 0)
    expect(outboundAvailable(s, 'US-LA-01', s.outboundOrders[0].customerId, 'LOT-DEMO-01')).toBe(goodOnHand)
  })
  it.each(['TRANSFER', 'PURCHASE_RETURN'] as const)('%s cannot short ship', (type) => {
    const s = fixture()
    const no = create(s, type, 'LOT-DEMO-01', 12)
    const task = ok(s, { type: 'ALLOCATE', no })
    pickAll(s, task)
    verify(s, no)
    expect(act(s, { type: 'SHIP', no }).ok).toBe(false)
    expect(s.outboundOrders[0].status).toBe('PENDING_PICK')
  })
  it('reserves staging stock but cannot allocate it; failed B2C allocation leaves no partial allocations', () => {
    const s = fixture()
    s.inventory
      .filter((r) => r.qualityType === 'GOOD' && r.customerId === 'C10028' && r.skuCode === 'CABLE-01')
      .forEach((r) => {
        r.locationCode = 'STAGE-IN-01'
      })
    const no = create(s)
    const before = structuredClone(s.inventory)
    expect(act(s, { type: 'ALLOCATE', no }).ok).toBe(false)
    expect(s.inventory).toEqual(before)
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(3)
  })
  it('keeps fixed wave ownership after partial scanning and member cancellation', () => {
    const s = fixture()
    const a = create(s)
    const b = create(s, 'B2C', 'CABLE-01', 2)
    const w = ok(s, { type: 'WAVE', orderNos: [a, b] })
    const task = s.outboundWaves.find((wv) => wv.no === w)!.taskNo
    pick(s, task, 4)
    expect(orderAssignments(s, a).reduce((n, a) => n + a.activeQty, 0)).toBe(3)
    expect(orderAssignments(s, b).reduce((n, a) => n + a.activeQty, 0)).toBe(1)
    ok(s, { type: 'CANCEL', no: a, messageId: 'cancel-a', version: 1 })
    expect(s.outboundPutbacks[0].lines.reduce((n, l) => n + l.qty, 0)).toBe(3)
    expect(orderAssignments(s, b).reduce((n, a) => n + a.activeQty, 0)).toBe(1)
    pickAll(s, task)
    expect(s.outboundOrders.find((o) => o.no === b)!.items[0].pickedQty).toBe(2)
    expect(s.inventory.some((r) => (r.allocatedQty ?? 0) < 0)).toBe(false)
  })
  it('cancels unscanned order without inventing stock movement', () => {
    const s = fixture()
    const no = create(s)
    ok(s, { type: 'ALLOCATE', no })
    const before = total(s)
    ok(s, { type: 'CANCEL', no, messageId: 'cancel', version: 1 })
    expect(s.outboundPutbacks).toHaveLength(0)
    expect(s.inventoryLogs.filter((l) => l.qtyChange !== 0)).toHaveLength(0)
    expect(total(s)).toBe(before)
    expect(s.inventory.every((r) => !r.allocatedQty)).toBe(true)
  })
  it('saves return without moving; submission moves once and preserves total', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    ok(s, { type: 'CANCEL', no, messageId: 'cancel', version: 1 })
    const p = s.outboundPutbacks[0]
    const before = structuredClone(s.inventory)
    p.lines.forEach((l) => ok(s, { type: 'SAVE_PUTBACK', no: p.no, lineId: l.id, location: 'A-01-01', qty: l.qty }))
    expect(s.inventory).toEqual(before)
    const n = total(s)
    ok(s, { type: 'SUBMIT_PUTBACK', no: p.no })
    expect(total(s)).toBe(n)
    const returned = structuredClone(s.inventory)
    expect(act(s, { type: 'SUBMIT_PUTBACK', no: p.no }).ok).toBe(false)
    expect(s.inventory).toEqual(returned)
  })
  it('other outbound allocates specified defective stock once and has no order reservation', () => {
    const s = fixture()
    const r = s.inventory.find(
      (r) => r.customerId === 'C10028' && r.skuCode === 'CABLE-01' && r.qualityType === 'DEFECTIVE',
    )!
    const p = input(s, 'OTHER', 'CABLE-01', 2)
    p.specified = [{ inventoryId: r.id, itemNo: 1, qty: 2, serialNos: [] }]
    const no = ok(s, { type: 'CREATE', input: p })
    expect(s.inventory.find((x) => x.id === r.id)!.allocatedQty).toBe(2)
    const task = ok(s, { type: 'ALLOCATE', no })
    expect(s.inventory.find((x) => x.id === r.id)!.allocatedQty).toBe(2)
    pickAll(s, task)
    verify(s, no)
    ok(s, { type: 'SHIP', no })
    expect(
      s.inventory
        .filter((x) => x.qualityType === 'DEFECTIVE' && x.skuCode === 'CABLE-01')
        .reduce((n, r) => n + r.onHandQty, 0),
    ).toBe(3)
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(0)
  })
  it('duplicate scan confirmation and upstream messages never duplicate stock or orders', () => {
    const s = fixture()
    const p = input(s)
    const no = ok(s, { type: 'CREATE', input: p })
    ok(s, { type: 'CREATE', input: p })
    expect(s.outboundOrders).toHaveLength(1)
    const task = ok(s, { type: 'ALLOCATE', no })
    pick(s, task, 1, 'same')
    const after = structuredClone(s.inventory)
    pick(s, task, 1, 'same')
    expect(s.inventory).toEqual(after)
    expect(s.outboundOrders[0].items[0].pickedQty).toBe(1)
  })
  it('failed change preserves previous order and reservation; accepted version replaces both', () => {
    const s = fixture()
    const no = create(s)
    expect(
      act(s, { type: 'CHANGE', no, messageId: 'change-fail', version: 1, items: [{ skuCode: 'CABLE-01', qty: 100 }] })
        .ok,
    ).toBe(false)
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(3)
    ok(s, { type: 'CHANGE', no, messageId: 'change-ok', version: 1, items: [{ skuCode: 'CABLE-01', qty: 2 }] })
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(2)
    ok(s, { type: 'ALLOCATE', no })
    expect(
      act(s, { type: 'CHANGE', no, messageId: 'change-late', version: 2, items: [{ skuCode: 'CABLE-01', qty: 1 }] }).ok,
    ).toBe(false)
  })
  it('shortage allows one replacement then blocks allocation while existing allocations finish', () => {
    const s = fixture()
    const no = create(s)
    const task = ok(s, { type: 'ALLOCATE', no })
    const t = s.outboundPickTasks[0]
    ok(s, { type: 'SHORTAGE', no: task, lineId: t.lines[0].id, qty: 1, reason: 'MISSING' })
    expect(s.outboundPickTasks[0].lines).toHaveLength(2)
    expect(s.skuAllocationControls).toHaveLength(1)
    const another = create(s, 'B2C', 'CABLE-01', 1)
    expect(act(s, { type: 'ALLOCATE', no: another }).ok).toBe(false)
    pickAll(s, task)
    expect(s.outboundOrders[0].items[0].pickedQty).toBe(3)
  })
  it('missing picked item returns expected quantity, count adjusts loss and clears pending check only on confirmation', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    verify(s, no)
    const a = orderAssignments(s, no)[0]
    const n = total(s)
    const pb = ok(s, { type: 'UNPICK', no, assignmentId: a.id, qty: 1, serialNos: [], reason: 'MISSING' })
    expect(s.outboundOrders[0].items[0].verifiedQty).toBe(2)
    expect(act(s, { type: 'ALLOCATE', no }).ok).toBe(false)
    const p = s.outboundPutbacks[0]
    ok(s, { type: 'SAVE_PUTBACK', no: pb, lineId: p.lines[0].id, location: 'A-01-01', qty: 1 })
    ok(s, { type: 'SUBMIT_PUTBACK', no: pb })
    expect(total(s)).toBe(n)
    const c1 = ok(s, { type: 'CREATE_COUNT', warehouseCode: 'US-LA-01', customerId: 'C10028', skuCode: 'CABLE-01' })
    ok(s, { type: 'CANCEL_COUNT', no: c1 })
    expect(s.skuAllocationControls).toHaveLength(1)
    const countNo = ok(s, {
      type: 'CREATE_COUNT',
      warehouseCode: 'US-LA-01',
      customerId: 'C10028',
      skuCode: 'CABLE-01',
    })
    const count = s.inventoryCounts.find((c) => c.no === countNo)!
    const source = s.inventory.find(
      (r) => r.locationCode === 'A-01-01' && r.customerId === 'C10028' && r.skuCode === 'CABLE-01',
    )!
    ok(s, {
      type: 'CONFIRM_COUNT',
      no: countNo,
      lines: count.lines.map((l) => ({
        inventoryId: l.inventoryId,
        qty: l.bookQty - (l.inventoryId === source.id ? 1 : 0),
        serialNos: [],
      })),
    })
    expect(total(s)).toBe(n - 1)
    expect(s.skuAllocationControls).toHaveLength(0)
    const supp = ok(s, { type: 'ALLOCATE', no })
    expect(s.outboundPickTasks.find((t) => t.no === supp)!.lines.reduce((n, l) => n + l.plannedQty, 0)).toBe(1)
    expect(ok(s, { type: 'ALLOCATE', no })).toBe(supp)
  })
  it('SN ownership, duplicate review and delete/redo remain consistent', () => {
    const s = fixture()
    const no = create(s, 'WHOLESALE', 'SN-DEMO-01', 2)
    const task = ok(s, { type: 'ALLOCATE', no })
    pickAll(s, task)
    const a = orderAssignments(s, no)[0]
    expect(a.activeSerialNos).toHaveLength(2)
    const v = verify(s, no)
    expect(
      act(s, {
        type: 'VERIFY',
        no,
        method: 'PACK',
        containerType: 'BOX',
        containerNo: 'B2',
        lines: [{ assignmentId: a.id, qty: 1, serialNos: [a.activeSerialNos[0]] }],
      }).ok,
    ).toBe(false)
    ok(s, { type: 'DELETE_VERIFY', no: v })
    verify(s, no)
    ok(s, { type: 'SHIP', no })
    expect(s.inventory.filter((r) => r.skuCode === 'SN-DEMO-01').flatMap((r) => r.serialNos ?? [])).toHaveLength(3)
  })
  it('stored expiry is excluded; expiry passing after pick adds no shipping recheck', () => {
    const s = fixture()
    const expired = s.inventory.find((r) => r.batchNo === 'LOT-EXPIRED')!
    expired.qualityType = 'GOOD'
    expired.lockedQty = 0
    const no = create(s, 'WHOLESALE', 'LOT-DEMO-01', 2)
    const task = ok(s, { type: 'ALLOCATE', no })
    expect(s.outboundPickTasks[0].lines[0].batchNo).toBe('LOT-202610')
    pickAll(s, task)
    verify(s, no)
    const result = applyOutboundAction(s, { type: 'SHIP', no }, 'tester', '2028-01-01T00:00:00.000Z')
    expect(result.ok).toBe(true)
  })
  it('warehouse and owner boundaries are applied by the shared action', () => {
    const s = fixture()
    create(s)
    expect(outboundAvailable(s, 'US-LA-01', 'C10031', 'CABLE-01')).toBe(6)
    expect(outboundAvailable(s, 'DE-FRA-01', 'C10028', 'CABLE-01')).toBe(0)
  })
  it('handover does not make a second stock deduction', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    verify(s, no)
    ok(s, { type: 'SHIP', no })
    const before = structuredClone(s.inventory)
    ok(s, {
      type: 'HANDOVER',
      no,
      method: 'CARRIER',
      party: 'Mock carrier',
      credential: 'MOCK-1',
      containerQty: 1,
      at: AT,
    })
    expect(s.inventory).toEqual(before)
  })
  it('message content is immutable and expected version must exactly match', () => {
    const s = fixture()
    const p = input(s)
    const no = ok(s, { type: 'CREATE', input: p })
    expect(act(s, { type: 'CREATE', input: { ...p, items: [{ skuCode: 'CABLE-01', qty: 2 }] } }).ok).toBe(false)
    expect(
      act(s, { type: 'CREATE', input: { ...p, messageId: 'new-message', items: [{ skuCode: 'CABLE-01', qty: 2 }] } })
        .ok,
    ).toBe(false)
    expect(
      act(s, { type: 'CHANGE', no, messageId: 'future', version: 99, items: [{ skuCode: 'CABLE-01', qty: 2 }] }).ok,
    ).toBe(false)
    expect(s.outboundOrders[0].items[0].reservedQty).toBe(3)
  })
  it('result retry reuses sequence, never moves stock again, and skips an already accepted result', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    verify(s, no)
    ok(s, { type: 'SHIP', no })
    const stock = structuredClone(s.inventory)
    ok(s, { type: 'RETRY_RESULT', no, simulateFailure: true })
    ok(s, { type: 'RETRY_RESULT', no })
    expect(act(s, { type: 'RETRY_RESULT', no })).toMatchObject({ ok: false, errorKey: 'outbound.error.resultSent' })
    expect(s.outboundResults).toHaveLength(1)
    expect(s.outboundResults[0]).toMatchObject({ sequence: 1, status: 'SENT', attempts: 2 })
    expect(s.inventory).toEqual(stock)
  })
  it('registers a handover together with shipment without deducting stock twice', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    verify(s, no)
    ok(s, {
      type: 'SHIP',
      no,
      handover: {
        method: 'DRIVER',
        party: 'Demo driver',
        credential: 'DN-1',
        containerQty: 1,
        at: AT,
        remark: 'with shipment',
      },
    })
    const stock = structuredClone(s.inventory)
    expect(s.outboundHandovers).toHaveLength(1)
    expect(s.outboundHandovers[0]).toMatchObject({ orderNo: no, method: 'DRIVER', party: 'Demo driver', containerQty: 1 })
    expect(act(s, { type: 'SHIP', no })).toMatchObject({ ok: false, errorKey: 'outbound.error.terminal' })
    ok(s, {
      type: 'HANDOVER',
      no,
      method: 'CARRIER',
      party: 'Demo carrier',
      credential: 'DN-2',
      containerQty: 1,
      at: AT,
    })
    expect(s.outboundHandovers).toHaveLength(2)
    expect(s.inventory).toEqual(stock)
  })
  it('stocktake excludes staging and blocks shipping until supervisor confirms even zero difference', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    verify(s, no)
    const countNo = ok(s, {
      type: 'CREATE_COUNT',
      warehouseCode: 'US-LA-01',
      customerId: 'C10028',
      skuCode: 'CABLE-01',
    })
    const count = s.inventoryCounts[0]
    expect(
      count.lines.every((l) => !s.inventory.find((r) => r.id === l.inventoryId)!.locationCode.startsWith('STAGE')),
    ).toBe(true)
    expect(act(s, { type: 'SHIP', no }).ok).toBe(false)
    ok(s, {
      type: 'CONFIRM_COUNT',
      no: countNo,
      lines: count.lines.map((l) => ({ inventoryId: l.inventoryId, qty: l.bookQty, serialNos: [] })),
    })
    ok(s, { type: 'SHIP', no })
  })
  it('damaged picked goods convert to defective and return to isolation', () => {
    const s = fixture()
    const no = create(s)
    pickAll(s, ok(s, { type: 'ALLOCATE', no }))
    const a = orderAssignments(s, no)[0]
    const pb = ok(s, { type: 'UNPICK', no, assignmentId: a.id, qty: 1, serialNos: [], reason: 'DAMAGED' })
    const p = s.outboundPutbacks[0]
    expect(p.lines[0].qualityType).toBe('DEFECTIVE')
    expect(s.outboundOrders[0].items[0].pickedQty).toBe(2)
    ok(s, { type: 'SAVE_PUTBACK', no: pb, lineId: p.lines[0].id, location: 'DEFECT-01', qty: 1 })
    ok(s, { type: 'SUBMIT_PUTBACK', no: pb })
    expect(s.inventory.filter((r) => r.locationCode === 'DEFECT-01').reduce((n, r) => n + r.onHandQty, 0)).toBe(6)
  })
})
