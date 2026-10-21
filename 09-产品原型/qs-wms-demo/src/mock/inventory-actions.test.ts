import { describe, expect, it } from 'vitest'
import { deriveSerials, deriveSkuStocks } from '@/lib/inventory-derive'
import type { InventoryCommand } from '@/types/inventory'
import type { QualityType } from '@/types/wms'
import { applyInventoryAction } from './inventory-actions'
import { createSeedData, type SeedData } from './seed'

const AT = '2026-10-21T08:00:00.000Z'
const LA = 'US-LA-01'
const NJ = 'US-NJ-01'
const HOMY = 'C10031'
const ANKR = 'C10028'

function act(s: SeedData, c: InventoryCommand) {
  const r = applyInventoryAction(s, c, 'tester', AT)
  if (r.ok) Object.assign(s, r.patch)
  return r
}
function ok(s: SeedData, c: InventoryCommand) {
  const r = act(s, c)
  expect(r.ok, !r.ok ? `${r.errorKey} ${JSON.stringify(r.params)}` : '').toBe(true)
  if (!r.ok) throw new Error(r.errorKey)
  return r.no!
}
function stock(
  s: SeedData,
  warehouse: string,
  owner: string,
  sku: string,
  location: string,
  quality: QualityType = 'GOOD',
) {
  return s.inventory.find(
    (r) =>
      r.warehouseCode === warehouse &&
      r.customerId === owner &&
      r.skuCode === sku &&
      r.locationCode === location &&
      r.qualityType === quality,
  )
}
const skuRow = (s: SeedData, warehouse: string, owner: string, sku: string) =>
  deriveSkuStocks(s, warehouse).find((r) => r.customerId === owner && r.skuCode === sku)!
const convert = (
  inventoryId: string,
  qty: number,
  requestId = 'QC-T1',
): Extract<InventoryCommand, { type: 'CONVERT_QUALITY' }> => ({
  type: 'CONVERT_QUALITY',
  requestId,
  inventoryId,
  qty,
  serialNos: [],
  reasonNote: 'Crushed carton',
  evidence: 'Photo on file',
  ownerNotice: 'NOTIFIED',
})

describe('品质转换（品质转换主PRD）', () => {
  it('原位正常转不良：实际不变、预占加、可用减，写成对流水且重复确认不再转', () => {
    const s = createSeedData()
    const source = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    const before = skuRow(s, LA, HOMY, 'CABLE-01')
    const logCount = s.inventoryLogs.length
    ok(s, convert(source.id, 2))
    const after = skuRow(s, LA, HOMY, 'CABLE-01')
    expect(after.actual).toBe(before.actual)
    expect(after.preoccupied).toBe(before.preoccupied + 2)
    expect(after.available).toBe(before.available - 2)
    expect(stock(s, LA, HOMY, 'CABLE-01', 'B-01-02', 'DEFECTIVE')!.onHandQty).toBe(2)
    const [minus, plus] = s.inventoryLogs.slice(logCount)
    expect([minus.type, plus.type]).toEqual(['QUALITY', 'QUALITY'])
    expect([minus.qtyChange, plus.qtyChange]).toEqual([-2, 2])
    expect(minus.pairedLogId).toBe(plus.id)
    expect(plus.reasonCode).toBe('DAMAGED')
    expect(plus.ownerNotice).toBe('NOTIFIED')
    ok(s, convert(source.id, 2))
    expect(s.inventoryLogs).toHaveLength(logCount + 2)
  })

  it('超过实际－已分配拒绝并给出上限，原因说明、依据、通知结果必填', () => {
    const s = createSeedData()
    const source = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    expect(act(s, convert(source.id, 7))).toMatchObject({
      ok: false,
      errorKey: 'inventory.error.convertQty',
      params: { max: 6 },
    })
    expect(act(s, { ...convert(source.id, 1), reasonNote: ' ' })).toMatchObject({
      ok: false,
      errorKey: 'inventory.error.convertReason',
    })
  })

  it('已核实的品质变化可以让可用为负；盘点中的 SKU 不能转换', () => {
    const s = createSeedData()
    const lot = stock(s, LA, ANKR, 'LOT-DEMO-01', 'C-01-01')!
    const before = skuRow(s, LA, ANKR, 'LOT-DEMO-01').available
    ok(s, convert(lot.id, 1))
    expect(skuRow(s, LA, ANKR, 'LOT-DEMO-01').available).toBe(before - 1)
    const frozen = stock(s, LA, HOMY, 'HOMY-003', 'B-04-01')!
    expect(act(s, convert(frozen.id, 1, 'QC-T2'))).toMatchObject({ ok: false, errorKey: 'inventory.error.counting' })
  })
})

