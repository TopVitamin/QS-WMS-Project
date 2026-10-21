import { beforeEach, describe, expect, it } from 'vitest'
import { recordedQty as recordedOfPlanLine, suggestPutawayLocation } from '@/lib/putaway'
import { cmToLength, kgToWeight } from '@/lib/unit'
import type { PutawayOrder } from '@/types/inbound'
import { useDb } from './db'

function resetDb() {
  localStorage.clear()
  useDb.getState().resetDemo()
}

/** 固定验收种子 0001：US-LA-01，CABLE-01 预计 500，待收货 */
function findPendingInbound() {
  return useDb.getState().inbounds.find((o) => o.inboundNo === 'IB-20261002-0001' && o.status === 'PENDING_RECEIVE')
}

function getInbound(inboundNo: string) {
  return useDb.getState().inbounds.find((o) => o.inboundNo === inboundNo)
}

function totalOnHandQty() {
  return useDb.getState().inventory.reduce((sum, record) => sum + record.onHandQty, 0)
}

function onHandAt(warehouseCode: string, locationCode: string, skuCode: string, qualityType: 'GOOD' | 'DEFECTIVE') {
  return useDb
    .getState()
    .inventory.filter(
      (r) =>
        r.warehouseCode === warehouseCode &&
        r.locationCode === locationCode &&
        r.skuCode === skuCode &&
        r.qualityType === qualityType,
    )
    .reduce((sum, r) => sum + r.onHandQty, 0)
}

/** 最近一次收货生成的上架单（按品质） */
function putawayOrdersOfLatestReceipt(inboundNo: string): PutawayOrder[] {
  const state = useDb.getState()
  const receipt = state.receiptRecords.find((r) => r.inboundNo === inboundNo)
  return state.putawayOrders.filter((p) => p.receiptNo === receipt?.receiptNo)
}

