import { describe, expect, it } from 'vitest'
import type { InventoryRecord } from '@/types/wms'
import { balanceLog, ledgerChange, ledgerObject, reservedLog } from './inventory-ledger'

const record = (overrides: Partial<InventoryRecord> = {}): InventoryRecord => ({
  id: 'INV-1',
  warehouseCode: 'WH-LA',
  locationCode: 'A-01-01',
  customerId: 'CUS-1',
  skuCode: 'SKU-1',
  qualityType: 'GOOD',
  onHandQty: 5,
  lockedQty: 0,
  firstInboundAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
})

const meta = {
  id: 'LOG-1',
  type: 'RECEIVE' as const,
  refNo: 'IB-1',
  operator: 'tester',
  createdAt: '2026-10-01T10:00:00.000Z',
}

describe('库存流水口径', () => {
  it('有批次的批次库位实际仍记在明细层，不因批次存在改记 SKU 层', () => {
    const log = balanceLog(record({ batchNo: 'BATCH-1' }), 3, meta)
    expect(log.level).toBe('DETAIL')
    expect(log.batchNo).toBe('BATCH-1')
    expect(log.locationCode).toBe('A-01-01')
    expect(ledgerObject(log)).toBe('ACTUAL')
    expect(ledgerChange(log)).toBe(3)
  })

  it('非批次商品批次为空，仍记在明细层并保留库位', () => {
    const log = balanceLog(record(), 3, meta)
    expect(log.level).toBe('DETAIL')
    expect(log.batchNo).toBeUndefined()
    expect(log.locationCode).toBe('A-01-01')
    expect(ledgerObject(log)).toBe('ACTUAL')
  })

  it('SKU订单预占不带库位、批次，品质为良品', () => {
    const log = reservedLog({ warehouseCode: 'WH-LA', customerId: 'CUS-1', skuCode: 'SKU-1' }, 2, 0, {
      ...meta,
      type: 'RESERVE',
    })
    expect(log.level).toBe('SKU')
    expect(log.locationCode).toBe('')
    expect(log.batchNo).toBeUndefined()
    expect(log.qualityType).toBe('GOOD')
    expect(log.qtyChange).toBe(0)
    expect(log.reservedChange).toBe(2)
    expect(ledgerObject(log)).toBe('RESERVED')
    expect(ledgerChange(log)).toBe(2)
  })

  it('变化前、变化后与变化量都只在本行口径内计算', () => {
    const actual = balanceLog(record(), -2, { ...meta, type: 'SHIP' })
    expect(actual.beforeQty).toBe(7)
    expect(actual.afterQty).toBe(5)
    expect(ledgerChange(actual)).toBe(-2)

    const reserved = reservedLog({ warehouseCode: 'WH-LA', customerId: 'CUS-1', skuCode: 'SKU-1' }, -2, 7, {
      ...meta,
      type: 'SHIP',
    })
    expect(reserved.beforeQty).toBe(7)
    expect(reserved.afterQty).toBe(5)
    expect(ledgerChange(reserved)).toBe(-2)
  })
})
