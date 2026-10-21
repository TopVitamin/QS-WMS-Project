import type { QualityType } from './wms'

/** 盘点来源（盘点单主PRD 第一节） */
export type StocktakeSource = 'PLAN' | 'DISCREPANCY'
/** 发现环节：拣货缺货、复核少件、上架找不到、返库上架找不到、移库时账实不符 */
export type DiscoveryStage = 'PICK_SHORTAGE' | 'VERIFY_SHORT' | 'PUTAWAY_MISSING' | 'PUTBACK_MISSING' | 'MOVE_MISMATCH'
export type StocktakeStatus = 'COUNTING' | 'COMPLETED' | 'CANCELLED'

/** 盘点商品：SKU 在货主范围内，所以带货主 */
export interface StocktakeSku {
  customerId: string
  skuCode: string
}

/** 发现依据的一段：建单时一段，同 SKU 已在盘点中时 PDA 再次发现按次追加 */
export interface StocktakeDiscovery {
  stage: DiscoveryStage
  customerId: string
  skuCode: string
  locationCode: string
  diffQty: number
  note: string
  /** 原业务记录（缺货上报的拣货任务、退拣的返库上架单、上架单等） */
  sourceNo?: string
  reportedBy: string
  reportedAt: string
}

export interface StocktakeLine {
  lineNo: number
  /** 快照对应的库存明细；实盘新增行为空，差异确认时生成 */
  inventoryId?: string
  locationCode: string
  customerId: string
  skuCode: string
  batchNo?: string
  expiryDate?: string
  qualityType: QualityType
  bookQty: number
  bookSerialNos: string[]
  /** 未录入为 undefined；录入 0 也算已盘 */
  countedQty?: number
  countedSerialNos?: string[]
  countedBy?: string
  countedAt?: string
  diffNote?: string
  /** 实盘新增的账面 0 行 */
  added?: boolean
  adjustLogId?: string
}

export interface InventoryCount {
  no: string
  warehouseCode: string
  skus: StocktakeSku[]
  source: StocktakeSource
  discoveries: StocktakeDiscovery[]
  remark?: string
  status: StocktakeStatus
  createdBy: string
  /** 发起时间，同时是账面快照时点 */
  createdAt: string
  confirmedBy?: string
  confirmedAt?: string
  cancelledBy?: string
  cancelledAt?: string
  cancelReason?: string
  lines: StocktakeLine[]
}

export interface StockMoveLine {
  lineNo: number
  skuCode: string
  sourceLocation: string
  targetLocation: string
  batchNo?: string
  expiryDate?: string
  qualityType: QualityType
  qty: number
  serialNos: string[]
  sourceLogId: string
  targetLogId: string
}

/** 一次 PDA 移库提交（移库作业主PRD 第一节）；整次成功才生成 */
export interface StockMove {
  no: string
  /** 提交请求号：同一提交重复发送只返回原移库作业号 */
  requestId: string
  warehouseCode: string
  customerId: string
  operator: string
  submittedAt: string
  terminal: 'PDA'
  lines: StockMoveLine[]
}

/** 品质转换货主通知结果 */
export type OwnerNotice = 'NOTIFIED' | 'PENDING' | 'NOT_REQUIRED'

export type InventoryCommand =
  | {
      type: 'CONVERT_QUALITY'
      /** 确认请求号：重复确认只返回原结果，不生成第二组转换流水 */
      requestId: string
      inventoryId: string
      qty: number
      serialNos: string[]
      reasonNote: string
      evidence: string
      ownerNotice: OwnerNotice
    }
  | {
      type: 'SUBMIT_MOVE'
      requestId: string
      warehouseCode: string
      lines: { inventoryId: string; targetLocation: string; qty: number; serialNos: string[] }[]
    }
  | {
      type: 'REPORT_DISCREPANCY'
      warehouseCode: string
      customerId: string
      skuCode: string
      stage: DiscoveryStage
      locationCode: string
      sourceNo?: string
    }
  | { type: 'CREATE_STOCKTAKE'; warehouseCode: string; skus: StocktakeSku[]; remark?: string }
  | {
      type: 'CREATE_STOCKTAKE_FROM_DISCREPANCY'
      warehouseCode: string
      customerId: string
      skuCode: string
      stage: DiscoveryStage
      locationCode: string
      diffQty: number
      note: string
      sourceNo?: string
    }
  | { type: 'SAVE_COUNTS'; no: string; entries: { lineNo: number; qty: number; serialNos: string[]; note?: string }[] }
  | {
      type: 'ADD_COUNT_LINE'
      no: string
      locationCode: string
      customerId: string
      skuCode: string
      batchNo?: string
      expiryDate?: string
      qualityType: QualityType
      qty: number
      serialNos: string[]
      note?: string
    }
  | { type: 'CONFIRM_STOCKTAKE'; no: string }
  | { type: 'CANCEL_STOCKTAKE'; no: string; reason: string }
