import { nextDocNo } from '@/lib/doc-no'
import { deriveOutboundOrderStatus } from '@/lib/outbound-derive'
import type { SeedData } from './seed'
import type { AuditRefType, InventoryRecord } from '@/types/wms'
import type {
  OutboundCommand,
  OutboundData,
  OutboundHandoverInput,
  OutboundOrder,
  OutboundPickTask,
  PickAssignment,
  PickShare,
} from '@/types/outbound'

export const outboundDataKeys = [
  'outboundOrders',
  'outboundWaves',
  'outboundPickTasks',
  'outboundVerifications',
  'outboundPutbacks',
  'outboundHandovers',
  'skuAllocationControls',
  'outboundMessages',
  'outboundResults',
  'inventoryCounts',
  'outboundRole',
] as const
export function emptyOutboundData(): OutboundData {
  return {
    outboundOrders: [],
    outboundWaves: [],
    outboundPickTasks: [],
    outboundVerifications: [],
    outboundPutbacks: [],
    outboundHandovers: [],
    skuAllocationControls: [],
    outboundMessages: [],
    outboundResults: [],
    inventoryCounts: [],
    outboundRole: 'SUPERVISOR',
  }
}
export const skuKey = (warehouse: string, owner: string, sku: string) => `${warehouse}::${owner}::${sku}`
const sameSku = (
  r: { warehouseCode: string; customerId: string; skuCode: string },
  warehouse: string,
  owner: string,
  sku: string,
) => skuKey(r.warehouseCode, r.customerId, r.skuCode) === skuKey(warehouse, owner, sku)
export function outboundAvailable(
  s: Pick<SeedData, 'inventory' | 'outboundOrders'>,
  warehouse: string,
  owner: string,
  sku: string,
): number {
  const actual = s.inventory
    .filter((r) => sameSku(r, warehouse, owner, sku) && r.qualityType === 'GOOD')
    .reduce((n, r) => n + r.onHandQty, 0)
  const reserved = s.outboundOrders
    .filter(
      (o) => o.warehouseCode === warehouse && o.customerId === owner && !['SHIPPED', 'CANCELLED'].includes(o.status),
    )
    .reduce((n, o) => n + o.items.filter((i) => i.skuCode === sku).reduce((m, i) => m + i.reservedQty, 0), 0)
  return actual - reserved
}
export function allocationBlocked(
  s: Pick<SeedData, 'skuAllocationControls' | 'inventoryCounts'>,
  warehouse: string,
  owner: string,
  sku: string,
): boolean {
  return (
    s.skuAllocationControls.some((r) => sameSku(r, warehouse, owner, sku)) ||
    s.inventoryCounts.some((r) => sameSku(r, warehouse, owner, sku) && r.status === 'COUNTING')
  )
}
export function openTask(t: OutboundPickTask) {
  return t.status === 'PENDING_PICK' || t.status === 'PICKING'
}
export function taskOrderNos(t: OutboundPickTask): string[] {
  return [...new Set([...(t.orderNo ? [t.orderNo] : []), ...t.lines.flatMap((l) => l.shares.map((p) => p.orderNo))])]
}
export function orderAssignments(s: Pick<SeedData, 'outboundPickTasks'>, no: string) {
  return s.outboundPickTasks.flatMap((t) =>
    t.assignments
      .filter((a) => a.orderNo === no)
      .map((a) => ({ ...a, taskNo: t.no, line: t.lines.find((l) => l.id === a.lineId)! })),
  )
}
export function verificationRemaining(s: Pick<SeedData, 'outboundVerifications'>, a: PickAssignment) {
  const used = s.outboundVerifications
    .filter((v) => !v.deleted)
    .flatMap((v) => v.lines)
    .filter((l) => l.assignmentId === a.id)
  return {
    qty: a.activeQty - used.reduce((n, l) => n + l.effectiveQty, 0),
    serialNos: a.activeSerialNos.filter((sn) => !used.some((l) => l.effectiveQty > 0 && l.serialNos.includes(sn))),
  }
}

type Patch = OutboundData & Pick<SeedData, 'inventory' | 'inventoryLogs'>
export type OutboundActionResult =
  | { ok: true; no?: string; patch: Patch }
  | { ok: false; errorKey: string; params?: Record<string, string | number>; patch?: Patch }
class BusinessError extends Error {
  key: string
  params?: Record<string, string | number>
  constructor(key: string, params?: Record<string, string | number>) {
    super(key)
    this.key = key
    this.params = params
  }
}
const reject = (key: string, params?: Record<string, string | number>): never => {
  throw new BusinessError(`outbound.error.${key}`, params)
}
const positive = (n: number) => Number.isInteger(n) && n > 0
const nonnegative = (n: number) => Number.isInteger(n) && n >= 0

