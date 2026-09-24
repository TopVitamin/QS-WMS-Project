import type { InboundStatus, PackageStatus, PutawayTaskStatus } from '@/types/wms'

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

export const inboundStatusMeta: Record<InboundStatus, StatusMeta> = {
  PENDING: { tone: 'orange', labelKey: 'status.inbound.PENDING' },
  ARRIVED: { tone: 'cyan', labelKey: 'status.inbound.ARRIVED' },
  RECEIVING: { tone: 'blue', labelKey: 'status.inbound.RECEIVING' },
  PARTIAL_PUT: { tone: 'purple', labelKey: 'status.inbound.PARTIAL_PUT' },
  COMPLETED: { tone: 'green', labelKey: 'status.inbound.COMPLETED' },
  ABNORMAL: { tone: 'red', labelKey: 'status.inbound.ABNORMAL' },
  CANCELLED: { tone: 'gray', labelKey: 'status.inbound.CANCELLED' },
}

export const putawayStatusMeta: Record<PutawayTaskStatus, StatusMeta> = {
  PENDING: { tone: 'orange', labelKey: 'status.putaway.PENDING' },
  DOING: { tone: 'blue', labelKey: 'status.putaway.DOING' },
  COMPLETED: { tone: 'green', labelKey: 'status.putaway.COMPLETED' },
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
