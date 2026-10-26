import { warehouseSerialStocks, serialStockId } from './serial-stock'
import { stagingLocationCode } from '@/lib/inbound-derive'
import type { SeedData } from '@/mock/seed'
import type { InventoryCount, StockMove, StocktakeLine, StocktakeSku } from '@/types/inventory'
import type { OutboundStatus, SkuAllocationControl } from '@/types/outbound'
import type { InventoryLog, InventoryRecord, QualityType, SkuMaster } from '@/types/wms'

/**
 * 库存派生（库存查询主PRD 第二节）：SKU 库存、库存明细的派生量和 SN 库存都由现有业务事实算出，
 * 页面只读这里的结果，不另存第二份数字。
 */

export const stockKey = (warehouseCode: string, customerId: string, skuCode: string) =>
  `${warehouseCode}::${customerId}::${skuCode}`

/** 未结案出库单的预占才计入订单占用；已出库、已取消的单不再占 */
export const isLiveOutbound = (status: OutboundStatus) => status !== 'SHIPPED' && status !== 'CANCELLED'

/** SKU 当前所在的盘点中单据（冻结按仓库＋货主＋SKU 生效） */
export function countingStocktake(
  counts: InventoryCount[],
  warehouseCode: string,
  customerId: string,
  skuCode: string,
): InventoryCount | undefined {
  return counts.find(
    (c) =>
      c.status === 'COUNTING' &&
      c.warehouseCode === warehouseCode &&
      c.skus.some((k) => k.customerId === customerId && k.skuCode === skuCode),
  )
}

export function pendingControl(
  controls: SkuAllocationControl[],
  warehouseCode: string,
  customerId: string,
  skuCode: string,
): SkuAllocationControl | undefined {
  return controls.find((c) => c.warehouseCode === warehouseCode && c.customerId === customerId && c.skuCode === skuCode)
}

/** 库位用途，由库区类型决定（库存模块宏观架构 2.2） */
export type LocationUsage = 'RECEIVING_STAGING' | 'STORAGE' | 'PICK' | 'DEFECT' | 'OUTBOUND_STAGING' | 'EXCEPTION'

export function locationUsage(
  s: Pick<SeedData, 'locations' | 'locationMasters'> & Pick<Partial<SeedData>, 'warehouseMasters'>,
  warehouseCode: string,
  code: string,
): LocationUsage | undefined {
  const master = s.locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code === code)
  const legacy = s.locations.find((l) => l.warehouseCode === warehouseCode && l.code === code)
  const type = master ? (master.zoneType === 'DEFECT_ISOLATION' ? 'DEFECT' : master.zoneType) : legacy?.type
  if (!type) return undefined
  if (type === 'STAGING') {
    const configured = s.warehouseMasters?.find((w) => w.code === warehouseCode)
    if (configured?.receivingStagingLocation && code === configured.receivingStagingLocation) return 'RECEIVING_STAGING'
    if (configured?.outboundStagingLocation && code === configured.outboundStagingLocation) return 'OUTBOUND_STAGING'
    return code === stagingLocationCode(s.locations, warehouseCode) ? 'RECEIVING_STAGING' : 'OUTBOUND_STAGING'
  }
  return type
}

/** 存储、拣货、不良隔离库位可盘点、可作移库源与目标；暂存库位跟随收发单据处理 */
export const isWorkLocation = (usage?: LocationUsage) => usage === 'PICK' || usage === 'STORAGE' || usage === 'DEFECT'

/** 库位用途与启停：库位资料优先，旧库位表兜底；编码不区分大小写，不存在返回 undefined */
export function locationInfo(
  s: Pick<SeedData, 'locations' | 'locationMasters'>,
  warehouseCode: string,
  code: string,
): { code: string; usage: LocationUsage; enabled: boolean } | undefined {
  const key = code.trim().toUpperCase()
  const usage = locationUsage(s, warehouseCode, key)
  if (!usage) return undefined
  const master = s.locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code === key)
  const legacy = s.locations.find((l) => l.warehouseCode === warehouseCode && l.code === key)
  return { code: key, usage, enabled: master ? master.status === 'ENABLED' : legacy?.status !== 'DISABLED' }
}

