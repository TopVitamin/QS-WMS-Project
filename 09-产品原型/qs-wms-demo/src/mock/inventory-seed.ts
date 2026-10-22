import { isLiveOutbound, stockKey } from '@/lib/inventory-derive'
import type { InventoryCommand, StocktakeSku } from '@/types/inventory'
import type { OutboundCommand } from '@/types/outbound'
import type { InventoryLog, InventoryLogSource, InventoryRecord, QualityType } from '@/types/wms'
import { applyInventoryAction, inventoryAuditRef, type InventoryTerminal } from './inventory-actions'
import { applyOutboundAction } from './outbound-actions'
import type { SeedData } from './seed'

const LA = 'US-LA-01'
const OWNER = 'C10028'
const HOMY = 'C10031'
/** 库内演示商品：只用于待核对与盘点中演示，不挂出库单或入库单，冻结不影响其他演示 */
const HOMY_SKU = 'HOMY-003'
const SUPERVISOR = 'Lily Chen'
const WORKER = 'Mike Zhang'
/** 出库种子的单据直接带预占写入，回放为预占流水时不晚于第一条出库动作 */
const OUTBOUND_FLOW_AT = '2026-10-15T08:59:00.000Z'
const CITY: Record<string, string> = {
  'US-LA-01': 'Los Angeles, CA',
  'US-NJ-01': 'Newark, NJ',
  'DE-FRA-01': 'Frankfurt, DE',
  'HK-WH-01': 'Hong Kong',
}

type BalanceKey = Pick<
  InventoryRecord,
  'warehouseCode' | 'customerId' | 'skuCode' | 'locationCode' | 'qualityType' | 'batchNo' | 'expiryDate'
>

interface Movement {
  at: string
  type: InventoryLog['type']
  key: BalanceKey
  change: number
  refNo: string
  jobNo?: string
  sourceType: InventoryLogSource
  sourceLineNo?: number
  serialNos?: string[]
  operator: string
  /** 同一上架动作的一减一加 */
  pair?: string
}

const balanceKey = (k: BalanceKey) =>
  [k.warehouseCode, k.customerId, k.skuCode, k.locationCode, k.batchNo ?? '', k.qualityType].join('|')

/**
 * 种子里直接写入的业务事实回放成流水：入库收货记录、已完成上架单，以及出库种子单据的初始预占。
 * 按发生时间逐条累加，得到每行变化前后数量；之后的出库、库内动作在此基础上继续记账。
 */
