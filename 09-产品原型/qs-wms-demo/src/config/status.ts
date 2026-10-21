import type { InboundBizType, InboundOrderStatus, PackageStatus, QualityType, UsageStatus } from '@/types/wms'
import type { PutawayOrderStatus, UnclaimedStatus } from '@/types/inbound'
import type { OrderComposition } from '@/lib/outbound-derive'
import type { OutboundPickTask, OutboundPutback, OutboundStatus, OutboundType, PickStatus, WaveStatus } from '@/types/outbound'
import type { StocktakeSource, StocktakeStatus } from '@/types/inventory'
import type { ExpiryLevel, SerialStatus } from '@/lib/inventory-derive'

export const outboundStatusMeta: Record<OutboundStatus, StatusMeta> = {
  PENDING_HANDLE: { tone: 'gray', labelKey: 'outbound.status.PENDING_HANDLE' },
  PENDING_PICK: { tone: 'orange', labelKey: 'outbound.status.PENDING_PICK' },
  PENDING_VERIFY: { tone: 'purple', labelKey: 'outbound.status.PENDING_VERIFY' },
  PENDING_SHIPMENT: { tone: 'cyan', labelKey: 'outbound.status.PENDING_SHIPMENT' },
  SHIPPED: { tone: 'green', labelKey: 'outbound.status.SHIPPED' },
  CANCELLED: { tone: 'gray', labelKey: 'outbound.status.CANCELLED' },
}
export const outboundPickStatusMeta: Record<PickStatus, StatusMeta> = {
  PENDING_PICK: { tone: 'orange', labelKey: 'outbound.status.PENDING_PICK' },
  PICKING: { tone: 'blue', labelKey: 'outbound.status.PICKING' },
  COMPLETED: { tone: 'green', labelKey: 'outbound.status.COMPLETED' },
  CLOSED: { tone: 'gray', labelKey: 'outbound.status.CLOSED' },
}
export const outboundPutbackStatusMeta = putbackMeta()
function putbackMeta(): Record<'PENDING' | 'PUTAWAYING' | 'COMPLETED', StatusMeta> {
  return { PENDING: { tone: 'orange', labelKey: 'outbound.status.PENDING' }, PUTAWAYING: { tone: 'blue', labelKey: 'outbound.status.PUTAWAYING' }, COMPLETED: { tone: 'green', labelKey: 'outbound.status.COMPLETED' } }
}
export const outboundWaveStatusMeta: Record<WaveStatus, StatusMeta> = {
  ALLOCATED: { tone: 'orange', labelKey: 'status.wave.ALLOCATED' },
  RELEASED: { tone: 'blue', labelKey: 'status.wave.RELEASED' },
  COMPLETED: { tone: 'green', labelKey: 'status.wave.COMPLETED' },
  CANCELLED: { tone: 'gray', labelKey: 'status.wave.CANCELLED' },
}
export const outboundMessageStatusMeta: Record<'ACCEPTED' | 'REJECTED', StatusMeta> = {
  ACCEPTED: { tone: 'green', labelKey: 'status.outboundMessage.ACCEPTED' },
  REJECTED: { tone: 'red', labelKey: 'status.outboundMessage.REJECTED' },
}
export const outboundResultStatusMeta: Record<'SENT' | 'FAILED', StatusMeta> = {
  SENT: { tone: 'green', labelKey: 'status.outboundResult.SENT' },
  FAILED: { tone: 'red', labelKey: 'status.outboundResult.FAILED' },
}
export const allocationStatusMeta = { NORMAL: { tone: 'green', labelKey: 'outbound.normal' }, PENDING: { tone: 'red', labelKey: 'outbound.pending' }, COUNTING: { tone: 'blue', labelKey: 'outbound.counting' } } satisfies Record<string, StatusMeta>

