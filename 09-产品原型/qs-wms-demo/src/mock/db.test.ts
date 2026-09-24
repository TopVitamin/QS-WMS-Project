import { beforeEach, describe, expect, it } from 'vitest'
import { useDb } from './db'

function resetDb() {
  localStorage.clear()
  useDb.getState().resetDemo()
}

function findPendingInbound() {
  return useDb.getState().inbounds.find((o) => o.status === 'PENDING')
}

function totalOnHandQty() {
  return useDb.getState().inventory.reduce((sum, record) => sum + record.onHandQty, 0)
}

describe('useDb actions', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('signInbound', () => {
    it('signs a PENDING inbound successfully', () => {
      const order = findPendingInbound()
      expect(order).toBeDefined()

      const result = useDb.getState().signInbound(order!.inboundNo)
      expect(result).toEqual({ ok: true })

      const updated = useDb.getState().inbounds.find((o) => o.inboundNo === order!.inboundNo)
      expect(updated?.status).toBe('ARRIVED')
    })

    it('returns error when inbound not found', () => {
      const result = useDb.getState().signInbound('IN9999999999')
      expect(result).toEqual({ ok: false, errorKey: 'error.inboundNotFound' })
    })

    it('returns error when status is not PENDING', () => {
      const order = findPendingInbound()
      expect(order).toBeDefined()

      useDb.getState().signInbound(order!.inboundNo)
      const result = useDb.getState().signInbound(order!.inboundNo)
      expect(result).toEqual({ ok: false, errorKey: 'error.statusNotAllowed' })
    })
  })

  describe('receiveInboundItem', () => {
    it('increases inventory after receiving defect qty', () => {
      const order = findPendingInbound()
      expect(order).toBeDefined()

      useDb.getState().signInbound(order!.inboundNo)
      const skuCode = order!.items[0].skuCode
      const before = totalOnHandQty()

      const result = useDb.getState().receiveInboundItem({
        inboundNo: order!.inboundNo,
        skuCode,
        goodQty: 0,
        defectQty: 5,
        operator: 'test',
      })
      expect(result).toEqual({ ok: true })
      expect(totalOnHandQty()).toBe(before + 5)

      const defect = useDb.getState().inventory.find(
        (record) =>
          record.skuCode === skuCode && record.qualityType === 'DEFECTIVE' && record.locationCode === 'DEFECT-01',
      )
      expect(defect?.onHandQty).toBe(5)
    })

    it('increases inventory after receiving good qty and putaway', () => {
      const order = findPendingInbound()
      expect(order).toBeDefined()

      useDb.getState().signInbound(order!.inboundNo)
      const skuCode = order!.items[0].skuCode
      const goodQty = 10
      const before = totalOnHandQty()

      const receiveResult = useDb.getState().receiveInboundItem({
        inboundNo: order!.inboundNo,
        skuCode,
        goodQty,
        defectQty: 0,
        operator: 'test',
      })
      expect(receiveResult).toEqual({ ok: true })
      expect(totalOnHandQty()).toBe(before)

      const task = useDb.getState().putawayTasks.find(
        (t) => t.inboundNo === order!.inboundNo && t.skuCode === skuCode && t.status !== 'COMPLETED',
      )
      expect(task).toBeDefined()

      const putawayResult = useDb.getState().putaway({
        putawayNo: task!.putawayNo,
        locationCode: task!.suggestedLocationCode,
        qty: goodQty,
        operator: 'test',
      })
      expect(putawayResult).toEqual({ ok: true })
      expect(totalOnHandQty()).toBe(before + goodQty)
    })
  })

  describe('putaway', () => {
    it('updates task and inbound status after putaway', () => {
      const order = findPendingInbound()
      expect(order).toBeDefined()

      useDb.getState().signInbound(order!.inboundNo)
      const skuCode = order!.items[0].skuCode
      const goodQty = 10

      useDb.getState().receiveInboundItem({
        inboundNo: order!.inboundNo,
        skuCode,
        goodQty,
        defectQty: 0,
        operator: 'test',
      })

      const task = useDb.getState().putawayTasks.find(
        (t) => t.inboundNo === order!.inboundNo && t.skuCode === skuCode,
      )
      expect(task).toBeDefined()

      const result = useDb.getState().putaway({
        putawayNo: task!.putawayNo,
        locationCode: task!.suggestedLocationCode,
        qty: goodQty,
        operator: 'test',
      })
      expect(result).toEqual({ ok: true })

      const updatedTask = useDb.getState().putawayTasks.find((t) => t.putawayNo === task!.putawayNo)
      expect(updatedTask?.status).toBe('COMPLETED')
      expect(updatedTask?.actualQty).toBe(goodQty)

      const updatedOrder = useDb.getState().inbounds.find((o) => o.inboundNo === order!.inboundNo)
      const item = updatedOrder?.items.find((i) => i.skuCode === skuCode)
      expect(item?.putawayQty).toBe(goodQty)
      expect(updatedOrder?.status).toBe('PARTIAL_PUT')
    })
  })

  describe('illegal status operations', () => {
    it('returns errorKey when receiving on CANCELLED inbound', () => {
      const cancelled = useDb.getState().inbounds.find((o) => o.status === 'CANCELLED')
      expect(cancelled).toBeDefined()

      const result = useDb.getState().receiveInboundItem({
        inboundNo: cancelled!.inboundNo,
        skuCode: cancelled!.items[0].skuCode,
        goodQty: 1,
        defectQty: 0,
        operator: 'test',
      })
      expect(result).toEqual({ ok: false, errorKey: 'error.statusNotAllowed' })
    })

    it('returns errorKey when putaway qty exceeds remain', () => {
      const task = useDb.getState().putawayTasks.find((t) => t.status === 'PENDING')
      expect(task).toBeDefined()

      const result = useDb.getState().putaway({
        putawayNo: task!.putawayNo,
        locationCode: task!.suggestedLocationCode,
        qty: task!.planQty + 1,
        operator: 'test',
      })
      expect(result).toEqual({ ok: false, errorKey: 'error.qtyInvalid' })
    })
  })
})