/** 一库位一货主：库位上已有其他货主实物，或其他货主未提交的落位（移库目标、盘点新增行共用） */
export function occupiedByOtherOwner(
  s: Pick<SeedData, 'inventory' | 'putawayOrders'>,
  warehouseCode: string,
  locationCode: string,
  customerId: string,
): boolean {
  return (
    s.inventory.some(
      (r) =>
        r.warehouseCode === warehouseCode &&
        r.locationCode === locationCode &&
        r.onHandQty > 0 &&
        r.customerId !== customerId,
    ) ||
    s.putawayOrders.some(
      (p) =>
        p.warehouseCode === warehouseCode &&
        p.customerId !== customerId &&
        p.status !== 'COMPLETED' &&
        p.actualLines.some((a) => !a.submitted && a.locationCode === locationCode),
    )
  )
}

export type MoveTargetIssue = 'TARGET' | 'SAME' | 'QUALITY' | 'OCCUPIED'

/**
 * 移库目标库位校验（移库作业主PRD 第二节）：启用的存储、拣货或不良隔离库位，不是源位，品质与库位用途相符，
 * 没有其他货主占用。PDA 扫目标位时先查，提交时动作逐行按同一规则再查。
 */
export function moveTargetIssue(
  s: Pick<SeedData, 'locations' | 'locationMasters' | 'inventory' | 'putawayOrders'>,
  r: Pick<InventoryRecord, 'warehouseCode' | 'customerId' | 'locationCode' | 'qualityType'>,
  targetCode: string,
): MoveTargetIssue | undefined {
  const target = locationInfo(s, r.warehouseCode, targetCode)
  if (!target?.enabled || !isWorkLocation(target.usage)) return 'TARGET'
  if (target.code === r.locationCode) return 'SAME'
  if ((target.usage === 'DEFECT') !== (r.qualityType === 'DEFECTIVE')) return 'QUALITY'
  if (occupiedByOtherOwner(s, r.warehouseCode, target.code, r.customerId)) return 'OCCUPIED'
  return undefined
}

