import { describe, expect, it } from 'vitest'
import { deriveBalances, deriveSerials, deriveSkuStocks } from '@/lib/inventory-derive'
import { negativeInventoryIssue } from '@/lib/inventory-constraints'
import { serialsInWarehouse, warehouseSerialStocks } from '@/lib/serial-stock'
import { applyInventoryAction } from './inventory-actions'
import { applySavePutawayLine, applySubmitPutawayOrder } from './putaway-actions'
import { createSeedData } from './seed'

const NJ = 'US-NJ-01'
const OWNER = 'C10028'

describe('库存查询修订的跨流程回归', () => {
  it('各仓品质分行，合计不重复，不良品及受限库存不作为普通出库可分配', () => {
    const s = createSeedData()
    expect(negativeInventoryIssue(s)).toBeUndefined()
    for (const w of s.warehouses) {
      const rows = deriveSkuStocks(s, w.code)
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
      rows.forEach((r) => {
        if (r.lastLog) expect(r.lastLog.qualityType).toBe(r.qualityType)
      })
      expect(rows.reduce((n, r) => n + r.actual, 0)).toBe(
        s.inventory.filter((r) => r.warehouseCode === w.code).reduce((n, r) => n + r.onHandQty, 0),
      )
      rows
        .filter((r) => r.qualityType === 'DEFECTIVE')
        .forEach((r) => {
          expect([r.orderReserved, r.preoccupied, r.available]).toEqual([0, 0, 0])
        })
      deriveBalances(s, w.code, new Date('2026-10-22T00:00:00Z')).forEach((b) => {
        if (!b.normalAllocatable) expect(b.allocatable).toBe(0)
      })
    }
  })

  it('SN商品不扫描单件也可数量移库，仓库身份保留，产生两条各含一个库位的独立流水', () => {
    const s = createSeedData()
    const source = s.inventory.find(
      (r) =>
        r.warehouseCode === NJ &&
        r.skuCode === 'SN-DEMO-01' &&
        r.locationCode === 'A-01-02' &&
        r.qualityType === 'GOOD',
    )!
    const serials = deriveSerials(s, NJ)
    const result = applyInventoryAction(
      s,
      {
        type: 'SUBMIT_MOVE',
        requestId: 'MOVE-WITHOUT-SN',
        warehouseCode: NJ,
        lines: [{ inventoryId: source.id, targetLocation: 'B-04-02', qty: 1, serialNos: [] }],
      },
      'tester',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const next = { ...s, ...result.patch }
    expect(deriveSerials(next, NJ)).toEqual(serials)
    const logs = next.inventoryLogs.slice(s.inventoryLogs.length)
    expect(logs.map((l) => [l.locationCode, l.qtyChange])).toEqual([
      ['A-01-02', -1],
      ['B-04-02', 1],
    ])
    logs.forEach((l) => {
      expect(l).not.toHaveProperty('sourceLocation')
      expect(l).not.toHaveProperty('targetLocation')
      expect(l.serialNos).toBeUndefined()
    })
  })

  it('未逐件确认的品质转换保留SN在库身份，并清除无法确认的单件品质', () => {
    const s = createSeedData()
    const source = s.inventory.find(
      (r) =>
        r.warehouseCode === NJ &&
        r.skuCode === 'SN-DEMO-01' &&
        r.locationCode === 'A-01-02' &&
        r.qualityType === 'GOOD',
    )!
    const before = serialsInWarehouse(s, NJ, source.customerId, source.skuCode)
    const result = applyInventoryAction(
      s,
      {
        type: 'CONVERT_QUALITY',
        requestId: 'QUALITY-WITHOUT-SN',
        inventoryId: source.id,
        qty: 1,
        serialNos: [],
        reasonNote: '现场受损',
        evidence: '已清点数量',
        ownerNotice: 'NOTIFIED',
      },
      'tester',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const next = { ...s, ...result.patch }
    expect(serialsInWarehouse(next, NJ, source.customerId, source.skuCode)).toEqual(before)
    warehouseSerialStocks(next)
      .filter(
        (r) =>
          r.warehouseCode === NJ &&
          r.customerId === source.customerId &&
          r.skuCode === source.skuCode &&
          r.status === 'IN_STOCK',
      )
      .forEach((r) => expect(r.qualityType).toBeUndefined())
  })

  it('已确认不良的SN不能用于良品转换，失败不产生库存或流水变动', () => {
    const s = createSeedData()
    const source = s.inventory.find(
      (r) =>
        r.warehouseCode === NJ &&
        r.skuCode === 'SN-DEMO-01' &&
        r.locationCode === 'A-01-02' &&
        r.qualityType === 'GOOD',
    )!
    s.serialStocks = warehouseSerialStocks(s).map((r) => ({ ...r }))
    const bad = s.serialStocks.find(
      (r) =>
        r.warehouseCode === NJ &&
        r.customerId === source.customerId &&
        r.skuCode === source.skuCode &&
        r.status === 'IN_STOCK',
    )!
    bad.qualityType = 'DEFECTIVE'
    const before = structuredClone(s)
    const result = applyInventoryAction(
      s,
      {
        type: 'CONVERT_QUALITY',
        requestId: 'QUALITY-WRONG-SN',
        inventoryId: source.id,
        qty: 1,
        serialNos: [bad.serialNo],
        reasonNote: '现场受损',
        evidence: '单件核实',
        ownerNotice: 'NOTIFIED',
      },
      'tester',
    )
    expect(result.ok).toBe(false)
    expect(result).not.toHaveProperty('patch')
    expect(s).toEqual(before)
  })

  function putawayFixture(sourceQty = 2) {
    const s = createSeedData()
    const order = {
      ...s.putawayOrders[0],
      putawayNo: 'PA-UNLOCATED-SN',
      warehouseCode: NJ,
      customerId: OWNER,
      status: 'PENDING' as const,
      qualityType: 'GOOD' as const,
      stagingLocationCode: 'STAGE-IN-01',
      // 本场景是散件暂存，不继承模板上架单的容器身份。
      containerNo: undefined,
      containerId: undefined,
      planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'SN-DEMO-01', planQty: 2 }],
      actualLines: [],
    }
    s.putawayOrders = [order]
    s.inventory.push({
      id: 'INV-UNLOCATED-SN',
      warehouseCode: NJ,
      customerId: OWNER,
      skuCode: 'SN-DEMO-01',
      locationCode: 'STAGE-IN-01',
      qualityType: 'GOOD',
      onHandQty: sourceQty,
      lockedQty: 0,
      firstInboundAt: order.createdAt,
    })
    s.serialStocks = [
      ...warehouseSerialStocks(s),
      ...['UNLOCATED-1', 'UNLOCATED-2'].map((serialNo) => ({
        customerId: OWNER,
        skuCode: 'SN-DEMO-01',
        serialNo,
        warehouseCode: NJ,
        status: 'IN_STOCK' as const,
      })),
    ]
    const saved = applySavePutawayLine(s, {
      putawayNo: order.putawayNo,
      planLineNo: 1,
      locationCode: 'B-03-02',
      qty: 2,
    })
    expect(saved.ok).toBe(true)
    Object.assign(s, saved.patch)
    return s
  }

  it('SN没有库位也可整单上架，移走全部暂存数量后仍保留仓库级身份', () => {
    const s = putawayFixture()
    const result = applySubmitPutawayOrder(s, { putawayNo: 'PA-UNLOCATED-SN', operator: 'tester' })
    expect(result.ok).toBe(true)
    const next = { ...s, ...result.patch }
    for (const sn of ['UNLOCATED-1', 'UNLOCATED-2']) {
      expect(deriveSerials(next, NJ).find((r) => r.serialNo === sn)).toMatchObject({
        status: 'IN_STOCK',
        locationCode: '',
      })
    }
    expect(next.inventory.find((r) => r.id === 'INV-UNLOCATED-SN')?.onHandQty).toBe(0)
  })

  it('来源暂存不足时上架整次失败，不能截零并凭空增加目标位数量', () => {
    const s = putawayFixture(1)
    const before = structuredClone(s)
    const result = applySubmitPutawayOrder(s, { putawayNo: 'PA-UNLOCATED-SN', operator: 'tester' })
    expect(result).toMatchObject({ ok: false, errorKey: 'pdaPutaway.error.stockInsufficient' })
    expect(result.patch).toBeUndefined()
    expect(s).toEqual(before)
  })

  it('散件暂存数量足够也不能用于另一容器的上架单', () => {
    const s = putawayFixture()
    s.putawayOrders[0].containerNo = 'OTHER-CONTAINER'
    const before = structuredClone(s)
    const result = applySubmitPutawayOrder(s, { putawayNo: 'PA-UNLOCATED-SN', operator: 'tester' })
    expect(result).toMatchObject({ ok: false, errorKey: 'pdaPutaway.error.stockInsufficient' })
    expect(result.patch).toBeUndefined()
    expect(s).toEqual(before)
  })
})
