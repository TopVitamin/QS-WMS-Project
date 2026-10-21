import type { InventoryRecord, Location, SkuMaster } from '@/types/wms'
import type { OutboundData, OutboundItem, OutboundOrder, OutboundType } from '@/types/outbound'
import { applyOutboundAction, emptyOutboundData, orderAssignments } from './outbound-actions'
import type { SeedData } from './seed'

const LA = 'US-LA-01'
const SEED_DAY = '2026-10-15T08:00:00.000Z'
const LA_B2C_CHANNELS = ['CH-DHL-EXP', 'CH-UPS-GND', 'CH-FEDEX-HD', 'CH-DHL-ECO'] as const

/** 单测 fixture：把某仓 outbound-seed 写入的库存行恢复为建单前数量（不含已跑 seed 流水消耗） */
export function resetOutboundSeedInventory(inventory: InventoryRecord[], warehouseCode: string, wi: number) {
  const owner = 'C10028'
  const prefix = `INV-OUT-SEED-${wi}-`
  const set = (id: string, patch: Partial<InventoryRecord>) => {
    const row = inventory.find((r) => r.id === id)
    if (row) Object.assign(row, { allocatedQty: 0, lockedQty: 0, ...patch })
  }
  set(`${prefix}0`, { onHandQty: 30, qualityType: 'GOOD', customerId: owner, skuCode: 'CABLE-01' })
  set(`${prefix}1`, { onHandQty: 8, qualityType: 'GOOD', customerId: owner, skuCode: 'CABLE-01' })
  set(`${prefix}2`, { onHandQty: 5, qualityType: 'DEFECTIVE', lockedQty: 5, customerId: owner, skuCode: 'CABLE-01' })
  set(`${prefix}3`, {
    onHandQty: 5,
    qualityType: 'GOOD',
    customerId: owner,
    skuCode: 'SN-DEMO-01',
    serialNos: Array.from({ length: 5 }, (_, i) => `SN${String(wi * 100 + i + 1).padStart(8, '0')}`),
  })
  set(`${prefix}4`, {
    onHandQty: 8,
    qualityType: 'GOOD',
    customerId: owner,
    skuCode: 'LOT-DEMO-01',
    batchNo: 'LOT-202610',
    expiryDate: '2027-10-01',
  })
  set(`${prefix}5`, {
    onHandQty: 2,
    qualityType: 'DEFECTIVE',
    lockedQty: 2,
    customerId: owner,
    skuCode: 'LOT-DEMO-01',
    batchNo: 'LOT-EXPIRED',
    expiryDate: '2026-01-01',
  })
  set(`${prefix}6`, { onHandQty: 6, qualityType: 'GOOD', customerId: 'C10031', skuCode: 'CABLE-01' })
  inventory
    .filter((r) => r.warehouseCode === warehouseCode && r.id.startsWith(prefix) && !r.id.match(new RegExp(`${prefix}[0-6]$`)))
    .forEach((r) => {
      r.onHandQty = 0
      r.allocatedQty = 0
    })
}

type OrderLineInput = { skuCode: string; demandQty: number; reservedQty?: number }

