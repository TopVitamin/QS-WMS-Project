import { nextDocNo } from '@/lib/doc-no'
import {
  countingStocktake,
  isWorkLocation,
  locationInfo,
  moveTargetIssue,
  occupiedByOtherOwner,
  pendingControl,
  snapshotRows,
  stocktakeBlockers,
  type MoveTargetIssue,
} from '@/lib/inventory-derive'
import { balanceLog, pairLogs } from '@/lib/inventory-ledger'
import type { InventoryCommand, InventoryCount, StockMoveLine, StocktakeDiscovery } from '@/types/inventory'
import type { AuditRefType, InventoryLog, InventoryRecord, QualityType } from '@/types/wms'
import type { SeedData } from './seed'

type Patch = Pick<SeedData, 'inventory' | 'inventoryLogs' | 'inventoryCounts' | 'stockMoves' | 'skuAllocationControls'>
type Params = Record<string, string | number>
type WriteMeta = Omit<
  Partial<InventoryLog>,
  'warehouseCode' | 'customerId' | 'skuCode' | 'locationCode' | 'qtyChange' | 'level' | 'id'
> &
  Pick<InventoryLog, 'type' | 'refNo'>
export type InventoryActionResult =
  { ok: true; no?: string; patch: Patch } | { ok: false; errorKey: string; params?: Params }
export type InventoryTerminal = 'WEB' | 'PDA' | 'SYSTEM'

class InventoryError extends Error {
  key: string
  params?: Params
  constructor(key: string, params?: Params) {
    super(key)
    this.key = key
    this.params = params
  }
}
const reject = (key: string, params?: Params): never => {
  throw new InventoryError(`inventory.error.${key}`, params)
}
const positive = (n: number) => Number.isInteger(n) && n > 0
const nonnegative = (n: number) => Number.isInteger(n) && n >= 0
const MOVE_TARGET_ERRORS: Record<MoveTargetIssue, string> = {
  TARGET: 'moveTarget',
  SAME: 'moveSameLocation',
  QUALITY: 'moveQuality',
  OCCUPIED: 'moveOccupied',
}

/**
 * 库内动作（库存管理 PRD 套件）：品质转换、移库提交、差异上报、盘点建单／实盘／确认／取消。
 * 管理端与 PDA 共用；任一校验不过整次不生效，返回 errorKey；重复提交返回原结果。
 */
