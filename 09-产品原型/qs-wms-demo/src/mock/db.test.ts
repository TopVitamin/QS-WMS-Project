import { beforeEach, describe, expect, it } from 'vitest'
import { suggestPutawayLocation } from '@/lib/putaway'
import type { PutawayOrder } from '@/types/inbound'
import { useDb } from './db'

function resetDb() {
  localStorage.clear()
  useDb.getState().resetDemo()
}

/** 固定验收种子 0001：US-LA-01，CABLE-01 预计 500，待收货 */
function findPendingInbound() {
  return useDb.getState().inbounds.find((o) => o.inboundNo === 'RK-20261002-0001' && o.status === 'PENDING_RECEIVE')
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

      const save = useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: target, skuCode, qty: 10, operator: 'test' })
      expect(save).toEqual({ ok: true })
      const saved = useDb.getState().putawayOrders.find((p) => p.putawayNo === po.putawayNo)!
      expect(saved.status).toBe('PUTAWAYING')
      expect(saved.actualLines).toEqual([{ locationCode: target, skuCode, qty: 10, submitted: false }])
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
        useDb.getState().savePutawayLine({ putawayNo: defect.putawayNo, locationCode: 'A-01-01', skuCode: item.skuCode, qty: 10, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.defectOnly' })
      expect(
        useDb.getState().savePutawayLine({ putawayNo: good.putawayNo, locationCode: 'DEFECT-01', skuCode: item.skuCode, qty: 1, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.goodToDefect' })
      expect(
        useDb.getState().savePutawayLine({ putawayNo: good.putawayNo, locationCode: 'STAGE-IN-01', skuCode: item.skuCode, qty: 1, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.staging' })

      const goodTarget = suggestPutawayLocation(good, item.skuCode, useDb.getState())!
      useDb.getState().savePutawayLine({ putawayNo: good.putawayNo, locationCode: goodTarget, skuCode: item.skuCode, qty: item.plannedQty - 10, operator: 'test' })
      useDb.getState().savePutawayLine({ putawayNo: defect.putawayNo, locationCode: 'DEFECT-01', skuCode: item.skuCode, qty: 10, operator: 'test' })
      expect(useDb.getState().submitPutawayOrder({ putawayNo: good.putawayNo, operator: 'test' })).toEqual({ ok: true })
      expect(getInbound(order.inboundNo)!.status).toBe('PUTAWAYING')
      expect(useDb.getState().submitPutawayOrder({ putawayNo: defect.putawayNo, operator: 'test' })).toEqual({ ok: true })
      expect(getInbound(order.inboundNo)!.status).toBe('COMPLETED')
    })

    it('cannot submit until every plan line is fully placed; undo returns the order to PENDING', () => {
      const po = useDb.getState().putawayOrders.find((p) => p.putawayNo === 'PA-20261009-0001')!
      const skuCode = po.planLines[0].skuCode
      const target = suggestPutawayLocation(po, skuCode, useDb.getState())!
      useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: target, skuCode, qty: 10, operator: 'test' })
      expect(useDb.getState().submitPutawayOrder({ putawayNo: po.putawayNo, operator: 'test' })).toEqual({
        ok: false,
        errorKey: 'pdaPutaway.error.planMismatch',
      })
      expect(
        useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: target, skuCode, qty: po.planLines[0].planQty, operator: 'test' }),
      ).toEqual({ ok: false, errorKey: 'pdaPutaway.error.overRemain' })

      expect(useDb.getState().removePutawayLine({ putawayNo: po.putawayNo, locationCode: target, skuCode, operator: 'test' })).toEqual({ ok: true })
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
        useDb.getState().savePutawayLine({ putawayNo: po.putawayNo, locationCode: 'C-04-03', skuCode: po.planLines[0].skuCode, qty: 1, operator: 'test' }),
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
        expect(state.putawayOrders.some((p) => p.inboundNo === o.inboundNo)).toBe(true)
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
              .filter((p) => p.inboundNo === o.inboundNo && p.qualityType === quality)
              .flatMap((p) => p.planLines)
              .reduce((s, l) => s + l.planQty, 0)
          const received = (pick: (line: (typeof o.items)[number]) => number) => o.items.reduce((s, i) => s + pick(i), 0)
          expect({ no: o.inboundNo, good: planned('GOOD') }).toEqual({ no: o.inboundNo, good: received((i) => i.goodQty) })
          expect({ no: o.inboundNo, defect: planned('DEFECTIVE') }).toEqual({ no: o.inboundNo, defect: received((i) => i.defectQty) })
        })
    })
  })
})
