import { locationInfo, type LocationUsage } from '@/lib/inventory-derive'
import type { SeedData } from '@/mock/seed'

export type InventoryScanHit =
  | { kind: 'location'; code: string; usage: LocationUsage; enabled: boolean }
  | { kind: 'sku'; customerId: string; skuCode: string }
  /** SN：在库的带所在仓；已出库、已盘亏的取最后一条流水的仓 */
  | { kind: 'serial'; customerId: string; skuCode: string; serialNo: string; warehouseCode: string }

type ScanState = Pick<
  SeedData,
  'locations' | 'locationMasters' | 'skuMasters' | 'skuBarcodes' | 'inventory' | 'inventoryLogs'
>

/**
 * PDA 库内扫码识别（PDA库存查询 PRD）：按库位 → SKU 编码／货主条码／主条码 → SN 的顺序收集命中。
 * 编码类不区分大小写，条码原样比较；同一个码可能是几个货主的同一 SKU，全部返回由页面让人选，不静默猜测。
 * 库存查询、移库、盘点三个作业共用，各步再按自己的范围（源位库存、盘点范围）筛选。
 */
export function resolveInventoryScan(s: ScanState, warehouseCode: string, raw: string): InventoryScanHit[] {
  const code = raw.trim()
  if (!code) return []
  const upper = code.toUpperCase()
  const hits: InventoryScanHit[] = []

  const location = locationInfo(s, warehouseCode, code)
  if (location) hits.push({ kind: 'location', ...location })

  const skus = new Map<string, { customerId: string; skuCode: string }>()
  const addSku = (customerId: string, skuCode: string) => skus.set(`${customerId}::${skuCode}`, { customerId, skuCode })
  s.skuMasters.forEach((m) => {
    if (m.code.toUpperCase() === upper || m.primaryBarcode === code) addSku(m.customerId, m.code)
  })
  s.skuBarcodes
    .filter((b) => b.barcode === code && b.status === 'ENABLED')
    .forEach((b) => {
      const m = s.skuMasters.find((x) => x.ownerCode === b.ownerCode && x.code === b.skuCode)
      if (m) addSku(m.customerId, m.code)
    })
  // 没有商品资料的演示库存按 SKU 编码兜底
  s.inventory
    .filter((r) => r.warehouseCode === warehouseCode && r.skuCode.toUpperCase() === upper)
    .forEach((r) => addSku(r.customerId, r.skuCode))
  skus.forEach((k) => hits.push({ kind: 'sku', ...k }))

  const stock = s.inventory.find((r) => r.onHandQty > 0 && r.serialNos?.some((sn) => sn.toUpperCase() === upper))
  if (stock) {
    const serialNo = stock.serialNos!.find((sn) => sn.toUpperCase() === upper)!
    hits.push({
      kind: 'serial',
      customerId: stock.customerId,
      skuCode: stock.skuCode,
      serialNo,
      warehouseCode: stock.warehouseCode,
    })
  } else {
    const last = s.inventoryLogs
      .filter((l) => l.serialNos?.some((sn) => sn.toUpperCase() === upper))
      .reduce<SeedData['inventoryLogs'][number] | undefined>(
        (latest, l) => (!latest || l.createdAt >= latest.createdAt ? l : latest),
        undefined,
      )
    if (last) {
      const serialNo = last.serialNos!.find((sn) => sn.toUpperCase() === upper)!
      hits.push({
        kind: 'serial',
        customerId: last.customerId,
        skuCode: last.skuCode,
        serialNo,
        warehouseCode: last.warehouseCode,
      })
    }
  }
  return hits
}

/** 商品的模拟扫码值：货主主条码，没有时用 SKU 编码 */
export function skuScanValue(s: Pick<SeedData, 'skuMasters'>, customerId: string, skuCode: string): string {
  return s.skuMasters.find((m) => m.customerId === customerId && m.code === skuCode)?.primaryBarcode ?? skuCode
}

/** 自然顺序比较库位编号：A-01-02 在 A-01-10 前 */
export const compareLocation = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
