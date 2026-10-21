/** 单次收货录入：先实收+拒收，再实收内良品+不良品（R03） */

export interface InboundReceiveDraft {
  receivedQty: number
  rejectedQty: number
  goodQty: number
  defectQty: number
  rejectReason?: string
  /** 启用批次/效期时按行采集；同一容器同一 SKU 多批次暂按多次收货处理 */
  batchNo?: string
  productionDate?: string
  expiryDate?: string
  /** 启用 SN 时按品质逐件采集；条数必须等于良品/不良品数量 */
  goodSerialNos?: string[]
  defectSerialNos?: string[]
}

export function emptyReceiveDraft(): InboundReceiveDraft {
  return {
    receivedQty: 0,
    rejectedQty: 0,
    goodQty: 0,
    defectQty: 0,
    goodSerialNos: [],
    defectSerialNos: [],
  }
}

/** 文本域/输入框里的 SN：支持换行、逗号、中文逗号分隔，统一大写去重前先保留原值供校验 */
export function parseSerialNos(text: string): string[] {
  return text
    .split(/[\s,，]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
}

/** 选中行默认按未收数量预填良品（相当于「全部记为良品」） */
export function defaultReceiveDraft(remain: number): InboundReceiveDraft {
  return {
    receivedQty: remain,
    rejectedQty: 0,
    goodQty: remain,
    defectQty: 0,
    goodSerialNos: [],
    defectSerialNos: [],
  }
}

/** 本行本次收货的活动数量：良品＋不良品＋拒收 */
export function receiveDraftActivity(draft: InboundReceiveDraft): number {
  return draft.goodQty + draft.defectQty + draft.rejectedQty
}

export const REJECT_REASONS = ['DAMAGED', 'LABEL_MISMATCH', 'EXPIRY', 'OTHER'] as const
export type RejectReason = (typeof REJECT_REASONS)[number]

export type ReceiveQtyField = 'goodQty' | 'defectQty' | 'rejectedQty'

/**
 * 录入联动（收货分册 §2）：调整不良品或拒收时，数量在良品与该项之间转移——增加先从良品扣，
 * 良品不够才增加合计；减少退回良品。直接改良品只改合计。合计超过 `limit` 时拒绝本次修改（不截断）。
 */
export function applyReceiveDraftChange(
  draft: InboundReceiveDraft,
  field: ReceiveQtyField,
  next: number,
  limit: number,
): { ok: true; draft: InboundReceiveDraft } | { ok: false; max: number } {
  const value = Math.max(0, Math.floor(next))
  let { goodQty: good, defectQty: defect, rejectedQty: rejected } = draft
  const total = good + defect + rejected
  if (field === 'goodQty') {
    const max = Math.max(0, limit - defect - rejected)
    if (value > max) return { ok: false, max }
    good = value
  } else {
    const current = field === 'defectQty' ? defect : rejected
    const delta = value - current
    if (delta > 0) {
      const fromGood = Math.min(good, delta)
      const max = current + good + Math.max(0, limit - total)
      if (total + (delta - fromGood) > limit) return { ok: false, max }
      good -= fromGood
    } else {
      good -= delta
    }
    if (field === 'defectQty') defect = value
    else rejected = value
  }
  return {
    ok: true,
    draft: {
      ...draft,
      goodQty: good,
      defectQty: defect,
      rejectedQty: rejected,
      receivedQty: good + defect,
      rejectReason: rejected > 0 ? draft.rejectReason : undefined,
    },
  }
}

/** 商品扫码解析（与 Web 作业台同一顺序）：SKU 编码 → 本单货主的货主条码 → 主条码 */
export function resolveInboundSkuScan(
  raw: string,
  skuCodes: string[],
  ctx: {
    ownerCode: string
    skuBarcodes: Array<{ barcode: string; ownerCode: string; skuCode: string }>
    primaryBarcode: (skuCode: string) => string | undefined
  },
): string | undefined {
  const code = raw.trim()
  if (!code) return undefined
  const bySku = skuCodes.find((s) => s.toLowerCase() === code.toLowerCase())
  if (bySku) return bySku
  const ownerHit = ctx.skuBarcodes.find((b) => b.barcode === code && b.ownerCode === ctx.ownerCode)
  if (ownerHit && skuCodes.includes(ownerHit.skuCode)) return ownerHit.skuCode
  return skuCodes.find((s) => ctx.primaryBarcode(s) === code)
}

export function validateReceiveQtyStep(draft: InboundReceiveDraft, remainPlanned: number): string | null {
  const { receivedQty, rejectedQty } = draft
  if (receivedQty + rejectedQty <= 0) return 'error.qtyInvalid'
  if (receivedQty + rejectedQty > remainPlanned) return 'inbound.receive.overRemain'
  if (rejectedQty > 0 && !draft.rejectReason) return 'inbound.receive.rejectReasonRequired'
  return null
}

export function validateInboundReceiveDraft(draft: InboundReceiveDraft, remainPlanned: number): string | null {
  const { receivedQty, rejectedQty, goodQty, defectQty } = draft
  const step1 = validateReceiveQtyStep(draft, remainPlanned)
  if (step1) return step1
  if (receivedQty > 0 && goodQty + defectQty !== receivedQty) return 'inbound.receive.qualitySumInvalid'
  if (receivedQty === 0 && (goodQty > 0 || defectQty > 0)) return 'inbound.receive.qualitySumInvalid'
  if (rejectedQty > 0 && !draft.rejectReason) return 'inbound.receive.rejectReasonRequired'
  return null
}
