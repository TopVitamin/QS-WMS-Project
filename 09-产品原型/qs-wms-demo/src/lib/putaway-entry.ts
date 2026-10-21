import type { PutawayActualLine, PutawayOrder, PutawayPlanLine } from '@/types/inbound'
import { recordedQty, remainingQty } from './putaway'

/**
 * Web 端上架作业台的录入规则（上架单前端Demo版PRD 第六节）。页面只管渲染，默认值、校验、分组、提交参数都在这里。
 * 每个应上架行一组落位：本次要录的落位可拆多条；PDA 已保存未提交的落位不在表里，算进合计并列在右侧清单。
 */

/** 本次要录的一条落位；三个值都是作业员输入的原文，确认时才转换 */
export interface EntryDraft {
  id: string
  locationCode: string
  qty: string
  serialText: string
}

/** 作业员改过的应上架行（按应上架行号）；没改过的行每次渲染按单据算默认值，单据变了自动跟着变 */
export type EditedDrafts = Readonly<Record<number, EntryDraft[]>>

/** 序列号原文 → 列表：换行、空格、逗号都算分隔 */
export const parseSerials = (text: string) => text.split(/[\s,，]+/).filter(Boolean)

/** 提示里指认一个应上架行：同商品多批次时带上批次 */
export const planLineLabel = (line: PutawayPlanLine) =>
  line.batchNo ? `${line.skuCode} · ${line.batchNo}` : line.skuCode

/**
 * 默认落位：库位留空、数量填本行剩余。推荐库位只当提示（库位框里灰字 +「用推荐」），
 * 要作业员扫码或点一下才算数，避免没核对实物就整单确认。已录满的行没有默认落位。
 */
export function defaultDrafts(order: PutawayOrder, line: PutawayPlanLine): EntryDraft[] {
  const remain = remainingQty(order, line.lineNo)
  if (remain <= 0) return []
  return [{ id: `plan-${line.lineNo}`, locationCode: '', qty: String(remain), serialText: '' }]
}

/** 每个应上架行本次要录的落位：改过的用作业员填的，没改过的用默认值 */
export function entryDrafts(order: PutawayOrder, edited: EditedDrafts): Map<number, EntryDraft[]> {
  return new Map(order.planLines.map((line) => [line.lineNo, edited[line.lineNo] ?? defaultDrafts(order, line)]))
}

export interface EntryProblem {
  planLineNo: number
  /** 问题出在哪条落位；本行合计不对时为空 */
  draftId?: string
  key: 'missingLocation' | 'qtyInvalid' | 'serialCount' | 'sumMismatch'
  params: { sku: string; need?: number; got?: number }
}

/** 数量原文 → 正整数；不是正整数返回 undefined */
export const draftQty = (draft: EntryDraft) => {
  const qty = Number(draft.qty)
  return Number.isInteger(qty) && qty > 0 ? qty : undefined
}

/**
 * 一个应上架行的第一处问题：每条落位要有库位、正整数数量，SN 商品序列号条数等于数量；
 * 已保存加本次合计等于应上架。库位能不能放（存在、用途、品质、货主占用）由扫码时和确认动作按 PDA 同一套规则校验。
 */
export function lineProblem(
  order: PutawayOrder,
  line: PutawayPlanLine,
  rows: readonly EntryDraft[],
  isSerialLine: (line: PutawayPlanLine) => boolean,
): EntryProblem | undefined {
  const sku = planLineLabel(line)
  for (const draft of rows) {
    if (!draft.locationCode.trim())
      return { planLineNo: line.lineNo, draftId: draft.id, key: 'missingLocation', params: { sku } }
    const qty = draftQty(draft)
    if (qty === undefined) return { planLineNo: line.lineNo, draftId: draft.id, key: 'qtyInvalid', params: { sku } }
    const serials = parseSerials(draft.serialText).length
    if (isSerialLine(line) && serials !== qty) {
      return {
        planLineNo: line.lineNo,
        draftId: draft.id,
        key: 'serialCount',
        params: { sku, need: qty, got: serials },
      }
    }
  }
  const total = recordedQty(order, line.lineNo) + rows.reduce((n, d) => n + (draftQty(d) ?? 0), 0)
  if (total !== line.planQty) {
    return { planLineNo: line.lineNo, key: 'sumMismatch', params: { sku, need: line.planQty, got: total } }
  }
  return undefined
}