describe('移库提交（移库作业主PRD）', () => {
  const move = (
    requestId: string,
    lines: { inventoryId: string; targetLocation: string; qty: number }[],
  ): InventoryCommand => ({
    type: 'SUBMIT_MOVE',
    requestId,
    warehouseCode: LA,
    lines: lines.map((l) => ({ ...l, serialNos: [] })),
  })

  it('多行一次生效：每行一减一加成对流水，SKU 三量不变，重复提交返回原移库作业号', () => {
    const s = createSeedData()
    const source = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    const before = skuRow(s, LA, HOMY, 'CABLE-01')
    const logCount = s.inventoryLogs.length
    const no = ok(
      s,
      move('MV-T1', [
        { inventoryId: source.id, targetLocation: 'B-04-02', qty: 2 },
        { inventoryId: source.id, targetLocation: 'b-04-03', qty: 1 },
      ]),
    )
    expect(no).toMatch(/^MV-\d{8}-\d{4}$/)
    expect(stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!.onHandQty).toBe(3)
    expect(stock(s, LA, HOMY, 'CABLE-01', 'B-04-03')!.onHandQty).toBe(1)
    expect(skuRow(s, LA, HOMY, 'CABLE-01')).toMatchObject({ actual: before.actual, available: before.available })
    const logs = s.inventoryLogs.slice(logCount)
    expect(logs.map((l) => l.qtyChange)).toEqual([-2, 2, -1, 1])
    expect(logs.every((l) => l.type === 'MOVE' && l.refNo === no && l.pairedLogId)).toBe(true)
    expect(s.stockMoves.find((m) => m.no === no)!.lines.map((l) => l.targetLocation)).toEqual(['B-04-02', 'B-04-03'])
    expect(ok(s, move('MV-T1', [{ inventoryId: source.id, targetLocation: 'B-04-02', qty: 1 }]))).toBe(no)
    expect(s.inventoryLogs).toHaveLength(logCount + 4)
  })

  it('任一行不过整次不生效，并指出失败行', () => {
    const s = createSeedData()
    const source = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    const inventory = structuredClone(s.inventory)
    const result = act(
      s,
      move('MV-T2', [
        { inventoryId: source.id, targetLocation: 'B-04-02', qty: 4 },
        { inventoryId: source.id, targetLocation: 'B-04-03', qty: 4 },
      ]),
    )
    expect(result).toMatchObject({ ok: false, errorKey: 'inventory.error.moveQty', params: { line: 2, max: 2 } })
    expect(s.inventory).toEqual(inventory)
    expect(s.stockMoves.some((m) => m.requestId === 'MV-T2')).toBe(false)
  })

  it('目标库位被他货主占用、是暂存库位、品质不适配，以及一次提交跨货主都阻断', () => {
    const s = createSeedData()
    const source = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    const other = stock(s, LA, ANKR, 'CABLE-01', 'A-01-02')!
    expect(act(s, move('M1', [{ inventoryId: source.id, targetLocation: 'A-01-01', qty: 1 }]))).toMatchObject({
      errorKey: 'inventory.error.moveOccupied',
    })
    expect(act(s, move('M2', [{ inventoryId: source.id, targetLocation: 'STAGE-IN-01', qty: 1 }]))).toMatchObject({
      errorKey: 'inventory.error.moveTarget',
    })
    expect(act(s, move('M3', [{ inventoryId: source.id, targetLocation: 'DEFECT-01', qty: 1 }]))).toMatchObject({
      errorKey: 'inventory.error.moveQuality',
    })
    expect(
      act(
        s,
        move('M4', [
          { inventoryId: source.id, targetLocation: 'B-04-02', qty: 1 },
          { inventoryId: other.id, targetLocation: 'B-04-03', qty: 1 },
        ]),
      ),
    ).toMatchObject({ errorKey: 'inventory.error.moveOwner', params: { line: 2 } })
  })
})

