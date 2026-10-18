export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'HKD'
export type UsageStatus = 'ENABLED' | 'DISABLED'

/** 基础资料-仓库（与作业用 Warehouse 并存；一期四仓预置） */
export interface WarehouseMaster {
  code: string
  name: string
  timezone: string
  currency: CurrencyCode
  status: UsageStatus
  remark?: string
  countryCode: string
  state?: string
  city: string
  district?: string
  address1: string
  address2?: string
  postalCode?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}
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

export type CustomerOwnerType = 'SELF' | 'EXTERNAL'

/** 上架库位推荐时机（货主作业控制） */
export type PutawayRecommendTiming = 'NONE' | 'AFTER_RECEIVE' | 'AT_PUTAWAY_SCAN'

export interface CustomerMaster {
  id: string
  code: string
  name: string
  ownerType: CustomerOwnerType
  status: UsageStatus
  remark?: string
  putawayRecommendTiming: PutawayRecommendTiming
  upstreamOwnerId: string
  lastSyncAt: string
  countryCode?: string
  state?: string
  city?: string
  district?: string
  address1?: string
  address2?: string
  postalCode?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

/** 物流渠道类型 */
export type ChannelType = 'EXPRESS' | 'TRUCK' | 'PICKUP' | 'OTHER'

/** 物流对接方式 */
export type LogisticsIntegrationMode = 'API_RESERVED' | 'OFFLINE_HANDOVER'

/** 基础资料-物流承运商（全系统共用） */
export interface CarrierMaster {
  code: string
  name: string
  shortName?: string
  status: UsageStatus
  remark?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  externalCarrierCode?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

/** 基础资料-物流渠道 */
export interface ChannelMaster {
  carrierCode: string
  code: string
  name: string
  channelType: ChannelType
  status: UsageStatus
  remark?: string
  integrationMode: LogisticsIntegrationMode
  externalProductCode?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
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

/** 库位类型；EXCEPTION 为异常处理库位（无主货、超收等没有入账的实物，不作上架目标） */
export type LocationType = 'PICK' | 'STORAGE' | 'STAGING' | 'DEFECT' | 'EXCEPTION'

export interface Location {
  code: string
  warehouseCode: string
  zone: string
  type: LocationType
  /** 未设置视为启用；停用库位不能作为收货、上架、无主货暂存等业务的目标位 */
  status?: UsageStatus
}

/** 库区类型（与库区资料枚举一致；货位只读随库区） */
export type ZoneType = 'STORAGE' | 'PICK' | 'STAGING' | 'DEFECT_ISOLATION' | 'EXCEPTION'

export interface ZoneMaster {
  warehouseCode: string
  code: string
  name: string
  zoneType: ZoneType
  status: UsageStatus
  remark?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

/** 适配商品形态（与商品资料枚举对齐，Demo 简化三项） */
export type ProductFormFactor = 'SMALL' | 'LARGE' | 'IRREGULAR'

/** 基础资料-商品 SKU（货主编码 + 商品编码唯一） */
export interface SkuMaster {
  ownerCode: string
  customerId: string
  code: string
  name: string
  nameEn?: string
  spec?: string
  unit: string
  status: UsageStatus
  remark?: string
  /** 主条码摘要（来自条码子表） */
  primaryBarcode?: string
  upstreamSkuId: string
  productForm: ProductFormFactor
  isBattery?: boolean
  snEnabled: boolean
  snFormat?: string
  batchEnabled: boolean
  expiryEnabled: boolean
  shelfLifeDays?: number
  inboundDays?: number
  nearExpiryDays?: number
  expiredDays?: number
  qcRequired: boolean
  qcFlowType?: string
  grossWeightKg?: number
  netWeightKg?: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface SkuBarcode {
  id: string
  ownerCode: string
  skuCode: string
  barcode: string
  isPrimary: boolean
  status: UsageStatus
  createdAt: string
  updatedAt: string
}

/** 基础资料-货位（仓库内编码唯一） */
export interface LocationMaster {
  warehouseCode: string
  zoneCode: string
  zoneType: ZoneType
  code: string
  status: UsageStatus
  remark?: string
  allowMixSku: boolean
  allowMixBatch: boolean
  putawaySequence?: number
  pickSequence?: number
  aisle?: string
  bay?: string
  level?: string
  productForms: ProductFormFactor[]
  /** Demo：当前货主占用（库存域 Mock）；空表示空闲 */
  occupyingCustomerId?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type LoadType = 'CONTAINER' | 'PALLET' | 'BOX'

export type {
  InboundArrivalMethod,
  InboundBizType,
  InboundException,
  InboundExceptionType,
  InboundLineStatus,
  InboundOrder,
  InboundOrderLine,
  InboundOrderStatus,
  PutawayActualLine,
  PutawayOrder,
  PutawayOrderStatus,
  PutawayPlanLine,
  ReceiptCloseFlag,
  ReceiptRecord,
  ReceiptRecordLine,
} from './inbound'

export interface InventoryRecord {
  /** 库位分配与SN实物位置；SKU订单占用从出库单明细汇总。 */
  allocatedQty?: number
  serialNos?: string[]
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

export type InventoryLogType = 'RECEIVE' | 'PUTAWAY' | 'PICK' | 'MOVE' | 'ADJUST' | 'SHIP' | 'RETURN' | 'RESERVE' | 'ALLOCATE'

export interface InventoryLog {
  level?: 'SKU' | 'DETAIL'
  reservedChange?: number
  allocatedChange?: number
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

/** PUTAWAY：上架单自身的保存、撤销与提交；入库单详情按来源单一并列出 */
export type AuditRefType = 'INBOUND' | 'PUTAWAY' | 'SYSTEM' | 'OUTBOUND' | 'WAVE' | 'PICK_TASK' | 'PUTBACK'

export type AuditAction =
  | 'OUTBOUND_ACTION'
  | 'INBOUND_RECEIPT_CLOSE'
  | 'INBOUND_MOCK_PUSH'
  | 'INBOUND_RECEIVE'
  | 'PUTAWAY_SAVE'
  | 'PUTAWAY_REMOVE'
  | 'PUTAWAY'
  | 'NEW_SKU_MEASURE'
  | 'UNCLAIMED_REGISTER'
  | 'DEMO_RESET'

export interface AuditLog {
  id: string
  refType: AuditRefType
  refNo: string
  action: AuditAction
  /** 出库动作的命令类型（action 为 OUTBOUND_ACTION 时） */
  command?: string
  operator: string
  detail?: string
  createdAt: string
}
