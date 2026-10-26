import type { OutboundVerification } from '@/types/outbound'
import type { ContainerMaster } from '@/types/wms'

export type FbaContainerIssue =
  | 'missing'
  | 'warehouse'
  | 'owner'
  | 'type'
  | 'busy'
  | 'parentMissing'
  | 'parentOwner'
  | 'parentType'
  | 'parentBusy'
  | 'mixedContent'

const norm = (value?: string) => value?.trim().toUpperCase() ?? ''

const sameNo = (a?: string, b?: string) => norm(a) === norm(b)

const activeContainerReference = (
  records: OutboundVerification[],
  orderNo: string,
  containerNo: string,
) =>
  records.some(
    (record) =>
      !record.deleted &&
      record.orderNo === orderNo &&
      record.lines.some((line) => line.effectiveQty > 0) &&
      (sameNo(record.containerNo, containerNo) || sameNo(record.parentContainerNo, containerNo)),
  )

function statusIssue(
  container: ContainerMaster,
  orderNo: string,
  records: OutboundVerification[],
  parent: boolean,
): FbaContainerIssue | undefined {
  if (container.status === 'IDLE') return undefined
  if (container.status === 'OUTBOUND' && activeContainerReference(records, orderNo, container.containerNo))
    return undefined
  return parent ? 'parentBusy' : 'busy'
}

export function effectiveFbaParentNo(container: ContainerMaster | undefined, requested?: string) {
  return requested?.trim() || container?.parentContainerNo?.trim() || undefined
}

/** FBA复核绑定规则；当前容器和父托都必须先在本仓建档。 */
export function fbaContainerIssue(
  containers: ContainerMaster[],
  input: {
    warehouseCode: string
    customerId: string
    orderNo: string
    containerType: 'BOX' | 'PALLET'
    containerNo: string
    parentContainerNo?: string
    records: OutboundVerification[]
  },
): FbaContainerIssue | undefined {
  const containerNo = input.containerNo.trim()
  const existing = containers.find(
    (container) =>
      container.warehouseCode === input.warehouseCode && sameNo(container.containerNo, containerNo),
  )
  if (
    !existing &&
    containers.some((container) => container.warehouseCode !== input.warehouseCode && sameNo(container.containerNo, containerNo))
  )
    return 'warehouse'
  if (!existing) return 'missing'

  if (existing.customerId !== input.customerId) return 'owner'
  if (existing.containerType !== (input.containerType === 'BOX' ? 'CARTON' : 'PALLET')) return 'type'
  const status = statusIssue(existing, input.orderNo, input.records, false)
  if (status) return status
  if (input.containerType === 'PALLET' && existing.parentContainerNo) return 'parentType'

  const parentContainerNo = effectiveFbaParentNo(existing, input.parentContainerNo)
  const activeRowsForContainer = input.records.filter(
    (record) =>
      !record.deleted &&
      record.orderNo === input.orderNo &&
      sameNo(record.containerNo, containerNo) &&
      record.lines.some((line) => line.effectiveQty > 0),
  )
  if (activeRowsForContainer.some((record) => !sameNo(record.parentContainerNo, parentContainerNo))) return 'parentType'
  if (input.containerType === 'BOX' && existing.parentContainerNo && !sameNo(existing.parentContainerNo, parentContainerNo)) {
    if (activeRowsForContainer.length > 0) return 'parentType'
  }
  if (!parentContainerNo) return undefined
  if (input.containerType !== 'BOX' || sameNo(parentContainerNo, containerNo)) return 'parentType'

  const parent = containers.find(
    (container) =>
      container.warehouseCode === input.warehouseCode && sameNo(container.containerNo, parentContainerNo),
  )
  if (!parent) {
    return containers.some(
      (container) => container.warehouseCode !== input.warehouseCode && sameNo(container.containerNo, parentContainerNo),
    )
      ? 'warehouse'
      : 'parentMissing'
  }
  if (parent.customerId !== input.customerId) return 'parentOwner'
  if (parent.containerType !== 'PALLET' || parent.parentContainerNo) return 'parentType'
  const parentStatus = statusIssue(parent, input.orderNo, input.records, true)
  if (parentStatus) return parentStatus

  const hasDirectPalletContent = input.records.some(
    (record) =>
      !record.deleted &&
      record.orderNo === input.orderNo &&
      sameNo(record.containerNo, parentContainerNo) &&
      !record.parentContainerNo &&
      record.lines.some((line) => line.effectiveQty > 0),
  )
  return hasDirectPalletContent ? 'mixedContent' : undefined
}

export function fbaPalletHasActiveChildContent(
  records: OutboundVerification[],
  orderNo: string,
  palletNo: string,
) {
  return records.some(
    (record) =>
      !record.deleted &&
      record.orderNo === orderNo &&
      sameNo(record.parentContainerNo, palletNo) &&
      !sameNo(record.containerNo, palletNo) &&
      record.lines.some((line) => line.effectiveQty > 0),
  )
}

