import type { NewSkuRecord } from '@/types/inbound'
import type { SkuMaster } from '@/types/wms'

/**
 * 新品判断（新品维护主PRD 第二节）：同一货主＋SKU 没有提交成功的 NS 记录就是新品。
 * 只看 NS 记录，不看上游「需维护」标记，也不看商品上是否已有预报尺寸。
 */
export function findNewSkuRecord(
  records: NewSkuRecord[],
  customerId: string,
  skuCode: string,
): NewSkuRecord | undefined {
  return records.find((r) => r.customerId === customerId && r.skuCode === skuCode)
}

export function isNewSku(records: NewSkuRecord[], customerId: string, skuCode: string): boolean {
  return !findNewSkuRecord(records, customerId, skuCode)
}

/** 独立量方时可选的商品：该货主启用且尚无 NS 记录 */
export function measureCandidates(
  records: NewSkuRecord[],
  skuMasters: SkuMaster[],
  customerId: string,
): SkuMaster[] {
  return skuMasters.filter(
    (m) => m.customerId === customerId && m.status === 'ENABLED' && isNewSku(records, m.customerId, m.code),
  )
}
