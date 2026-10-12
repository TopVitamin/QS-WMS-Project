import type { InboundOrderStatus, PackageStatus, UsageStatus } from '@/types/wms'
import type { PutawayOrderStatus } from '@/types/inbound'

/**
 * 全站统一的状态色调。新增状态时只能从这里选色调，不要在页面里自定义颜色。
 * gray=草稿/取消  blue=处理中  orange=待处理  green=完成  red=异常  purple=部分完成
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
  PUTAWAYING: { tone: 'orange', labelKey: 'status.inboundOrder.PUTAWAYING' },
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
