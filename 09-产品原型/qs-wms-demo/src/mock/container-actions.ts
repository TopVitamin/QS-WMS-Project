import type { ContainerMaster, ContainerStatus, ContainerType, ContainerSource } from '@/types/wms'
import type { PutawayOrder } from '@/types/inbound'
import type { SeedData } from './seed'
import { containerIdOf } from '@/lib/container-id'
import type { InventoryRecord } from '@/types/wms'

type ActionResult = { ok: true } | { ok: false; errorKey: string; params?: Record<string, string | number> }

export interface CreateContainerInput {
  warehouseCode: string
  containerNo: string
  containerType: ContainerType
  source: ContainerSource
  customerId: string
  maxPieces?: number
  maxWeightKg?: number
  maxVolumeM3?: number
  parentContainerNo?: string
  remark?: string
}

const keyOf = (warehouseCode: string, containerNo: string) =>
  `${warehouseCode}|${containerNo.trim().toUpperCase()}`

export function findContainer(
  containers: ContainerMaster[],
  warehouseCode: string,
  containerNo: string,
): ContainerMaster | undefined {
  return containers.find((c) => keyOf(c.warehouseCode, c.containerNo) === keyOf(warehouseCode, containerNo))
}

function validateCapacity(input: Partial<CreateContainerInput>): string | undefined {
  const values = [input.maxPieces, input.maxWeightKg, input.maxVolumeM3]
  if (values.some((v) => v !== undefined && (!Number.isFinite(v) || v < 0))) return 'container.error.capacity'
  return undefined
}

/** 收货/退货首次绑定容器时校验：停用或货主不符阻断；不存在则后续自动建档 */
export function receiptContainerIssue(
  containers: ContainerMaster[],
  warehouseCode: string,
  customerId: string,
  containerNo: string,
): string | undefined {
  const found = findContainer(containers, warehouseCode, containerNo)
  if (!found) return undefined
  if (found.status === 'DISABLED') return 'container.error.disabled'
  if (found.customerId !== customerId) return 'container.error.ownerMismatch'
  if (!['IDLE', 'RECEIVING'].includes(found.status)) return 'container.error.busy'
  return undefined
}

/** 收货确认后把本次容器置为上架中；未知容器自动建档 */
export function upsertReceivingContainers(
  containers: ContainerMaster[],
  input: {
    warehouseCode: string
    customerId: string
    containerNos: string[]
    operator: string
    at: string
    status?: 'RECEIVING' | 'PUTAWAYING'
  },
): ContainerMaster[] {
  let next = [...containers]
  for (const raw of input.containerNos) {
    const containerNo = raw.trim()
    if (!containerNo) continue
    const idx = next.findIndex((c) => keyOf(c.warehouseCode, c.containerNo) === keyOf(input.warehouseCode, containerNo))
    if (idx >= 0) {
      const prev = next[idx]
      next[idx] = {
        ...prev,
        status: input.status ?? 'PUTAWAYING',
        currentLocationCode: undefined,
        lastScannedAt: input.at,
        lastScannedBy: input.operator,
        updatedAt: input.at,
        updatedBy: input.operator,
      }
    } else {
      next.push({
        warehouseCode: input.warehouseCode,
        containerNo,
        containerType: 'CARTON',
        source: 'EXTERNAL_LABEL',
        customerId: input.customerId,
        status: input.status ?? 'PUTAWAYING',
        createdAt: input.at,
        createdBy: input.operator,
        updatedAt: input.at,
        updatedBy: input.operator,
        lastScannedAt: input.at,
        lastScannedBy: input.operator,
      })
    }
  }
  return next
}

/** 上架提交后更新容器：全部落位在同一库位为在库，拆散为已释放 */
export function syncPutawayContainers(
  containers: ContainerMaster[],
  order: PutawayOrder,
  operator: string,
  at: string,
  putawayOrders: PutawayOrder[] = [order],
  inventory: InventoryRecord[] = [],
): ContainerMaster[] {
  if (!order.containerNo) return containers
  const containerId = order.containerId ?? containerIdOf(order.warehouseCode, order.containerNo)
  const idx = containers.findIndex(
    (c) => keyOf(c.warehouseCode, c.containerNo) === keyOf(order.warehouseCode, order.containerNo!),
  )
  if (idx < 0) return containers
  const pending = putawayOrders.some(
    (candidate) =>
      (candidate.containerId ?? containerIdOf(candidate.warehouseCode, candidate.containerNo)) === containerId &&
      candidate.status !== 'COMPLETED',
  )
  const rows = inventory.filter((r) => r.containerId === containerId && r.onHandQty > 0)
  const locations = [...new Set(rows.map((r) => r.locationCode))]
  const one = !pending && rows.length > 0 && locations.length === 1 ? locations[0] : undefined
  const next = [...containers]
  next[idx] = {
    ...next[idx],
    status: pending ? 'PUTAWAYING' : one ? 'IN_STOCK' : 'RELEASED',
    currentLocationCode: one,
    lastScannedAt: at,
    lastScannedBy: operator,
    updatedAt: at,
    updatedBy: operator,
  }
  return next
}