describe('盘点单（盘点单主PRD）', () => {
  const homyCable = [{ customerId: HOMY, skuCode: 'CABLE-01' }]

  it('建单冻结 SKU，全部实盘后主管确认按差异调账并写盘点流水，重复确认不再调', () => {
    const s = createSeedData()
    const no = ok(s, { type: 'CREATE_STOCKTAKE', warehouseCode: LA, skus: homyCable, remark: 'test' })
    const source = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    expect(
      act(s, {
        type: 'SUBMIT_MOVE',
        requestId: 'MV-F',
        warehouseCode: LA,
        lines: [{ inventoryId: source.id, targetLocation: 'B-04-02', qty: 1, serialNos: [] }],
      }),
    ).toMatchObject({ ok: false, errorKey: 'inventory.error.counting' })
    expect(act(s, { type: 'CONFIRM_STOCKTAKE', no })).toMatchObject({
      ok: false,
      errorKey: 'inventory.error.stocktakeUncounted',
    })
    const count = s.inventoryCounts.find((c) => c.no === no)!
    expect(count.lines.map((l) => [l.locationCode, l.bookQty])).toEqual([['B-01-02', 6]])
    ok(s, { type: 'SAVE_COUNTS', no, entries: [{ lineNo: 1, qty: 5, serialNos: [], note: 'one missing' }] })
    expect(stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!.onHandQty).toBe(6)
    const logCount = s.inventoryLogs.length
    ok(s, { type: 'CONFIRM_STOCKTAKE', no })
    expect(stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!.onHandQty).toBe(5)
    const [adjust] = s.inventoryLogs.slice(logCount)
    expect(adjust).toMatchObject({
      type: 'ADJUST',
      refNo: no,
      qtyChange: -1,
      beforeQty: 6,
      afterQty: 5,
      sourceLineNo: 1,
    })
    expect(s.inventoryCounts.find((c) => c.no === no)).toMatchObject({ status: 'COMPLETED', confirmedBy: 'tester' })
    ok(s, { type: 'CONFIRM_STOCKTAKE', no })
    expect(s.inventoryLogs).toHaveLength(logCount + 1)
  })

  it('有进行中的拣货任务、返库上架单、上架单时整次不建，不静默跳过 SKU', () => {
    const s = createSeedData()
    const r = act(s, {
      type: 'CREATE_STOCKTAKE',
      warehouseCode: LA,
      skus: [...homyCable, { customerId: ANKR, skuCode: 'CABLE-01' }],
    })
    expect(r).toMatchObject({ ok: false, errorKey: expect.stringMatching(/^inventory\.error\.stocktakeBlocked\./) })
    expect(
      s.inventoryCounts.filter((c) => c.skus.some((k) => k.customerId === HOMY && k.skuCode === 'CABLE-01')),
    ).toHaveLength(0)
  })

  it('同 SKU 已在盘点中时发现差异只追加依据；取消不调账、待核对保留，完成才解除', () => {
    const s = createSeedData()
    const counting = s.inventoryCounts.find((c) => c.warehouseCode === LA && c.status === 'COUNTING')!
    const appended = ok(s, {
      type: 'CREATE_STOCKTAKE_FROM_DISCREPANCY',
      warehouseCode: LA,
      customerId: HOMY,
      skuCode: 'HOMY-003',
      stage: 'MOVE_MISMATCH',
      locationCode: 'B-04-01',
      diffQty: 1,
      note: 'second sighting',
    })
    expect(appended).toBe(counting.no)
    expect(s.inventoryCounts.find((c) => c.no === counting.no)!.discoveries).toHaveLength(1)
    expect(act(s, { type: 'CANCEL_STOCKTAKE', no: counting.no, reason: ' ' })).toMatchObject({
      ok: false,
      errorKey: 'inventory.error.cancelReason',
    })
    ok(s, { type: 'CANCEL_STOCKTAKE', no: counting.no, reason: 'recount tomorrow' })
    const pending = () => s.skuAllocationControls.some((c) => c.warehouseCode === LA && c.skuCode === 'HOMY-003')
    expect(pending()).toBe(true)
    const recount = ok(s, {
      type: 'CREATE_STOCKTAKE',
      warehouseCode: LA,
      skus: [{ customerId: HOMY, skuCode: 'HOMY-003' }],
    })
    ok(s, { type: 'SAVE_COUNTS', no: recount, entries: [{ lineNo: 1, qty: 11, serialNos: [] }] })
    ok(s, { type: 'CONFIRM_STOCKTAKE', no: recount })
    expect(pending()).toBe(false)
    // 盘亏 1 件，订单仍占 12：可用为负
    expect(skuRow(s, LA, HOMY, 'HOMY-003').available).toBe(-1)
  })

  it('SN 商品：缺失的 SN 记为已盘亏，实盘找回的 SN 新增账面 0 行确认后重新在库', () => {
    const s = createSeedData()
    const lost = deriveSerials(s, NJ).find((r) => r.status === 'LOST')!
    const no = ok(s, {
      type: 'CREATE_STOCKTAKE',
      warehouseCode: NJ,
      skus: [{ customerId: ANKR, skuCode: 'SN-DEMO-01' }],
    })
    const count = s.inventoryCounts.find((c) => c.no === no)!
    ok(s, {
      type: 'SAVE_COUNTS',
      no,
      entries: count.lines.map((l) => ({ lineNo: l.lineNo, qty: l.bookQty, serialNos: l.bookSerialNos })),
    })
    expect(
      act(s, {
        type: 'ADD_COUNT_LINE',
        no,
        locationCode: 'B-04-02',
        customerId: ANKR,
        skuCode: 'SN-DEMO-01',
        qualityType: 'GOOD',
        qty: 2,
        serialNos: [lost.serialNo],
      }),
    ).toMatchObject({ ok: false, errorKey: 'inventory.error.serial' })
    ok(s, {
      type: 'ADD_COUNT_LINE',
      no,
      locationCode: 'B-04-02',
      customerId: ANKR,
      skuCode: 'SN-DEMO-01',
      qualityType: 'GOOD',
      qty: 1,
      serialNos: [lost.serialNo],
    })
    ok(s, { type: 'CONFIRM_STOCKTAKE', no })
    expect(deriveSerials(s, NJ).find((r) => r.serialNo === lost.serialNo)).toMatchObject({
      status: 'IN_STOCK',
      locationCode: 'B-04-02',
    })
  })
})

