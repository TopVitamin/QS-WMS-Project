import type { ReturnOrderLine } from '@/types/return'

/** 退货收货一行草稿；数量用字符串保留输入过程，提交时再转数字 */
export interface ReturnReceiveDraft {
  goodQty: string
  defectQty: string
  rejectedQty: string
  rejectReason: string
  batchNo: string
  expiryDate: string
  goodSerialNos: string
  defectSerialNos: string
  rejectedSerialNos: string
}

export const emptyReturnReceiveDraft = (): ReturnReceiveDraft => ({
  goodQty: '',
  defectQty: '',
  rejectedQty: '',
  rejectReason: '',
  batchNo: '',
  expiryDate: '',
  goodSerialNos: '',
  defectSerialNos: '',
  rejectedSerialNos: '',
})

export const num = (value: string) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export const returnDraftActivity = (draft: ReturnReceiveDraft) =>
  num(draft.goodQty) + num(draft.defectQty) + num(draft.rejectedQty)

/** 字符串序列号按逗号、空格、换行拆开，交给动作层再去重转大写 */
export const parseReturnSerialNos = (value: string) =>
  value
    .split(/[\s,，;；]+/)
    .map((sn) => sn.trim())
    .filter(Boolean)

/** 本行可收上限：预计 − 已收 − 已拒 − 其他容器已录 */
export const returnLineLimit = (
  line: ReturnOrderLine,
  otherContainersQty: number,
) => Math.max(0, line.plannedQty - line.receivedQty - line.rejectedQty - otherContainersQty)