describe('useDb actions', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('mockPushInboundInstruction', () => {
    it('creates inbound for demo upstream', () => {
      const ankr = useDb.getState().customers.find((c) => c.code === 'ANKR')
      expect(ankr).toBeDefined()
      const result = useDb.getState().mockPushInboundInstruction({
        customerId: ankr!.id,
        warehouseCode: 'US-LA-01',
        bizType: 'NORMAL',
        upstreamNo: 'OMS-TEST-PUSH-001',
        skuCode: 'CABLE-01',
        plannedQty: 100,
      })
      expect(result.ok).toBe(true)
      expect(useDb.getState().inbounds.some((o) => o.upstreamNo === 'OMS-TEST-PUSH-001')).toBe(true)
    })
  })

  describe('submitReceipt / submitContainerReceipt', () => {
    it('adds defect qty to staging inventory with quality locked', () => {
      const order = findPendingInbound()!
      const skuCode = order.items[0].skuCode
      const before = totalOnHandQty()
      const stagingBefore = onHandAt(order.warehouseCode, 'STAGE-IN-01', skuCode, 'DEFECTIVE')

      const result = useDb.getState().submitContainerReceipt({
        inboundNo: order.inboundNo,
        bulkPiece: true,
        lines: [{ skuCode, goodQty: 0, defectQty: 5 }],
        operator: 'test',
      })
      expect(result).toEqual({ ok: true })
      expect(totalOnHandQty()).toBe(before + 5)
      expect(onHandAt(order.warehouseCode, 'STAGE-IN-01', skuCode, 'DEFECTIVE')).toBe(stagingBefore + 5)
    })

    it('one submission with several containers creates one receipt and putaway orders per container × quality (AC23)', () => {
      const order = findPendingInbound()!
      const skuCode = order.items[0].skuCode
      const receiptsBefore = useDb.getState().receiptRecords.filter((r) => r.inboundNo === order.inboundNo).length

      const result = useDb.getState().submitReceipt({
        inboundNo: order.inboundNo,
        operator: 'test',
        containers: [
          { containerNo: 'BOX-A', lines: [{ skuCode, goodQty: 30, defectQty: 0 }] },
          { containerNo: 'BOX-B', lines: [{ skuCode, goodQty: 28, defectQty: 2 }] },
        ],
      })
      expect(result).toEqual({ ok: true })

      const receipts = useDb.getState().receiptRecords.filter((r) => r.inboundNo === order.inboundNo)
      expect(receipts).toHaveLength(receiptsBefore + 1)
      const receipt = receipts[0]
      expect(receipt.containerNo).toBeUndefined()
      expect(receipt.lines.map((l) => l.containerNo)).toEqual(['BOX-A', 'BOX-B'])

      const orders = putawayOrdersOfLatestReceipt(order.inboundNo)
      expect(orders.map((p) => `${p.containerNo}:${p.qualityType}:${p.planLines[0].planQty}`).sort()).toEqual([
        'BOX-A:GOOD:30',
        'BOX-B:DEFECTIVE:2',
        'BOX-B:GOOD:28',
      ])
      expect(getInbound(order.inboundNo)!.items[0].receivedQty).toBe(60)
    })

    it('rejects a container already submitted on the same order, case-insensitively (AC25)', () => {
      const order = findPendingInbound()!
      const skuCode = order.items[0].skuCode
      expect(
        useDb.getState().submitContainerReceipt({
          inboundNo: order.inboundNo,
          containerNo: 'BOX-A',
          lines: [{ skuCode, goodQty: 5, defectQty: 0 }],
          operator: 'test',
        }),
      ).toEqual({ ok: true })

      const again = useDb.getState().submitReceipt({
        inboundNo: order.inboundNo,
        operator: 'test',
        containers: [{ containerNo: 'box-a', lines: [{ skuCode, goodQty: 5, defectQty: 0 }] }],
      })
      expect(again).toEqual({ ok: false, errorKey: 'inbound.receive.containerAlreadyUsedNo' })
    })

    it('rejects duplicate containers and empty submissions', () => {
      const order = findPendingInbound()!
      const skuCode = order.items[0].skuCode
      const line = { skuCode, goodQty: 1, defectQty: 0 }
      expect(
        useDb.getState().submitReceipt({
          inboundNo: order.inboundNo,
          operator: 'test',
          containers: [
            { containerNo: 'BOX-A', lines: [line] },
            { containerNo: 'BOX-A', lines: [line] },
          ],
        }),
      ).toEqual({ ok: false, errorKey: 'inbound.receive.containerDuplicated' })
      expect(
        useDb.getState().submitReceipt({ inboundNo: order.inboundNo, operator: 'test', containers: [{ containerNo: 'BOX-C', lines: [] }] }),
      ).toEqual({ ok: false, errorKey: 'inbound.receive.emptySubmit' })
    })

    it('checks the remaining quantity across all containers of one submission (R04)', () => {
      const order = findPendingInbound()!
      const item = order.items[0]
      const half = Math.ceil(item.plannedQty / 2) + 1
      const result = useDb.getState().submitReceipt({
        inboundNo: order.inboundNo,
        operator: 'test',
        containers: [
          { containerNo: 'BOX-A', lines: [{ skuCode: item.skuCode, goodQty: half, defectQty: 0 }] },
          { containerNo: 'BOX-B', lines: [{ skuCode: item.skuCode, goodQty: half, defectQty: 0 }] },
        ],
      })
      expect(result).toEqual({ ok: false, errorKey: 'inbound.receive.overRemain' })
    })

    it('rejects receiving on a cancelled order', () => {
      const cancelled = useDb.getState().inbounds.find((o) => o.status === 'CANCELLED')!
      expect(cancelled.items[0].status).toBe('CANCELLED')
      const result = useDb.getState().submitContainerReceipt({
        inboundNo: cancelled.inboundNo,
        bulkPiece: true,
        lines: [{ skuCode: cancelled.items[0].skuCode, goodQty: 1, defectQty: 0 }],
        operator: 'test',
      })
      expect(result).toEqual({ ok: false, errorKey: 'inbound.receive.cancelled' })
    })

    it('returns errorKey when receiving after receipt close', () => {
      const order = useDb.getState().inbounds.find((o) => o.inboundNo.endsWith('-0005'))!
      expect(order.receiptCloseFlag).toBe('CONFIRMED')
      const result = useDb.getState().submitContainerReceipt({
        inboundNo: order.inboundNo,
        bulkPiece: true,
        lines: [{ skuCode: order.items[0].skuCode, goodQty: 1, defectQty: 0 }],
        operator: 'test',
      })
      expect(result).toEqual({ ok: false, errorKey: 'inbound.receiptCloseStale' })
    })
  })

  describe('putaway orders', () => {
    it('saving only records progress; submitting moves stock from staging to the target location (R10)', () => {
      const order = findPendingInbound()!
      const skuCode = order.items[0].skuCode
      useDb.getState().submitContainerReceipt({
        inboundNo: order.inboundNo,
        bulkPiece: true,
        lines: [{ skuCode, goodQty: 10, defectQty: 0 }],
        operator: 'test',
      })
      const po = putawayOrdersOfLatestReceipt(order.inboundNo).find((p) => p.qualityType === 'GOOD')!
      const target = suggestPutawayLocation(po, skuCode, useDb.getState())!
      expect(target).toBeDefined()
      const total = totalOnHandQty()
      const stagingBefore = onHandAt(order.warehouseCode, 'STAGE-IN-01', skuCode, 'GOOD')
      const targetBefore = onHandAt(order.warehouseCode, target, skuCode, 'GOOD')

      const save = useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: target, planLineNo: po.planLines[0].lineNo, qty: 10, operator: 'test' })
      expect(save).toEqual({ ok: true })
      const saved = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
      expect(saved.status).toBe('PUTAWAYING')
      expect(saved.actualLines).toEqual([
        { lineNo: 1, planLineNo: po.planLines[0].lineNo, locationCode: target, skuCode, qty: 10, submitted: false },
      ])
      expect(onHandAt(order.warehouseCode, 'STAGE-IN-01', skuCode, 'GOOD')).toBe(stagingBefore)
      expect(getInbound(order.inboundNo)!.items[0].putawayQty).toBe(0)

      expect(useDb.getState().submitPutawayOrder({ putawayNo: po.putawayNo, operator: 'test' })).toEqual({ ok: true })
      const submitted = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
      expect(submitted.status).toBe('COMPLETED')
      expect(submitted.submittedBy).toBe('test')
      expect(submitted.actualLines.every((a) => a.submitted)).toBe(true)
      expect(totalOnHandQty()).toBe(total)
      expect(onHandAt(order.warehouseCode, 'STAGE-IN-01', skuCode, 'GOOD')).toBe(stagingBefore - 10)
      expect(onHandAt(order.warehouseCode, target, skuCode, 'GOOD')).toBe(targetBefore + 10)
      expect(getInbound(order.inboundNo)!.items[0].putawayQty).toBe(10)

      expect(useDb.getState().submitPutawayOrder({ putawayNo: po.putawayNo, operator: 'test' })).toEqual({
        ok: false,
        errorKey: 'pdaPutaway.error.orderSubmitted',
      })
    })

    it('an inbound with defective goods reaches COMPLETED once both putaway orders are submitted (P0)', () => {
      const order = findPendingInbound()!
      const item = order.items[0]
      useDb.getState().submitContainerReceipt({
        inboundNo: order.inboundNo,
        bulkPiece: true,
        lines: [{ skuCode: item.skuCode, goodQty: item.plannedQty - 10, defectQty: 10 }],
        operator: 'test',
      })
      const orders = putawayOrdersOfLatestReceipt(order.inboundNo)
      const good = orders.find((p) => p.qualityType === 'GOOD')!
      const defect = orders.find((p) => p.qualityType === 'DEFECTIVE')!

      expect(
        useDb.getState().savePutawayLine({ putawayNo: defect.putawayNo, locationCode: 'A-01-01', planLineNo: defect.planLines[0].lineNo, qty: 10, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.defectOnly' })
      expect(
        useDb.getState().savePutawayLine({ putawayNo: good.putawayNo, locationCode: 'DEFECT-01', planLineNo: good.planLines[0].lineNo, qty: 1, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.goodToDefect' })
      expect(
        useDb.getState().savePutawayLine({ putawayNo: good.putawayNo, locationCode: 'STAGE-IN-01', planLineNo: good.planLines[0].lineNo, qty: 1, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.staging' })

      const goodTarget = suggestPutawayLocation(good, item.skuCode, useDb.getState())!
      useDb.getState().savePutawayLine({ putawayNo: good.putawayNo, locationCode: goodTarget, planLineNo: good.planLines[0].lineNo, qty: item.plannedQty - 10, operator: 'test' })
      useDb.getState().savePutawayLine({ putawayNo: defect.putawayNo, locationCode: 'DEFECT-01', planLineNo: defect.planLines[0].lineNo, qty: 10, operator: 'test' })
      expect(useDb.getState().submitPutawayOrder({ putawayNo: good.putawayNo, operator: 'test' })).toEqual({ ok: true })
      expect(getInbound(order.inboundNo)!.status).toBe('PUTAWAYING')
      expect(useDb.getState().submitPutawayOrder({ putawayNo: defect.putawayNo, operator: 'test' })).toEqual({ ok: true })
      expect(getInbound(order.inboundNo)!.status).toBe('COMPLETED')
    })

    it('cannot submit until every plan line is fully placed; undo returns the order to PENDING', () => {
      const po = useDb.getState().putawayOrders.find((p) => p.putawayNo === 'PA-20261009-0001')!
      const skuCode = po.planLines[0].skuCode
      const target = suggestPutawayLocation(po, skuCode, useDb.getState())!
      useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: target, planLineNo: po.planLines[0].lineNo, qty: 10, operator: 'test' })
      expect(useDb.getState().submitPutawayOrder({ putawayNo: po.putawayNo, operator: 'test' })).toEqual({
        ok: false,
        errorKey: 'pdaPutaway.error.planMismatch',
      })
      expect(
        useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: target, planLineNo: po.planLines[0].lineNo, qty: po.planLines[0].planQty, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.overRemain' })

      const [placed] = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!.actualLines
      expect(useDb.getState().removePutawayLine({ putawayNo: po.putawayNo, actualLineNo: placed.lineNo, operator: 'test' })).toEqual({ ok: true })
      expect(useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!.status).toBe('PENDING')
    })

    it('rejects a location already holding another owner\'s stock (one owner per location)', () => {
      const po = useDb.getState().putawayOrders.find((p) => p.putawayNo === 'PA-20261009-0001')!
      useDb.setState((s) => ({
        inventory: [
          ...s.inventory,
          {
            id: 'INV-TEST-OTHER',
            warehouseCode: po.warehouseCode,
            locationCode: 'C-04-03',
            customerId: 'OTHER-OWNER',
            skuCode: 'OTHER-SKU',
            qualityType: 'GOOD',
            onHandQty: 3,
            lockedQty: 0,
            firstInboundAt: '2026-10-01T00:00:00.000Z',
          },
        ],
      }))
      expect(
        useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: 'C-04-03', planLineNo: po.planLines[0].lineNo, qty: 1, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.otherOwner' })
    })
  })

  describe('confirmReceiptClose', () => {
    it('closes receiving order 0003 scenario', () => {
      const order = useDb.getState().inbounds.find((o) => o.inboundNo.endsWith('-0003'))
      expect(order).toBeDefined()
      const result = useDb.getState().confirmReceiptClose(order!.inboundNo, 'admin')
      expect(result).toEqual({ ok: true })
      const updated = useDb.getState().inbounds.find((o) => o.inboundNo === order!.inboundNo)
      expect(updated?.receiptCloseFlag).toBe('CONFIRMED')
    })
  })

  describe('seed consistency', () => {
    it('completed orders keep their child records and putaway children', () => {
      const state = useDb.getState()
      const completed = state.inbounds.filter((o) => o.status === 'COMPLETED')
      expect(completed.length).toBeGreaterThan(0)
      completed.forEach((o) => {
        expect(state.receiptRecords.some((r) => r.inboundNo === o.inboundNo)).toBe(true)
        expect(state.putawayOrders.some((p) => p.sourceType === 'INBOUND' && p.sourceNo === o.inboundNo)).toBe(true)
      })
      // 入库异常必须指回真实存在的收货记录
      state.inboundExceptions.forEach((e) => {
        expect(state.receiptRecords.some((r) => r.receiptNo === e.receiptNo)).toBe(true)
      })
    })

    it('every received good and defective unit of the acceptance seeds has a putaway order (主 PRD §7.6)', () => {
      const state = useDb.getState()
      state.inbounds
        .filter((o) => o.warehouseCode === 'US-LA-01' && o.status !== 'CANCELLED')
        .forEach((o) => {
          const planned = (quality: 'GOOD' | 'DEFECTIVE') =>
            state.putawayOrders
              .filter((p) => p.sourceType === 'INBOUND' && p.sourceNo === o.inboundNo && p.qualityType === quality)
              .flatMap((p) => p.planLines)
              .reduce((s, l) => s + l.planQty, 0)
          const received = (pick: (line: (typeof o.items)[number]) => number) => o.items.reduce((s, i) => s + pick(i), 0)
          expect({ no: o.inboundNo, good: planned('GOOD') }).toEqual({ no: o.inboundNo, good: received((i) => i.goodQty) })
          expect({ no: o.inboundNo, defect: planned('DEFECTIVE') }).toEqual({ no: o.inboundNo, defect: received((i) => i.defectQty) })
        })
    })
  })
})

describe('上架单按应上架行落位（上架单主PRD 第三节）', () => {
  beforeEach(() => {
    resetDb()
  })

  it('同SKU两个批次各占一行，保存与撤销按行定位，不按SKU合并', () => {
    const po = useDb.getState().putawayOrders.find((p) => p.putawayNo === 'PA-20261005-0001')!
    expect(po.planLines).toHaveLength(2)
    expect(po.planLines[0].skuCode).toBe(po.planLines[1].skuCode)
    const [first, second] = po.planLines

    expect(
      useDb.getState().savePutawayLine({
        putawayNo: po.putawayNo,
        locationCode: 'B-01-01',
        planLineNo: second.lineNo,
        qty: 10,
        operator: 'test',
      }),
    ).toEqual({ ok: true })
    const saved = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
    const secondLine = saved.actualLines.find((a) => a.planLineNo === second.lineNo)!
    expect(secondLine.qty).toBe(10)
    expect(secondLine.skuCode).toBe(second.skuCode)

    /** 第二批的落位不动第一批已录（种子第一批已录 300）；按 SKU 合并会串账 */
    expect(recordedOfPlanLine(saved, first.lineNo)).toBe(300)

    expect(
      useDb.getState().savePutawayLine({
        putawayNo: po.putawayNo,
        locationCode: 'B-01-01',
        planLineNo: first.lineNo,
        qty: 20,
        operator: 'test',
      }),
    ).toEqual({ ok: true })
    const afterFirst = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
    expect(recordedOfPlanLine(afterFirst, first.lineNo)).toBe(320)
    expect(recordedOfPlanLine(afterFirst, second.lineNo)).toBe(10)

    expect(
      useDb.getState().removePutawayLine({ putawayNo: po.putawayNo, actualLineNo: secondLine.lineNo, operator: 'test' }),
    ).toEqual({ ok: true })
    const afterRemove = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
    expect(recordedOfPlanLine(afterRemove, second.lineNo)).toBe(0)
    expect(recordedOfPlanLine(afterRemove, first.lineNo)).toBe(320)
    /** 删光落位回到待上架（上架单主PRD 第二节） */
    afterRemove.actualLines.forEach((a) =>
      useDb.getState().removePutawayLine({ putawayNo: po.putawayNo, actualLineNo: a.lineNo, operator: 'test' }),
    )
    const emptied = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
    expect(emptied.actualLines).toHaveLength(0)
    expect(emptied.status).toBe('PENDING')
  })

  it('SN商品两件分别落到两个库位，提交后序列号随行保留', () => {
    const po = useDb.getState().putawayOrders.find((p) => p.putawayNo === 'PA-20261010-0001')!
    expect(po.status).toBe('COMPLETED')
    expect(po.actualLines.map((a) => a.serialNos)).toEqual([['SN00000001'], ['SN00000002']])
    expect(new Set(po.actualLines.map((a) => a.locationCode)).size).toBe(2)
  })

  it('同一库位同一行两条SN落位，撤销第二条后剩下第一条的SN', () => {
    /** 种子里的 SN 上架单已提交（新 SN 商品收货要先量方）：照它放一张待上架的 SN-DEMO-01 × 2 */
    const seeded = useDb.getState().putawayOrders.find((p) => p.putawayNo === 'PA-20261010-0001')!
    const po: PutawayOrder = {
      ...seeded,
      putawayNo: 'PA-TEST-SN-UNDO',
      status: 'PENDING',
      actualLines: [],
      submittedAt: undefined,
      submittedBy: undefined,
    }
    useDb.setState((s) => ({
      putawayOrders: [...s.putawayOrders, po],
      /** SN 落位必须来自本单收货暂存库存 */
      inventory: [
        ...s.inventory,
        {
          id: 'INV-TEST-SN-STAGING',
          warehouseCode: po.warehouseCode,
          locationCode: po.stagingLocationCode,
          customerId: po.customerId,
          skuCode: 'SN-DEMO-01',
          qualityType: 'GOOD',
          onHandQty: 2,
          lockedQty: 0,
          serialNos: ['SN00000101', 'SN00000102'],
          firstInboundAt: '2026-10-10T00:00:00.000Z',
        },
      ],
    }))
    const target = suggestPutawayLocation(po, 'SN-DEMO-01', useDb.getState())!
    const save = (sn: string) =>
      useDb.getState().savePutawayLine({
        putawayNo: po.putawayNo,
        locationCode: target,
        planLineNo: po.planLines[0].lineNo,
        qty: 1,
        serialNos: [sn],
        operator: 'test',
      })
    expect(save('SN00000101')).toEqual({ ok: true })
    expect(save('SN00000102')).toEqual({ ok: true })
    /** SN 每次保存各追加一条，同库位同一应上架行有两条 */
    const placed = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!.actualLines
    expect(placed.map((a) => [a.locationCode, a.planLineNo, a.serialNos])).toEqual([
      [target, po.planLines[0].lineNo, ['SN00000101']],
      [target, po.planLines[0].lineNo, ['SN00000102']],
    ])

    expect(
      useDb.getState().removePutawayLine({ putawayNo: po.putawayNo, actualLineNo: placed[1].lineNo, operator: 'test' }),
    ).toEqual({ ok: true })
    const left = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!.actualLines
    expect(left.map((a) => a.serialNos)).toEqual([['SN00000101']])
    /** 已撤销的行再撤销报找不到，不会顺手删掉剩下那条 */
    expect(
      useDb.getState().removePutawayLine({ putawayNo: po.putawayNo, actualLineNo: placed[1].lineNo, operator: 'test' }),
    ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.lineNotFound' })
  })
})

describe('新品维护量方（新品维护主PRD 第二～四节）', () => {
  beforeEach(() => {
    resetDb()
  })

  it('同一次提交重复到达返回原记录，不新建第二条', () => {
    const input = {
      customerId: 'C10028',
      skuCode: 'SN-DEMO-01',
      warehouseCode: 'US-LA-01',
      length: 12.5,
      width: 8,
      height: 3,
      grossWeight: 0.75,
      requestId: 'test-ns-1',
      operator: 'test',
    }
    const first = useDb.getState().submitNewSkuMeasure(input)
    expect(first.ok).toBe(true)
    const second = useDb.getState().submitNewSkuMeasure(input)
    expect(second.ok).toBe(true)
    expect(second.record?.recordNo).toBe(first.record?.recordNo)
    expect(useDb.getState().newSkuRecords.filter((r) => r.requestId === 'test-ns-1')).toHaveLength(1)
  })

  it('写入仓内规格并把 cm、kg 存到商品资料，展示按仓库单位换算', () => {
    const before = useDb.getState().skuMasters.find((m) => m.customerId === 'C10028' && m.code === 'SN-DEMO-01')!
    const res = useDb.getState().submitNewSkuMeasure({
      customerId: 'C10028',
      skuCode: 'SN-DEMO-01',
      warehouseCode: 'DE-FRA-01',
      length: 30,
      width: 20,
      height: 10,
      grossWeight: 1.25,
      requestId: 'test-ns-2',
      operator: 'test',
    })
    expect(res.ok).toBe(true)
    expect(res.record?.lengthCm).toBe(30)
    expect(res.record?.grossWeightKg).toBe(1.25)
    const after = useDb.getState().skuMasters.find((m) => m.customerId === 'C10028' && m.code === 'SN-DEMO-01')!
    expect(after.lengthCm).toBe(30)
    expect(after.grossWeightKg).toBe(1.25)
    expect(before.updatedAt).not.toBe(after.updatedAt)
    expect(cmToLength(after.lengthCm!, 'imperial')).toBe(11.81)
    expect(kgToWeight(after.grossWeightKg!, 'imperial')).toBe(2.756)
  })

  it('已有同货主SKU记录时阻断并返回已有记录', () => {
    const res = useDb.getState().submitNewSkuMeasure({
      customerId: 'C10028',
      skuCode: 'CABLE-01',
      warehouseCode: 'US-NJ-01',
      length: 10,
      width: 10,
      height: 10,
      grossWeight: 1,
      requestId: 'test-ns-3',
      operator: 'test',
    })
    if (res.ok) throw new Error('expected block')
    expect(res.errorKey).toBe('newSku.error.exists')
    expect(res.record?.recordNo).toBe('NS-20261004-0001')
  })

  it('未维护的新品收货整次提交被阻断，量方后同一提交可通过', () => {
    const order = getInbound('IB-20261002-0009')!
    const blocked = useDb.getState().submitContainerReceipt({
      inboundNo: order.inboundNo,
      containerNo: 'BOX-NEW-01',
      lines: [{ skuCode: 'SN-DEMO-01', goodQty: 1, defectQty: 0 }],
      operator: 'test',
    })
    expect(blocked).toEqual({
      ok: false,
      errorKey: 'inbound.receive.newSkuBlocked',
      params: { skuCode: 'SN-DEMO-01' },
    })
    expect(useDb.getState().receiptRecords.filter((r) => r.inboundNo === order.inboundNo)).toHaveLength(1)

    expect(
      useDb.getState().submitNewSkuMeasure({
        customerId: order.customerId,
        skuCode: 'SN-DEMO-01',
        warehouseCode: order.warehouseCode,
        sourceInboundNo: order.inboundNo,
        length: 12,
        width: 8,
        height: 3,
        grossWeight: 0.8,
        requestId: 'test-ns-4',
        operator: 'test',
      }).ok,
    ).toBe(true)

    const passed = useDb.getState().submitContainerReceipt({
      inboundNo: order.inboundNo,
      containerNo: 'BOX-NEW-01',
      lines: [{ skuCode: 'SN-DEMO-01', goodQty: 1, defectQty: 0, goodSerialNos: ['SN00009999'] }],
      operator: 'test',
    })
    expect(passed).toEqual({ ok: true })
  })
})

describe('无主货登记（无主货登记主PRD 第二～三节）', () => {
  beforeEach(() => {
    resetDb()
  })

  it('只写 unclaimedRecords，不动入库、收货、上架、异常与库存', () => {
    const before = useDb.getState()
    const snapshot = {
      inbounds: before.inbounds,
      receiptRecords: before.receiptRecords,
      putawayOrders: before.putawayOrders,
      inboundExceptions: before.inboundExceptions,
      inventory: before.inventory,
      inventoryLogs: before.inventoryLogs,
    }
    const res = useDb.getState().registerUnclaimed({
      warehouseCode: 'US-LA-01',
      trackingNos: ['1Z999AA10000000001'],
      cartonMarks: [],
      cartonQty: 2,
      requestId: 'test-ug-1',
      operator: 'test',
    })
    expect(res.ok).toBe(true)
    expect(res.record?.status).toBe('HOLDING')
    const after = useDb.getState()
    expect(after.inbounds).toEqual(snapshot.inbounds)
    expect(after.receiptRecords).toEqual(snapshot.receiptRecords)
    expect(after.putawayOrders).toEqual(snapshot.putawayOrders)
    expect(after.inboundExceptions).toEqual(snapshot.inboundExceptions)
    expect(after.inventory).toEqual(snapshot.inventory)
    expect(after.inventoryLogs).toEqual(snapshot.inventoryLogs)
    expect(after.unclaimedRecords.filter((r) => r.requestId === 'test-ug-1')).toHaveLength(1)
  })

  it('同一次提交重复到达返回原UG号；线索全空与箱数不合法均阻断', () => {
    const input = {
      warehouseCode: 'US-LA-01',
      trackingNos: ['1Z999AA10000000002'],
      cartonMarks: [],
      cartonQty: 1,
      requestId: 'test-ug-2',
      operator: 'test',
    }
    const first = useDb.getState().registerUnclaimed(input)
    expect(first.ok).toBe(true)
    const again = useDb.getState().registerUnclaimed(input)
    expect(again.ok).toBe(true)
    expect(again.record?.registerNo).toBe(first.record?.registerNo)

    expect(
      useDb.getState().registerUnclaimed({ ...input, requestId: 'test-ug-3', trackingNos: [] }),
    ).toEqual({ ok: false, errorKey: 'unclaimed.error.clueRequired' })
    expect(
      useDb.getState().registerUnclaimed({ ...input, requestId: 'test-ug-4', cartonQty: 0 }),
    ).toEqual({ ok: false, errorKey: 'error.qtyInvalid' })
    /** 只有箱唛、没有运单号也算有线索（登记不选库位，实物统一放无主货暂存区域） */
    expect(
      useDb
        .getState()
        .registerUnclaimed({ ...input, requestId: 'test-ug-5', trackingNos: [], cartonMarks: ['FBA15XYZ0009'] }).ok,
    ).toBe(true)
  })
})
