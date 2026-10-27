import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/mock/seed'
import type { InventoryLog } from '@/types/wms'
import {
  deriveBalances,
  deriveSerials,
  deriveSkuStocks,
  expiryLevel,
  orderReservedTotals,
  serialTrack,
  stockKey,
  stocktakeBlockers,
} from './inventory-derive'
import { ledgerNumbers } from './inventory-ledger'

const LA = 'US-LA-01'
const NJ = 'US-NJ-01'
const ANKR = 'C10028'
const HOMY = 'C10031'
const NOW = new Date('2026-10-21T12:00:00.000Z')
const seed = createSeedData()
const warehouses = seed.warehouses.map((w) => w.code)

/** 流水按发生时间排序，同一时刻按写入顺序（与库存流水列表一致） */
const chronological = (logs: InventoryLog[]) =>
  logs
    .map((l, index) => ({ l, index }))
    .sort((a, b) => a.l.createdAt.localeCompare(b.l.createdAt) || a.index - b.index)
    .map(({ l }) => l)
const detailKey = (
  l: Pick<InventoryLog, 'warehouseCode' | 'customerId' | 'skuCode' | 'locationCode' | 'batchNo' | 'containerId' | 'expiryDate' | 'inventoryId'> & {
    qualityType?: string
    productionDate?: string
  },
) => [
  l.warehouseCode, l.customerId, l.skuCode, l.locationCode, l.containerId ?? '', l.batchNo ?? '',
  l.productionDate ?? seed.inventory.find((r) => r.id === l.inventoryId)?.productionDate ?? '',
  l.expiryDate ?? '', l.qualityType ?? '',
].join('|')

describe('SKU库存按品质分行（库存查询主PRD 第二节）', () => {
  it('良品库存＝订单预占＋可用，不良品预占与可用均为0，汇总等于批次库存', () => {
    warehouses.forEach((w) => {
      const balances = deriveBalances(seed, w, NOW)
      deriveSkuStocks(seed, w).forEach((r) => {
        expect(r.actual).toBe(r.good + r.defective)
        expect(r.preoccupied).toBe(r.orderReserved)
        expect(r.available).toBe(r.qualityType === 'GOOD' ? r.actual - r.orderReserved : 0)
        expect(r.available).toBeGreaterThanOrEqual(0)
        const detail = balances.filter(
          (b) =>
            b.record.customerId === r.customerId &&
            b.record.skuCode === r.skuCode &&
            b.record.qualityType === r.qualityType,
        )
        expect(detail.reduce((n, b) => n + b.record.onHandQty, 0)).toBe(r.actual)
      })
    })
  })

  it('暂存库位上的正常品计入可用但不可分配', () => {
    const staging = warehouses.flatMap((w) => deriveBalances(seed, w, NOW)).filter((b) => b.stagingGood)
    expect(staging.length).toBeGreaterThan(0)
    staging.forEach((b) => {
      expect(b.normalAllocatable).toBe(false)
      expect(b.convertible).toBe(0)
    })
  })

  it('演示数据：洛杉矶仓演示商品待核对、盘点中、可用为 0；批次商品盘亏后可用为0', () => {
    const rows = deriveSkuStocks(seed, LA)
    const homy = rows.find((r) => r.customerId === HOMY && r.skuCode === 'HOMY-003')!
    expect(homy.pending).toBeDefined()
    expect(homy.counting?.status).toBe('COUNTING')
    expect(homy.available).toBe(0)
    expect(rows.find((r) => r.customerId === ANKR && r.skuCode === 'LOT-DEMO-01')!.available).toBe(0)
    const frozen = deriveBalances(seed, LA, NOW).filter((b) => b.record.skuCode === 'HOMY-003')
    expect(frozen.every((b) => b.counting && b.convertible === 0 && !b.normalAllocatable)).toBe(true)
  })
})

