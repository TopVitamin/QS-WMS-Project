import { nextDocNo } from '@/lib/doc-no'
import { parseCodeLines } from '@/lib/unclaimed'
import type { UnclaimedRecord } from '@/types/inbound'
import type { SeedData } from './seed'

export interface RegisterUnclaimedInput {
  warehouseCode: string
  trackingNos: string[]
  cartonMarks: string[]
  containerNo?: string
  cartonQty: number
  description?: string
  photos?: string[]
  requestId: string
  operator: string
}

export type RegisterUnclaimedResult =
  | { ok: true; record: UnclaimedRecord; patch: Partial<SeedData> }
  | { ok: false; errorKey: string }

/**
 * 无主货登记（无主货登记主PRD 第二节）：只生成 UG 记录，不碰入库单、收货记录、上架单、异常、库存与流水；
 * 实物统一放本仓无主货专用暂存库位，登记时自动绑定、不让人选库位。
 * 管理端登记弹窗与 PDA 登记屏共用本动作；同一次提交重复到达返回原 UG 号。
 */
export function applyRegisterUnclaimed(state: SeedData, input: RegisterUnclaimedInput): RegisterUnclaimedResult {
  const records = state.unclaimedRecords ?? []
  const existed = records.find((r) => r.requestId === input.requestId)
  if (existed) return { ok: true, record: existed, patch: {} }

  const trackingNos = parseCodeLines(input.trackingNos.join('\n'))
  const cartonMarks = parseCodeLines(input.cartonMarks.join('\n'))
  const containerNo = input.containerNo?.trim() || undefined

  if (trackingNos.length === 0 && cartonMarks.length === 0 && !containerNo) {
    return { ok: false, errorKey: 'unclaimed.error.clueRequired' }
  }
  if (!Number.isInteger(input.cartonQty) || input.cartonQty <= 0) {
    return { ok: false, errorKey: 'error.qtyInvalid' }
  }

  const ts = new Date().toISOString()
  const record: UnclaimedRecord = {
    registerNo: nextDocNo('UG', records.map((r) => r.registerNo), ts),
    status: 'HOLDING',
    warehouseCode: input.warehouseCode,
    stagingLocationCode:
      state.locations.find((l) => l.warehouseCode === input.warehouseCode && l.type === 'EXCEPTION')?.code ?? 'EX-01-01',
    trackingNos,
    cartonMarks,
    containerNo,
    cartonQty: input.cartonQty,
    description: input.description?.trim() || undefined,
    photos: input.photos ?? [],
    registeredBy: input.operator,
    registeredAt: ts,
    requestId: input.requestId,
  }
  return { ok: true, record, patch: { unclaimedRecords: [record, ...records] } }
}
