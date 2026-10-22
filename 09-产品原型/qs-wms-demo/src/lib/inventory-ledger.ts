import type { InventoryLog, InventoryRecord } from '@/types/wms'

type LogMeta = Omit<
  Partial<InventoryLog>,
  'warehouseCode' | 'customerId' | 'skuCode' | 'locationCode' | 'qtyChange' | 'level'
> &
  Pick<InventoryLog, 'id' | 'type' | 'refNo' | 'operator' | 'createdAt'>

/**
 * 实际数量类流水，记在库存明细那一行（库存流水主PRD 第一节）。
 * 在库存明细行已经变化之后调用：变化后＝当前实际，变化前＝变化后－变化量。
 */
export function balanceLog(r: InventoryRecord, change: number, meta: LogMeta): InventoryLog {
  return {
    level: 'DETAIL',
    warehouseCode: r.warehouseCode,
    customerId: r.customerId,
    skuCode: r.skuCode,
    locationCode: r.locationCode,
    inventoryId: r.id,
    batchNo: r.batchNo,
    expiryDate: r.expiryDate,
    qualityType: r.qualityType,
    qtyChange: change,
    beforeQty: r.onHandQty - change,
    afterQty: r.onHandQty,
    ...meta,
  }
}

/** 订单预占流水记在SKU良品层：库位、批次为空，实际数量变化为0 */
export function reservedLog(
  key: { warehouseCode: string; customerId: string; skuCode: string },
  change: number,
  before: number,
  meta: LogMeta,
): InventoryLog {
  return {
    level: 'SKU',
    qualityType: 'GOOD',
    warehouseCode: key.warehouseCode,
    customerId: key.customerId,
    skuCode: key.skuCode,
    locationCode: '',
    qtyChange: 0,
    reservedChange: change,
    beforeQty: before,
    afterQty: before + change,
    ...meta,
  }
}

/** 同一动作的一减一加两条流水共用动作标识，并互相指向 */
export function pairLogs(minus: InventoryLog, plus: InventoryLog, actionId: string) {
  minus.actionId = actionId
  plus.actionId = actionId
  minus.pairedLogId = plus.id
  plus.pairedLogId = minus.id
}

/** 变动对象：SKU 层为订单占用，其余为实际数量 */
export const ledgerObject = (l: InventoryLog): 'ACTUAL' | 'RESERVED' => (l.level === 'SKU' ? 'RESERVED' : 'ACTUAL')

/** 变化量：按变动对象取实际数量或订单占用的变化 */
export const ledgerChange = (l: InventoryLog) => (l.level === 'SKU' ? (l.reservedChange ?? 0) : l.qtyChange)

/**
 * 流水号：系统内部编号，不设业务前缀（单据术语与生成规则）。流水只追加不删改，按写入顺序编号，
 * 显示与筛选都用它；内部 id 只做关联。
 */
export function ledgerNumbers(logs: InventoryLog[]): Map<string, string> {
  return new Map(logs.map((l, i) => [l.id, String(i + 1).padStart(6, '0')]))
}
