import type { ContainerMaster } from '@/types/wms'
import type { SeedData } from './seed'

const keyOf = (warehouseCode: string, containerNo: string) =>
  `${warehouseCode}|${containerNo.trim().toUpperCase()}`

/**
 * 从已有收货、上架和复核记录回放容器档案：
 * - 收货确认过的容器先为“上架中”；
 * - 已完成上架且所有落位在同一库位为“在库”，拆散为“已释放”；
 * - 复核记录里的包裹/箱托按出库单状态为“出库中/已出库”。
 * 内容不写进档案，页面按收货行、上架行和复核行汇总。
 */
export function createContainerSeed(seed: SeedData): ContainerMaster[] {
  const map = new Map<string, ContainerMaster>()
  const put = (container: ContainerMaster) => {
    const key = keyOf(container.warehouseCode, container.containerNo)
    const prev = map.get(key)
    if (!prev) map.set(key, container)
    else map.set(key, { ...prev, ...container })
  }

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

  seed.outboundVerifications.forEach((verify) => {
    if (!verify.containerNo) return
    const order = seed.outboundOrders.find((o) => o.no === verify.orderNo)
    if (!order) return
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
