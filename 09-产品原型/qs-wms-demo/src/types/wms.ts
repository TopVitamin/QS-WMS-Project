export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY'
export type UnitSystem = 'metric' | 'imperial'
export type QualityType = 'GOOD' | 'DEFECTIVE'

export interface Money {
  amount: number
  currency: CurrencyCode
}

export interface Warehouse {
  code: string
  nameKey: string
  countryCode: string
  timezone: string
  currency: CurrencyCode
  unitSystem: UnitSystem
}

export interface Customer {
  id: string
  code: string
  name: string
}

export interface Sku {
  code: string
  customerId: string
  name: string
  barcode: string
  weightG: number
  lengthCm: number
  widthCm: number
  heightCm: number
  declaredValue: Money
  /** Amazon FNSKU（海外仓） */
  fnsku?: string
  /** 平台 SKU 编码（海外仓） */
  platformSku?: string
  /** Amazon ASIN（海外仓） */
  asin?: string
}

export type LocationType = 'PICK' | 'STORAGE' | 'STAGING' | 'DEFECT'

export interface Location {
  code: string
  warehouseCode: string
  zone: string
  type: LocationType
}

/** 附录B 2.1 入库单状态 */
export type InboundStatus =
  | 'PENDING'
  | 'ARRIVED'
  | 'RECEIVING'
  | 'PARTIAL_PUT'
  | 'COMPLETED'
  | 'ABNORMAL'
  | 'CANCELLED'

export type InboundBizType = 'STANDARD' | 'FBA_RETURN' | 'TRANSFER'
export type LoadType = 'CONTAINER' | 'PALLET' | 'BOX'

export interface InboundItem {
  skuCode: string
  plannedQty: number
  receivedGoodQty: number
  receivedDefectQty: number
  putawayQty: number
}

export interface InboundOrder {
  inboundNo: string
  customerId: string
  warehouseCode: string
  bizType: InboundBizType
  loadType: LoadType
  containerNo: string
  plannedCartonQty: number
  etaAt: string
  status: InboundStatus
  items: InboundItem[]
  remark?: string
  createdAt: string
  updatedAt: string
}

export type PutawayTaskStatus = 'PENDING' | 'DOING' | 'COMPLETED'

export interface PutawayTask {
  putawayNo: string
  inboundNo: string
  warehouseCode: string
  customerId: string
  skuCode: string
  qualityType: QualityType
  planQty: number
  actualQty: number
  sourceLocationCode: string
  suggestedLocationCode: string
  actualLocationCode?: string
  status: PutawayTaskStatus
  createdAt: string
  completedAt?: string
}

export interface InventoryRecord {
  id: string
  warehouseCode: string
  locationCode: string
  customerId: string
  skuCode: string
  qualityType: QualityType
  onHandQty: number
  lockedQty: number
  /** 库存预占数量 */
  reservedQty?: number
  /** 批次号 */
  batchNo?: string
  /** 效期（ISO 8601 日期） */
  expiryDate?: string
  firstInboundAt: string
}

export type InventoryLogType = 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'MOVE' | 'ADJUST'

export interface InventoryLog {
  id: string
  warehouseCode: string
  type: InventoryLogType
  refNo: string
  skuCode: string
  customerId: string
  locationCode: string
  qtyChange: number
  operator: string
  createdAt: string
}

/** 附录B 3.2 出库包裹状态 */
export type PackageStatus =
  | 'READY_PRINT'
  | 'PICKING'
  | 'PICKED'
  | 'PACKING'
  | 'SHIPPED'
  | 'HOLD'
  | 'CANCELLED'

export interface OutboundPackage {
  packageNo: string
  customerOrderNo: string
  customerId: string
  warehouseCode: string
  channelCode: string
  countryCode: string
  status: PackageStatus
  shippingFee: Money
  createdAt: string
}

/** 附录B 3.1 波次状态 */
export type WaveStatus = 'DRAFT' | 'RELEASED' | 'PICKING' | 'COMPLETED' | 'CANCELLED'

export interface Wave {
  waveNo: string
  warehouseCode: string
  status: WaveStatus
  packageCount: number
  createdAt: string
  releasedAt?: string
  completedAt?: string
}

/** 附录B 3.3 拣货任务状态 */
export type PickTaskStatus = 'PENDING' | 'PICKING' | 'COMPLETED' | 'CANCELLED'

export interface PickTask {
  pickTaskNo: string
  waveNo: string
  packageNo: string
  warehouseCode: string
  customerId: string
  skuCode: string
  locationCode: string
  planQty: number
  actualQty: number
  status: PickTaskStatus
  createdAt: string
  completedAt?: string
}

export type AuditRefType = 'INBOUND' | 'SYSTEM'

export type AuditAction =
  | 'INBOUND_SIGN'
  | 'INBOUND_CANCEL'
  | 'INBOUND_RECEIVE'
  | 'PUTAWAY'
  | 'DEMO_RESET'

export interface AuditLog {
  id: string
  refType: AuditRefType
  refNo: string
  action: AuditAction
  operator: string
  detail?: string
  createdAt: string
}