/**
 * 全站统一的状态色调。新增状态时只能从这里选色调，不要在页面里自定义颜色。
 * 语义（与 docs/02-设计规范.md 第 3 节一致）：
 * - gray   未开始（等外部，如待收货）或已取消
 * - orange 待我方处理（已具备作业条件、等人处理，如待上架、待打单）
 * - blue   作业进行中（收货中、上架中、拣货中）
 * - cyan   阶段完成、等下一环节（已拣货）
 * - green  最终完成 / 启用
 * - red    异常、拦截
 * - purple 特殊流程（打包中）
 * 同一个状态文案在任何单据上颜色必须相同。
 */
export type StatusTone = 'gray' | 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'cyan'

export interface StatusMeta {
  tone: StatusTone
  /** i18n key */
  labelKey: string
}

export const inboundOrderStatusMeta: Record<InboundOrderStatus, StatusMeta> = {
  PENDING_RECEIVE: { tone: 'gray', labelKey: 'status.inboundOrder.PENDING_RECEIVE' },
  RECEIVING: { tone: 'blue', labelKey: 'status.inboundOrder.RECEIVING' },
  PUTAWAYING: { tone: 'blue', labelKey: 'status.inboundOrder.PUTAWAYING' },
  COMPLETED: { tone: 'green', labelKey: 'status.inboundOrder.COMPLETED' },
  CANCELLED: { tone: 'gray', labelKey: 'status.inboundOrder.CANCELLED' },
}

export const putawayOrderStatusMeta: Record<PutawayOrderStatus, StatusMeta> = {
  PENDING: { tone: 'orange', labelKey: 'status.putawayOrder.PENDING' },
  PUTAWAYING: { tone: 'blue', labelKey: 'status.putawayOrder.PUTAWAYING' },
  COMPLETED: { tone: 'green', labelKey: 'status.putawayOrder.COMPLETED' },
}

/** 无主货登记：一期只有「暂存中」；后续 CONVERTED / DISPOSED 待 OMS 认领上线 */
export const unclaimedStatusMeta: Record<UnclaimedStatus, StatusMeta> = {
  HOLDING: { tone: 'orange', labelKey: 'status.unclaimed.HOLDING' },
}

export const usageStatusMeta: Record<UsageStatus, StatusMeta> = {
  ENABLED: { tone: 'green', labelKey: 'status.usage.ENABLED' },
  DISABLED: { tone: 'gray', labelKey: 'status.usage.DISABLED' },
}

export const packageStatusMeta: Record<PackageStatus, StatusMeta> = {
  READY_PRINT: { tone: 'orange', labelKey: 'status.package.READY_PRINT' },
  PICKING: { tone: 'blue', labelKey: 'status.package.PICKING' },
  PICKED: { tone: 'cyan', labelKey: 'status.package.PICKED' },
  PACKING: { tone: 'purple', labelKey: 'status.package.PACKING' },
  SHIPPED: { tone: 'green', labelKey: 'status.package.SHIPPED' },
  HOLD: { tone: 'red', labelKey: 'status.package.HOLD' },
  CANCELLED: { tone: 'gray', labelKey: 'status.package.CANCELLED' },
}

/** 枚举属性（不是生命周期状态）用 TagLabel 展示，颜色同样只在这里定义 */
export const qualityMeta: Record<QualityType, StatusMeta> = {
  GOOD: { tone: 'green', labelKey: 'enum.quality.GOOD' },
  DEFECTIVE: { tone: 'red', labelKey: 'enum.quality.DEFECTIVE' },
}

export const inboundBizTypeMeta: Record<InboundBizType, StatusMeta> = {
  NORMAL: { tone: 'gray', labelKey: 'enum.inboundBizType.NORMAL' },
  TRANSFER: { tone: 'cyan', labelKey: 'enum.inboundBizType.TRANSFER' },
}