describe('效期等级', () => {
  const master = { expiryEnabled: true, nearExpiryDays: 90, expiredDays: 0 }
  const today = '2026-10-21'

  it('剩余天数低于过期天数为过期，低于临期天数为临期，过期优先', () => {
    expect(expiryLevel('2026-10-20', master, today)).toBe('EXPIRED')
    expect(expiryLevel('2026-10-21', master, today)).toBe('NEAR')
    expect(expiryLevel('2027-01-18', master, today)).toBe('NEAR')
    expect(expiryLevel('2027-01-19', master, today)).toBe('NORMAL')
    expect(expiryLevel('2026-11-01', { ...master, expiredDays: 30 }, today)).toBe('EXPIRED')
  })

  it('未启用效期或没有有效期不分等级；演示新批次为临期', () => {
    expect(expiryLevel('2026-10-01', { ...master, expiryEnabled: false }, today)).toBeUndefined()
    expect(expiryLevel(undefined, master, today)).toBeUndefined()
    const lot = deriveBalances(seed, LA, NOW).find((b) => b.record.batchNo === 'LOT-202612')!
    expect(lot.expiry).toBe('NEAR')
  })
})

describe('SN 库存', () => {
  it('在库 SN 全系统唯一；盘点核实缺失SN记为已盘亏，不推断当前库位', () => {
    const inStock = warehouses.flatMap((w) => deriveSerials(seed, w)).filter((r) => r.status === 'IN_STOCK')
    expect(new Set(inStock.map((r) => r.id)).size).toBe(inStock.length)
    const lost = deriveSerials(seed, NJ).filter((r) => r.status === 'LOST')
    expect(lost).toHaveLength(1)
    expect(lost[0]).toMatchObject({ locationCode: '', skuCode: 'SN-DEMO-01' })
    expect(lost[0].lastLog).toMatchObject({ type: 'ADJUST', qtyChange: -1 })
    expect(seed.inventory.some((r) => r.serialNos?.includes(lost[0].serialNo))).toBe(false)
    expect(deriveSerials(seed, LA).some((r) => r.status === 'LOST')).toBe(false)
  })

  it('SN轨迹保留两条独立移库记录，不生成源目标位字段', () => {
    const moved = deriveSerials(seed, LA).find((r) => r.serialNo === 'SN00000017')!
    const nodes = serialTrack(seed.inventoryLogs, moved.customerId, moved.skuCode, moved.serialNo)
    const move = nodes.find((n) => n.type === 'MOVE')!
    expect(move).not.toHaveProperty('fromLocation')
    expect(move).not.toHaveProperty('toLocation')
    expect(nodes.filter((n) => n.type === 'MOVE')).toHaveLength(2)
  })
})

describe('盘点阻断', () => {
  it('只有同一 SKU 已在盘点中才阻断，已有任务不阻断', () => {
    expect(stocktakeBlockers(seed, LA, [{ customerId: ANKR, skuCode: 'CABLE-01' }])).toEqual([])
    expect(stocktakeBlockers(seed, LA, [{ customerId: HOMY, skuCode: 'HOMY-003' }]).map((b) => b.kind)).toEqual([
      'COUNTING',
    ])
    expect(stocktakeBlockers(seed, LA, [{ customerId: HOMY, skuCode: 'CABLE-01' }])).toEqual([])
  })
})

