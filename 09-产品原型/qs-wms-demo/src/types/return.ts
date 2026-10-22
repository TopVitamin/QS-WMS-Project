import type { QualityType } from './wms'

/** 退货来源：客户退货、平台仓退件、派送失败退回 */
export type ReturnSourceType = 'CUSTOMER' | 'PLATFORM' | 'DELIVERY_FAILED'
export type ReturnOrderStatus = 'PENDING_RECEIVE' | 'RECEIVING' | 'PUTAWAYING' | 'COMPLETED' | 'CANCELLED'
export type ReturnLineStatus = 'PENDING_RECEIVE' | 'RECEIVING' | 'PUTAWAYING' | 'COMPLETED' | 'CANCELLED'

export interface ReturnOrderLine {
  lineNo: number
  skuCode: string
  plannedQty: number
  receivedQty: number
  goodQty: number
  defectQty: number
  rejectedQty: number
  putawayQty: number
  status: ReturnLineStatus
}

export interface ReturnOrder {
  returnNo: string
  warehouseCode: string
  customerId: string
  sourceType: ReturnSourceType
  /** 上游退货预报号或原出库单号 */
  upstreamNo: string
  originalOutboundNo?: string
  trackingNo?: string
  status: ReturnOrderStatus
  items: ReturnOrderLine[]
  remark?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
}

export interface ReturnReceiptLine {
  lineNo: number
  skuCode: string
  containerNo?: string
  receivedQty: number
  rejectedQty: number
  goodQty: number
  defectQty: number
  rejectReason?: string
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  goodSerialNos?: string[]
  defectSerialNos?: string[]
  /** 拒收件扫到的 SN；与原出库不一致的 SN 只能走这里 */
  rejectedSerialNos?: string[]
  /** SN 核验依据：有原出库可对核，或无可对核原单 */
  serialCheckBasis?: 'ORIGINAL_OUTBOUND' | 'NO_REFERENCE'
}

export interface ReturnReceiptRecord {
  receiptNo: string
  returnNo: string
  warehouseCode: string
  customerId: string
  /** 仅单容器提交时有值；多容器以明细行 containerNo 为准 */
  containerNo?: string
  stagingLocationCode: string
  operator: string
  receivedAt: string
  lines: ReturnReceiptLine[]
}

export interface ReturnException {
  exceptionNo: string
  returnNo: string
  type: 'REJECT'
  skuCode: string
  qty: number
  reason?: string
  receiptNo: string
  createdAt: string
}

export interface ReturnResult {
  returnNo: string
  upstreamNo: string
  status: 'SENT' | 'FAILED'
  attempts: number
  items: { skuCode: string; receivedQty: number; rejectedQty: number; putawayQty: number }[]
  at: string
}

export interface ReturnReceiveLineInput {
  skuCode: string
  goodQty: number
  defectQty: number
  rejectedQty?: number
  rejectReason?: string
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  goodSerialNos?: string[]
  defectSerialNos?: string[]
  /** 拒收件 SN；SN 与原出库不一致时只能放这里 */
  rejectedSerialNos?: string[]
}

/** 一次退货收货提交中的一个容器（或无容器收货的一组） */
export interface ReturnReceiptContainerInput {
  containerNo?: string
  bulkPiece?: boolean
  lines: ReturnReceiveLineInput[]
}

export interface ReturnData {
  returnOrders: ReturnOrder[]
  returnReceipts: ReturnReceiptRecord[]
  returnExceptions: ReturnException[]
  returnResults: ReturnResult[]
}

export type ReturnQuality = QualityType