function openingLedger(seed: SeedData): InventoryLog[] {
  const moves: Movement[] = []
  /** 批次、效期只对启用批次或效期管理的商品是库存维度；其他商品收货登记的批次不分库存明细 */
  const lot = (customerId: string, skuCode: string, batchNo?: string, expiryDate?: string) => {
    const m = seed.skuMasters.find((x) => x.customerId === customerId && x.code === skuCode)
    return {
      batchNo: m?.batchEnabled || m?.expiryEnabled ? batchNo : undefined,
      expiryDate: m?.expiryEnabled ? expiryDate : undefined,
    }
  }
  seed.receiptRecords.forEach((r) =>
    r.lines.forEach((l) =>
      (
        [
          ['GOOD', l.goodQty],
          ['DEFECTIVE', l.defectQty],
        ] as const
      ).forEach(([qualityType, qty]) => {
        if (qty > 0)
          moves.push({
            at: r.receivedAt,
            type: 'RECEIVE',
            key: {
              warehouseCode: r.warehouseCode,
              customerId: r.customerId,
              skuCode: l.skuCode,
              locationCode: r.stagingLocationCode,
              qualityType,
              ...lot(r.customerId, l.skuCode, l.batchNo, l.expiryDate),
            },
            change: qty,
            refNo: r.inboundNo,
            jobNo: r.receiptNo,
            sourceType: 'INBOUND',
            sourceLineNo: l.lineNo,
            operator: r.operator,
          })
      }),
    ),
  )
  seed.putawayOrders
    .filter((p) => p.status === 'COMPLETED')
    .forEach((p) =>
      p.actualLines
        .filter((a) => a.submitted)
        .forEach((a) => {
          const plan = p.planLines.find((l) => l.lineNo === a.planLineNo)
          const base = {
            at: p.submittedAt ?? p.createdAt,
            type: 'PUTAWAY' as const,
            refNo: p.sourceNo,
            jobNo: p.putawayNo,
            sourceType: (p.sourceType === 'INBOUND' ? 'INBOUND' : 'RETURN') as InventoryLogSource,
            sourceLineNo: plan?.receiptLineNo || undefined,
            serialNos: a.serialNos?.length ? a.serialNos : undefined,
            operator: p.submittedBy ?? 'system',
            pair: `${p.putawayNo}#${a.lineNo}`,
          }
          const key = {
            warehouseCode: p.warehouseCode,
            customerId: p.customerId,
            skuCode: a.skuCode,
            qualityType: p.qualityType,
            ...lot(p.customerId, a.skuCode, plan?.batchNo, plan?.expiryDate),
          }
          moves.push({ ...base, key: { ...key, locationCode: p.stagingLocationCode }, change: -a.qty })
          moves.push({ ...base, key: { ...key, locationCode: a.locationCode }, change: a.qty })
        }),
    )
  // 期初：出库种子直接写入的演示库存没有来源单据，算作回放前已有的数量；
  // 期初＋回放变化＋已记出库流水＝当前实际，同一库存明细的前后数量首尾相接
  const running = new Map<string, number>()
  const shift = (k: string, qty: number) => running.set(k, (running.get(k) ?? 0) + qty)
  seed.inventory.forEach((r) => shift(balanceKey(r), r.onHandQty))
  moves.forEach((m) => shift(balanceKey(m.key), -m.change))
  seed.inventoryLogs
    .filter((l) => l.level === 'DETAIL')
    .forEach((l) => shift(balanceKey({ ...l, qualityType: l.qualityType ?? 'GOOD' }), -l.qtyChange))
  const logs: InventoryLog[] = []
  const pairs = new Map<string, InventoryLog>()
  moves
    .map((m, index) => ({ m, index }))
    .sort((a, b) => a.m.at.localeCompare(b.m.at) || a.index - b.index)
    .forEach(({ m }, i) => {
      const k = balanceKey(m.key)
      const before = running.get(k) ?? 0
      running.set(k, before + m.change)
      const log: InventoryLog = {
        id: `LOG-SEED-IB-${i}`,
        level: 'DETAIL',
        ...m.key,
        inventoryId: seed.inventory.find((r) => balanceKey(r) === k)?.id,
        type: m.type,
        refNo: m.refNo,
        jobNo: m.jobNo,
        sourceType: m.sourceType,
        sourceLineNo: m.sourceLineNo,
        serialNos: m.serialNos,
        qtyChange: m.change,
        beforeQty: before,
        afterQty: before + m.change,
        operator: m.operator,
        createdAt: m.at,
        terminal: 'PDA',
      }
      const other = m.pair ? pairs.get(m.pair) : undefined
      if (other) {
        log.actionId = m.pair
        other.actionId = m.pair
        log.pairedLogId = other.id
        other.pairedLogId = log.id
      } else if (m.pair) pairs.set(m.pair, log)
      logs.push(log)
    })
  // 出库种子单据的初始预占：现有占用加上种子动作已释放、扣减的占用，即为接单时的预占
  const reserved = new Map<string, number>()
  seed.outboundOrders.forEach((o, index) => {
    const at = o.createdAt < OUTBOUND_FLOW_AT ? o.createdAt : OUTBOUND_FLOW_AT
    new Set(o.items.map((i) => i.skuCode)).forEach((sku) => {
      const live = isLiveOutbound(o.status)
        ? o.items.filter((i) => i.skuCode === sku).reduce((n, i) => n + i.reservedQty, 0)
        : 0
      const changed = seed.inventoryLogs
        .filter((l) => l.level === 'SKU' && l.refNo === o.no && l.skuCode === sku)
        .reduce((n, l) => n + (l.reservedChange ?? 0), 0)
      const qty = live - changed
      if (qty <= 0) return
      const key = stockKey(o.warehouseCode, o.customerId, sku)
      const before = reserved.get(key) ?? 0
      reserved.set(key, before + qty)
      logs.push({
        id: `LOG-SEED-RES-${index}-${sku}`,
        level: 'SKU',
        warehouseCode: o.warehouseCode,
        customerId: o.customerId,
        skuCode: sku,
        locationCode: '',
        type: 'RESERVE',
        refNo: o.no,
        sourceType: 'OUTBOUND',
        qtyChange: 0,
        reservedChange: qty,
        beforeQty: before,
        afterQty: before + qty,
        operator: 'oms-mock',
        createdAt: at,
        terminal: 'SYSTEM',
      })
    })
  })
  return logs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * 库内演示数据（库存查询、库存流水、移库作业、盘点单 Demo PRD 的 Mock 要求），在出库种子之后推进。
 * 先把种子直接写入的收货、上架和初始预占回放成流水，再走页面同一套动作，成对流水、前后数量和 SN 位置都由动作生成。每仓：
 * - 三条移库：单行普通 SKU、转不良后移到不良隔离库位、多行含批次和 SN；
 * - 一次在库受损品质转换；
 * - 一张已完成的计划盘点：盘亏后可用为0、不良品短少、盘盈新批次（临期）；洛杉矶以外三仓另含 SN 缺失；
 * - 一张发现账实不符后取消的盘点，以及随后的盘点中计划盘点；演示商品再接一张批发单占满库存，
 *   同时显示待核对、盘点中、可用为 0，并演示盘点期间照常接单预占、不能分配。
 * 新泽西仓另提交一张返库上架单，流水覆盖返库上架。
 */
export function playInventorySeedFlows(seed: SeedData): SeedData {
  let s: SeedData = { ...seed, inventoryLogs: [...openingLedger(seed), ...seed.inventoryLogs] }
  const run = (c: InventoryCommand, at: string, terminal: InventoryTerminal, operator: string) => {
    const r = applyInventoryAction(s, c, operator, at, terminal)
    if (!r.ok) throw new Error(`inventory seed ${c.type}: ${r.errorKey} ${JSON.stringify(r.params ?? {})}`)
    // 与页面一样写操作日志，移库、盘点详情的操作日志页签有据可查
    const audit = {
      id: `AUD-SEED-INV-${s.auditLogs.length}`,
      createdAt: at,
      ...inventoryAuditRef(c, r.no),
      action: 'INVENTORY_ACTION' as const,
      operator,
    }
    s = { ...s, ...r.patch, auditLogs: [audit, ...s.auditLogs] }
    return r.no!
  }
  const runOutbound = (c: OutboundCommand, at: string, operator: string) => {
    const r = applyOutboundAction(s, c, operator, at)
    if (!r.ok) throw new Error(`inventory seed ${c.type}: ${r.errorKey}`)
    s = { ...s, ...r.patch }
    return r.no!
  }
  const balance = (
    warehouseCode: string,
    customerId: string,
    skuCode: string,
    locationCode: string,
    qualityType: QualityType = 'GOOD',
  ) =>
    s.inventory.find(
      (r) =>
        r.warehouseCode === warehouseCode &&
        r.customerId === customerId &&
        r.skuCode === skuCode &&
        r.locationCode === locationCode &&
        r.qualityType === qualityType &&
        r.onHandQty > 0,
    ) ??
    (() => {
      throw new Error(`inventory seed: no stock ${warehouseCode} ${skuCode} @${locationCode}`)
    })()

  s.warehouses.forEach((w, wi) => {
    const code = w.code
    const at = (day: number, hour: number) =>
      `2026-10-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(wi * 10).padStart(2, '0')}:00.000Z`
    const demoStock: InventoryRecord = {
      id: `INV-INV-SEED-${wi}`,
      warehouseCode: code,
      locationCode: 'B-04-01',
      customerId: HOMY,
      skuCode: HOMY_SKU,
      qualityType: 'GOOD',
      onHandQty: 12,
      lockedQty: 0,
      allocatedQty: 0,
      firstInboundAt: '2026-10-12T02:00:00.000Z',
    }
    s = { ...s, inventory: [...s.inventory, demoStock] }

    // 新泽西仓：拣后取消生成的返库上架单按建议库位提交，演示返库上架流水
    if (code === 'US-NJ-01') {
      const putback = s.outboundPutbacks.find((p) => p.warehouseCode === code && p.status === 'PENDING')
      if (putback) {
        putback.lines.forEach((l) =>
          runOutbound(
            { type: 'SAVE_PUTBACK', no: putback.no, lineId: l.id, location: l.suggestedLocation, qty: l.qty },
            at(16, 1),
            WORKER,
          ),
        )
        runOutbound({ type: 'SUBMIT_PUTBACK', no: putback.no }, at(16, 1), WORKER)
      }
    }

    // 单行移库：线材从拣货位 A-01-02 移 5 件到存储位 B-03-01
    run(
      {
        type: 'SUBMIT_MOVE',
        requestId: `SEED-MV-${code}-1`,
        warehouseCode: code,
        lines: [
          {
            inventoryId: balance(code, OWNER, 'CABLE-01', 'A-01-02').id,
            targetLocation: 'B-03-01',
            qty: 5,
            serialNos: [],
          },
        ],
      },
      at(16, 2),
      'PDA',
      WORKER,
    )
    // 在库受损：B-03-01 上 1 件转不良，随后移到不良隔离库位
    run(
      {
        type: 'CONVERT_QUALITY',
        requestId: `SEED-QC-${code}`,
        inventoryId: balance(code, OWNER, 'CABLE-01', 'B-03-01').id,
        qty: 1,
        serialNos: [],
        reasonNote: 'Outer carton crushed during replenishment',
        evidence: 'Photo taken at B-03-01; connector housing cracked',
        ownerNotice: 'NOTIFIED',
      },
      at(16, 3),
      'WEB',
      SUPERVISOR,
    )
    run(
      {
        type: 'SUBMIT_MOVE',
        requestId: `SEED-MV-${code}-2`,
        warehouseCode: code,
        lines: [
          {
            inventoryId: balance(code, OWNER, 'CABLE-01', 'B-03-01', 'DEFECTIVE').id,
            targetLocation: 'DEFECT-01',
            qty: 1,
            serialNos: [],
          },
        ],
      },
      at(16, 4),
      'PDA',
      WORKER,
    )
    // 多行移库：批次商品 2 件、SN 商品 2 件一起移到 B-03-02（同仓同货主一次提交）
    const lotSource = code === LA ? 'C-01-01' : 'A-01-02'
    const sn = balance(code, OWNER, 'SN-DEMO-01', 'A-01-02')
    run(
      {
        type: 'SUBMIT_MOVE',
        requestId: `SEED-MV-${code}-3`,
        warehouseCode: code,
        lines: [
          {
            inventoryId: balance(code, OWNER, 'LOT-DEMO-01', lotSource).id,
            targetLocation: 'B-03-02',
            qty: 2,
            serialNos: [],
          },
          { inventoryId: sn.id, targetLocation: 'B-03-02', qty: 2, serialNos: (sn.serialNos ?? []).slice(-2) },
        ],
      },
      at(17, 2),
      'PDA',
      WORKER,
    )

    // 已完成的计划盘点：洛杉矶仓 SN 商品有进行中的拣货任务和返库上架单，只盘批次商品
    const skus: StocktakeSku[] = [{ customerId: OWNER, skuCode: 'LOT-DEMO-01' }]
    if (code !== LA) skus.push({ customerId: OWNER, skuCode: 'SN-DEMO-01' })
    const counted = run(
      { type: 'CREATE_STOCKTAKE', warehouseCode: code, skus, remark: 'Weekly count of lot and serial demo items' },
      at(18, 1),
      'WEB',
      SUPERVISOR,
    )
    const stocktake = s.inventoryCounts.find((c) => c.no === counted)!
    run(
      {
        type: 'SAVE_COUNTS',
        no: counted,
        entries: stocktake.lines.map((l) => {
          if (l.skuCode === 'LOT-DEMO-01' && l.qualityType === 'GOOD' && l.locationCode === lotSource)
            return { lineNo: l.lineNo, qty: l.bookQty - 1, serialNos: [], note: 'One unit missing from the location' }
          if (l.skuCode === 'LOT-DEMO-01' && l.qualityType === 'DEFECTIVE')
            return { lineNo: l.lineNo, qty: l.bookQty - 1, serialNos: [], note: 'Only one expired unit in isolation' }
          if (l.skuCode === 'SN-DEMO-01' && l.locationCode === 'A-01-02') {
            const found = l.bookSerialNos.slice(1)
            return {
              lineNo: l.lineNo,
              qty: found.length,
              serialNos: found,
              note: `Serial ${l.bookSerialNos[0]} not found`,
            }
          }
          return { lineNo: l.lineNo, qty: l.bookQty, serialNos: l.bookSerialNos }
        }),
      },
      at(18, 3),
      'PDA',
      WORKER,
    )
    run(
      {
        type: 'ADD_COUNT_LINE',
        no: counted,
        locationCode: 'B-03-03',
        customerId: OWNER,
        skuCode: 'LOT-DEMO-01',
        batchNo: 'LOT-202612',
        expiryDate: '2026-12-20',
        qualityType: 'GOOD',
        qty: 1,
        serialNos: [],
        note: 'Unregistered batch found on B-03-03',
      },
      at(18, 4),
      'PDA',
      WORKER,
    )
    run({ type: 'CONFIRM_STOCKTAKE', no: counted }, at(19, 1), 'WEB', SUPERVISOR)

    // 移库扫描时发现 B-04-01 少 1 件：立即待核对，发起盘点后因人手调走取消，待核对保留
    run(
      {
        type: 'REPORT_DISCREPANCY',
        warehouseCode: code,
        customerId: HOMY,
        skuCode: HOMY_SKU,
        stage: 'MOVE_MISMATCH',
        locationCode: 'B-04-01',
      },
      at(19, 6),
      'PDA',
      WORKER,
    )
    const discrepancy = run(
      {
        type: 'CREATE_STOCKTAKE_FROM_DISCREPANCY',
        warehouseCode: code,
        customerId: HOMY,
        skuCode: HOMY_SKU,
        stage: 'MOVE_MISMATCH',
        locationCode: 'B-04-01',
        diffQty: 1,
        note: 'Scanned 11 at B-04-01 while moving; book shows 12',
      },
      at(19, 7),
      'PDA',
      WORKER,
    )
    run(
      { type: 'CANCEL_STOCKTAKE', no: discrepancy, reason: 'Counter reassigned to inbound; recount scheduled' },
      at(19, 9),
      'WEB',
      SUPERVISOR,
    )
    run(
      {
        type: 'CREATE_STOCKTAKE',
        warehouseCode: code,
        skus: [{ customerId: HOMY, skuCode: HOMY_SKU }],
        remark: 'Recount after the cancelled discrepancy check',
      },
      at(20, 1),
      'WEB',
      SUPERVISOR,
    )
    // 盘点期间照常接单：批发单按可用预占 12 件，可用变 0；待核对与盘点中都拦着分配
    runOutbound(
      {
        type: 'CREATE',
        input: {
          type: 'WHOLESALE',
          warehouseCode: code,
          customerId: HOMY,
          source: 'OMS',
          messageId: `MSG-SEED-INV-${code}`,
          upstreamNo: `OMS-WS-${HOMY_SKU}-${code}`,
          version: 0,
          recipient: 'Local wholesale customer',
          address: `Buyer warehouse, ${CITY[code] ?? code}`,
          items: [{ skuCode: HOMY_SKU, qty: 12 }],
        },
      },
      at(20, 3),
      'oms-mock',
    )
  })
  return s
}
