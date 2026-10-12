import type { ReceiptRecord } from '@/types/inbound'

/**
 * 本入库单下该作业容器是否已提交过收货（已提交则不可再用于本单，主 PRD R16）。
 * 一次提交可含多个容器，容器号以明细行为准；单头容器号兼容旧数据。
 */
export function isWorkContainerUsedOnInbound(
  receipts: ReceiptRecord[],
  inboundNo: string,
  containerNo: string,
): boolean {
  const key = containerNo.trim().toUpperCase()
  if (!key) return false
  return receipts.some(
    (r) =>
      r.inboundNo === inboundNo &&
      [r.containerNo, ...r.lines.map((l) => l.containerNo)].some((c) => (c?.trim().toUpperCase() ?? '') === key),
  )
}

/** 一条收货记录涉及的容器：按明细出现顺序去重；`hasBulk` 表示含无容器收货的明细 */
export function receiptContainers(record: ReceiptRecord): { containers: string[]; hasBulk: boolean } {
  const containers: string[] = []
  let hasBulk = false
  const lineContainers = record.lines.length > 0 ? record.lines.map((l) => l.containerNo) : [record.containerNo]
  lineContainers.forEach((c) => {
    const no = c?.trim()
    if (!no) hasBulk = true
    else if (!containers.includes(no)) containers.push(no)
  })
  return { containers, hasBulk }
}

/**
 * 收货记录「作业容器」展示：一个容器显示容器号；多个显示「首个 等 N 个」；只有无容器收货显示「无容器收货」。
 * 文案由调用方传入，便于中英文。
 */
export function receiptContainerLabel(
  record: ReceiptRecord,
  text: { bulk: string; many: (first: string, count: number) => string },
): string {
  const { containers, hasBulk } = receiptContainers(record)
  const count = containers.length + (hasBulk ? 1 : 0)
  if (containers.length === 0) return text.bulk
  if (count === 1) return containers[0]
  return text.many(containers[0], count)
}