export function applyOutboundAction(
  state: SeedData,
  c: OutboundCommand,
  operator: string,
  at = new Date().toISOString(),
): OutboundActionResult {
  const data = Object.fromEntries(outboundDataKeys.map((k) => [k, state[k]])) as unknown as OutboundData
  const patch: Patch = structuredClone({ ...data, inventory: state.inventory, inventoryLogs: state.inventoryLogs })
  const s = { ...state, ...patch }
  const finish = (no?: string): OutboundActionResult => ({ ok: true, no, patch })
  const supervisor = () => {}
  const role = (_r: 'ORGANIZER' | 'WORKER') => {}
  const order = (no: string) => s.outboundOrders.find((o) => o.no === no) ?? reject('notFound')
  const task = (no: string) => s.outboundPickTasks.find((t) => t.no === no) ?? reject('notFound')
  const inventory = (id: string) => s.inventory.find((r) => r.id === id) ?? reject('notFound')
  const skuMaster = (owner: string, sku: string) => s.skuMasters.find((m) => m.customerId === owner && m.code === sku)
  const ensureLive = (o: OutboundOrder) => {
    if (o.status === 'SHIPPED' || o.status === 'CANCELLED') reject('terminal')
  }
  const frozen = (warehouse: string, owner: string, sku: string) =>
    s.inventoryCounts.some((r) => sameSku(r, warehouse, owner, sku) && r.status === 'COUNTING')
  const block = (warehouse: string, owner: string, sku: string) => {
    if (allocationBlocked(s, warehouse, owner, sku)) reject('pending', { sku })
  }
  const markPending = (warehouse: string, owner: string, sku: string, source: string) => {
    const row = s.skuAllocationControls.find((r) => sameSku(r, warehouse, owner, sku))
    if (row) {
      if (!row.sources.includes(source)) row.sources.push(source)
    } else
      s.skuAllocationControls.push({ warehouseCode: warehouse, customerId: owner, skuCode: sku, sources: [source] })
  }
  const loc = (warehouse: string, code: string) => {
    const m = s.locationMasters.find((l) => l.warehouseCode === warehouse && l.code === code)
    if (m) return { type: m.zoneType, enabled: m.status === 'ENABLED', master: m }
    const legacy = s.locations.find((l) => l.warehouseCode === warehouse && l.code === code)
    return legacy ? { type: legacy.type, enabled: true, master: undefined } : undefined
  }
  const stockLog = (
    r: InventoryRecord,
    qty: number,
    ref: string,
    type: 'PICK' | 'RETURN' | 'SHIP' | 'ADJUST' | 'MOVE',
  ) =>
    s.inventoryLogs.push({
      id: `LOG-OB-${at}-${s.inventoryLogs.length}`,
      warehouseCode: r.warehouseCode,
      customerId: r.customerId,
      skuCode: r.skuCode,
      locationCode: r.locationCode,
      qtyChange: qty,
      type,
      refNo: ref,
      operator,
      createdAt: at,
    })
  const move = (
    id: string,
    target: string,
    qty: number,
    serialNos: string[],
    ref: string,
    type: 'PICK' | 'RETURN' | 'MOVE',
    quality?: InventoryRecord['qualityType'],
  ) => {
    const from = inventory(id)
    if (frozen(from.warehouseCode, from.customerId, from.skuCode)) reject('countFrozen')
    if (from.onHandQty < qty || serialNos.some((sn) => !from.serialNos?.includes(sn))) reject('stockChanged')
    const q = quality ?? from.qualityType
    let to = s.inventory.find(
      (r) =>
        r.id !== from.id &&
        sameSku(r, from.warehouseCode, from.customerId, from.skuCode) &&
        r.locationCode === target &&
        r.qualityType === q &&
        r.batchNo === from.batchNo &&
        r.expiryDate === from.expiryDate,
    )
    if (!to) {
      to = {
        ...from,
        id: `INV-OB-${at}-${s.inventory.length}`,
        locationCode: target,
        qualityType: q,
        onHandQty: 0,
        lockedQty: 0,
        allocatedQty: 0,
        serialNos: [],
      }
      s.inventory.push(to)
    }
    from.onHandQty -= qty
    from.lockedQty = from.qualityType === 'DEFECTIVE' ? from.onHandQty : 0
    from.serialNos = from.serialNos?.filter((sn) => !serialNos.includes(sn))
    to.onHandQty += qty
    to.lockedQty = q === 'DEFECTIVE' ? to.onHandQty : 0
    to.serialNos = [...(to.serialNos ?? []), ...serialNos]
    stockLog(from, -qty, ref, type)
    stockLog(to, qty, ref, type)
    return to.id
  }
  const recompute = () => {
    s.outboundOrders.forEach((o) => {
      const assignments = orderAssignments(s, o.no)
      o.items.forEach((i) => {
        i.pickedQty = assignments.filter((a) => a.itemNo === i.lineNo).reduce((n, a) => n + a.activeQty, 0)
        i.verifiedQty = s.outboundVerifications
          .filter((v) => v.orderNo === o.no && !v.deleted)
          .flatMap((v) => v.lines)
          .filter((l) => l.itemNo === i.lineNo)
          .reduce((n, l) => n + l.effectiveQty, 0)
      })
      if (['SHIPPED', 'CANCELLED'].includes(o.status)) return
      o.status = deriveOutboundOrderStatus(o, s.outboundPickTasks)
      o.updatedAt = at
    })
  }
  const candidates = (warehouse: string, owner: string, sku: string, exclude?: string) =>
    s.inventory
      .filter(
        (r) =>
          sameSku(r, warehouse, owner, sku) &&
          r.id !== exclude &&
          r.qualityType === 'GOOD' &&
          r.onHandQty - (r.allocatedQty ?? 0) > 0 &&
          ['PICK', 'STORAGE'].includes(loc(warehouse, r.locationCode)?.type ?? '') &&
          loc(warehouse, r.locationCode)?.enabled &&
          (!r.expiryDate || r.expiryDate.slice(0, 10) >= at.slice(0, 10)),
      )
      .sort(
        (a, b) =>
          (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999') ||
          a.locationCode.localeCompare(b.locationCode),
      )
  const addLine = (t: OutboundPickTask, r: InventoryRecord, share: PickShare, incrementAllocation = true) => {
    let l = t.lines.find((l) => l.inventoryId === r.id && l.shortageQty === 0)
    if (!l) {
      l = {
        id: `${t.no}-${t.lines.length + 1}`,
        inventoryId: r.id,
        locationCode: r.locationCode,
        skuCode: r.skuCode,
        batchNo: r.batchNo,
        expiryDate: r.expiryDate,
        qualityType: r.qualityType,
        plannedQty: 0,
        pickedQty: 0,
        shortageQty: 0,
        shares: [],
      }
      t.lines.push(l)
    }
    l.plannedQty += share.qty
    const prev = l.shares.find((p) => p.orderNo === share.orderNo && p.itemNo === share.itemNo)
    if (prev) prev.qty += share.qty
    else l.shares.push({ ...share })
    if (incrementAllocation) r.allocatedQty = (r.allocatedQty ?? 0) + share.qty
  }
  const allocate = (orders: OutboundOrder[], waveNo?: string) => {
    const first = orders[0]
    const existing = s.outboundPickTasks.find((t) => openTask(t) && orders.some((o) => taskOrderNos(t).includes(o.no)))
    if (existing) return existing
    const no = nextDocNo(
      'PK',
      s.outboundPickTasks.map((t) => t.no),
      at,
    )
    const supplement = orders.some((o) => s.outboundPickTasks.some((t) => taskOrderNos(t).includes(o.no)))
    const gaps: { sku: string; qty: number }[] = []
    const t: OutboundPickTask = {
      no,
      warehouseCode: first.warehouseCode,
      customerId: first.customerId,
      source: waveNo ? 'WAVE' : supplement ? 'SUPPLEMENT' : 'ORDER',
      waveNo,
      orderNo: waveNo ? undefined : first.no,
      status: 'PENDING_PICK',
      stagingCode: 'STAGE-OUT-01',
      lines: [],
      assignments: [],
      confirmations: [],
      createdAt: at,
    }
    orders.forEach((o) => {
      ensureLive(o)
      o.items.forEach((i) => {
        block(o.warehouseCode, o.customerId, i.skuCode)
        if (o.type === 'OTHER') {
          o.specified
            .filter((p) => p.itemNo === i.lineNo)
            .forEach((p) => {
              const taken = orderAssignments(s, o.no)
                .filter((a) => a.itemNo === i.lineNo && a.line.inventoryId === p.inventoryId)
                .reduce((n, a) => n + a.activeQty, 0)
              if (p.qty > taken)
                addLine(
                  t,
                  inventory(p.inventoryId),
                  { orderNo: o.no, itemNo: i.lineNo, qty: p.qty - taken },
                  supplement,
                )
            })
          return
        }
        i.reservedQty += Math.min(
          i.demandQty - i.reservedQty,
          Math.max(0, outboundAvailable(s, o.warehouseCode, o.customerId, i.skuCode)),
        )
        let waiting = i.reservedQty - i.pickedQty
        candidates(o.warehouseCode, o.customerId, i.skuCode).forEach((r) => {
          const qty = Math.min(waiting, r.onHandQty - (r.allocatedQty ?? 0))
          if (qty > 0) {
            addLine(t, r, { orderNo: o.no, itemNo: i.lineNo, qty })
            waiting -= qty
          }
        })
        if (o.type === 'B2C' && waiting > 0) reject('allocation', { sku: i.skuCode, qty: waiting })
        if (waiting > 0) gaps.push({ sku: i.skuCode, qty: waiting })
      })
    })
    if (t.lines.length === 0) reject('noAllocation', gaps[0])
    s.outboundPickTasks.push(t)
    return t
  }
  const unpick = (
    o: OutboundOrder,
    assignments: { a: PickAssignment; t: OutboundPickTask; qty: number; serialNos: string[] }[],
    reason: 'CANCEL' | 'MISSING' | 'DAMAGED',
  ) => {
    const no = nextDocNo(
      'PB',
      s.outboundPutbacks.map((p) => p.no),
      at,
    )
    const lines = assignments.map(({ a, t, qty, serialNos }, idx) => {
      if (!positive(qty) || qty > a.activeQty) reject('quantity')
      const l = t.lines.find((l) => l.id === a.lineId)!
      const enabled = skuMaster(o.customerId, l.skuCode)?.snEnabled
      if (
        enabled &&
        (serialNos.length !== qty ||
          new Set(serialNos).size !== qty ||
          serialNos.some((sn) => !a.activeSerialNos.includes(sn)))
      )
        reject('serial')
      a.activeQty -= qty
      a.activeSerialNos = a.activeSerialNos.filter((sn) => !serialNos.includes(sn))
      // 对应SN失效；非SN按本实拣关联的记录从后往前扣有效量。
      let toInvalidate = qty
      s.outboundVerifications
        .filter((v) => v.orderNo === o.no && !v.deleted)
        .reverse()
        .forEach((v) =>
          v.lines
            .filter((vl) => vl.assignmentId === a.id)
            .forEach((vl) => {
              const remove = enabled
                ? vl.serialNos.filter((sn) => serialNos.includes(sn)).length
                : Math.min(toInvalidate, vl.effectiveQty)
              vl.effectiveQty = Math.max(0, vl.effectiveQty - remove)
              toInvalidate -= remove
            }),
        )
      let stagingInventoryId = a.stagingInventoryId
      if (reason === 'DAMAGED')
        stagingInventoryId = move(stagingInventoryId, t.stagingCode, qty, serialNos, no, 'MOVE', 'DEFECTIVE')
      if (reason === 'MISSING') markPending(o.warehouseCode, o.customerId, l.skuCode, no)
      return {
        id: `${no}-${idx + 1}`,
        itemNo: a.itemNo,
        skuCode: l.skuCode,
        stagingInventoryId,
        fromLocation: t.stagingCode,
        suggestedLocation: l.locationCode,
        batchNo: l.batchNo,
        qualityType: reason === 'DAMAGED' ? ('DEFECTIVE' as const) : l.qualityType,
        qty,
        serialNos,
        savedQty: 0,
      }
    })
    if (lines.length)
      s.outboundPutbacks.push({
        no,
        orderNo: o.no,
        warehouseCode: o.warehouseCode,
        customerId: o.customerId,
        reason,
        status: 'PENDING',
        lines,
        createdAt: at,
      })
    return no
  }
  const addHandover = (o: OutboundOrder, input: OutboundHandoverInput) => {
    if (
      !input.party.trim() ||
      !positive(input.containerQty) ||
      !Number.isFinite(Date.parse(input.at)) ||
      (input.channelCode && !s.channelMasters.some((ch) => ch.code === input.channelCode && ch.status === 'ENABLED'))
    )
      reject('handover')
    const no = nextDocNo(
      'HO',
      s.outboundHandovers.map((h) => h.no),
      at,
    )
    s.outboundHandovers.push({
      no,
      orderNo: o.no,
      method: input.method,
      party: input.party,
      channelCode: input.channelCode,
      credential: input.credential,
      containerQty: input.containerQty,
      at: input.at,
      remark: input.remark,
      attachments: input.attachments,
      operator,
    })
    return no
  }
  const validateReturnTarget = (
    p: OutboundData['outboundPutbacks'][number],
    l: OutboundData['outboundPutbacks'][number]['lines'][number],
    location: string,
  ) => {
    const target = loc(p.warehouseCode, location) ?? reject('target')
    if (!target.enabled || !['PICK', 'STORAGE', 'DEFECT'].includes(target.type)) reject('target')
    if (frozen(p.warehouseCode, p.customerId, l.skuCode)) reject('countFrozen')
    if (target.type === 'DEFECT' && l.qualityType !== 'DEFECTIVE') reject('target')
    const occupied = s.inventory.filter(
      (r) => r.warehouseCode === p.warehouseCode && r.locationCode === location && r.onHandQty > 0,
    )
    if (
      occupied.some((r) => r.customerId !== p.customerId || r.qualityType !== l.qualityType) ||
      (target.master &&
        ((occupied.some((r) => r.skuCode !== l.skuCode) && !target.master.allowMixSku) ||
          (occupied.some((r) => r.batchNo !== l.batchNo) && !target.master.allowMixBatch)))
    )
      reject('target')
  }
  const message =
    c.type === 'CREATE' && c.input.source === 'OMS'
      ? {
          id: c.input.messageId ?? '',
          upstreamNo: c.input.upstreamNo ?? '',
          version: c.input.version ?? 0,
          action: 'CREATE' as const,
        }
      : (c.type === 'CHANGE' || c.type === 'CANCEL') && c.messageId
        ? {
            id: c.messageId,
            upstreamNo: s.outboundOrders.find((o) => o.no === c.no)?.upstreamNo ?? '',
            version: c.version ?? 0,
            action: c.type,
          }
        : undefined
  const fingerprint = JSON.stringify(c)
  if (message) {
    const seen = s.outboundMessages.find((m) => m.id === message.id)
    if (seen && seen.fingerprint !== fingerprint) return { ok: false, errorKey: 'outbound.error.messageConflict' }
    if (seen)
      return seen.status === 'ACCEPTED'
        ? finish(seen.orderNo)
        : { ok: false, errorKey: seen.errorKey!, params: seen.params }
  }
  try {
    let resultNo: string | undefined
    if (message && (!message.id || !message.upstreamNo || !nonnegative(message.version))) reject('message')
    switch (c.type) {
      case 'CREATE': {
        const p = c.input
        const businessFingerprint = JSON.stringify({ ...p, messageId: undefined })
        const existing =
          p.source === 'OMS'
            ? s.outboundOrders.find((o) => o.source === 'OMS' && o.type === p.type && o.upstreamNo === p.upstreamNo)
            : undefined
        if (existing) {
          if (existing.createFingerprint && existing.createFingerprint !== businessFingerprint)
            reject('messageConflict')
          resultNo = existing.no
          break
        }
        if (p.source === 'OMS' && (p.version ?? 0) !== 0) reject('version')
        if (p.source === 'MANUAL') {
          supervisor()
          if (p.type !== 'OTHER' || !p.emailBasis?.trim()) reject('basis')
        }
        if (
          !s.warehouses.some((w) => w.code === p.warehouseCode) &&
          !s.warehouseMasters.some((w) => w.code === p.warehouseCode && w.status === 'ENABLED')
        )
          reject('warehouse')
        if (!s.customerMasters.some((m) => m.id === p.customerId && m.status === 'ENABLED')) reject('owner')
        if (
          !p.items.length ||
          new Set(p.items.map((i) => i.skuCode)).size !== p.items.length ||
          p.items.some((i) => !positive(i.qty))
        )
          reject('quantity')
        if (!p.recipient.trim() || !p.address.trim() || (p.type === 'PURCHASE_RETURN' && !p.originalInboundNo))
          reject('recipient')
        if (p.channelCode && !s.channelMasters.some((ch) => ch.code === p.channelCode && ch.status === 'ENABLED'))
          reject('channel')
        const no = nextDocNo(
          'OB',
          s.outboundOrders.map((o) => o.no),
          at,
        )
        const o: OutboundOrder = {
          no,
          type: p.type,
          warehouseCode: p.warehouseCode,
          customerId: p.customerId,
          source: p.source,
          upstreamNo: p.upstreamNo,
          messageId: p.source === 'OMS' ? p.messageId : undefined,
          version: 1,
          createFingerprint: businessFingerprint,
          channelCode: p.channelCode,
          recipient: p.recipient,
          address: p.address,
          phone: p.phone,
          originalInboundNo: p.originalInboundNo,
          emailBasis: p.emailBasis,
          remark: p.remark,
          status: 'PENDING_HANDLE',
          items: [],
          specified: p.specified ?? [],
          createdAt: at,
          updatedAt: at,
        }
        p.items.forEach((i, idx) => {
          const master = skuMaster(p.customerId, i.skuCode)
          if (!master || master.status !== 'ENABLED') reject('sku', { sku: i.skuCode })
          const available = Math.max(0, outboundAvailable(s, p.warehouseCode, p.customerId, i.skuCode))
          if (p.type === 'B2C' && available < i.qty) reject('available', { sku: i.skuCode, demand: i.qty, available })
          o.items.push({
            lineNo: idx + 1,
            skuCode: i.skuCode,
            demandQty: i.qty,
            reservedQty: p.type === 'OTHER' ? 0 : Math.min(i.qty, available),
            pickedQty: 0,
            verifiedQty: 0,
            shippedQty: 0,
          })
        })
        if (p.type === 'OTHER') {
          if (!o.specified.length) reject('specified')
          o.items.forEach((i) => {
            block(o.warehouseCode, o.customerId, i.skuCode)
            const specs = o.specified.filter((r) => r.itemNo === i.lineNo)
            if (specs.reduce((n, r) => n + r.qty, 0) !== i.demandQty) reject('specified')
            specs.forEach((sp) => {
              const r = inventory(sp.inventoryId)
              if (
                !sameSku(r, o.warehouseCode, o.customerId, i.skuCode) ||
                r.qualityType !== 'DEFECTIVE' ||
                !['PICK', 'STORAGE', 'DEFECT'].includes(loc(r.warehouseCode, r.locationCode)?.type ?? '') ||
                !loc(r.warehouseCode, r.locationCode)?.enabled ||
                !positive(sp.qty) ||
                sp.qty > r.onHandQty - (r.allocatedQty ?? 0)
              )
                reject('specified')
              if (
                skuMaster(o.customerId, i.skuCode)?.snEnabled &&
                (sp.serialNos.length !== sp.qty ||
                  new Set(sp.serialNos).size !== sp.qty ||
                  sp.serialNos.some((sn) => !r.serialNos?.includes(sn)) ||
                  s.outboundOrders.some(
                    (old) =>
                      !['CANCELLED', 'SHIPPED'].includes(old.status) &&
                      old.specified.some((v) => v.serialNos.some((sn) => sp.serialNos.includes(sn))),
                  ))
              )
                reject('serial')
              r.allocatedQty = (r.allocatedQty ?? 0) + sp.qty
            })
          })
        }
        s.outboundOrders.push(o)
        resultNo = no
        break
      }
      case 'CHANGE': {
        const o = order(c.no)
        ensureLive(o)
        if (o.source !== 'OMS' || o.type === 'OTHER' || s.outboundPickTasks.some((t) => taskOrderNos(t).includes(o.no)))
          reject('change')
        if (c.version !== o.version) reject('version')
        o.items.forEach((i) => {
          i.reservedQty = 0
        })
        if (
          !c.items.length ||
          new Set(c.items.map((i) => i.skuCode)).size !== c.items.length ||
          c.items.some((i) => !positive(i.qty))
        )
          reject('quantity')
        o.items = c.items.map((i, idx) => {
          if (skuMaster(o.customerId, i.skuCode)?.status !== 'ENABLED') reject('sku', { sku: i.skuCode })
          const available = Math.max(0, outboundAvailable(s, o.warehouseCode, o.customerId, i.skuCode))
          if (o.type === 'B2C' && available < i.qty) reject('available', { sku: i.skuCode, demand: i.qty, available })
          return {
            lineNo: idx + 1,
            skuCode: i.skuCode,
            demandQty: i.qty,
            reservedQty: Math.min(i.qty, available),
            pickedQty: 0,
            verifiedQty: 0,
            shippedQty: 0,
          }
        })
        o.version += 1
        resultNo = o.no
        break
      }
      case 'ALLOCATE': {
        role('ORGANIZER')
        resultNo = allocate([order(c.no)]).no
        break
      }
      case 'WAVE': {
        role('ORGANIZER')
        const orders = [...new Set(c.orderNos)].map(order)
        if (
          orders.length < 2 ||
          orders.some(
            (o) =>
              o.type !== 'B2C' ||
              o.status !== 'PENDING_HANDLE' ||
              o.warehouseCode !== orders[0].warehouseCode ||
              o.customerId !== orders[0].customerId ||
              s.outboundPickTasks.some((t) => taskOrderNos(t).includes(o.no)),
          )
        )
          reject('wave')
        const no = nextDocNo(
          'WV',
          s.outboundWaves.map((w) => w.no),
          at,
        )
        const t = allocate(orders, no)
        s.outboundWaves.push({
          no,
          warehouseCode: orders[0].warehouseCode,
          customerId: orders[0].customerId,
          taskNo: t.no,
          members: orders.map((o) => o.no),
          status: 'RELEASED',
          createdAt: at,
        })
        resultNo = no
        break
      }
      case 'PICK': {
        role('WORKER')
        const t = task(c.no)
        if (t.confirmations.includes(c.confirmationId)) return finish(t.no)
        if (!openTask(t)) reject('terminal')
        const l = t.lines.find((l) => l.id === c.lineId) ?? reject('notFound')
        const r = inventory(l.inventoryId)
        if (frozen(t.warehouseCode, t.customerId, l.skuCode)) reject('pending', { sku: l.skuCode })
        const master = skuMaster(t.customerId, l.skuCode)
        const barcode = s.skuBarcodes.some(
          (b) =>
            b.ownerCode === master?.ownerCode &&
            b.skuCode === l.skuCode &&
            b.barcode === c.sku &&
            b.status === 'ENABLED',
        )
        if (
          c.location !== l.locationCode ||
          (c.sku !== l.skuCode && c.sku !== master?.primaryBarcode && !barcode) ||
          (l.batchNo ?? '') !== (c.batch ?? '')
        )
          reject('scan')
        if (!positive(c.qty) || c.qty > l.plannedQty - l.pickedQty - l.shortageQty || c.qty > (r.allocatedQty ?? 0))
          reject('quantity')
        if (
          master?.snEnabled &&
          (c.serialNos.length !== c.qty ||
            new Set(c.serialNos).size !== c.qty ||
            c.serialNos.some((sn) => !r.serialNos?.includes(sn)))
        )
          reject('serial')
        const snPool = [...c.serialNos]
        let remaining = c.qty
        l.shares.forEach((p) => {
          if (!remaining || order(p.orderNo).status === 'CANCELLED') return
          const already = t.assignments
            .filter((a) => a.lineId === l.id && a.orderNo === p.orderNo && a.itemNo === p.itemNo)
            .reduce((n, a) => n + a.pickedQty, 0)
          const qty = Math.min(remaining, Math.max(0, p.qty - already))
          if (!qty) return
          const o = order(p.orderNo)
          const sns = master?.snEnabled ? snPool.splice(0, qty) : []
          if (
            o.type === 'OTHER' &&
            sns.some(
              (sn) =>
                !o.specified.some(
                  (sp) => sp.inventoryId === r.id && sp.itemNo === p.itemNo && sp.serialNos.includes(sn),
                ),
            )
          )
            reject('serial')
          const stageId = move(r.id, t.stagingCode, qty, sns, t.no, 'PICK')
          t.assignments.push({
            id: `${t.no}-A${t.assignments.length + 1}`,
            lineId: l.id,
            orderNo: p.orderNo,
            itemNo: p.itemNo,
            stagingInventoryId: stageId,
            pickedQty: qty,
            activeQty: qty,
            serialNos: sns,
            activeSerialNos: [...sns],
            at,
            operator,
          })
          remaining -= qty
        })
        if (remaining) reject('quantity')
        l.pickedQty += c.qty
        r.allocatedQty = (r.allocatedQty ?? 0) - c.qty
        t.status = 'PICKING'
        t.confirmations.push(c.confirmationId)
        resultNo = t.no
        break
      }
      case 'SHORTAGE': {
        role('WORKER')
        const t = task(c.no)
        if (!openTask(t)) reject('terminal')
        const l = t.lines.find((l) => l.id === c.lineId) ?? reject('notFound')
        if (!positive(c.qty) || c.qty > l.plannedQty - l.pickedQty - l.shortageQty) reject('quantity')
        const r = inventory(l.inventoryId)
        r.allocatedQty = (r.allocatedQty ?? 0) - c.qty
        l.shortageQty += c.qty
        l.shortageReason = c.reason
        const previouslyBlocked = allocationBlocked(s, t.warehouseCode, t.customerId, l.skuCode)
        let left = c.qty
        const lostShares: PickShare[] = []
        ;[...l.shares].reverse().forEach((p) => {
          const picked = t.assignments
            .filter((a) => a.lineId === l.id && a.orderNo === p.orderNo)
            .reduce((n, a) => n + a.pickedQty, 0)
          const qty = Math.min(left, Math.max(0, p.qty - picked))
          if (qty) {
            p.qty -= qty
            left -= qty
            lostShares.unshift({ ...p, qty })
          }
        })
        if (!previouslyBlocked && l.qualityType === 'GOOD')
          lostShares.forEach((p) => {
            let need = p.qty
            candidates(t.warehouseCode, t.customerId, l.skuCode, r.id).forEach((target) => {
              const qty = Math.min(need, target.onHandQty - (target.allocatedQty ?? 0))
              if (qty) {
                addLine(t, target, { ...p, qty })
                need -= qty
              }
            })
            l.replacedQty = (l.replacedQty ?? 0) + (p.qty - need)
          })
        markPending(t.warehouseCode, t.customerId, l.skuCode, t.no)
        t.status = 'PICKING'
        resultNo = t.no
        break
      }
      case 'FINISH_PICK': {
        role('WORKER')
        const t = task(c.no)
        if (!openTask(t)) reject('terminal')
        if (t.lines.some((l) => l.plannedQty !== l.pickedQty + l.shortageQty)) reject('unfinished')
        t.status = 'COMPLETED'
        t.completedAt = at
        t.submittedBy = operator
        resultNo = t.no
        break
      }
      case 'VERIFY': {
        role('WORKER')
        const o = order(c.no)
        ensureLive(o)
        if (
          !c.lines.length ||
          new Set(c.lines.map((l) => l.assignmentId)).size !== c.lines.length ||
          (c.containerType !== 'NONE' && !c.containerNo.trim())
        )
          reject('verification')
        if (
          c.method === 'SORT' &&
          s.outboundVerifications.some((v) => v.orderNo === o.no && v.method === 'SORT' && !v.deleted)
        )
          reject('verification')
        if (o.type === 'B2C' && c.method === 'PACK' && (c.containerType !== 'PACKAGE' || !c.weightKg))
          reject('verification')
        if (c.weightKg !== undefined && (!Number.isFinite(c.weightKg) || c.weightKg <= 0)) reject('quantity')
        const assignments = orderAssignments(s, o.no)
        const lines = c.lines.map((l) => {
          const a = assignments.find((a) => a.id === l.assignmentId) ?? reject('verification')
          const remaining = verificationRemaining(s, a)
          if (!positive(l.qty) || l.qty > remaining.qty) reject('quantity')
          if (
            skuMaster(o.customerId, a.line.skuCode)?.snEnabled &&
            (l.serialNos.length !== l.qty ||
              new Set(l.serialNos).size !== l.qty ||
              l.serialNos.some((sn) => !remaining.serialNos.includes(sn)))
          )
            reject('serial')
          return {
            assignmentId: a.id,
            itemNo: a.itemNo,
            skuCode: a.line.skuCode,
            qty: l.qty,
            effectiveQty: l.qty,
            serialNos: l.serialNos,
          }
        })
        const no = nextDocNo(
          'VR',
          s.outboundVerifications.map((v) => v.no),
          at,
        )
        s.outboundVerifications.push({
          no,
          orderNo: o.no,
          method: c.method,
          containerType: c.containerType,
          containerNo: c.containerNo,
          weightKg: c.weightKg,
          remark: c.remark,
          trackingNo: c.containerType === 'PACKAGE' ? `MOCK-${no}` : undefined,
          lines,
          at,
          operator,
        })
        resultNo = no
        break
      }
      case 'DELETE_VERIFY': {
        role('WORKER')
        const v = s.outboundVerifications.find((v) => v.no === c.no) ?? reject('notFound')
        ensureLive(order(v.orderNo))
        if (v.deleted) reject('terminal')
        v.deleted = true
        v.lines.forEach((l) => {
          l.effectiveQty = 0
        })
        resultNo = v.orderNo
        break
      }
      case 'PACK_VERIFY': {
        role('WORKER')
        const v = s.outboundVerifications.find((v) => v.no === c.no) ?? reject('notFound')
        ensureLive(order(v.orderNo))
        if (v.deleted || !c.containerNo.trim() || !Number.isFinite(c.weightKg) || c.weightKg <= 0)
          reject('verification')
        v.containerType = 'PACKAGE'
        v.containerNo = c.containerNo
        v.weightKg = c.weightKg
        v.trackingNo = `MOCK-${v.no}`
        resultNo = v.no
        break
      }
      case 'UNPICK': {
        role('WORKER')
        if (c.reason === 'DAMAGED') supervisor()
        const o = order(c.no)
        ensureLive(o)
        const t =
          s.outboundPickTasks.find((t) => t.assignments.some((a) => a.id === c.assignmentId && a.orderNo === o.no)) ??
          reject('notFound')
        resultNo = unpick(
          o,
          [{ a: t.assignments.find((a) => a.id === c.assignmentId)!, t, qty: c.qty, serialNos: c.serialNos }],
          c.reason,
        )
        break
      }
      case 'CANCEL': {
        const o = order(c.no)
        if (o.status === 'CANCELLED') {
          resultNo = o.no
          break
        }
        ensureLive(o)
        if (o.source === 'OMS' && !message) reject('message')
        if (o.source === 'MANUAL') supervisor()
        if (message && message.version !== o.version) reject('version')
        s.outboundPickTasks
          .filter((t) => taskOrderNos(t).includes(o.no))
          .forEach((t) => {
            if (openTask(t))
              t.lines.forEach((l) =>
                l.shares
                  .filter((p) => p.orderNo === o.no)
                  .forEach((p) => {
                    const already = t.assignments
                      .filter((a) => a.orderNo === o.no && a.lineId === l.id)
                      .reduce((n, a) => n + a.pickedQty, 0)
                    const qty = Math.max(0, p.qty - already)
                    inventory(l.inventoryId).allocatedQty = (inventory(l.inventoryId).allocatedQty ?? 0) - qty
                    l.plannedQty -= qty
                    p.qty -= qty
                  }),
              )
            if (openTask(t) && !taskOrderNos(t).some((n) => n !== o.no && order(n).status !== 'CANCELLED')) {
              t.status = 'CLOSED'
              t.completedAt = at
            }
          })
        if (o.type === 'OTHER' && !s.outboundPickTasks.some((t) => taskOrderNos(t).includes(o.no)))
          o.specified.forEach((sp) => {
            const r = inventory(sp.inventoryId)
            r.allocatedQty = (r.allocatedQty ?? 0) - sp.qty
          })
        const all = s.outboundPickTasks.flatMap((t) =>
          t.assignments
            .filter((a) => a.orderNo === o.no && a.activeQty > 0)
            .map((a) => ({ a, t, qty: a.activeQty, serialNos: [...a.activeSerialNos] })),
        )
        if (all.length) unpick(o, all, 'CANCEL')
        o.items.forEach((i) => {
          i.reservedQty = 0
        })
        if (c.reason?.trim()) o.cancelReason = c.reason.trim()
        o.status = 'CANCELLED'
        o.cancelledAt = at
        s.outboundWaves.forEach((w) => {
          if (!w.members.includes(o.no) || w.status === 'CANCELLED') return
          if (w.members.every((m) => order(m).status === 'CANCELLED')) w.status = 'CANCELLED'
        })
        if (message) o.version += 1
        resultNo = o.no
        break
      }
      case 'SHIP': {
        supervisor()
        const o = order(c.no)
        ensureLive(o)
        o.items.forEach((i) => {
          if (frozen(o.warehouseCode, o.customerId, i.skuCode)) reject('pending', { sku: i.skuCode })
        })
        if (s.outboundPickTasks.some((t) => openTask(t) && taskOrderNos(t).includes(o.no))) reject('unfinished')
        const shortAllowed = o.type === 'FBA' || o.type === 'WHOLESALE'
        if (
          !o.items.some((i) => i.pickedQty > 0) ||
          o.items.some((i) => i.verifiedQty !== i.pickedQty || (!shortAllowed && i.pickedQty !== i.demandQty))
        )
          reject('ship')
        if (
          o.type === 'B2C' &&
          s.outboundVerifications
            .filter((v) => v.orderNo === o.no && !v.deleted && v.lines.some((l) => l.effectiveQty > 0))
            .some((v) => v.containerType !== 'PACKAGE' || !v.containerNo || !v.trackingNo || !v.weightKg)
        )
          reject('verification')
        orderAssignments(s, o.no)
          .filter((a) => a.activeQty > 0)
          .forEach((a) => {
            const r = inventory(a.stagingInventoryId)
            if (r.onHandQty < a.activeQty || a.activeSerialNos.some((sn) => !r.serialNos?.includes(sn)))
              reject('stockChanged')
            r.onHandQty -= a.activeQty
            r.lockedQty = r.qualityType === 'DEFECTIVE' ? r.onHandQty : 0
            r.serialNos = r.serialNos?.filter((sn) => !a.activeSerialNos.includes(sn))
            stockLog(r, -a.activeQty, o.no, 'SHIP')
          })
        o.items.forEach((i) => {
          i.shippedQty = i.verifiedQty
        })
        o.status = 'SHIPPED'
        o.shippedAt = at
        o.shippedBy = operator
        if (c.handover) addHandover(o, c.handover)
        if (o.upstreamNo)
          s.outboundResults.push({
            orderNo: o.no,
            upstreamNo: o.upstreamNo,
            sequence: 1,
            status: 'SENT',
            attempts: 1,
            at,
            items: o.items.map((i) => ({
              skuCode: i.skuCode,
              shippedQty: i.shippedQty,
              unshippedQty: i.demandQty - i.shippedQty,
            })),
          })
        resultNo = o.no
        break
      }
      case 'RETRY_RESULT': {
        const result = s.outboundResults.find((r) => r.orderNo === c.no) ?? reject('notFound')
        if (c.simulateFailure) result.status = 'FAILED'
        else if (result.status === 'SENT') reject('resultSent')
        else {
          result.attempts += 1
          result.status = 'SENT'
        }
        resultNo = result.orderNo
        break
      }
      case 'HANDOVER': {
        role('WORKER')
        const o = order(c.no)
        if (o.status !== 'SHIPPED') reject('handover')
        resultNo = addHandover(o, c)
        break
      }
      case 'SAVE_PUTBACK': {
        role('WORKER')
        const p = s.outboundPutbacks.find((p) => p.no === c.no) ?? reject('notFound')
        if (p.status === 'COMPLETED') reject('terminal')
        const l = p.lines.find((l) => l.id === c.lineId) ?? reject('notFound')
        validateReturnTarget(p, l, c.location)
        if (!positive(c.qty) || c.qty > l.qty - l.savedQty) reject('quantity')
        // SN 行：PDA 逐件扫到的序列号须是本行还没落位的；不传时按应返库清单顺序取
        const placed = (l.placements ?? []).flatMap((pl) => pl.serialNos)
        const left = l.serialNos.filter((sn) => !placed.includes(sn))
        if (
          l.serialNos.length &&
          c.serialNos &&
          (c.serialNos.length !== c.qty ||
            new Set(c.serialNos).size !== c.qty ||
            c.serialNos.some((sn) => !left.includes(sn)))
        )
          reject('serial')
        l.placements = [
          ...(l.placements ?? []),
          {
            location: c.location,
            qty: c.qty,
            serialNos: l.serialNos.length ? (c.serialNos ?? left.slice(0, c.qty)) : [],
          },
        ]
        l.savedQty += c.qty
        l.targetLocation = c.location
        p.status = 'PUTAWAYING'
        resultNo = p.no
        break
      }
      case 'RESET_PUTBACK_LINE': {
        role('WORKER')
        const p = s.outboundPutbacks.find((p) => p.no === c.no) ?? reject('notFound')
        if (p.status === 'COMPLETED') reject('terminal')
        const l = p.lines.find((l) => l.id === c.lineId) ?? reject('notFound')
        l.placements = []
        l.savedQty = 0
        l.targetLocation = undefined
        resultNo = p.no
        break
      }
      case 'SUBMIT_PUTBACK': {
        role('WORKER')
        const p = s.outboundPutbacks.find((p) => p.no === c.no) ?? reject('notFound')
        if (p.status === 'COMPLETED') reject('terminal')
        if (p.lines.some((l) => l.savedQty !== l.qty || !l.targetLocation)) reject('unfinished')
        p.lines.forEach((l) => {
          const placements = l.placements ?? [{ location: l.targetLocation!, qty: l.qty, serialNos: l.serialNos }]
          for (const actual of placements) {
            validateReturnTarget(p, l, actual.location)
            move(l.stagingInventoryId, actual.location, actual.qty, actual.serialNos, p.no, 'RETURN')
          }
        })
        p.status = 'COMPLETED'
        p.completedAt = at
        p.submittedBy = operator
        resultNo = p.no
        break
      }
      case 'CREATE_COUNT': {
        role('WORKER')
        const { warehouseCode: w, customerId: owner, skuCode: sku } = c
        if (
          frozen(w, owner, sku) ||
          s.outboundPickTasks.some(
            (t) =>
              t.warehouseCode === w && t.customerId === owner && openTask(t) && t.lines.some((l) => l.skuCode === sku),
          ) ||
          s.outboundPutbacks.some(
            (p) =>
              p.warehouseCode === w &&
              p.customerId === owner &&
              p.status !== 'COMPLETED' &&
              p.lines.some((l) => l.skuCode === sku),
          ) ||
          s.putawayOrders.some(
            (p) =>
              p.warehouseCode === w &&
              p.customerId === owner &&
              p.status !== 'COMPLETED' &&
              p.planLines.some((l) => l.skuCode === sku),
          )
        )
          reject('countBusy')
        const rows = s.inventory.filter(
          (r) =>
            sameSku(r, w, owner, sku) &&
            r.onHandQty > 0 &&
            ['PICK', 'STORAGE', 'DEFECT'].includes(loc(w, r.locationCode)?.type ?? ''),
        )
        if (!rows.length || rows.some((r) => (r.allocatedQty ?? 0) > 0)) reject('countBusy')
        const no = nextDocNo(
          'ST',
          s.inventoryCounts.map((p) => p.no),
          at,
        )
        s.inventoryCounts.push({
          no,
          warehouseCode: w,
          customerId: owner,
          skuCode: sku,
          status: 'COUNTING',
          lines: rows.map((r) => ({ inventoryId: r.id, bookQty: r.onHandQty })),
          createdAt: at,
        })
        resultNo = no
        break
      }
      case 'CONFIRM_COUNT': {
        supervisor()
        const p = s.inventoryCounts.find((p) => p.no === c.no) ?? reject('notFound')
        if (p.status !== 'COUNTING') reject('terminal')
        if (c.lines.length !== p.lines.length || new Set(c.lines.map((l) => l.inventoryId)).size !== p.lines.length)
          reject('quantity')
        p.lines.forEach((l) => {
          const actual = c.lines.find((a) => a.inventoryId === l.inventoryId) ?? reject('quantity')
          const r = inventory(l.inventoryId)
          if (!nonnegative(actual.qty)) reject('quantity')
          if (
            skuMaster(p.customerId, p.skuCode)?.snEnabled &&
            (actual.serialNos.length !== actual.qty || new Set(actual.serialNos).size !== actual.qty)
          )
            reject('serial')
          const diff = actual.qty - r.onHandQty
          r.onHandQty = actual.qty
          r.lockedQty = r.qualityType === 'DEFECTIVE' ? actual.qty : 0
          r.serialNos = actual.serialNos
          l.actualQty = actual.qty
          l.serialNos = actual.serialNos
          if (diff) stockLog(r, diff, p.no, 'ADJUST')
        })
        const sns = s.inventory
          .filter((r) => r.customerId === p.customerId && r.skuCode === p.skuCode)
          .flatMap((r) => r.serialNos ?? [])
        if (new Set(sns).size !== sns.length) reject('serial')
        p.status = 'COMPLETED'
        p.completedAt = at
        const idx = s.skuAllocationControls.findIndex((r) => sameSku(r, p.warehouseCode, p.customerId, p.skuCode))
        if (idx >= 0) s.skuAllocationControls.splice(idx, 1)
        resultNo = p.no
        break
      }
      case 'CANCEL_COUNT': {
        role('WORKER')
        const p = s.inventoryCounts.find((p) => p.no === c.no) ?? reject('notFound')
        if (p.status !== 'COUNTING') reject('terminal')
        p.status = 'CANCELLED'
        resultNo = p.no
        break
      }
    }
    recompute()
    // 订单占用和库位分配同样写既有库存流水，实际变动为0，避免把它们当成实物移动。
    for (const o of s.outboundOrders) {
      const before = state.outboundOrders.find((old) => old.no === o.no)
      const skus = new Set([...o.items.map((i) => i.skuCode), ...(before?.items.map((i) => i.skuCode) ?? [])])
      for (const sku of skus) {
        const delta =
          o.items.filter((i) => i.skuCode === sku).reduce((n, i) => n + i.reservedQty, 0) -
          (before?.items.filter((i) => i.skuCode === sku).reduce((n, i) => n + i.reservedQty, 0) ?? 0)
        if (delta)
          s.inventoryLogs.push({
            id: `LOG-RES-${at}-${s.inventoryLogs.length}`,
            warehouseCode: o.warehouseCode,
            customerId: o.customerId,
            skuCode: sku,
            locationCode: '',
            type: 'RESERVE',
            level: 'SKU',
            qtyChange: 0,
            reservedChange: delta,
            refNo: o.no,
            operator,
            createdAt: at,
          })
      }
    }
    for (const r of s.inventory) {
      const delta = (r.allocatedQty ?? 0) - (state.inventory.find((old) => old.id === r.id)?.allocatedQty ?? 0)
      if (delta)
        s.inventoryLogs.push({
          id: `LOG-ALLOC-${at}-${s.inventoryLogs.length}`,
          warehouseCode: r.warehouseCode,
          customerId: r.customerId,
          skuCode: r.skuCode,
          locationCode: r.locationCode,
          type: 'ALLOCATE',
          level: 'DETAIL',
          qtyChange: 0,
          allocatedChange: delta,
          refNo: resultNo ?? '',
          operator,
          createdAt: at,
        })
    }
    if (message)
      s.outboundMessages.push({
        ...message,
        fingerprint,
        status: 'ACCEPTED',
        orderNo: c.type === 'CREATE' ? resultNo : 'no' in c ? c.no : undefined,
        at,
      })
    return finish(resultNo)
  } catch (e) {
    if (!(e instanceof BusinessError)) throw e
    if (!message) return { ok: false, errorKey: e.key, params: e.params }
    // 拒收只留消息事实，业务状态使用原快照。
    const original = structuredClone({ ...data, inventory: state.inventory, inventoryLogs: state.inventoryLogs })
    original.outboundMessages.push({
      ...message,
      fingerprint,
      status: 'REJECTED',
      errorKey: e.key,
      params: e.params,
      at,
    })
    return { ok: false, errorKey: e.key, params: e.params, patch: original }
  }
}

/** 出库动作写操作日志时挂到哪个对象：任务、返库、波次各记各的，复核记录归原出库单 */
export function outboundAuditRef(
  s: Pick<SeedData, 'outboundVerifications'>,
  c: OutboundCommand,
  resultNo?: string,
): { refType: AuditRefType; refNo: string; command: string; detail?: string } {
  const base = { command: c.type }
  switch (c.type) {
    case 'WAVE':
      return { ...base, refType: 'WAVE', refNo: resultNo ?? '-', detail: c.orderNos.join(', ') }
    case 'PICK':
      return { ...base, refType: 'PICK_TASK', refNo: c.no, detail: `${c.sku} × ${c.qty}` }
    case 'SHORTAGE':
      return { ...base, refType: 'PICK_TASK', refNo: c.no, detail: `× ${c.qty}` }
    case 'FINISH_PICK':
      return { ...base, refType: 'PICK_TASK', refNo: c.no }
    case 'SAVE_PUTBACK':
      return { ...base, refType: 'PUTBACK', refNo: c.no, detail: `${c.location} × ${c.qty}` }
    case 'RESET_PUTBACK_LINE':
    case 'SUBMIT_PUTBACK':
      return { ...base, refType: 'PUTBACK', refNo: c.no }
    case 'DELETE_VERIFY':
    case 'PACK_VERIFY':
      return {
        ...base,
        refType: 'OUTBOUND',
        refNo: s.outboundVerifications.find((v) => v.no === c.no)?.orderNo ?? c.no,
        detail: c.no,
      }
    case 'CREATE':
      return { ...base, refType: 'OUTBOUND', refNo: resultNo ?? '-' }
    case 'CREATE_COUNT':
    case 'CONFIRM_COUNT':
    case 'CANCEL_COUNT':
      return { ...base, refType: 'OUTBOUND', refNo: 'no' in c ? c.no : (resultNo ?? '-') }
    default:
      return { ...base, refType: 'OUTBOUND', refNo: c.no, detail: resultNo && resultNo !== c.no ? resultNo : undefined }
  }
}
