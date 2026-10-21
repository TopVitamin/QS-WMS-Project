import { describe, expect, it } from 'vitest'
import type { ReceiptRecord } from '@/types/inbound'
import { applyReceiveDraftChange, defaultReceiveDraft, emptyReceiveDraft, resolveInboundSkuScan } from './inbound-receive'
import { isWorkContainerUsedOnInbound, receiptContainerLabel } from './inbound-receipt-container'
import { interpretQtyInput } from './pda-scan'

describe('applyReceiveDraftChange（收货分册 §2 联动）', () => {
  it('raising defect or reject moves units out of good while the total stays the same', () => {
    const start = defaultReceiveDraft(60)
    const r1 = applyReceiveDraftChange(start, 'defectQty', 2, 60)
    expect(r1).toMatchObject({ ok: true, draft: { goodQty: 58, defectQty: 2, rejectedQty: 0, receivedQty: 60 } })
    if (!r1.ok) return
    const r2 = applyReceiveDraftChange(r1.draft, 'rejectedQty', 3, 60)
    expect(r2).toMatchObject({ ok: true, draft: { goodQty: 55, defectQty: 2, rejectedQty: 3, receivedQty: 57 } })
  })

  it('lowering defect returns units to good', () => {
    const r = applyReceiveDraftChange({ ...emptyReceiveDraft(), goodQty: 5, defectQty: 3, receivedQty: 8 }, 'defectQty', 1, 20)
    expect(r).toMatchObject({ ok: true, draft: { goodQty: 7, defectQty: 1 } })
  })

  it('only grows the total when good has nothing left to give, and rejects going over the limit', () => {
    const base = { ...emptyReceiveDraft(), goodQty: 1, receivedQty: 1 }
    expect(applyReceiveDraftChange(base, 'rejectedQty', 3, 5)).toMatchObject({
      ok: true,
      draft: { goodQty: 0, rejectedQty: 3 },
    })
    expect(applyReceiveDraftChange(base, 'rejectedQty', 6, 5)).toEqual({ ok: false, max: 5 })
    expect(applyReceiveDraftChange(base, 'goodQty', 6, 5)).toEqual({ ok: false, max: 5 })
  })

  it('clears the reject reason once rejected goes back to 0', () => {
    const draft = { ...emptyReceiveDraft(), goodQty: 2, rejectedQty: 1, receivedQty: 2, rejectReason: 'DAMAGED' }
    const r = applyReceiveDraftChange(draft, 'rejectedQty', 0, 10)
    expect(r).toMatchObject({ ok: true, draft: { goodQty: 3, rejectedQty: 0, rejectReason: undefined } })
  })
})

describe('interpretQtyInput（规范 §4.2 扫码不写成数量）', () => {
  it('treats short digit strings as quantities', () => {
    expect(interpretQtyInput('120', 20)).toEqual({ kind: 'number', value: 120 })
    expect(interpretQtyInput(' 20 ', 20)).toEqual({ kind: 'unchanged' })
    expect(interpretQtyInput('', 20)).toEqual({ kind: 'unchanged' })
  })

  it('treats a barcode appended by the scanner as a scan and keeps the quantity', () => {
    expect(interpretQtyInput('20690000000001', 20)).toEqual({ kind: 'scan', code: '690000000001' })
  })

  it('treats replaced text with letters or more than 6 digits as a scan', () => {
    expect(interpretQtyInput('CABLE-01', 20)).toEqual({ kind: 'scan', code: 'CABLE-01' })
    expect(interpretQtyInput('1234567', 0)).toEqual({ kind: 'scan', code: '1234567' })
  })
})

function receipt(lines: Array<{ containerNo?: string }>, containerNo?: string): ReceiptRecord {
  return {
    receiptNo: 'RC-TEST',
    inboundNo: 'IB-TEST',
    warehouseCode: 'US-LA-01',
    customerId: 'C1',
    containerNo,
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'test',
    receivedAt: '2026-10-12T00:00:00.000Z',
    lines: lines.map((l, i) => ({
      lineNo: i + 1,
      skuCode: 'CABLE-01',
      containerNo: l.containerNo,
      receivedQty: 1,
      rejectedQty: 0,
      goodQty: 1,
      defectQty: 0,
    })),
  }
}

describe('收货记录容器（主 PRD R16）', () => {
  const text = { bulk: '无容器收货', many: (first: string, count: number) => `${first} 等 ${count} 个` }

  it('labels single, multiple and no-container receipts', () => {
    expect(receiptContainerLabel(receipt([{ containerNo: 'BOX-A' }], 'BOX-A'), text)).toBe('BOX-A')
    expect(receiptContainerLabel(receipt([{ containerNo: 'BOX-A' }, { containerNo: 'BOX-B' }]), text)).toBe('BOX-A 等 2 个')
    expect(receiptContainerLabel(receipt([{}]), text)).toBe('无容器收货')
    expect(receiptContainerLabel(receipt([{ containerNo: 'BOX-A' }, {}]), text)).toBe('BOX-A 等 2 个')
  })

  it('finds containers used on line level, case-insensitively', () => {
    const records = [receipt([{ containerNo: 'BOX-A' }, { containerNo: 'BOX-B' }])]
    expect(isWorkContainerUsedOnInbound(records, 'IB-TEST', 'box-b')).toBe(true)
    expect(isWorkContainerUsedOnInbound(records, 'IB-TEST', 'BOX-C')).toBe(false)
    expect(isWorkContainerUsedOnInbound(records, 'IB-OTHER', 'BOX-A')).toBe(false)
  })
})

describe('resolveInboundSkuScan（与 Web 作业台同一顺序）', () => {
  const ctx = {
    ownerCode: 'ANKR',
    skuBarcodes: [
      { barcode: 'OWNER-BC-1', ownerCode: 'ANKR', skuCode: 'CABLE-01' },
      { barcode: 'OWNER-BC-2', ownerCode: 'OTHER', skuCode: 'CABLE-01' },
    ],
    primaryBarcode: (s: string) => (s === 'CABLE-01' ? '690000000001' : undefined),
  }

  it('matches SKU code, the order owner barcode, then the primary barcode', () => {
    expect(resolveInboundSkuScan('cable-01', ['CABLE-01'], ctx)).toBe('CABLE-01')
    expect(resolveInboundSkuScan('OWNER-BC-1', ['CABLE-01'], ctx)).toBe('CABLE-01')
    expect(resolveInboundSkuScan('690000000001', ['CABLE-01'], ctx)).toBe('CABLE-01')
  })

  it('ignores other owners\' barcodes and SKUs outside the order', () => {
    expect(resolveInboundSkuScan('OWNER-BC-2', ['CABLE-01'], ctx)).toBeUndefined()
    expect(resolveInboundSkuScan('OWNER-BC-1', ['SN-DEMO-01'], ctx)).toBeUndefined()
  })
})
