export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'HKD'
export type UsageStatus = 'ENABLED' | 'DISABLED'
/** 一期仓库默认收货方式（与入库单到货方式同枚举） */
export type WarehouseReceiptMethod = 'CONTAINER' | 'LTL' | 'EXPRESS' | 'OTHER'

/** 基础资料-仓库（与作业用 Warehouse 并存；一期四仓预置） */
export interface WarehouseMaster {
  code: string
  name: string
  timezone: string
  currency: CurrencyCode
  status: UsageStatus
  /** 仓库默认单位制，作业端按它展示重量、尺寸 */
  unitSystem: UnitSystem
  defaultReceiptMethod: WarehouseReceiptMethod
  /** 本仓收货暂存库位、出库暂存库位，必须启用且不同 */
  receivingStagingLocation: string
  outboundStagingLocation: string
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
  defaultReceiptMethod: WarehouseReceiptMethod
  receivingStagingLocation: string
  outboundStagingLocation: string
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
  /** 本行已分配数量；SKU订单预占从出库单明细汇总。 */
  allocatedQty?: number
  /** 兼容已有逐件采集记录；当前SN身份以独立仓库级台账为准，不要求库位关联完整。 */
  serialNos?: string[]
  id: string
  warehouseCode: string
  locationCode: string
  /** 同仓容器自然键；散件或无容器库存为空。 */
  containerId?: string
  customerId: string
  skuCode: string
  qualityType: QualityType
  onHandQty: number
  lockedQty: number
  /** 旧演示兼容字段；不参与SKU订单预占计算。 */
  reservedQty?: number
  /** 批次号 */
  batchNo?: string
  /** 生产日期；效期商品批次属性。 */
  productionDate?: string
  /** 效期（ISO 8601 日期） */
  expiryDate?: string
  firstInboundAt: string
}

/**
 * 库存流水类型闭集（库存流水主PRD 第一节）：收货入暂存库位、上架移库、拣货移入出库暂存库位、返库上架、
 * 品质转换、移库、盘点调整、确认出库扣减、预占、释放。分配与其他出库指定不写流水。
 */
export type InventoryLogType =
  'RECEIVE' | 'PUTAWAY' | 'PICK' | 'RETURN' | 'QUALITY' | 'MOVE' | 'ADJUST' | 'SHIP' | 'RESERVE' | 'RELEASE'

/** 来源单据类型：入库单、退货单、出库单、盘点单、移库作业、其他业务记录、无独立单据 */
export type InventoryLogSource = 'INBOUND' | 'RETURN' | 'OUTBOUND' | 'STOCKTAKE' | 'MOVE' | 'OTHER' | 'NONE'

export interface InventoryLog {
  /** SKU：良品订单预占变化（库位、批次为空）；DETAIL或缺省：批次库位实际数量变化 */
  level?: 'SKU' | 'DETAIL'
  /** 订单占用变化量；实际数量类为空 */
  reservedChange?: number
  id: string
  warehouseCode: string
  type: InventoryLogType
  /** 来源单号；品质转换等无独立单据的动作为空串 */
  refNo: string
  skuCode: string
  customerId: string
  locationCode: string
  /** 批次库存流水的容器维度；SKU层流水为空。 */
  containerId?: string
  /** 实际数量变化量；订单占用类为 0 */
  qtyChange: number
  operator: string
  /** 业务发生时间 */
  createdAt: string
  inventoryId?: string
  batchNo?: string
  expiryDate?: string
  qualityType?: QualityType
  /** 变动对象（实际或订单占用）变化前后的余额 */
  beforeQty?: number
  afterQty?: number
  serialNos?: string[]
  /** 同一次业务动作的内部幂等与追溯标识；页面逐条展示，不提供配对联动 */
  actionId?: string
  pairedLogId?: string
  sourceType?: InventoryLogSource
  sourceLineNo?: number
  /** 关联作业记录号：上架单、拣货任务、返库上架单等 */
  jobNo?: string
  reasonCode?: 'DAMAGED' | 'EXPIRED'
  reasonNote?: string
  evidence?: string
  ownerNotice?: 'NOTIFIED' | 'PENDING' | 'NOT_REQUIRED'
  terminal?: 'WEB' | 'PDA' | 'SYSTEM'
}

/** PUTAWAY：上架单自身的保存、撤销与提交；入库单详情按来源单一并列出 */
export type AuditRefType =
  | 'INBOUND'
  | 'RETURN'
  | 'PUTAWAY'
  | 'SYSTEM'
  | 'OUTBOUND'
  | 'WAVE'
  | 'PICK_TASK'
  | 'PUTBACK'
  | 'STOCKTAKE'
  | 'STOCK_MOVE'
  | 'INVENTORY'
  | 'MASTER'

export type AuditAction =
  | 'OUTBOUND_ACTION'
  | 'INVENTORY_ACTION'
  | 'SKU_MASTER_EDIT'
  | 'INBOUND_RECEIPT_CLOSE'
  | 'INBOUND_MOCK_PUSH'
  | 'INBOUND_MOCK_CHANGE'
  | 'INBOUND_MOCK_CANCEL'
  | 'INBOUND_RESULT_RETRY'
  | 'INBOUND_RECEIVE'
  | 'RETURN_RECEIVE'
  | 'RETURN_MOCK_FORECAST'
  | 'RETURN_DELIVERY_FAILED_CREATE'
  | 'RETURN_RESULT_RETRY'
  | 'RETURN_RESULT_SIMULATE_FAILURE'
  | 'RETURN_RECEIPT_CLOSE'
  | 'RETURN_CANCEL'
  | 'MASTER_MOCK_PUSH'
  | 'CONTAINER_SAVE'
  | 'PUTAWAY_SAVE'
  | 'PUTAWAY_REMOVE'
  | 'PUTAWAY'
  | 'NEW_SKU_MEASURE'
  | 'UNCLAIMED_REGISTER'
  | 'DEMO_RESET'

/** 容器类型：箱、托、袋、笼车、包裹 */
export type ContainerType = 'CARTON' | 'PALLET' | 'BAG' | 'CAGE' | 'PACKAGE'
/** 容器状态由作业驱动 */
export type ContainerStatus =
  'IDLE' | 'RECEIVING' | 'PUTAWAYING' | 'IN_STOCK' | 'OUTBOUND' | 'SHIPPED' | 'RELEASED' | 'DISABLED'
export type ContainerSource = 'EXTERNAL_LABEL' | 'INTERNAL' | 'OUTBOUND_PACK'

export interface ContainerMaster {
  warehouseCode: string
  containerNo: string
  containerType: ContainerType
  source: ContainerSource
  customerId: string
  status: ContainerStatus
  /** 容量为空表示不限制 */
  maxPieces?: number
  maxWeightKg?: number
  maxVolumeM3?: number
  /** 整箱落位时记录；拆散后为空 */
  currentLocationCode?: string
  parentContainerNo?: string
  remark?: string
  lastScannedAt?: string
  lastScannedBy?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface MasterPushMessage {
  id: string
  masterType: 'OWNER' | 'SKU'
  ownerCode: string
  skuCode?: string
  status: 'ACCEPTED' | 'REJECTED'
  reason?: string
  at: string
}

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