/** 出库复核成功后绑定已建档的箱/托。 */
export function bindOutboundContainers(
  containers: ContainerMaster[],
  input: {
    warehouseCode: string
    customerId: string
    containerNo: string
    containerType: Extract<ContainerType, 'CARTON' | 'PALLET'>
    parentContainerNo?: string
    operator: string
    at: string
  },
): ContainerMaster[] {
  const next = [...containers]
  const bind = (
    containerNo: string,
    containerType: Extract<ContainerType, 'CARTON' | 'PALLET'>,
    parentContainerNo?: string,
  ) => {
    const found = findContainer(next, input.warehouseCode, containerNo)
    if (!found) return
    const index = next.indexOf(found)
    next[index] = {
      ...found,
      containerType,
      parentContainerNo: parentContainerNo || undefined,
      status: 'OUTBOUND',
      currentLocationCode: undefined,
      lastScannedAt: input.at,
      lastScannedBy: input.operator,
      updatedAt: input.at,
      updatedBy: input.operator,
    }
  }

  const childNo = input.containerNo.trim()
  const parentNo = input.parentContainerNo?.trim()
  bind(childNo, input.containerType, parentNo)
  if (parentNo) bind(parentNo, 'PALLET')
  return next
}

export function bindContainerAction(
  state: SeedData,
  input: { warehouseCode: string; customerId: string; containerNo: string; operator: string },
  _operator: string,
): ActionResult & { patch?: Partial<SeedData> } {
  const containerNo = input.containerNo.trim()
  if (!containerNo) return { ok: false, errorKey: 'container.error.noRequired' }
  const issue = receiptContainerIssue(state.containers ?? [], input.warehouseCode, input.customerId, containerNo)
  if (issue) return { ok: false, errorKey: issue }
  const existing = findContainer(state.containers ?? [], input.warehouseCode, containerNo)
  if (existing && !['IDLE', 'RECEIVING'].includes(existing.status)) {
    return { ok: false, errorKey: 'container.error.busy' }
  }
  const at = new Date().toISOString()
  return {
    ok: true,
    patch: {
      containers: upsertReceivingContainers(state.containers ?? [], {
        warehouseCode: input.warehouseCode,
        customerId: input.customerId,
        containerNos: [containerNo],
        operator: input.operator,
        at,
        status: 'RECEIVING',
      }),
    },
  }
}

export function createContainerAction(
  state: SeedData,
  input: CreateContainerInput,
  operator: string,
): ActionResult & { patch?: Partial<SeedData> } {
  const containerNo = input.containerNo.trim()
  if (!containerNo) return { ok: false, errorKey: 'container.error.noRequired' }
  if (!input.warehouseCode) return { ok: false, errorKey: 'container.error.warehouseRequired' }
  const owner = state.customerMasters.find((c) => c.id === input.customerId && c.status === 'ENABLED')
  if (!owner) return { ok: false, errorKey: 'container.error.ownerInvalid' }
  if (findContainer(state.containers, input.warehouseCode, containerNo)) {
    return { ok: false, errorKey: 'container.error.duplicate' }
  }
  const capacityError = validateCapacity(input)
  if (capacityError) return { ok: false, errorKey: capacityError }
  const at = new Date().toISOString()
  const row: ContainerMaster = {
    warehouseCode: input.warehouseCode,
    containerNo,
    containerType: input.containerType,
    source: input.source,
    customerId: input.customerId,
    status: 'IDLE',
    maxPieces: input.maxPieces,
    maxWeightKg: input.maxWeightKg,
    maxVolumeM3: input.maxVolumeM3,
    parentContainerNo: input.parentContainerNo?.trim() || undefined,
    remark: input.remark?.trim() || undefined,
    createdAt: at,
    createdBy: operator,
    updatedAt: at,
    updatedBy: operator,
  }
  return { ok: true, patch: { containers: [row, ...state.containers] } }
}

export function updateContainerAction(
  state: SeedData,
  input: {
    warehouseCode: string
    containerNo: string
    containerType: ContainerType
    maxPieces?: number
    maxWeightKg?: number
    maxVolumeM3?: number
    parentContainerNo?: string
    remark?: string
  },
  operator: string,
): ActionResult & { patch?: Partial<SeedData> } {
  const idx = state.containers.findIndex(
    (c) => keyOf(c.warehouseCode, c.containerNo) === keyOf(input.warehouseCode, input.containerNo),
  )
  if (idx < 0) return { ok: false, errorKey: 'container.error.notFound' }
  const capacityError = validateCapacity(input)
  if (capacityError) return { ok: false, errorKey: capacityError }
  const at = new Date().toISOString()
  const next = [...state.containers]
  next[idx] = {
    ...next[idx],
    containerType: input.containerType,
    maxPieces: input.maxPieces,
    maxWeightKg: input.maxWeightKg,
    maxVolumeM3: input.maxVolumeM3,
    parentContainerNo: input.parentContainerNo?.trim() || undefined,
    remark: input.remark?.trim() || undefined,
    updatedAt: at,
    updatedBy: operator,
  }
  return { ok: true, patch: { containers: next } }
}

export function setContainerStatusAction(
  state: SeedData,
  input: { warehouseCode: string; containerNo: string; status: Extract<ContainerStatus, 'IDLE' | 'DISABLED'> },
  operator: string,
): ActionResult & { patch?: Partial<SeedData> } {
  const idx = state.containers.findIndex(
    (c) => keyOf(c.warehouseCode, c.containerNo) === keyOf(input.warehouseCode, input.containerNo),
  )
  if (idx < 0) return { ok: false, errorKey: 'container.error.notFound' }
  const row = state.containers[idx]
  if (input.status === 'IDLE' && row.status !== 'DISABLED' && row.status !== 'IDLE') {
    return { ok: false, errorKey: 'container.error.busy' }
  }
  if (input.status === 'DISABLED' && ['PUTAWAYING', 'IN_STOCK', 'OUTBOUND', 'SHIPPED'].includes(row.status)) {
    return { ok: false, errorKey: 'container.error.busy' }
  }
  const at = new Date().toISOString()
  const next = [...state.containers]
  next[idx] = { ...row, status: input.status, updatedAt: at, updatedBy: operator }
  return { ok: true, patch: { containers: next } }
}
