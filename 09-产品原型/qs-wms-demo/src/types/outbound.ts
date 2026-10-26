import type { QualityType } from './wms'

export type OutboundType = 'B2C' | 'FBA' | 'WHOLESALE' | 'TRANSFER' | 'PURCHASE_RETURN' | 'OTHER'
export type OutboundStatus =
  | 'PENDING_HANDLE'
  | 'PENDING_PICK'
  | 'PENDING_VERIFY'
  | 'PENDING_SHIPMENT'
  | 'SHIPPED'
  | 'CANCELLED'
export type PickStatus = 'PENDING_PICK' | 'PICKING' | 'COMPLETED' | 'CLOSED'
/** 波次头状态（宏观架构 §3.4；不表达拣货任务拣货中） */
export type WaveStatus = 'ALLOCATED' | 'RELEASED' | 'COMPLETED' | 'CANCELLED'
export interface OutboundItem {
  lineNo: number
  skuCode: string
  demandQty: number
  reservedQty: number
  pickedQty: number
  verifiedQty: number
  shippedQty: number
}
export interface SpecifiedStock {
  itemNo: number
  inventoryId: string
  qty: number
  serialNos: string[]
}
export interface OutboundOrder {
  no: string
  type: OutboundType
  status: OutboundStatus
  warehouseCode: string
  customerId: string
  source: 'OMS' | 'MANUAL'
  upstreamNo?: string
  /** 接单消息标识（OMS 来源） */
  messageId?: string
  version: number
  channelCode?: string
  recipient: string
  address: string
  phone?: string
  originalInboundNo?: string
  emailBasis?: string
  remark?: string
  cancelReason?: string
  items: OutboundItem[]
  specified: SpecifiedStock[]
  createdAt: string
  updatedAt: string
  shippedAt?: string
  shippedBy?: string
  cancelledAt?: string
  createFingerprint?: string
}
export interface PickShare {
  orderNo: string
  itemNo: number
  qty: number
}
export interface PickLine {
  id: string
  inventoryId: string
  locationCode: string
  skuCode: string
  batchNo?: string
  containerId?: string
  expiryDate?: string
  qualityType: QualityType
  plannedQty: number
  pickedQty: number
  shortageQty: number
  shortageReason?: 'MISSING' | 'DAMAGED'
  /** 上报缺货后本次换位补上的数量；短拣＝shortageQty－replacedQty */
  replacedQty?: number
  shares: PickShare[]
}
export interface PickAssignment {
  id: string
  lineId: string
  orderNo: string
  itemNo: number
  stagingInventoryId: string
  pickedQty: number
  activeQty: number
  serialNos: string[]
  activeSerialNos: string[]
  at: string
  operator: string
}
export interface OutboundPickTask {
  no: string
  warehouseCode: string
  customerId: string
  source: 'ORDER' | 'WAVE' | 'SUPPLEMENT'
  orderNo?: string
  waveNo?: string
  status: PickStatus
  stagingCode: string
  lines: PickLine[]
  assignments: PickAssignment[]
  confirmations: string[]
  createdAt: string
  completedAt?: string
  submittedBy?: string
  remark?: string
}
export interface OutboundWave {
  no: string
  warehouseCode: string
  customerId: string
  taskNo: string
  members: string[]
  status: WaveStatus
  createdAt: string
  remark?: string
}
export interface VerifyLine {
  assignmentId: string
  itemNo: number
  skuCode: string
  qty: number
  effectiveQty: number
  serialNos: string[]
}
export interface OutboundVerification {
  no: string
  orderNo: string
  method: 'SORT' | 'PACK'
  containerType: 'NONE' | 'PACKAGE' | 'BOX' | 'PALLET'
  containerNo: string
  /** FBA箱的父托；托直接装货时为空 */
  parentContainerNo?: string
  trackingNo?: string
  weightKg?: number
  remark?: string
  lines: VerifyLine[]
  deleted?: boolean
  at: string
  operator: string
}
export interface PutbackLine {
  placements?: { location: string; qty: number; serialNos: string[] }[]
  id: string
  itemNo: number
  skuCode: string
  stagingInventoryId: string
  fromLocation: string
  suggestedLocation: string
  batchNo?: string
  qualityType: QualityType
  qty: number
  serialNos: string[]
  targetLocation?: string
  savedQty: number
}
export interface OutboundPutback {
  no: string
  orderNo: string
  warehouseCode: string
  customerId: string
  reason: 'CANCEL' | 'MISSING' | 'DAMAGED'
  status: 'PENDING' | 'PUTAWAYING' | 'COMPLETED'
  lines: PutbackLine[]
  createdAt: string
  completedAt?: string
  submittedBy?: string
  remark?: string
}
export interface OutboundHandover {
  no: string
  orderNo: string
  method: 'CARRIER' | 'DRIVER' | 'PICKUP'
  party: string
  channelCode?: string
  credential: string
  containerQty: number
  at: string
  operator: string
  remark?: string
  attachments?: string[]
}
/** 确认出库时随单登记的交接资料，字段与补登一致 */
export interface OutboundHandoverInput {
  method: OutboundHandover['method']
  party: string
  credential: string
  channelCode?: string
  containerQty: number
  at: string
  remark?: string
  attachments?: string[]
}
export interface SkuAllocationControl {
  warehouseCode: string
  customerId: string
  skuCode: string
  sources: string[]
}
export interface OutboundMessage {
  fingerprint: string
  id: string
  upstreamNo: string
  version: number
  action: 'CREATE' | 'CHANGE' | 'CANCEL'
  status: 'ACCEPTED' | 'REJECTED'
  orderNo?: string
  errorKey?: string
  params?: Record<string, string | number>
  at: string
}
export interface OutboundResult {
  orderNo: string
  upstreamNo: string
  sequence: number
  status: 'SENT' | 'FAILED'
  attempts: number
  items: { skuCode: string; shippedQty: number; unshippedQty: number }[]
  at: string
}
export interface OutboundData {
  outboundOrders: OutboundOrder[]
  outboundWaves: OutboundWave[]
  outboundPickTasks: OutboundPickTask[]
  outboundVerifications: OutboundVerification[]
  outboundPutbacks: OutboundPutback[]
  outboundHandovers: OutboundHandover[]
  skuAllocationControls: SkuAllocationControl[]
  outboundMessages: OutboundMessage[]
  outboundResults: OutboundResult[]
}
export interface OutboundCreateInput {
  type: OutboundType
  warehouseCode: string
  customerId: string
  source: 'OMS' | 'MANUAL'
  messageId?: string
  upstreamNo?: string
  version?: number
  channelCode?: string
  recipient: string
  address: string
  phone?: string
  originalInboundNo?: string
  emailBasis?: string
  remark?: string
  items: { skuCode: string; qty: number }[]
  specified?: SpecifiedStock[]
}
export type OutboundCommand =
  | { type: 'CREATE'; input: OutboundCreateInput }
  | { type: 'CHANGE'; no: string; messageId: string; version: number; items: { skuCode: string; qty: number }[] }
  | { type: 'CANCEL'; no: string; messageId?: string; version?: number; reason?: string }
  | { type: 'ALLOCATE'; no: string; containerId?: string }
  | { type: 'WAVE'; orderNos: string[] }
  | {
      type: 'PICK'
      no: string
      lineId: string
      location: string
      sku: string
      batch?: string
      serialNos: string[]
      qty: number
      confirmationId: string
    }
  | { type: 'SHORTAGE'; no: string; lineId: string; qty: number; reason: 'MISSING' | 'DAMAGED' }
  | { type: 'FINISH_PICK'; no: string }
  | {
      type: 'VERIFY'
      no: string
      method: OutboundVerification['method']
      containerType: OutboundVerification['containerType']
      containerNo: string
      parentContainerNo?: string
      weightKg?: number
      remark?: string
      lines: { assignmentId: string; qty: number; serialNos: string[] }[]
    }
  | { type: 'DELETE_VERIFY'; no: string }
  | { type: 'PACK_VERIFY'; no: string; containerNo: string; weightKg: number }
  | {
      type: 'UNPICK'
      no: string
      assignmentId: string
      qty: number
      serialNos: string[]
      reason: 'MISSING' | 'DAMAGED'
    }
  | { type: 'SHIP'; no: string; handover?: OutboundHandoverInput }
  | { type: 'RETRY_RESULT'; no: string; simulateFailure?: boolean }
  | ({ type: 'HANDOVER'; no: string } & OutboundHandoverInput)
  | {
      type: 'SAVE_PUTBACK'
      no: string
      lineId: string
      location: string
      qty: number
      /** SN 行逐件扫到的序列号；不传按应返库清单顺序取 */
      serialNos?: string[]
    }
  | { type: 'RESET_PUTBACK_LINE'; no: string; lineId: string }
  | { type: 'SUBMIT_PUTBACK'; no: string }
