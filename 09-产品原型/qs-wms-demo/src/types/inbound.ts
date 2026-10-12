import type { QualityType } from '@/types/wms'

/** 入库单单据状态（多数由数量派生；已取消由上游取消受理写入后保持终态） */
export type InboundOrderStatus =
  | 'PENDING_RECEIVE'
  | 'RECEIVING'
  | 'PUTAWAYING'
  | 'COMPLETED'
  | 'CANCELLED'

/** 入库单明细状态（派生；已取消随单收口） */
export type InboundLineStatus = 'PENDING_RECEIVE' | 'RECEIVING' | 'PUTAWAYING' | 'COMPLETED' | 'CANCELLED'

export type ReceiptCloseFlag = 'NOT_CONFIRMED' | 'CONFIRMED'

export type InboundBizType = 'NORMAL' | 'TRANSFER'

export type InboundArrivalMethod = 'CONTAINER' | 'LTL' | 'EXPRESS' | 'OTHER'

export interface InboundOrderLine {
  lineNo: number
  skuCode: string
  plannedQty: number
  receivedQty: number
  rejectedQty: number
  goodQty: number
  defectQty: number
  /** 仅已提交上架单累计 */
  putawayQty: number
  status: InboundLineStatus
}

export interface InboundOrder {
  inboundNo: string
  customerId: string
  warehouseCode: string
  bizType: InboundBizType
  upstreamNo: string
  arrivalMethod?: InboundArrivalMethod
  containerNo?: string
  trackingNos?: string
  etaAt?: string
  firstArrivalAt?: string
  status: InboundOrderStatus
  receiptCloseFlag: ReceiptCloseFlag
  receiptClosedBy?: string
  receiptClosedAt?: string
  completedAt?: string
  items: InboundOrderLine[]
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ReceiptRecordLine {
  lineNo?: number
  skuCode: string
  /** 本行实物所在作业容器；无容器收货时为空 */
  containerNo?: string
  receivedQty: number
  rejectedQty: number
  goodQty: number
  defectQty: number
  rejectReason?: string
  batchNo?: string
  productionDate?: string
  expiryDate?: string
}

export interface ReceiptRecord {
  receiptNo: string
  inboundNo: string
  warehouseCode: string
  customerId: string
  /** 仅单容器提交时有值；一次提交可含多个容器，容器以明细行 `containerNo` 为准（主 PRD R16） */
  containerNo?: string
  stagingLocationCode: string
  operator: string
  receivedAt: string
  lines: ReceiptRecordLine[]
}

export type ContainerReceiptLineInput = {
  skuCode: string
  goodQty: number
  defectQty: number
  rejectedQty?: number
  rejectReason?: string
}

/** 一次收货提交中的一个容器（或一组无容器收货） */
export type ReceiptContainerInput = {
  containerNo?: string
  bulkPiece?: boolean
  lines: ContainerReceiptLineInput[]
}

export type PutawayOrderStatus = 'PENDING' | 'PUTAWAYING' | 'COMPLETED'

export interface PutawayPlanLine {
  lineNo: number
  skuCode: string
  planQty: number
  batchNo?: string
  expiryDate?: string
}

export interface PutawayActualLine {
  locationCode: string
  skuCode: string
  qty: number
  submitted: boolean
}

export interface PutawayOrder {
  putawayNo: string
  inboundNo: string
  warehouseCode: string
  customerId: string
  receiptNo?: string
  containerNo?: string
  qualityType: QualityType
  status: PutawayOrderStatus
  planLines: PutawayPlanLine[]
  actualLines: PutawayActualLine[]
  createdAt: string
  submittedAt?: string
  submittedBy?: string
}

export type InboundExceptionType = 'REJECT'

export interface InboundException {
  exceptionNo: string
  inboundNo: string
  type: InboundExceptionType
  skuCode: string
  qty: number
  reason?: string
  receiptNo: string
  createdAt: string
}