/** 课程演示库存，与入库产生的库存放在同一账内。数量及收件资料均为样例。 */
export function createOutboundSeed(
  inventory: InventoryRecord[],
  locations: Location[],
  skuMasters: SkuMaster[],
  warehouseCodes: string[],
): OutboundData {
  const d = emptyOutboundData()
  const owner = 'C10028'
  const cable = skuMasters.find((m) => m.customerId === owner && m.code === 'CABLE-01')!
  if (!skuMasters.some((m) => m.code === 'LOT-DEMO-01' && m.customerId === owner))
    skuMasters.push({
      ...cable,
      code: 'LOT-DEMO-01',
      name: '批次效期演示商品',
      nameEn: 'Lot and expiry demo item',
      primaryBarcode: '690000000004',
      upstreamSkuId: 'OMS-LOT-DEMO-01',
      batchEnabled: true,
      expiryEnabled: true,
      shelfLifeDays: 365,
      // 剩余不足 90 天为临期，过了有效期为过期（库存查询按仓库当地日期计算效期等级）
      nearExpiryDays: 90,
      expiredDays: 0,
    })
  const seedCity: Record<string, string> = {
    'US-LA-01': 'Los Angeles, CA',
    'US-NJ-01': 'Newark, NJ',
    'DE-FRA-01': 'Frankfurt, DE',
    'HK-WH-01': 'Hong Kong',
  }
  const consignee = (type: OutboundType, city: string) => {
    switch (type) {
      case 'FBA':
        return { recipient: 'Amazon FBA platform warehouse', address: `FBA inbound dock, ${city}` }
      case 'WHOLESALE':
        return { recipient: 'Local wholesale customer', address: `Buyer warehouse, ${city}` }
      case 'TRANSFER':
        return { recipient: 'Strong current warehouse (transfer-in)', address: `Transfer-in warehouse, ${city}` }
      case 'PURCHASE_RETURN':
        return { recipient: 'Demo supplier return dock', address: `Supplier dock, ${city}` }
      default:
        return { recipient: 'Online shopper (demo order)', address: `Consumer address, ${city}` }
    }
  }
  const channelFor = (type: OutboundType, index: number) => {
    if (type === 'B2C') return LA_B2C_CHANNELS[index % LA_B2C_CHANNELS.length]
    if (type === 'FBA') return 'CH-UPS-EX'
    if (type === 'WHOLESALE') return 'CH-UPS-GND'
    return undefined
  }
  warehouseCodes.forEach((warehouseCode, wi) => {
    if (!locations.some((l) => l.warehouseCode === warehouseCode && l.code === 'STAGE-OUT-01'))
      locations.push({ warehouseCode, code: 'STAGE-OUT-01', zone: 'STAGE-OUT', type: 'STAGING' })
    ;['A-01-01', 'A-01-02', 'B-01-01', 'B-01-02', 'DEFECT-01'].forEach((code) => {
      if (!locations.some((l) => l.warehouseCode === warehouseCode && l.code === code))
        locations.push({
          warehouseCode,
          code,
          zone: code[0],
          type: code === 'DEFECT-01' ? 'DEFECT' : code[0] === 'A' ? 'PICK' : 'STORAGE',
        })
    })
    let invSeq = 0
    const add = (skuCode: string, qty: number, locationCode = 'A-01-01', extra: Partial<InventoryRecord> = {}) => {
      const row: InventoryRecord = {
        id: `INV-OUT-SEED-${wi}-${invSeq++}`,
        warehouseCode,
        locationCode,
        customerId: owner,
        skuCode,
        qualityType: 'GOOD',
        onHandQty: qty,
        lockedQty: 0,
        allocatedQty: 0,
        firstInboundAt: SEED_DAY,
        ...extra,
      }
      // 入库种子已有同一余额键（仓库＋货主＋SKU＋库位＋批次＋品质）时并成一行，库存明细不出现重复行
      const dup = inventory.findIndex(
        (r) =>
          r.warehouseCode === row.warehouseCode &&
          r.customerId === row.customerId &&
          r.skuCode === row.skuCode &&
          r.locationCode === row.locationCode &&
          (r.batchNo ?? '') === (row.batchNo ?? '') &&
          r.qualityType === row.qualityType,
      )
      if (dup >= 0) {
        const old = inventory[dup]
        row.onHandQty += old.onHandQty
        row.lockedQty += old.lockedQty
        if (old.serialNos?.length) row.serialNos = [...old.serialNos, ...(row.serialNos ?? [])]
        if (old.firstInboundAt < row.firstInboundAt) row.firstInboundAt = old.firstInboundAt
        // 原位替换：保持数组顺序，上架推荐（按顺序找同货主同商品库存）与原来一致
        inventory[dup] = row
        return row
      }
      inventory.push(row)
      return row
    }
    add('CABLE-01', 30)
    add('CABLE-01', 8, 'A-01-02')
    add('CABLE-01', 5, 'DEFECT-01', { qualityType: 'DEFECTIVE', lockedQty: 5 })
    // 8 件：除 0006、0011 待处理外，洛杉矶仓 0019（待拣）与 0020（拣后取消）各用 1 件。
    // 序号从 11 起，避开入库种子已上架的 SN00000001、SN00000002
    add('SN-DEMO-01', 8, 'A-01-02', {
      serialNos: Array.from({ length: 8 }, (_, i) => `SN${String(wi * 100 + i + 11).padStart(8, '0')}`),
    })
    add('LOT-DEMO-01', 8, 'A-01-02', { batchNo: 'LOT-202610', expiryDate: '2027-10-01' })
    add('LOT-DEMO-01', 2, 'B-01-01', {
      batchNo: 'LOT-EXPIRED',
      expiryDate: '2026-01-01',
      qualityType: 'DEFECTIVE',
      lockedQty: 2,
    })
    add('CABLE-01', 6, 'B-01-02', { customerId: 'C10031' })
    // 洛杉矶仓有两张 FBA 单（0003、0016）各预占 8 件 LOT-DEMO-01，补一库位同批次 8 件，避免预占超过正常品实际
    if (warehouseCode === LA) add('LOT-DEMO-01', 8, 'C-01-01', { batchNo: 'LOT-202610', expiryDate: '2027-10-01' })

    let laOrderIndex = 0
    const order = (
      type: OutboundType,
      lines: OrderLineInput[] | string,
      demandQty?: number,
      reservedQty?: number,
      opts?: { channelCode?: string; createdOffsetMin?: number },
    ) => {
      const itemRows: OrderLineInput[] =
        typeof lines === 'string'
          ? [{ skuCode: lines, demandQty: demandQty!, reservedQty: reservedQty ?? demandQty! }]
          : lines
      const no = `OB-20261015-${String(
        warehouseCode === LA ? ++laOrderIndex : wi * 100 + d.outboundOrders.filter((o) => o.warehouseCode === warehouseCode).length + 1,
      ).padStart(4, '0')}`
      const { recipient, address } = consignee(type, seedCity[warehouseCode] ?? warehouseCode)
      const createdAt = new Date(
        new Date(SEED_DAY).getTime() + (opts?.createdOffsetMin ?? d.outboundOrders.filter((o) => o.warehouseCode === warehouseCode).length) * 30 * 60_000,
      ).toISOString()
      const items: OutboundItem[] = itemRows.map((l, i) => ({
        lineNo: i + 1,
        skuCode: l.skuCode,
        demandQty: l.demandQty,
        reservedQty: l.reservedQty ?? l.demandQty,
        pickedQty: 0,
        verifiedQty: 0,
        shippedQty: 0,
      }))
      const o: OutboundOrder = {
        no,
        type,
        status: 'PENDING_HANDLE',
        warehouseCode,
        customerId: owner,
        source: 'OMS',
        upstreamNo: `OMS-OUT-${no}`,
        messageId: `MSG-SEED-${no}`,
        version: 1,
        channelCode: opts?.channelCode ?? channelFor(type, d.outboundOrders.length),
        recipient,
        address,
        phone: warehouseCode === LA ? `+1-323-555-${String(1000 + laOrderIndex).slice(-4)}` : undefined,
        originalInboundNo: type === 'PURCHASE_RETURN' ? 'IB-20261002-0001' : undefined,
        items,
        specified: [],
        createdAt,
        updatedAt: createdAt,
      }
      d.outboundOrders.push(o)
    }

    order('B2C', 'CABLE-01', 3)
    order('B2C', 'CABLE-01', 2)
    order('FBA', 'LOT-DEMO-01', 12, 8)
    order('TRANSFER', 'CABLE-01', 2)
    order('PURCHASE_RETURN', 'CABLE-01', 1)
    order('WHOLESALE', 'SN-DEMO-01', 3)
    order('B2C', 'CABLE-01', 1)
    order('B2C', 'CABLE-01', 2)
    order('B2C', 'CABLE-01', 1)
    order('B2C', 'CABLE-01', 1)

    if (warehouseCode === LA) {
      order('B2C', [{ skuCode: 'CABLE-01', demandQty: 2 }, { skuCode: 'SN-DEMO-01', demandQty: 1 }])
      order('B2C', 'CABLE-01', 1)
      order('B2C', 'CABLE-01', 4)
      order('B2C', 'CABLE-01', 3)
      order('B2C', 'CABLE-01', 2)
      order('FBA', 'LOT-DEMO-01', 10, 8)
      order('B2C', 'CABLE-01', 1)
      order('B2C', 'CABLE-01', 5)
      // 0019、0020：两个库位（A-01-01 线材、A-01-02 SN 商品），演示 PDA 按库位自动跳站与管理端录入
      order('B2C', [{ skuCode: 'CABLE-01', demandQty: 3 }, { skuCode: 'SN-DEMO-01', demandQty: 1 }])
      order('B2C', [{ skuCode: 'CABLE-01', demandQty: 1 }, { skuCode: 'SN-DEMO-01', demandQty: 1 }])
    }
  })
  return d
}

