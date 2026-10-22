import type { SeedData } from '@/mock/seed'
import type { InventoryLog, QualityType } from '@/types/wms'

/** SN只承诺仓库级在库身份，不把库位余额当成单件位置真源。 */
export interface SerialStock {
  customerId: string
  skuCode: string
  serialNo: string
  warehouseCode: string
  status: 'IN_STOCK' | 'SHIPPED' | 'LOST'
  qualityType?: QualityType
  lastLogId?: string
  lastChangedAt?: string
}

type SerialState = Pick<SeedData, 'inventory' | 'inventoryLogs'> & { serialStocks?: SerialStock[] }
export const serialStockId = (s: Pick<SerialStock, 'customerId' | 'skuCode' | 'serialNo'>) =>
  `${s.customerId}::${s.skuCode}::${s.serialNo}`

/** 兼容已有演示数据；初始化一次后独立维护，搬动数量不要求重新登记SN。 */
export function warehouseSerialStocks(s: SerialState): SerialStock[] {
  if (s.serialStocks) return s.serialStocks
  const rows = new Map<string, SerialStock>()
  s.inventory.forEach((r) => {
    if (r.onHandQty <= 0) return
    r.serialNos?.forEach((serialNo) => {
      const row: SerialStock = {
        customerId: r.customerId,
        skuCode: r.skuCode,
        serialNo,
        warehouseCode: r.warehouseCode,
        status: 'IN_STOCK',
        qualityType: r.qualityType,
        lastChangedAt: r.firstInboundAt,
      }
      rows.set(serialStockId(row), row)
    })
  })
  s.inventoryLogs.forEach((l) => {
    if (l.type !== 'SHIP' && l.type !== 'ADJUST') return
    l.serialNos?.forEach((serialNo) => {
      const key = serialStockId({ ...l, serialNo })
      if (!rows.has(key))
        rows.set(key, {
          customerId: l.customerId,
          skuCode: l.skuCode,
          serialNo,
          warehouseCode: l.warehouseCode,
          status: l.type === 'SHIP' ? 'SHIPPED' : l.qtyChange < 0 ? 'LOST' : 'IN_STOCK',
          qualityType: l.qualityType,
          lastLogId: l.id,
          lastChangedAt: l.createdAt,
        })
    })
  })
  return [...rows.values()]
}

/** 数量移库不改变SN身份；未逐件确认的品质转换不能反推每个SN的品质。 */
export function updateSerialStocks(s: SerialState, logs: InventoryLog[]): SerialStock[] {
  const rows = new Map(warehouseSerialStocks(s).map((r) => [serialStockId(r), { ...r }]))
  logs.forEach((l) => {
    if (l.level === 'SKU') return
    if (l.type === 'QUALITY' && !l.serialNos?.length) {
      rows.forEach((r) => {
        if (
          r.warehouseCode === l.warehouseCode &&
          r.customerId === l.customerId &&
          r.skuCode === l.skuCode &&
          r.status === 'IN_STOCK'
        )
          r.qualityType = undefined
      })
    }
    l.serialNos?.forEach((serialNo) => {
      const key = serialStockId({ ...l, serialNo })
      const previous = rows.get(key)
      const status =
        l.type === 'SHIP'
          ? 'SHIPPED'
          : l.type === 'ADJUST' && l.qtyChange < 0
            ? 'LOST'
            : l.qtyChange > 0
              ? 'IN_STOCK'
              : previous?.status
      if (!status) return
      rows.set(key, {
        ...previous,
        customerId: l.customerId,
        skuCode: l.skuCode,
        serialNo,
        warehouseCode: l.warehouseCode,
        status,
        qualityType: l.qtyChange > 0 ? l.qualityType : previous?.qualityType,
        lastLogId: l.id,
        lastChangedAt: l.createdAt,
      })
    })
  })
  return [...rows.values()]
}

export function serialsInWarehouse(
  s: SerialState,
  warehouseCode: string,
  customerId: string,
  skuCode: string,
  qualityType?: QualityType,
) {
  return warehouseSerialStocks(s)
    .filter(
      (r) =>
        r.warehouseCode === warehouseCode &&
        r.customerId === customerId &&
        r.skuCode === skuCode &&
        r.status === 'IN_STOCK' &&
        (!qualityType || !r.qualityType || r.qualityType === qualityType),
    )
    .map((r) => r.serialNo)
}