/** 确认前的第一处问题（按应上架行顺序），没有问题返回 undefined */
export function firstEntryProblem(
  order: PutawayOrder,
  drafts: ReadonlyMap<number, EntryDraft[]>,
  isSerialLine: (line: PutawayPlanLine) => boolean,
): EntryProblem | undefined {
  for (const line of order.planLines) {
    const problem = lineProblem(order, line, drafts.get(line.lineNo) ?? [], isSerialLine)
    if (problem) return problem
  }
  return undefined
}

export interface EntryPlacement {
  draftId: string
  planLineNo: number
  locationCode: string
  qty: number
  serialNos?: string[]
}

/** 校验通过后交给确认动作的落位清单（按表格顺序） */
export function entryPlacements(
  order: PutawayOrder,
  drafts: ReadonlyMap<number, EntryDraft[]>,
  isSerialLine: (line: PutawayPlanLine) => boolean,
): EntryPlacement[] {
  return order.planLines.flatMap((line) =>
    (drafts.get(line.lineNo) ?? []).map((draft) => ({
      draftId: draft.id,
      planLineNo: line.lineNo,
      locationCode: draft.locationCode.trim(),
      qty: Number(draft.qty),
      serialNos: isSerialLine(line) ? parseSerials(draft.serialText) : undefined,
    })),
  )
}

export interface EntryGroupItem {
  planLineNo: number
  qty: number
  /** PDA 已保存未提交的落位（可撤销）；本次录入的落位为空 */
  saved?: PutawayActualLine
}

export interface EntryGroup {
  /** 大写库位编码 */
  location: string
  items: EntryGroupItem[]
}

/**
 * 右侧「本次上架」清单：按库位分组（PDA 已保存的在前，再按表格顺序），库位没填的商品单列「还没填库位」。
 * 只列有数量的落位；同一行拆出来、还没填数量的空行不进清单。
 */
export function entryGroups(
  order: PutawayOrder,
  drafts: ReadonlyMap<number, EntryDraft[]>,
): { groups: EntryGroup[]; pending: EntryGroupItem[] } {
  const groups = new Map<string, EntryGroupItem[]>()
  const push = (location: string, item: EntryGroupItem) => {
    const key = location.trim().toUpperCase()
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  for (const actual of order.actualLines) {
    if (!actual.submitted) push(actual.locationCode, { planLineNo: actual.planLineNo, qty: actual.qty, saved: actual })
  }
  const pending: EntryGroupItem[] = []
  for (const line of order.planLines) {
    let unplaced = 0
    let missing = false
    for (const draft of drafts.get(line.lineNo) ?? []) {
      const qty = draftQty(draft) ?? 0
      if (!draft.locationCode.trim()) {
        missing = true
        unplaced += qty
      } else if (qty > 0) {
        push(draft.locationCode, { planLineNo: line.lineNo, qty })
      }
    }
    if (missing) pending.push({ planLineNo: line.lineNo, qty: unplaced })
  }
  return { groups: [...groups].map(([location, items]) => ({ location, items })), pending }
}

/** 已填好的件数：PDA 已保存的 + 本次有库位、有数量的 */
export function filledQty(order: PutawayOrder, drafts: ReadonlyMap<number, EntryDraft[]>): number {
  return order.planLines.reduce(
    (n, line) =>
      n +
      recordedQty(order, line.lineNo) +
      (drafts.get(line.lineNo) ?? []).filter((d) => d.locationCode.trim()).reduce((m, d) => m + (draftQty(d) ?? 0), 0),
    0,
  )
}