/** 出库业务类型、任务来源、退拣原因：枚举标签（TagLabel meta） */
export const outboundCompositionMeta: Record<OrderComposition, StatusMeta> = {
  SINGLE_SINGLE: { tone: 'gray', labelKey: 'outbound.composition.SINGLE_SINGLE' },
  SINGLE_MULTI: { tone: 'blue', labelKey: 'outbound.composition.SINGLE_MULTI' },
  MULTI_MIX: { tone: 'purple', labelKey: 'outbound.composition.MULTI_MIX' },
}
export const outboundTypeMeta: Record<OutboundType, StatusMeta> = {
  B2C: { tone: 'blue', labelKey: 'outbound.type.B2C' },
  FBA: { tone: 'purple', labelKey: 'outbound.type.FBA' },
  WHOLESALE: { tone: 'cyan', labelKey: 'outbound.type.WHOLESALE' },
  TRANSFER: { tone: 'gray', labelKey: 'outbound.type.TRANSFER' },
  PURCHASE_RETURN: { tone: 'orange', labelKey: 'outbound.type.PURCHASE_RETURN' },
  OTHER: { tone: 'red', labelKey: 'outbound.type.OTHER' },
}
export const pickSourceMeta: Record<OutboundPickTask['source'], StatusMeta> = {
  ORDER: { tone: 'gray', labelKey: 'outbound.sources.ORDER' },
  WAVE: { tone: 'purple', labelKey: 'outbound.sources.WAVE' },
  SUPPLEMENT: { tone: 'orange', labelKey: 'outbound.sources.SUPPLEMENT' },
}
export const unpickReasonMeta: Record<OutboundPutback['reason'], StatusMeta> = {
  CANCEL: { tone: 'gray', labelKey: 'outbound.unpickReasons.CANCEL' },
  MISSING: { tone: 'orange', labelKey: 'outbound.unpickReasons.MISSING' },
  DAMAGED: { tone: 'red', labelKey: 'outbound.unpickReasons.DAMAGED' },
}
/** 盘点单状态：盘点中是作业进行中，完成与取消为终态 */
export const stocktakeStatusMeta: Record<StocktakeStatus, StatusMeta> = {
  COUNTING: { tone: 'blue', labelKey: 'inventory.stocktakeStatus.COUNTING' },
  COMPLETED: { tone: 'green', labelKey: 'inventory.stocktakeStatus.COMPLETED' },
  CANCELLED: { tone: 'gray', labelKey: 'inventory.stocktakeStatus.CANCELLED' },
}
export const stocktakeSourceMeta: Record<StocktakeSource, StatusMeta> = {
  PLAN: { tone: 'gray', labelKey: 'inventory.stocktakeSource.PLAN' },
  DISCREPANCY: { tone: 'orange', labelKey: 'inventory.stocktakeSource.DISCREPANCY' },
}
/** 库存枚举标签：待核对为拦截（red），盘点中与盘点单状态同色（blue），可用为负为异常（red） */
export const inventoryTagMeta = {
  pending: { tone: 'red', labelKey: 'inventory.pending' },
  counting: { tone: 'blue', labelKey: 'inventory.counting' },
  negative: { tone: 'red', labelKey: 'inventory.negativeAvailable' },
  notAllocatable: { tone: 'gray', labelKey: 'inventory.notAllocatable' },
} satisfies Record<string, StatusMeta>
export const expiryLevelMeta: Record<ExpiryLevel, StatusMeta> = {
  NORMAL: { tone: 'gray', labelKey: 'inventory.expiryLevel.NORMAL' },
  NEAR: { tone: 'orange', labelKey: 'inventory.expiryLevel.NEAR' },
  EXPIRED: { tone: 'red', labelKey: 'inventory.expiryLevel.EXPIRED' },
}
export const serialStatusMeta: Record<SerialStatus, StatusMeta> = {
  IN_STOCK: { tone: 'green', labelKey: 'inventory.serialStatus.IN_STOCK' },
  SHIPPED: { tone: 'gray', labelKey: 'inventory.serialStatus.SHIPPED' },
  LOST: { tone: 'red', labelKey: 'inventory.serialStatus.LOST' },
}
export const waveMemberStatusMeta: Record<'ACTIVE' | 'CANCELLED', StatusMeta> = {
  ACTIVE: { tone: 'blue', labelKey: 'outbound.ui.memberActive' },
  CANCELLED: { tone: 'gray', labelKey: 'outbound.ui.memberCancelled' },
}