/**
 * 用与页面相同的出库动作把每仓 0007～0010 推进到已出库、已取消、已组波；
 * 洛杉矶仓额外推进 0013～0018，覆盖待拣货、待复核、待出库等状态（出库单弹窗与 Mock 分册 §7.2）。
 */
export function playOutboundSeedFlows(seed: SeedData): SeedData {
  let s = seed
  const at = '2026-10-15T09:00:00.000Z'
  const run = (c: Parameters<typeof applyOutboundAction>[1]) => {
    const r = applyOutboundAction(s, c, 'seed', at)
    if (!r.ok) throw new Error(`outbound seed ${c.type}: ${r.errorKey}`)
    s = { ...s, ...r.patch }
    return r.no!
  }
  const pickAll = (taskNo: string) => {
    const task = s.outboundPickTasks.find((t) => t.no === taskNo)!
    task.lines.forEach((l, i) =>
      run({
        type: 'PICK',
        no: taskNo,
        lineId: l.id,
        location: l.locationCode,
        sku: l.skuCode,
        batch: l.batchNo,
        // SN 商品按来源库存的序列号顺序取，与 PDA 逐件扫描一致
        serialNos: s.skuMasters.find((m) => m.customerId === task.customerId && m.code === l.skuCode)?.snEnabled
          ? (s.inventory.find((r) => r.id === l.inventoryId)?.serialNos ?? []).slice(0, l.plannedQty)
          : [],
        qty: l.plannedQty,
        confirmationId: `SEED-${taskNo}-${i}`,
      }),
    )
  }
  const finishPick = (taskNo: string) => {
    pickAll(taskNo)
    run({ type: 'FINISH_PICK', no: taskNo })
  }
  const verifyOrder = (orderNo: string, capQty?: number) => {
    let left = capQty
    const lines = orderAssignments(s, orderNo)
      .filter((a) => a.activeQty > 0)
      .flatMap((a) => {
        const qty = left === undefined ? a.activeQty : Math.min(a.activeQty, left)
        if (left !== undefined) left -= qty
        if (qty <= 0) return []
        return [{ assignmentId: a.id, qty, serialNos: a.activeSerialNos.slice(0, qty) }]
      })
    if (lines.length === 0) return
    run({
      type: 'VERIFY',
      no: orderNo,
      method: 'PACK',
      containerType: 'PACKAGE',
      containerNo: `PKG-${orderNo}`,
      weightKg: 0.4,
      lines,
    })
  }
  const byWarehouse = new Map<string, string[]>()
  s.outboundOrders.forEach((o) => byWarehouse.set(o.warehouseCode, [...(byWarehouse.get(o.warehouseCode) ?? []), o.no]))
  for (const [warehouseCode, nos] of byWarehouse) {
    const [shipped, cancelled, waveA, waveB] = nos.slice(6, 10)
    const t1 = run({ type: 'ALLOCATE', no: shipped })
    finishPick(t1)
    const a1 = s.outboundPickTasks.find((t) => t.no === t1)!.assignments[0]
    run({
      type: 'VERIFY',
      no: shipped,
      method: 'PACK',
      containerType: 'PACKAGE',
      containerNo: `PKG-${shipped}`,
      weightKg: 0.4,
      lines: [{ assignmentId: a1.id, qty: a1.activeQty, serialNos: [] }],
    })
    run({
      type: 'SHIP',
      no: shipped,
      handover: { method: 'CARRIER', party: 'Demo carrier pickup', credential: `MOCK-${shipped}`, containerQty: 1, at },
    })
    const t2 = run({ type: 'ALLOCATE', no: cancelled })
    pickAll(t2)
    const o2 = s.outboundOrders.find((o) => o.no === cancelled)!
    run({
      type: 'CANCEL',
      no: cancelled,
      messageId: `MSG-SEED-CANCEL-${cancelled}`,
      version: o2.version,
      reason: 'Customer cancelled after picking (demo)',
    })
    run({ type: 'WAVE', orderNos: [waveA, waveB] })

    if (warehouseCode !== LA) continue
    const la = (suffix: string) => `OB-20261015-${suffix}`
    run({ type: 'ALLOCATE', no: la('0013') })
    const t14 = run({ type: 'ALLOCATE', no: la('0014') })
    finishPick(t14)
    const t15 = run({ type: 'ALLOCATE', no: la('0015') })
    finishPick(t15)
    verifyOrder(la('0015'))
    const t16 = run({ type: 'ALLOCATE', no: la('0016') })
    finishPick(t16)
    verifyOrder(la('0016'), 3)
    const t18 = run({ type: 'ALLOCATE', no: la('0018') })
    const task18 = s.outboundPickTasks.find((t) => t.no === t18)!
    const line18 = task18.lines[0]
    run({
      type: 'PICK',
      no: t18,
      lineId: line18.id,
      location: line18.locationCode,
      sku: line18.skuCode,
      batch: line18.batchNo,
      serialNos: [],
      qty: Math.min(2, line18.plannedQty),
      confirmationId: 'SEED-0018-partial',
    })
    // 0020 拣完后取消：返库上架单两行分别回 A-01-01、A-01-02；0019 只生成任务，两个库位待拣
    const t20 = run({ type: 'ALLOCATE', no: la('0020') })
    pickAll(t20)
    const o20 = s.outboundOrders.find((o) => o.no === la('0020'))!
    run({
      type: 'CANCEL',
      no: o20.no,
      messageId: `MSG-SEED-CANCEL-${o20.no}`,
      version: o20.version,
      reason: 'Address change after picking (demo)',
    })
    run({ type: 'ALLOCATE', no: la('0019') })
  }
  return s
}