export function applyInventoryAction(
  state: SeedData,
  c: InventoryCommand,
  operator: string,
  at = new Date().toISOString(),
  terminal: InventoryTerminal = 'WEB',
): InventoryActionResult {
  const patch: Patch = structuredClone({
    inventory: state.inventory,
    inventoryLogs: state.inventoryLogs,
    inventoryCounts: state.inventoryCounts,
    stockMoves: state.stockMoves,
    skuAllocationControls: state.skuAllocationControls,
  })
  const s = { ...state, ...patch }
  const finish = (no?: string): InventoryActionResult => ({ ok: true, no, patch })
  const row = (id: string) => s.inventory.find((r) => r.id === id) ?? reject('notFound')
  const stocktake = (no: string) => s.inventoryCounts.find((p) => p.no === no) ?? reject('notFound')
  const master = (customerId: string, skuCode: string) =>
    s.skuMasters.find((m) => m.customerId === customerId && m.code === skuCode)
  const location = (warehouseCode: string, code: string) => locationInfo(s, warehouseCode, code)
  const frozenBy = (r: Pick<InventoryRecord, 'warehouseCode' | 'customerId' | 'skuCode'>) =>
    countingStocktake(s.inventoryCounts, r.warehouseCode, r.customerId, r.skuCode)
  const sync = (r: InventoryRecord) => {
    r.lockedQty = r.qualityType === 'DEFECTIVE' ? r.onHandQty : 0
  }
  const write = (r: InventoryRecord, change: number, meta: WriteMeta) => {
    const log = balanceLog(r, change, {
      operator,
      createdAt: at,
      terminal,
      ...meta,
      id: `LOG-INV-${at}-${s.inventoryLogs.length}`,
    })
    s.inventoryLogs.push(log)
    return log
  }
  /** 同仓同货主同 SKU 同库位同批次同品质的库存明细，没有就新建（批次、效期、首次入库时间沿用来源） */
  const balanceAt = (
    from: Pick<
      InventoryRecord,
      'warehouseCode' | 'customerId' | 'skuCode' | 'batchNo' | 'expiryDate' | 'firstInboundAt'
    >,
    locationCode: string,
    qualityType: QualityType,
  ) => {
    let to = s.inventory.find(
      (r) =>
        r.warehouseCode === from.warehouseCode &&
        r.customerId === from.customerId &&
        r.skuCode === from.skuCode &&
        r.locationCode === locationCode &&
        r.qualityType === qualityType &&
        (r.batchNo ?? '') === (from.batchNo ?? '') &&
        (r.expiryDate ?? '') === (from.expiryDate ?? ''),
    )
    if (!to) {
      to = {
        id: `INV-INV-${at}-${s.inventory.length}`,
        warehouseCode: from.warehouseCode,
        customerId: from.customerId,
        skuCode: from.skuCode,
        locationCode,
        qualityType,
        batchNo: from.batchNo,
        expiryDate: from.expiryDate,
        onHandQty: 0,
        lockedQty: 0,
        allocatedQty: 0,
        serialNos: [],
        firstInboundAt: from.firstInboundAt,
      }
      s.inventory.push(to)
    }
    return to
  }
  /** SN 商品：SN 数等于数量、不重复，有来源池时必须出自来源；移库带行号，便于 PDA 标出失败行 */
  const checkSerials = (
    customerId: string,
    skuCode: string,
    qty: number,
    serialNos: string[],
    pool?: string[],
    line?: number,
  ) => {
    if (!master(customerId, skuCode)?.snEnabled) return
    if (
      serialNos.length !== qty ||
      new Set(serialNos).size !== qty ||
      (pool && serialNos.some((sn) => !pool.includes(sn)))
    )
      reject('serial', line ? { sku: skuCode, line } : { sku: skuCode })
  }
  const markPending = (warehouseCode: string, customerId: string, skuCode: string, source: string) => {
    const control = pendingControl(s.skuAllocationControls, warehouseCode, customerId, skuCode)
    if (control) {
      if (!control.sources.includes(source)) control.sources.push(source)
    } else s.skuAllocationControls.push({ warehouseCode, customerId, skuCode, sources: [source] })
  }
  const createStocktake = (
    warehouseCode: string,
    skus: InventoryCount['skus'],
    source: InventoryCount['source'],
    discoveries: StocktakeDiscovery[],
    remark?: string,
  ) => {
    if (!skus.length) reject('skuEmpty')
    if (new Set(skus.map((k) => `${k.customerId}::${k.skuCode}`)).size !== skus.length) reject('skuEmpty')
    skus.forEach((k) => {
      if (!master(k.customerId, k.skuCode)) reject('sku', { sku: k.skuCode })
    })
    const blocker = stocktakeBlockers(s, warehouseCode, skus)[0]
    if (blocker) reject(`stocktakeBlocked.${blocker.kind}`, { sku: blocker.skuCode, ref: blocker.ref })
    const rows = snapshotRows(s, warehouseCode, skus).sort(
      (a, b) =>
        a.locationCode.localeCompare(b.locationCode) ||
        a.skuCode.localeCompare(b.skuCode) ||
        (a.batchNo ?? '').localeCompare(b.batchNo ?? '') ||
        a.qualityType.localeCompare(b.qualityType),
    )
    const no = nextDocNo(
      'ST',
      s.inventoryCounts.map((p) => p.no),
      at,
    )
    s.inventoryCounts.push({
      no,
      warehouseCode,
      skus,
      source,
      discoveries,
      remark: remark?.trim() || undefined,
      status: 'COUNTING',
      createdBy: operator,
      createdAt: at,
      lines: rows.map((r, i) => ({
        lineNo: i + 1,
        inventoryId: r.id,
        locationCode: r.locationCode,
        customerId: r.customerId,
        skuCode: r.skuCode,
        batchNo: r.batchNo,
        expiryDate: r.expiryDate,
        qualityType: r.qualityType,
        bookQty: r.onHandQty,
        bookSerialNos: [...(r.serialNos ?? [])],
      })),
    })
    return no
  }

  try {
    let resultNo: string | undefined
    switch (c.type) {
      case 'CONVERT_QUALITY': {
        if (s.inventoryLogs.some((l) => l.actionId === c.requestId)) return finish(c.requestId)
        const r = row(c.inventoryId)
        if (r.qualityType !== 'GOOD') reject('notGood')
        const usage = location(r.warehouseCode, r.locationCode)?.usage
        if (usage !== 'PICK' && usage !== 'STORAGE') reject('convertLocation')
        const frozen = frozenBy(r)
        if (frozen) reject('counting', { sku: r.skuCode, no: frozen.no })
        const max = r.onHandQty - (r.allocatedQty ?? 0)
        if (!positive(c.qty) || c.qty > max) reject('convertQty', { max })
        if (!c.reasonNote.trim() || !c.evidence.trim() || !c.ownerNotice) reject('convertReason')
        checkSerials(r.customerId, r.skuCode, c.qty, c.serialNos, r.serialNos ?? [])
        const to = balanceAt(r, r.locationCode, 'DEFECTIVE')
        r.onHandQty -= c.qty
        r.serialNos = r.serialNos?.filter((sn) => !c.serialNos.includes(sn))
        to.onHandQty += c.qty
        to.serialNos = [...(to.serialNos ?? []), ...c.serialNos]
        sync(r)
        sync(to)
        const meta = {
          type: 'QUALITY' as const,
          refNo: '',
          sourceType: 'NONE' as const,
          reasonCode: 'DAMAGED' as const,
          reasonNote: c.reasonNote.trim(),
          evidence: c.evidence.trim(),
          ownerNotice: c.ownerNotice,
          serialNos: c.serialNos.length ? c.serialNos : undefined,
        }
        const minus = write(r, -c.qty, meta)
        const plus = write(to, c.qty, meta)
        pairLogs(minus, plus, c.requestId)
        resultNo = c.requestId
        break
      }
      case 'SUBMIT_MOVE': {
        const existing = s.stockMoves.find((m) => m.requestId === c.requestId)
        if (existing) return finish(existing.no)
        if (!c.lines.length) reject('moveEmpty')
        const no = nextDocNo(
          'MV',
          s.stockMoves.map((m) => m.no),
          at,
        )
        let customerId = ''
        const usedSerials = new Set<string>()
        const lines: StockMoveLine[] = c.lines.map((input, i) => {
          const line = i + 1
          const r = row(input.inventoryId)
          if (r.warehouseCode !== c.warehouseCode) reject('moveWarehouse', { line })
          if (customerId && r.customerId !== customerId) reject('moveOwner', { line })
          customerId = r.customerId
          const source = location(r.warehouseCode, r.locationCode)
          if (!source?.enabled || !isWorkLocation(source.usage)) reject('moveSource', { line })
          const targetCode = input.targetLocation.trim().toUpperCase()
          const issue = moveTargetIssue(s, r, targetCode)
          if (issue) reject(MOVE_TARGET_ERRORS[issue], { line })
          const frozen = frozenBy(r)
          if (frozen) reject('counting', { sku: r.skuCode, no: frozen.no, line })
          const max = r.onHandQty - (r.allocatedQty ?? 0)
          if (!positive(input.qty) || input.qty > max) reject('moveQty', { line, max })
          checkSerials(r.customerId, r.skuCode, input.qty, input.serialNos, r.serialNos ?? [], line)
          if (input.serialNos.some((sn) => usedSerials.has(sn))) reject('serial', { sku: r.skuCode, line })
          input.serialNos.forEach((sn) => usedSerials.add(sn))
          const to = balanceAt(r, targetCode, r.qualityType)
          r.onHandQty -= input.qty
          r.serialNos = r.serialNos?.filter((sn) => !input.serialNos.includes(sn))
          to.onHandQty += input.qty
          to.serialNos = [...(to.serialNos ?? []), ...input.serialNos]
          sync(r)
          sync(to)
          const meta = {
            type: 'MOVE' as const,
            refNo: no,
            sourceType: 'MOVE' as const,
            sourceLineNo: line,
            serialNos: input.serialNos.length ? input.serialNos : undefined,
          }
          const minus = write(r, -input.qty, meta)
          const plus = write(to, input.qty, meta)
          pairLogs(minus, plus, `${no}#${line}`)
          return {
            lineNo: line,
            skuCode: r.skuCode,
            sourceLocation: r.locationCode,
            targetLocation: targetCode,
            batchNo: r.batchNo,
            expiryDate: r.expiryDate,
            qualityType: r.qualityType,
            qty: input.qty,
            serialNos: input.serialNos,
            sourceLogId: minus.id,
            targetLogId: plus.id,
          }
        })
        s.stockMoves.push({
          no,
          requestId: c.requestId,
          warehouseCode: c.warehouseCode,
          customerId,
          operator,
          submittedAt: at,
          terminal: 'PDA',
          lines,
        })
        resultNo = no
        break
      }
      case 'REPORT_DISCREPANCY': {
        if (!master(c.customerId, c.skuCode)) reject('sku', { sku: c.skuCode })
        markPending(c.warehouseCode, c.customerId, c.skuCode, c.sourceNo ?? `${c.stage}@${c.locationCode}`)
        resultNo = c.skuCode
        break
      }
      case 'CREATE_STOCKTAKE': {
        resultNo = createStocktake(c.warehouseCode, c.skus, 'PLAN', [], c.remark)
        break
      }
      case 'CREATE_STOCKTAKE_FROM_DISCREPANCY': {
        if (!c.note.trim()) reject('discoveryNote')
        if (!positive(c.diffQty)) reject('countQty')
        const discovery: StocktakeDiscovery = {
          stage: c.stage,
          customerId: c.customerId,
          skuCode: c.skuCode,
          locationCode: c.locationCode,
          diffQty: c.diffQty,
          note: c.note.trim(),
          sourceNo: c.sourceNo,
          reportedBy: operator,
          reportedAt: at,
        }
        markPending(c.warehouseCode, c.customerId, c.skuCode, c.sourceNo ?? `${c.stage}@${c.locationCode}`)
        // 同 SKU 已在盘点中：不新建，本次发现追加到该单发现依据（盘点单主PRD 第一节）
        const existing = countingStocktake(s.inventoryCounts, c.warehouseCode, c.customerId, c.skuCode)
        if (existing) {
          existing.discoveries.push(discovery)
          resultNo = existing.no
          break
        }
        resultNo = createStocktake(c.warehouseCode, [{ customerId: c.customerId, skuCode: c.skuCode }], 'DISCREPANCY', [
          discovery,
        ])
        break
      }
      case 'SAVE_COUNTS': {
        const p = stocktake(c.no)
        if (p.status !== 'COUNTING') reject('stocktakeClosed')
        if (!c.entries.length) reject('countQty')
        c.entries.forEach((e) => {
          const l = p.lines.find((l) => l.lineNo === e.lineNo) ?? reject('notFound')
          if (!nonnegative(e.qty)) reject('countQty', { line: e.lineNo })
          checkSerials(l.customerId, l.skuCode, e.qty, e.serialNos)
          const elsewhere = p.lines
            .filter((o) => o.lineNo !== l.lineNo && o.customerId === l.customerId && o.skuCode === l.skuCode)
            .flatMap((o) => (c.entries.some((x) => x.lineNo === o.lineNo) ? [] : (o.countedSerialNos ?? [])))
          const inBatch = c.entries
            .filter((x) => x.lineNo !== e.lineNo)
            .flatMap((x) => {
              const o = p.lines.find((o) => o.lineNo === x.lineNo)
              return o && o.customerId === l.customerId && o.skuCode === l.skuCode ? x.serialNos : []
            })
          if (e.serialNos.some((sn) => elsewhere.includes(sn) || inBatch.includes(sn)))
            reject('serial', { sku: l.skuCode })
          l.countedQty = e.qty
          l.countedSerialNos = master(l.customerId, l.skuCode)?.snEnabled ? [...e.serialNos] : undefined
          l.countedBy = operator
          l.countedAt = at
          if (e.note !== undefined) l.diffNote = e.note.trim() || undefined
        })
        resultNo = p.no
        break
      }
      case 'ADD_COUNT_LINE': {
        const p = stocktake(c.no)
        if (p.status !== 'COUNTING') reject('stocktakeClosed')
        if (!p.skus.some((k) => k.customerId === c.customerId && k.skuCode === c.skuCode))
          reject('skuOutOfScope', { sku: c.skuCode })
        const code = c.locationCode.trim().toUpperCase()
        const target = location(p.warehouseCode, code)
        if (!target?.enabled || !isWorkLocation(target.usage)) reject('location', { location: code })
        if (occupiedByOtherOwner(s, p.warehouseCode, code, c.customerId)) reject('countOccupied', { location: code })
        const m = master(c.customerId, c.skuCode)
        if ((m?.batchEnabled || m?.expiryEnabled) && !c.batchNo?.trim()) reject('batchRequired')
        if (m?.expiryEnabled && !c.expiryDate) reject('batchRequired')
        if (!positive(c.qty)) reject('countQty')
        checkSerials(c.customerId, c.skuCode, c.qty, c.serialNos)
        // 同一 SN 只能盘在一行：其他行已录到的不能再新增
        const countedSerials = p.lines
          .filter((l) => l.customerId === c.customerId && l.skuCode === c.skuCode)
          .flatMap((l) => l.countedSerialNos ?? [])
        if (c.serialNos.some((sn) => countedSerials.includes(sn))) reject('serial', { sku: c.skuCode })
        const batchNo = c.batchNo?.trim() || undefined
        if (
          p.lines.some(
            (l) =>
              l.locationCode === code &&
              l.customerId === c.customerId &&
              l.skuCode === c.skuCode &&
              (l.batchNo ?? '') === (batchNo ?? '') &&
              l.qualityType === c.qualityType,
          )
        )
          reject('lineExists')
        p.lines.push({
          lineNo: Math.max(0, ...p.lines.map((l) => l.lineNo)) + 1,
          locationCode: code,
          customerId: c.customerId,
          skuCode: c.skuCode,
          batchNo,
          expiryDate: c.expiryDate || undefined,
          qualityType: c.qualityType,
          bookQty: 0,
          bookSerialNos: [],
          countedQty: c.qty,
          countedSerialNos: m?.snEnabled ? [...c.serialNos] : undefined,
          countedBy: operator,
          countedAt: at,
          diffNote: c.note?.trim() || undefined,
          added: true,
        })
        resultNo = p.no
        break
      }
      case 'CONFIRM_STOCKTAKE': {
        const p = stocktake(c.no)
        if (p.status === 'COMPLETED') return finish(p.no)
        if (p.status !== 'COUNTING') reject('stocktakeClosed')
        const uncounted = p.lines.filter((l) => l.countedQty === undefined).length
        if (uncounted) reject('stocktakeUncounted', { count: uncounted })
        p.lines.forEach((l) => {
          const counted = l.countedQty!
          const sn = Boolean(master(l.customerId, l.skuCode)?.snEnabled)
          const r = l.inventoryId
            ? row(l.inventoryId)
            : balanceAt(
                {
                  warehouseCode: p.warehouseCode,
                  customerId: l.customerId,
                  skuCode: l.skuCode,
                  batchNo: l.batchNo,
                  expiryDate: l.expiryDate,
                  firstInboundAt: at,
                },
                l.locationCode,
                l.qualityType,
              )
          l.inventoryId = r.id
          const meta = {
            type: 'ADJUST' as const,
            refNo: p.no,
            sourceType: 'STOCKTAKE' as const,
            sourceLineNo: l.lineNo,
          }
          if (sn) {
            const book = r.serialNos ?? []
            const actual = l.countedSerialNos ?? []
            const removed = book.filter((x) => !actual.includes(x))
            const added = actual.filter((x) => !book.includes(x))
            if (removed.length) {
              r.onHandQty -= removed.length
              r.serialNos = book.filter((x) => !removed.includes(x))
              sync(r)
              l.adjustLogId = write(r, -removed.length, { ...meta, serialNos: removed }).id
            }
            if (added.length) {
              r.onHandQty += added.length
              r.serialNos = [...(r.serialNos ?? []), ...added]
              sync(r)
              l.adjustLogId = write(r, added.length, { ...meta, serialNos: added }).id
            }
          } else {
            const diff = counted - r.onHandQty
            if (diff) {
              r.onHandQty = counted
              sync(r)
              l.adjustLogId = write(r, diff, meta).id
            }
          }
          if ((r.allocatedQty ?? 0) > r.onHandQty) reject('stocktakeAllocated', { location: r.locationCode })
        })
        p.skus.forEach((k) => {
          const serials = s.inventory
            .filter((r) => r.customerId === k.customerId && r.skuCode === k.skuCode && r.onHandQty > 0)
            .flatMap((r) => r.serialNos ?? [])
          if (new Set(serials).size !== serials.length) reject('serial', { sku: k.skuCode })
        })
        p.status = 'COMPLETED'
        p.confirmedBy = operator
        p.confirmedAt = at
        // 主管确认完成：SKU 解冻，解除本次已核实差异的待核对
        s.skuAllocationControls = s.skuAllocationControls.filter(
          (r) =>
            !(
              r.warehouseCode === p.warehouseCode &&
              p.skus.some((k) => k.customerId === r.customerId && k.skuCode === r.skuCode)
            ),
        )
        patch.skuAllocationControls = s.skuAllocationControls
        resultNo = p.no
        break
      }
      case 'CANCEL_STOCKTAKE': {
        const p = stocktake(c.no)
        if (p.status === 'CANCELLED') return finish(p.no)
        if (p.status !== 'COUNTING') reject('stocktakeClosed')
        if (!c.reason.trim()) reject('cancelReason')
        p.status = 'CANCELLED'
        p.cancelledBy = operator
        p.cancelledAt = at
        p.cancelReason = c.reason.trim()
        resultNo = p.no
        break
      }
    }
    return finish(resultNo)
  } catch (e) {
    if (!(e instanceof InventoryError)) throw e
    return { ok: false, errorKey: e.key, params: e.params }
  }
}

