import { nextDocNo } from '@/lib/doc-no'
import { findNewSkuRecord } from '@/lib/new-sku'
import { lengthToCm, weightToKg } from '@/lib/unit'
import type { NewSkuRecord } from '@/types/inbound'
import type { SkuMaster, UnitSystem } from '@/types/wms'
import type { SeedData } from './seed'

export interface SubmitNewSkuMeasureInput {
  customerId: string
  skuCode: string
  warehouseCode: string
  sourceInboundNo?: string
  /** 按仓库单位录入的四项实测值 */
  length: number
  width: number
  height: number
  grossWeight: number
  photos?: string[]
  remark?: string
  requestId: string
  operator: string
}

export type SubmitNewSkuMeasureResult =
  | { ok: true; record: NewSkuRecord; patch: Partial<SeedData> }
  | { ok: false; errorKey: string; record?: NewSkuRecord }

function decimalsOf(value: number): number {
  const text = String(value)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

function validMeasure(value: number, maxDecimals: number): boolean {
  return Number.isFinite(value) && value > 0 && decimalsOf(value) <= maxDecimals
}

/**
 * 新品量方提交（新品维护主PRD 第四节）：提交时重新检查货主、商品启用与该货主SKU无记录；
 * 成功生成 NS 号、写入仓内规格（商品资料留痕）。管理端量方弹窗与 PDA 量方屏共用本动作。
 */
export function applySubmitNewSkuMeasure(
  state: SeedData,
  input: SubmitNewSkuMeasureInput,
): SubmitNewSkuMeasureResult {
  const records = state.newSkuRecords ?? []
  const existed = records.find((r) => r.requestId === input.requestId)
  if (existed) return { ok: true, record: existed, patch: {} }

  const customer = state.customerMasters.find((c) => c.id === input.customerId)
  const skuMaster = state.skuMasters.find((m) => m.customerId === input.customerId && m.code === input.skuCode)
  if (!customer || customer.status !== 'ENABLED' || !skuMaster || skuMaster.status !== 'ENABLED') {
    return { ok: false, errorKey: 'newSku.error.inactive' }
  }
  const duplicate = findNewSkuRecord(records, input.customerId, input.skuCode)
  if (duplicate) return { ok: false, errorKey: 'newSku.error.exists', record: duplicate }

  if (
    !validMeasure(input.length, 2) ||
    !validMeasure(input.width, 2) ||
    !validMeasure(input.height, 2) ||
    !validMeasure(input.grossWeight, 3)
  ) {
    return { ok: false, errorKey: 'newSku.error.measureInvalid' }
  }

  const warehouse = state.warehouses.find((w) => w.code === input.warehouseCode)
  const unit: UnitSystem = warehouse?.unitSystem ?? 'metric'
  const ts = new Date().toISOString()
  const record: NewSkuRecord = {
    recordNo: nextDocNo('NS', records.map((r) => r.recordNo), ts),
    customerId: input.customerId,
    skuCode: input.skuCode,
    warehouseCode: input.warehouseCode,
    sourceInboundNo: input.sourceInboundNo,
    lengthCm: lengthToCm(input.length, unit),
    widthCm: lengthToCm(input.width, unit),
    heightCm: lengthToCm(input.height, unit),
    grossWeightKg: weightToKg(input.grossWeight, unit),
    photos: input.photos ?? [],
    remark: input.remark,
    maintainedBy: input.operator,
    maintainedAt: ts,
    requestId: input.requestId,
  }

  const skuMasters: SkuMaster[] = state.skuMasters.map((m) =>
    m.customerId === input.customerId && m.code === input.skuCode
      ? {
          ...m,
          lengthCm: record.lengthCm,
          widthCm: record.widthCm,
          heightCm: record.heightCm,
          grossWeightKg: record.grossWeightKg,
          updatedAt: ts,
          updatedBy: input.operator,
        }
      : m,
  )

  return { ok: true, record, patch: { newSkuRecords: [record, ...records], skuMasters } }
}
