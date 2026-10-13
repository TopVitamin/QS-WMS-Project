import type { InboundBizType, InboundOrderStatus, PackageStatus, QualityType, UsageStatus } from '@/types/wms'
import type { PutawayOrderStatus } from '@/types/inbound'

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
