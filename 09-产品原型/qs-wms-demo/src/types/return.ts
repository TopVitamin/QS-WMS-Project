import type { QualityType } from './wms'

/** 退货来源：客户退货、平台仓退件、派送失败退回 */
export type ReturnSourceType = 'CUSTOMER' | 'PLATFORM' | 'DELIVERY_FAILED'
export const RETURN_REJECT_REASON = {
  PACKAGE_SEVERELY_DAMAGED: '外包装严重破损',
  SN_MISMATCH: 'SN核对不一致',
} as const
export type ReturnRejectReason = (typeof RETURN_REJECT_REASON)[keyof typeof RETURN_REJECT_REASON]
export const RETURN_OPERATOR_REJECT_REASONS: ReturnRejectReason[] = [RETURN_REJECT_REASON.PACKAGE_SEVERELY_DAMAGED]
export const RETURN_REJECT_REASON_LABEL_KEYS: Record<ReturnRejectReason, string> = {
  [RETURN_REJECT_REASON.PACKAGE_SEVERELY_DAMAGED]: 'return.receive.rejectReasons.packageSeverelyDamaged',
  [RETURN_REJECT_REASON.SN_MISMATCH]: 'return.receive.rejectReasons.snMismatch',
}

export const isReturnRejectReason = (value: unknown): value is ReturnRejectReason =>
  value === RETURN_REJECT_REASON.PACKAGE_SEVERELY_DAMAGED || value === RETURN_REJECT_REASON.SN_MISMATCH

export const isOperatorSelectableReturnRejectReason = (
  value: unknown,
): value is typeof RETURN_REJECT_REASON.PACKAGE_SEVERELY_DAMAGED =>
  value === RETURN_REJECT_REASON.PACKAGE_SEVERELY_DAMAGED

export type ReturnOrderStatus = 'PENDING_RECEIVE' | 'RECEIVING' | 'PUTAWAYING' | 'COMPLETED' | 'CANCELLED'
export type ReturnLineStatus = 'PENDING_RECEIVE' | 'RECEIVING' | 'PUTAWAYING' | 'COMPLETED' | 'CANCELLED'

export interface ReturnOrderLine {
  lineNo: number
  skuCode: string
  /** 派送失败退回时，原出库包裹复核号与包裹号共同形成包裹级预计行。 */
  originalPackageNo?: string
  originalVerificationNo?: string
  originalOutboundLineNo?: number
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
  originalSalesNo?: string
  originalTrackingNo?: string
  platformReturnNo?: string
  trackingNo?: string
  status: ReturnOrderStatus
  items: ReturnOrderLine[]
  remark?: string
  receiveClosedBy?: string
  receiveClosedAt?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
}

export interface ReturnReceiptLine {
  lineNo: number
  /** 回指退货单预计行；派送失败退回据此保留原包裹归属。 */
  returnLineNo?: number
  skuCode: string
  containerNo?: string
  /** 容器自然键；散件退货收货为空。 */
  containerId?: string
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
  serialCheckResult?: 'MATCHED' | 'NO_REFERENCE' | 'MISMATCH_REJECTED'
  /** SN不一致拒收时，保存本次实际比对的原出库SN与扫描SN。 */
  serialMismatchSerialNos?: string[]
  serialReferenceSerialNos?: string[]
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
  sequence: number
  returnNo: string
  upstreamNo: string
  sourceType: ReturnSourceType
  sourceAssociationNo: string
  status: 'SENT' | 'FAILED'
  attempts: number
  items: {
    skuCode: string
    plannedQty: number
    receivedQty: number
    goodQty: number
    defectQty: number
    rejectedQty: number
    shortQty: number
    putawayQty: number
  }[]
  at: string
}

export interface ReturnReceiveLineInput {
  returnLineNo?: number
  skuCode: string
  goodQty: number
  defectQty: number
  rejectedQty?: number
  rejectReason?: ReturnRejectReason
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