/** 库内动作写操作日志时挂到哪个对象：盘点挂盘点单，移库挂移库作业，品质转换与差异上报挂库存 */
export function inventoryAuditRef(
  c: InventoryCommand,
  resultNo?: string,
): { refType: AuditRefType; refNo: string; command: string; detail?: string } {
  const base = { command: c.type }
  switch (c.type) {
    case 'CONVERT_QUALITY':
      return { ...base, refType: 'INVENTORY', refNo: c.inventoryId, detail: `× ${c.qty}` }
    case 'SUBMIT_MOVE':
      return {
        ...base,
        refType: 'STOCK_MOVE',
        refNo: resultNo ?? '-',
        detail: c.lines.map((l) => `→ ${l.targetLocation.trim().toUpperCase()} × ${l.qty}`).join(', '),
      }
    case 'REPORT_DISCREPANCY':
      return { ...base, refType: 'INVENTORY', refNo: c.skuCode, detail: c.locationCode }
    case 'SAVE_COUNTS':
      return {
        ...base,
        refType: 'STOCKTAKE',
        refNo: c.no,
        detail: c.entries.map((e) => `#${e.lineNo} × ${e.qty}`).join(', '),
      }
    case 'ADD_COUNT_LINE':
      return { ...base, refType: 'STOCKTAKE', refNo: c.no, detail: `${c.locationCode} × ${c.qty}` }
    case 'CREATE_STOCKTAKE':
    case 'CREATE_STOCKTAKE_FROM_DISCREPANCY':
      return { ...base, refType: 'STOCKTAKE', refNo: resultNo ?? '-' }
    case 'CONFIRM_STOCKTAKE':
    case 'CANCEL_STOCKTAKE':
      return { ...base, refType: 'STOCKTAKE', refNo: c.no }
  }
}