describe('种子流水（库存流水主PRD）', () => {
  it('同一库存明细的流水前后数量首尾相接，最后一条等于当前实际', () => {
    const last = new Map<string, InventoryLog>()
    chronological(seed.inventoryLogs.filter((l) => l.level === 'DETAIL')).forEach((l) => {
      const key = detailKey(l)
      const prev = last.get(key)
      if (prev) expect(l.beforeQty, `${key} ${l.id}`).toBe(prev.afterQty)
      expect(l.beforeQty, `${key} ${l.id}`).toBeGreaterThanOrEqual(0)
      expect(l.afterQty! - l.beforeQty!).toBe(l.qtyChange)
      last.set(key, l)
    })
    const current = new Map(seed.inventory.map((r) => [detailKey(r), r.onHandQty]))
    last.forEach((l, key) => expect(l.afterQty, key).toBe(current.get(key) ?? 0))
  })

  it('同一完整余额维度（含容器、生产日期和有效期）只有一行库存明细', () => {
    const keys = seed.inventory.map(detailKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('同库位的箱内库存与散件分别保留，箱内收货和上架流水可回溯', () => {
    const carton = seed.inventory.find((r) => r.containerId === 'US-LA-01::C-A01' && r.qualityType === 'GOOD')!
    const loose = seed.inventory.find((r) => r.warehouseCode === LA && r.customerId === ANKR &&
      r.skuCode === carton.skuCode && r.locationCode === carton.locationCode && !r.containerId && r.qualityType === 'GOOD')!
    expect(carton.onHandQty).toBeGreaterThan(0)
    expect(loose.onHandQty).toBeGreaterThan(0)
    expect(carton.id).not.toBe(loose.id)
    expect(seed.inventoryLogs.find((l) => l.type === 'PUTAWAY' && l.qtyChange > 0 && l.inventoryId === carton.id))
      .toMatchObject({ containerId: carton.containerId, beforeQty: 0, afterQty: 590 })
  })

  it('种子收货流水保留实录批次，不因商品当前开关丢失余额维度', () => {
    const logs = seed.inventoryLogs.filter((l) => l.jobNo === 'RC-20261005-0001')
    expect(logs.map((l) => [l.batchNo, l.beforeQty, l.afterQty])).toEqual([
      ['BATCH-2026-A', 0, 500], ['BATCH-2026-B', 0, 300],
    ])
  })

  it('多品质上架或多库位拆散后容器已释放，目标库存和流水均为散件', () => {
    for (const containerNo of ['C-C05', 'C-SN01']) {
      expect(seed.containers.find((c) => c.warehouseCode === LA && c.containerNo === containerNo)?.status).toBe('RELEASED')
      const orders = seed.putawayOrders.filter((p) => p.containerNo === containerNo)
      const targetLogs = seed.inventoryLogs.filter((l) => orders.some((p) => p.putawayNo === l.jobNo) && l.qtyChange > 0)
      expect(targetLogs.length).toBeGreaterThan(1)
      expect(targetLogs.every((l) => !l.containerId)).toBe(true)
      expect(seed.inventory.some((r) => r.containerId === `US-LA-01::${containerNo}` && r.onHandQty > 0)).toBe(false)
    }
  })

  it('订单占用流水逐条累加，最后等于各 SKU 未结案出库单的预占合计', () => {
    const last = new Map<string, InventoryLog>()
    chronological(seed.inventoryLogs.filter((l) => l.level === 'SKU')).forEach((l) => {
      const key = stockKey(l.warehouseCode, l.customerId, l.skuCode)
      expect(l.beforeQty, `${key} ${l.id}`).toBe(last.get(key)?.afterQty ?? 0)
      expect(l.afterQty! - l.beforeQty!).toBe(l.reservedChange)
      expect(l.qtyChange).toBe(0)
      last.set(key, l)
    })
    orderReservedTotals(seed.outboundOrders).forEach((qty, key) => expect(last.get(key)?.afterQty, key).toBe(qty))
  })

  it('上架、拣货、返库上架、品质转换、移库都是一减一加两条，互相指向', () => {
    const byId = new Map(seed.inventoryLogs.map((l) => [l.id, l]))
    const paired = seed.inventoryLogs.filter((l) => ['PUTAWAY', 'PICK', 'RETURN', 'QUALITY', 'MOVE'].includes(l.type))
    paired.forEach((l) => {
      const other = byId.get(l.pairedLogId ?? '')
      expect(other, `${l.type} ${l.id}`).toBeDefined()
      expect(other!.pairedLogId).toBe(l.id)
      expect(other!.actionId).toBe(l.actionId)
      expect(other!.qtyChange).toBe(-l.qtyChange)
      expect([other!.type, other!.skuCode]).toEqual([l.type, l.skuCode])
    })
  })

  it('封闭类型全部有样例，流水 id 与流水号不重复', () => {
    const types = new Set(seed.inventoryLogs.map((l) => l.type))
    ;(
      ['RECEIVE', 'PUTAWAY', 'PICK', 'RETURN', 'QUALITY', 'MOVE', 'ADJUST', 'SHIP', 'RESERVE', 'RELEASE'] as const
    ).forEach((t) => expect(types.has(t), t).toBe(true))
    expect(new Set(seed.inventoryLogs.map((l) => l.id)).size).toBe(seed.inventoryLogs.length)
    expect(new Set(ledgerNumbers(seed.inventoryLogs).values()).size).toBe(seed.inventoryLogs.length)
  })
})