/** 仓库当地日期 YYYY-MM-DD；效期判断按业务所属仓库，切换展示时区不改变结果 */
export function warehouseLocalDate(timezone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export type ExpiryLevel = 'NORMAL' | 'NEAR' | 'EXPIRED'

/**
 * 效期等级（基础资料商品效期天数）：剩余天数低于过期天数为过期，未过期且低于临期天数为临期，过期优先。
 * 未启用效期或没有有效期时返回 undefined。
 */
export function expiryLevel(
  expiryDate: string | undefined,
  master: Pick<SkuMaster, 'expiryEnabled' | 'nearExpiryDays' | 'expiredDays'> | undefined,
  today: string,
): ExpiryLevel | undefined {
  if (!master?.expiryEnabled || !expiryDate) return undefined
  const daysLeft = Math.round((Date.parse(expiryDate.slice(0, 10)) - Date.parse(today)) / 86_400_000)
  if (daysLeft < (master.expiredDays ?? 0)) return 'EXPIRED'
  if (daysLeft < (master.nearExpiryDays ?? 0)) return 'NEAR'
  return 'NORMAL'
}

type DeriveState = Pick<
  SeedData,
  | 'inventory'
  | 'inventoryLogs'
  | 'inventoryCounts'
  | 'outboundOrders'
  | 'skuAllocationControls'
  | 'skuMasters'
  | 'locations'
  | 'locationMasters'
  | 'warehouses'
>

const findMaster = (s: Pick<SeedData, 'skuMasters'>, customerId: string, skuCode: string) =>
  s.skuMasters.find((m) => m.customerId === customerId && m.code === skuCode)

/** 各 SKU 库存的订单占用：未结案出库单明细预占数量合计 */
export function orderReservedTotals(orders: SeedData['outboundOrders'], warehouseCode?: string) {
  const totals = new Map<string, number>()
  orders
    .filter((o) => isLiveOutbound(o.status) && (!warehouseCode || o.warehouseCode === warehouseCode))
    .forEach((o) =>
      o.items.forEach((i) => {
        if (!i.reservedQty) return
        const key = stockKey(o.warehouseCode, o.customerId, i.skuCode)
        totals.set(key, (totals.get(key) ?? 0) + i.reservedQty)
      }),
    )
  return totals
}

/** 流水按发生时间排序；同一时刻按写入顺序 */
function latestLogs(logs: InventoryLog[], keyOf: (l: InventoryLog) => string | undefined) {
  const latest = new Map<string, InventoryLog>()
  logs.forEach((l) => {
    const key = keyOf(l)
    if (!key) return
    const prev = latest.get(key)
    if (!prev || l.createdAt >= prev.createdAt) latest.set(key, l)
  })
  return latest
}

export interface SkuStockRow {
  id: string
  warehouseCode: string
  customerId: string
  skuCode: string
  qualityType: QualityType
  good: number
  defective: number
  orderReserved: number
  /** 当前品质行的实际数量 */
  actual: number
  /** 良品行订单预占；不良品为0 */
  preoccupied: number
  /** 良品行实际－订单预占；不良品为0，禁止负数 */
  available: number
  pending?: SkuAllocationControl
  counting?: InventoryCount
  lastLog?: InventoryLog
  lastChangedAt?: string
}

export function deriveSkuStocks(s: DeriveState, warehouseCode: string): SkuStockRow[] {
  const rows = new Map<string, SkuStockRow>()
  const ensure = (customerId: string, skuCode: string, qualityType: QualityType = 'GOOD') => {
    const id = `${stockKey(warehouseCode, customerId, skuCode)}::${qualityType}`
    let row = rows.get(id)
    if (!row) {
      row = {
        id,
        warehouseCode,
        customerId,
        skuCode,
        qualityType,
        good: 0,
        defective: 0,
        orderReserved: 0,
        actual: 0,
        preoccupied: 0,
        available: 0,
      }
      rows.set(id, row)
    }
    return row
  }
  const firstInbound = new Map<string, string>()
  s.inventory
    .filter((r) => r.warehouseCode === warehouseCode && r.onHandQty > 0)
    .forEach((r) => {
      const row = ensure(r.customerId, r.skuCode, r.qualityType)
      if (r.qualityType === 'GOOD') row.good += r.onHandQty
      else row.defective += r.onHandQty
      const prev = firstInbound.get(row.id)
      if (!prev || r.firstInboundAt > prev) firstInbound.set(row.id, r.firstInboundAt)
    })
  orderReservedTotals(s.outboundOrders, warehouseCode).forEach((qty, key) => {
    const [, customerId, skuCode] = key.split('::')
    ensure(customerId, skuCode).orderReserved = qty
  })
  s.skuAllocationControls
    .filter((c) => c.warehouseCode === warehouseCode)
    .forEach((c) => (ensure(c.customerId, c.skuCode).pending = c))
  s.inventoryCounts
    .filter((c) => c.status === 'COUNTING' && c.warehouseCode === warehouseCode)
    .forEach((c) => c.skus.forEach((k) => (ensure(k.customerId, k.skuCode).counting = c)))
  const latest = latestLogs(s.inventoryLogs, (l) =>
    l.warehouseCode === warehouseCode
      ? `${stockKey(l.warehouseCode, l.customerId, l.skuCode)}::${l.qualityType ?? 'GOOD'}`
      : undefined,
  )
  return [...rows.values()].map((row) => {
    const lastLog = latest.get(row.id)
    return {
      ...row,
      pending: pendingControl(s.skuAllocationControls, warehouseCode, row.customerId, row.skuCode),
      counting: countingStocktake(s.inventoryCounts, warehouseCode, row.customerId, row.skuCode),
      actual: row.good + row.defective,
      preoccupied: row.orderReserved,
      available: row.qualityType === 'GOOD' ? row.good - row.orderReserved : 0,
      lastLog,
      lastChangedAt: lastLog?.createdAt ?? firstInbound.get(row.id),
    }
  })
}

/** 过期正常品暂未自动转不良的原因：盘点中、仍有已分配、待系统重试 */
export type ExpiryPendingReason = 'COUNTING' | 'ALLOCATED' | 'RESERVED' | 'RETRY'

export interface BalanceRow {
  id: string
  record: InventoryRecord
  usage?: LocationUsage
  expiry?: ExpiryLevel
  allocated: number
  unallocated: number
  /** 普通出库可分配：满足品质、效期、库位及作业条件才取未分配量，否则为0。 */
  allocatable: number
  /** 普通出库能否从这一行分配：正常品、存储或拣货库位、未过期、非盘点中、非待核对且可分配大于 0 */
  normalAllocatable: boolean
  /** 暂存库位上的正常品：计入可用，但不参与分配 */
  stagingGood: boolean
  counting?: InventoryCount
  pending: boolean
  expiryPending?: ExpiryPendingReason
  /** 可转换数量同时受本行未分配量和SKU良品可用量约束。 */
  convertible: number
  lastLog?: InventoryLog
  lastChangedAt: string
  /** 创建时间：首笔形成本行余额的流水时间；没有流水的期初演示库存取首次入库时间 */
  createdAt: string
}

export function deriveBalances(s: DeriveState, warehouseCode: string, now: Date): BalanceRow[] {
  const timezone = s.warehouses.find((w) => w.code === warehouseCode)?.timezone ?? 'UTC'
  const today = warehouseLocalDate(timezone, now)
  const reserved = orderReservedTotals(s.outboundOrders, warehouseCode)
  const goods = new Map<string, number>()
  s.inventory
    .filter((r) => r.warehouseCode === warehouseCode && r.qualityType === 'GOOD')
    .forEach((r) => {
      const key = stockKey(warehouseCode, r.customerId, r.skuCode)
      goods.set(key, (goods.get(key) ?? 0) + r.onHandQty)
    })
  const latest = latestLogs(s.inventoryLogs, (l) => l.inventoryId)
  const earliest = new Map<string, string>()
  s.inventoryLogs.forEach((l) => {
    if (!l.inventoryId) return
    const prev = earliest.get(l.inventoryId)
    if (!prev || l.createdAt < prev) earliest.set(l.inventoryId, l.createdAt)
  })
  return s.inventory
    .filter((r) => r.warehouseCode === warehouseCode && r.onHandQty > 0)
    .map((r) => {
      const usage = locationUsage(s, warehouseCode, r.locationCode)
      const expiry = expiryLevel(r.expiryDate, findMaster(s, r.customerId, r.skuCode), today)
      const allocated = r.allocatedQty ?? 0
      const allocatable = r.onHandQty - allocated
      const counting = countingStocktake(s.inventoryCounts, warehouseCode, r.customerId, r.skuCode)
      const pending = Boolean(pendingControl(s.skuAllocationControls, warehouseCode, r.customerId, r.skuCode))
      const good = r.qualityType === 'GOOD'
      const workGood = good && (usage === 'PICK' || usage === 'STORAGE')
      const lastLog = latest.get(r.id)
      const key = stockKey(warehouseCode, r.customerId, r.skuCode)
      const available = (goods.get(key) ?? 0) - (reserved.get(key) ?? 0)
      const eligible = workGood && expiry !== 'EXPIRED' && !counting && !pending
      return {
        id: r.id,
        record: r,
        usage,
        expiry,
        allocated,
        unallocated: allocatable,
        allocatable: eligible ? allocatable : 0,
        normalAllocatable: workGood && expiry !== 'EXPIRED' && !counting && !pending && allocatable > 0,
        stagingGood: good && (usage === 'RECEIVING_STAGING' || usage === 'OUTBOUND_STAGING'),
        counting,
        pending,
        expiryPending:
          workGood && expiry === 'EXPIRED'
            ? counting
              ? 'COUNTING'
              : allocated > 0
                ? 'ALLOCATED'
                : available <= 0
                  ? 'RESERVED'
                  : 'RETRY'
            : undefined,
        convertible: workGood && !counting ? Math.max(0, Math.min(allocatable, available)) : 0,
        lastLog,
        lastChangedAt: lastLog?.createdAt ?? r.firstInboundAt,
        createdAt: earliest.get(r.id) ?? r.firstInboundAt,
      }
    })
}

export type SerialStatus = 'IN_STOCK' | 'SHIPPED' | 'LOST'

export interface SerialRow {
  id: string
  customerId: string
  skuCode: string
  serialNo: string
  status: SerialStatus
  /** 在库时为当前位置；退出库存后保留最后位置用于追溯 */
  warehouseCode: string
  locationCode: string
  batchNo?: string
  expiryDate?: string
  qualityType?: QualityType
  inventoryId?: string
  lastLog?: InventoryLog
  lastChangedAt?: string
}

/** SN台账由仓库级身份维护，不推断当前库位。 */
export function deriveSerials(
  s: Pick<SeedData, 'inventory' | 'inventoryLogs' | 'skuMasters' | 'serialStocks'>,
  warehouseCode: string,
): SerialRow[] {
  return warehouseSerialStocks(s)
    .filter((r) => r.warehouseCode === warehouseCode)
    .map((r) => ({
      ...r,
      id: serialStockId(r),
      locationCode: '',
      lastLog: r.lastLogId ? s.inventoryLogs.find((l) => l.id === r.lastLogId) : undefined,
    }))
}

export interface SerialTrackNode {
  id: string
  at: string
  type: InventoryLog['type']
  locationCode: string
  qualityType?: QualityType
  log: InventoryLog
}

/** 只展示实际带SN的记录，每条流水独立展示。 */
export function serialTrack(logs: InventoryLog[], customerId: string, skuCode: string, serialNo: string) {
  return logs
    .map((l, index) => ({ l, index }))
    .filter(({ l }) => l.customerId === customerId && l.skuCode === skuCode && l.serialNos?.includes(serialNo))
    .sort((a, b) => a.l.createdAt.localeCompare(b.l.createdAt) || a.index - b.index)
    .map(({ l }): SerialTrackNode => ({
      id: l.id,
      at: l.createdAt,
      type: l.type,
      locationCode: l.locationCode,
      qualityType: l.qualityType,
      log: l,
    }))
}

/** 盘点明细差异：未盘返回 undefined，不按 0 计算 */
export const lineDiff = (l: StocktakeLine) => (l.countedQty === undefined ? undefined : l.countedQty - l.bookQty)

export function stocktakeSummary(c: InventoryCount) {
  return {
    skuCount: c.skus.length,
    lineCount: c.lines.length,
    countedCount: c.lines.filter((l) => l.countedQty !== undefined).length,
    diffCount: c.lines.filter((l) => (lineDiff(l) ?? 0) !== 0).length,
  }
}

/** 盘点快照范围：这些 SKU 在本仓存储、拣货、不良隔离库位上的库存明细 */
export function snapshotRows(
  s: Pick<SeedData, 'inventory' | 'locations' | 'locationMasters'>,
  warehouseCode: string,
  skus: StocktakeSku[],
  containerId?: string,
): InventoryRecord[] {
  return s.inventory.filter(
    (r) =>
      r.warehouseCode === warehouseCode &&
      r.onHandQty > 0 &&
      (!containerId || r.containerId === containerId) &&
      skus.some((k) => k.customerId === r.customerId && k.skuCode === r.skuCode) &&
      isWorkLocation(locationUsage(s, warehouseCode, r.locationCode)),
  )
}

export type StocktakeBlockerKind = 'COUNTING' | 'PICK_TASK' | 'PUTBACK' | 'PUTAWAY' | 'ALLOCATED'

export interface StocktakeBlocker {
  customerId: string
  skuCode: string
  kind: StocktakeBlockerKind
  ref: string
}

/**
 * 不能建盘点单的原因（盘点单主PRD 第一节）：已在盘点中；有进行中的拣货任务、返库上架单、上架单；
 * 快照范围内还有已分配（其他出库指定或拣货分配）。有任一原因整次不建，不静默跳过 SKU。
 */
export function stocktakeBlockers(
  s: Pick<
    SeedData,
    | 'inventory'
    | 'inventoryCounts'
    | 'outboundPickTasks'
    | 'outboundPutbacks'
    | 'putawayOrders'
    | 'locations'
    | 'locationMasters'
  >,
  warehouseCode: string,
  skus: StocktakeSku[],
): StocktakeBlocker[] {
  const out: StocktakeBlocker[] = []
  skus.forEach(({ customerId, skuCode }) => {
    const push = (kind: StocktakeBlockerKind, ref: string) => out.push({ customerId, skuCode, kind, ref })
    const counting = countingStocktake(s.inventoryCounts, warehouseCode, customerId, skuCode)
    if (counting) push('COUNTING', counting.no)
    s.outboundPickTasks
      .filter(
        (t) =>
          t.warehouseCode === warehouseCode &&
          t.customerId === customerId &&
          (t.status === 'PENDING_PICK' || t.status === 'PICKING') &&
          t.lines.some((l) => l.skuCode === skuCode),
      )
      .forEach((t) => push('PICK_TASK', t.no))
    s.outboundPutbacks
      .filter(
        (p) =>
          p.warehouseCode === warehouseCode &&
          p.customerId === customerId &&
          p.status !== 'COMPLETED' &&
          p.lines.some((l) => l.skuCode === skuCode),
      )
      .forEach((p) => push('PUTBACK', p.no))
    s.putawayOrders
      .filter(
        (p) =>
          p.warehouseCode === warehouseCode &&
          p.customerId === customerId &&
          p.status !== 'COMPLETED' &&
          p.planLines.some((l) => l.skuCode === skuCode),
      )
      .forEach((p) => push('PUTAWAY', p.putawayNo))
    snapshotRows(s, warehouseCode, [{ customerId, skuCode }])
      .filter((r) => (r.allocatedQty ?? 0) > 0)
      .forEach((r) => push('ALLOCATED', r.locationCode))
  })
  return out
}

/** 移库作业汇总：明细行数、移库总数，以及源、目标库位摘要用的去重库位 */
export function moveSummary(m: StockMove) {
  return {
    lineCount: m.lines.length,
    totalQty: m.lines.reduce((n, l) => n + l.qty, 0),
    sources: [...new Set(m.lines.map((l) => l.sourceLocation))],
    targets: [...new Set(m.lines.map((l) => l.targetLocation))],
  }
}
