import type { InboundOrder, InventoryRecord, PutawayOrder, SkuMaster } from '@/types/wms'
import { PRODUCT_FORM_I18N, PRODUCT_FORM_OPTIONS } from '@/lib/location-master'

export { PRODUCT_FORM_I18N, PRODUCT_FORM_OPTIONS }

export function skuMasterKey(row: Pick<SkuMaster, 'ownerCode' | 'code'>): string {
  return `${row.ownerCode}::${row.code}`
}

export function findSkuMaster(
  masters: SkuMaster[],
  ownerCode: string,
  code: string,
): SkuMaster | undefined {
  return masters.find((m) => m.ownerCode === ownerCode && m.code === code)
}

export function skuDetailPath(ownerCode: string, skuCode: string): string {
  return `/wms/master/skus/${encodeURIComponent(ownerCode)}/${encodeURIComponent(skuCode)}`
}

export function skuEditPath(ownerCode: string, skuCode: string): string {
  return `/wms/master/skus/${encodeURIComponent(ownerCode)}/${encodeURIComponent(skuCode)}/edit`
}

export type SkuMasterFormErrors = Partial<
  Record<
    | 'name'
    | 'unit'
    | 'productForm'
    | 'status'
    | 'shelfLifeDays'
    | 'inboundDays'
    | 'nearExpiryDays'
    | 'expiredDays'
    | 'qcFlowType'
    | 'snFormat'
    | 'expiryInequality',
    string
  >
>

export function validateSkuMasterForm(form: SkuMaster): SkuMasterFormErrors {
  const errors: SkuMasterFormErrors = {}
  if (!form.name.trim()) errors.name = 'required'
  if (!form.unit.trim()) errors.unit = 'required'
  if (!form.productForm) errors.productForm = 'required'
  if (!form.status) errors.status = 'required'

  if (form.snEnabled && form.snFormat?.trim()) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(form.snFormat.trim())
    } catch {
      errors.snFormat = 'invalid'
    }
  }

  if (form.expiryEnabled) {
    const shelf = form.shelfLifeDays
    const inbound = form.inboundDays
    const near = form.nearExpiryDays
    const expired = form.expiredDays
    if (shelf == null || shelf <= 0) errors.shelfLifeDays = 'required'
    if (inbound == null || inbound < 0) errors.inboundDays = 'required'
    if (near == null || near < 0) errors.nearExpiryDays = 'required'
    if (expired == null || expired < 0) errors.expiredDays = 'required'
    if (
      inbound != null &&
      near != null &&
      expired != null &&
      (inbound < near || near < expired)
    ) {
      errors.expiryInequality = 'invalid'
    }
  }

  if (form.qcRequired && !form.qcFlowType?.trim()) {
    errors.qcFlowType = 'required'
  }

  return errors
}

export function hasSkuStock(inventory: InventoryRecord[], customerId: string, skuCode: string): boolean {
  return inventory.some((r) => r.customerId === customerId && r.skuCode === skuCode && r.onHandQty > 0)
}

export function hasOpenSkuWork(
  inbounds: InboundOrder[],
  putawayOrders: PutawayOrder[],
  customerId: string,
  skuCode: string,
): boolean {
  const openInbound = inbounds.some(
    (o) =>
      o.customerId === customerId &&
      o.status !== 'COMPLETED' &&
      o.items.some((i) => i.skuCode === skuCode),
  )
  if (openInbound) return true
  return putawayOrders.some(
    (p) => p.customerId === customerId && p.status !== 'COMPLETED' && p.planLines.some((l) => l.skuCode === skuCode),
  )
}

export function cannotDisableTrace(
  prev: SkuMaster,
  patch: Partial<SkuMaster>,
  customerId: string,
  inventory: InventoryRecord[],
): boolean {
  if (!hasSkuStock(inventory, customerId, prev.code)) return false
  if (prev.snEnabled && patch.snEnabled === false) return true
  if (prev.batchEnabled && patch.batchEnabled === false) return true
  if (prev.expiryEnabled && patch.expiryEnabled === false) return true
  return false
}

export function matchUpdatedRange(updatedAt: string, from: string, to: string): boolean {
  if (from) {
    const fromMs = new Date(from).getTime()
    if (new Date(updatedAt).getTime() < fromMs) return false
  }
  if (to) {
    const toMs = new Date(to).getTime() + 86_400_000
    if (new Date(updatedAt).getTime() > toMs) return false
  }
  return true
}