describe('PDA 作业用到的动作细节', () => {
  it('移库提交遇到盘点中的行，错误带行号，PDA 据此标出失败行', () => {
    const s = createSeedData()
    const cable = stock(s, LA, HOMY, 'CABLE-01', 'B-01-02')!
    const frozen = stock(s, LA, HOMY, 'HOMY-003', 'B-04-01')!
    const result = act(s, {
      type: 'SUBMIT_MOVE',
      requestId: 'MV-PDA-1',
      warehouseCode: LA,
      lines: [
        { inventoryId: cable.id, targetLocation: 'B-04-02', qty: 1, serialNos: [] },
        { inventoryId: frozen.id, targetLocation: 'B-04-03', qty: 1, serialNos: [] },
      ],
    })
    expect(result).toMatchObject({ ok: false, errorKey: 'inventory.error.counting', params: { line: 2 } })
  })

  it('新增实盘行：库位有其他货主库存时阻断；SN 已盘在别的行时阻断', () => {
    const s = createSeedData()
    const homy = ok(s, {
      type: 'CREATE_STOCKTAKE',
      warehouseCode: LA,
      skus: [{ customerId: HOMY, skuCode: 'CABLE-01' }],
    })
    expect(
      act(s, {
        type: 'ADD_COUNT_LINE',
        no: homy,
        locationCode: 'A-01-01',
        customerId: HOMY,
        skuCode: 'CABLE-01',
        qualityType: 'GOOD',
        qty: 1,
        serialNos: [],
      }),
    ).toMatchObject({ ok: false, errorKey: 'inventory.error.countOccupied', params: { location: 'A-01-01' } })

    const sn = ok(s, {
      type: 'CREATE_STOCKTAKE',
      warehouseCode: NJ,
      skus: [{ customerId: ANKR, skuCode: 'SN-DEMO-01' }],
    })
    const first = s.inventoryCounts.find((c) => c.no === sn)!.lines[0]
    const serial = first.bookSerialNos[0]
    ok(s, { type: 'SAVE_COUNTS', no: sn, entries: [{ lineNo: first.lineNo, qty: 1, serialNos: [serial] }] })
    expect(
      act(s, {
        type: 'ADD_COUNT_LINE',
        no: sn,
        locationCode: 'B-04-02',
        customerId: ANKR,
        skuCode: 'SN-DEMO-01',
        qualityType: 'GOOD',
        qty: 1,
        serialNos: [serial],
      }),
    ).toMatchObject({ ok: false, errorKey: 'inventory.error.serial' })
  })

  it('移库时上报账实不符立即待核对；随后发起盘点按同一来源建单', () => {
    const s = createSeedData()
    ok(s, {
      type: 'REPORT_DISCREPANCY',
      warehouseCode: LA,
      customerId: HOMY,
      skuCode: 'CABLE-01',
      stage: 'MOVE_MISMATCH',
      locationCode: 'B-01-02',
    })
    expect(
      s.skuAllocationControls.find((c) => c.warehouseCode === LA && c.skuCode === 'CABLE-01' && c.customerId === HOMY),
    ).toMatchObject({ sources: ['MOVE_MISMATCH@B-01-02'] })
    const no = ok(s, {
      type: 'CREATE_STOCKTAKE_FROM_DISCREPANCY',
      warehouseCode: LA,
      customerId: HOMY,
      skuCode: 'CABLE-01',
      stage: 'MOVE_MISMATCH',
      locationCode: 'B-01-02',
      diffQty: 1,
      note: 'one missing while moving',
    })
    expect(s.inventoryCounts.find((c) => c.no === no)).toMatchObject({ source: 'DISCREPANCY', status: 'COUNTING' })
    expect(
      s.skuAllocationControls.find((c) => c.warehouseCode === LA && c.skuCode === 'CABLE-01' && c.customerId === HOMY)!
        .sources,
    ).toEqual(['MOVE_MISMATCH@B-01-02'])
  })
})
