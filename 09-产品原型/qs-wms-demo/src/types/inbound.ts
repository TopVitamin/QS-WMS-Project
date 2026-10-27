import type { PutawayRecommendTiming, QualityType } from '@/types/wms'

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
  /** 容器自然键；散件收货为空。 */
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
  /** 启用批次/效期商品按配置采集；同SKU不同批次按行拆开 */
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  /** 启用 SN 时按品质逐件采集；条数必须等于对应数量 */
  goodSerialNos?: string[]
  defectSerialNos?: string[]
}

/** 一次收货提交中的一个容器（或一组无容器收货） */
export type ReceiptContainerInput = {
  containerNo?: string
  bulkPiece?: boolean
  lines: ContainerReceiptLineInput[]
}

export type PutawayOrderStatus = 'PENDING' | 'PUTAWAYING' | 'COMPLETED'

/** 上架单来源业务：入库单或退货单，两者共用同一上架对象 */
export type PutawaySourceType = 'INBOUND' | 'RETURN'

export interface PutawayPlanLine {
  lineNo: number
  /** 对应收货明细行号；同SKU不同批次靠收货行与批次区分 */
  receiptLineNo: number
  skuCode: string
  planQty: number
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  /** AFTER_RECEIVE 模式在生成上架单时保存的推荐库位快照；后续打开或保存落位不自动重算。 */
  suggestedLocationCode?: string
}

export interface PutawayActualLine {
  /** 本单内唯一；落位保存与撤销按它定位 */
  lineNo: number
  /** 关联应上架行；同SKU两个批次不能只靠 skuCode 区分 */
  planLineNo: number
  locationCode: string
  skuCode: string
  qty: number
  /** SN商品落位的序列号，条数等于 qty；保存不改SN库位，整单提交才更新 */
  serialNos?: string[]
  /** Demo 内部标记（未提交/已提交）；「已上架」一律按单头 status 推导 */
  submitted: boolean
}

export interface PutawayOrder {
  putawayNo: string
  /** 来源业务；单号取自对应来源单 */
  sourceType: PutawaySourceType
  sourceNo: string
  warehouseCode: string
  customerId: string
  receiptNo: string
  /** 来源暂存库位，取自收货记录，生成后不变 */
  stagingLocationCode: string
  /** 生成上架单时的货主推荐设置快照；旧数据为空时按兼容逻辑处理。 */
  putawayRecommendTiming?: PutawayRecommendTiming
  containerNo?: string
  containerId?: string
  qualityType: QualityType
  status: PutawayOrderStatus
  planLines: PutawayPlanLine[]
  actualLines: PutawayActualLine[]
  remark?: string
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

/** 上游 OMS Mock 消息：新建/明细变更/取消；受理与否都留痕 */
export type InboundMessageAction = 'CREATE' | 'CHANGE' | 'CANCEL'
export interface InboundMessage {
  id: string
  upstreamNo: string
  version: number
  action: InboundMessageAction
  status: 'ACCEPTED' | 'REJECTED'
  inboundNo?: string
  errorKey?: string
  params?: Record<string, string | number>
  at: string
}

/** 入库完成结果，整单完成时生成一次，可重试 */
export interface InboundResult {
  inboundNo: string
  upstreamNo: string
  status: 'SENT' | 'FAILED'
  attempts: number
  items: { skuCode: string; receivedQty: number; rejectedQty: number; putawayQty: number }[]
  at: string
}

/**
 * 新品维护记录 NS（主 PRD：同一货主＋SKU 一条，四仓共用）。
 * 提交成功即写入商品仓内规格，记录只读。
 */
export interface NewSkuRecord {
  recordNo: string
  customerId: string
  skuCode: string
  /** 维护仓库（执行量方的仓），决定录入单位 */
  warehouseCode: string
  /** 从收货环节发起时带入；独立维护为空 */
  sourceInboundNo?: string
  /** 统一按 cm 存储，展示按查看仓库单位换算 */
  lengthCm: number
  widthCm: number
  heightCm: number
  /** 统一按 kg 存储 */
  grossWeightKg: number
  photos: string[]
  remark?: string
  maintainedBy: string
  maintainedAt: string
  /** 幂等键 */
  requestId: string
}

/** 无主货登记状态；后续 CONVERTED / DISPOSED 待 OMS 认领上线 */
export type UnclaimedStatus = 'HOLDING'

export interface UnclaimedRecord {
  registerNo: string
  status: UnclaimedStatus
  warehouseCode: string
  /** 无主货专用暂存库位（实体位置参考，不形成库存账） */
  stagingLocationCode?: string
  trackingNos: string[]
  cartonMarks: string[]
  containerNo?: string
  cartonQty: number
  description?: string
  photos: string[]
  registeredBy: string
  registeredAt: string
  /** 幂等键 */
  requestId: string
}
