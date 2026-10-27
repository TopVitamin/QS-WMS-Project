import type { ContainerMaster } from '@/types/wms'
import type { SeedData } from './seed'
import { syncPutawayContainers } from './container-actions'

const keyOf = (warehouseCode: string, containerNo: string) =>
  `${warehouseCode}|${containerNo.trim().toUpperCase()}`

/**
 * 预建 FBA 演示用空箱，并从已有收货、上架和复核记录回放容器档案：
 * - 收货确认过的容器先为“上架中”；
 * - 已完成上架且所有落位在同一库位为“在库”，拆散为“已释放”；
 * - 复核记录里的包裹/箱托按出库单状态为“出库中/已出库”。
 * 内容不写进档案，页面按收货行、上架行和复核行汇总。
 */
export function createContainerSeed(seed: SeedData): ContainerMaster[] {
  const map = new Map<string, ContainerMaster>(
    seed.containers.map((container) => [keyOf(container.warehouseCode, container.containerNo), container]),
  )
  const put = (container: ContainerMaster) => {
    const key = keyOf(container.warehouseCode, container.containerNo)
    const prev = map.get(key)
    if (!prev) map.set(key, container)
    else map.set(key, { ...prev, ...container })
  }

  // FBA 复核只能绑定本仓同货主已建档的空闲箱/托，不能等复核完成后再补档案。
  const packingPreparedAt = '2026-10-15T08:00:00.000Z'
  seed.outboundOrders.filter((order) => order.type === 'FBA').forEach((order) => {
    const containerNo = `BOX-${order.no}`
    if (map.has(keyOf(order.warehouseCode, containerNo))) return
    put({
      warehouseCode: order.warehouseCode,
      containerNo,
      containerType: 'CARTON',
      source: 'OUTBOUND_PACK',
      customerId: order.customerId,
      status: 'IDLE',
      createdAt: packingPreparedAt,
      createdBy: 'seed',
      updatedAt: packingPreparedAt,
      updatedBy: 'seed',
    })
  })

  seed.receiptRecords.forEach((receipt) =>
    receipt.lines.forEach((line) => {
      if (!line.containerNo) return
      put({
        warehouseCode: receipt.warehouseCode,
        containerNo: line.containerNo,
        containerType: 'CARTON',
        source: 'EXTERNAL_LABEL',
        customerId: receipt.customerId,
        status: 'PUTAWAYING',
        createdAt: receipt.receivedAt,
        createdBy: receipt.operator,
        updatedAt: receipt.receivedAt,
        updatedBy: receipt.operator,
        lastScannedAt: receipt.receivedAt,
        lastScannedBy: receipt.operator,
      })
    }),
  )

  seed.putawayOrders.forEach((order) => {
    if (!order.containerNo) return
    const locations = [...new Set(order.actualLines.map((a) => a.locationCode))]
    const submitted = order.status === 'COMPLETED'
    put({
      warehouseCode: order.warehouseCode,
      containerNo: order.containerNo,
      containerType: 'CARTON',
      source: 'EXTERNAL_LABEL',
      customerId: order.customerId,
      status: !submitted ? 'PUTAWAYING' : locations.length > 1 ? 'RELEASED' : 'IN_STOCK',
      currentLocationCode: submitted && locations.length === 1 ? locations[0] : undefined,
      createdAt: order.createdAt,
      createdBy: 'system',
      updatedAt: order.submittedAt ?? order.createdAt,
      updatedBy: order.submittedBy ?? 'system',
      lastScannedAt: order.submittedAt ?? order.createdAt,
      lastScannedBy: order.submittedBy ?? 'system',
    })
  })

  // 同一容器可能有不同品质的多张上架单，状态按全部单据和当前库存汇总。
  seed.putawayOrders.forEach((order) => {
    const synced = syncPutawayContainers(
      [...map.values()], order, order.submittedBy ?? 'system', order.submittedAt ?? order.createdAt,
      seed.putawayOrders, seed.inventory,
    )
    synced.forEach((container) => put(container))
  })

  seed.outboundVerifications.forEach((verify) => {
    if (!verify.containerNo) return
    const order = seed.outboundOrders.find((o) => o.no === verify.orderNo)
    if (!order) return
    // FBA 的绑定、状态和建档信息由合法出库动作维护，保留动作执行后的档案。
    if (order.type === 'FBA') return
    put({
      warehouseCode: order.warehouseCode,
      containerNo: verify.containerNo,
      containerType: verify.containerType === 'PALLET' ? 'PALLET' : verify.containerType === 'BOX' ? 'CARTON' : 'PACKAGE',
      source: 'OUTBOUND_PACK',
      customerId: order.customerId,
      status: order.status === 'SHIPPED' ? 'SHIPPED' : 'OUTBOUND',
      createdAt: verify.at,
      createdBy: verify.operator,
      updatedAt: verify.at,
      updatedBy: verify.operator,
      lastScannedAt: verify.at,
      lastScannedBy: verify.operator,
    })
  })

  // 给常用演示容器补容量，便于演示超容提示和容量维护
  const capacity: Record<string, Pick<ContainerMaster, 'maxPieces' | 'maxWeightKg' | 'maxVolumeM3'>> = {
    'C-M01': { maxPieces: 100, maxWeightKg: 30, maxVolumeM3: 0.8 },
    'C-A01': { maxPieces: 1000, maxWeightKg: 200, maxVolumeM3: 4 },
    'C-B02': { maxPieces: 1200, maxWeightKg: 240, maxVolumeM3: 5 },
  }
  return [...map.values()].map((c) => ({ ...c, ...(capacity[c.containerNo] ?? {}) }))
}
