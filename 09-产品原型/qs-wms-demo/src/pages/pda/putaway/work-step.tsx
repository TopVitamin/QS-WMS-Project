import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaStopCard } from '@/components/pda/pda-stop-card'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { currentAndNextStop } from '@/lib/outbound-pick-route'
import {
  findLocation,
  NO_SUGGESTED_STOP,
  putawayStops,
  remainingQty,
  validatePutawayLocation,
  type PutawayStop,
} from '@/lib/putaway'
import { beep } from '@/lib/scan-beep'
import type { PdaPutawayCount } from '@/stores/pda-putaway-session'
import type { PutawayOrder, PutawayPlanLine } from '@/types/inbound'
import { PutawayContext, PutawayLineCard, PutawayPlacements } from './putaway-shared'
import type { PutawayFlow } from './use-putaway-flow'

/**
 * 按库位上架（PDA 上架 PRD 第 3～5 节）：一屏一个推荐库位，先扫目标库位（可改放到其他合法库位），
 * 再扫商品计数；一行数满自动保存落位，本站放完自动跳到下一站，全部落完进入汇总提交。保存不动库存。
 */
export function PutawayWorkStep({ flow }: { flow: PutawayFlow }) {
  const { t, nav } = flow
  const order = flow.findOrder(nav.param('po'))
  const stops = order ? putawayStops(order, flow.locationContext) : []

  useEffect(() => {
    if (!order) nav.replace('list')
    else if (order.status === 'COMPLETED') {
      toast.info(t('pdaPutaway.error.orderSubmitted'))
      nav.replace('list')
    } else if (stops.length === 0) nav.replace('done', { po: order.putawayNo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.putawayNo, order?.status, stops.length])

  if (!order || order.status === 'COMPLETED' || stops.length === 0) return null
  return <StopWorkspace key={order.putawayNo} flow={flow} order={order} stops={stops} />
}

/** 到站：哪一站（推荐库位）、实际放到哪个库位 */
interface Arrival {
  at?: string
  to?: string
}

/** 一次扫码或按钮动作所依据的现场 */
interface Snapshot {
  order: PutawayOrder
  stops: PutawayStop[]
  current?: PutawayStop
  arrived: boolean
  target?: string
  pending?: PdaPutawayCount
}

function StopWorkspace({ flow, order, stops }: { flow: PutawayFlow; order: PutawayOrder; stops: PutawayStop[] }) {
  const { t, nav } = flow
  const at = nav.param('at')
  const to = nav.param('to')
  const { current, next } = currentAndNextStop(stops, at)
  /** 没有推荐库位的一站：扫任一可用库位作为目标 */
  const anywhere = current.location === NO_SUGGESTED_STOP
  /** 扫过目标库位才算到站；目标可以不是推荐库位 */
  const arrived = Boolean(to) && at === current.location
  const target = arrived ? to! : current.location
  const count = flow.countOf(order)
  const countLine = count ? current.lines.find((l) => l.lineNo === count.lineNo) : undefined
  /** 计数要落到扫过的目标库位上：没到站（如重新进入本单）时先不显示，重扫目标后接着数 */
  const pending = arrived && countLine && count && count.qty > 0 ? count : undefined
  const [selected, setSelected] = useState<number>()
  const [message, setMessage] = useState<ScanMessage>()
  /** 扫码处理读的到站信息与选中行：路由切换是过渡更新，扫完库位紧跟的一枪可能还拿着旧渲染 */
  const arrivalRef = useRef<Arrival>({ at, to })
  useEffect(() => {
    arrivalRef.current = { at, to }
  }, [at, to])
  const selectedRef = useRef<number | undefined>(undefined)
  /** 全部落完、正在进入汇总提交时不再纠正路由 */
  const leavingRef = useRef(false)
  /** 换站时主区回到顶部：新库位卡在最上面，跳站后一眼能看到 */
  const mainRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [current.location])

  const choose = (lineNo?: number) => {
    selectedRef.current = lineNo
    setSelected(lineNo)
  }
  const activeLineNo =
    countLine?.lineNo ??
    (current.lines.some((l) => l.lineNo === selected) ? selected : undefined) ??
    (current.lines.length === 1 ? current.lines[0].lineNo : undefined)

  const stopKey = stops.map((s) => s.location).join('|')
  // 路由与草稿对不上时纠正：到站的库位已放完就清掉；有未保存计数时回到它所在的那一站（重扫目标库位后接着数）。
  // 按 ref 判断：扫完库位紧跟一枪时路由还没切过来，不能拿旧的 at 把刚扫的目标冲掉
  useEffect(() => {
    if (leavingRef.current) return
    const live = arrivalRef.current
    if (live.at && !stops.some((s) => s.location === live.at)) {
      arrivalRef.current = {}
      nav.replace('work', { po: order.putawayNo })
      return
    }
    if (!count) return
    const stop = stops.find((s) => s.lines.some((l) => l.lineNo === count.lineNo))
    if (!stop) flow.setCount(order, undefined)
    else if (!live.at) {
      arrivalRef.current = { at: stop.location }
      nav.replace('work', { po: order.putawayNo, at: stop.location })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, stopKey, count?.lineNo])

  /** 按最新数据取现场（动作刚写入 store、路由刚切换时组件可能还没重渲染） */
  const snapshot = (): Snapshot => {
    const live = flow.latestOrder(order.putawayNo) ?? order
    const liveStops = putawayStops(live, flow.liveLocationContext())
    const { at: liveAt, to: liveTo } = arrivalRef.current
    const stop = currentAndNextStop(liveStops, liveAt)
    const isArrived = Boolean(liveTo) && stop.current?.location === liveAt
    const liveCount = flow.liveCountOf(order.putawayNo)
    const onStop = liveCount && stop.current?.lines.some((l) => l.lineNo === liveCount.lineNo)
    return {
      order: live,
      stops: liveStops,
      current: stop.current,
      arrived: isArrived,
      target: isArrived ? liveTo : stop.current?.location,
      pending: isArrived && onStop && liveCount.qty > 0 ? liveCount : undefined,
    }
  }

  const arrive = (arrival: Arrival) => {
    arrivalRef.current = arrival
    nav.replace('work', { po: order.putawayNo, ...arrival })
  }
  const stopName = (location: string) => (location === NO_SUGGESTED_STOP ? t('pdaPutaway.noSuggestShort') : location)
  const lineOf = (s: Snapshot, lineNo?: number) => s.order.planLines.find((l) => l.lineNo === lineNo)
  const pendingError = (s: Snapshot) =>
    t('pdaPutaway.errPending', { sku: lineOf(s, s.pending?.lineNo)?.skuCode, count: s.pending?.qty })
  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  const ok = (text: string, tone: ScanMessage['tone'] = 'success') => {
    setMessage({ tone, text })
    return true
  }

  /** 保存落位（不动库存）；本站放完跳下一站，全部落完进入汇总提交 */
  const save = (s: Snapshot, line: PutawayPlanLine, qty: number, serialNos: string[]) => {
    const location = s.target!
    const res = flow.savePutawayLine({
      putawayNo: order.putawayNo,
      locationCode: location,
      planLineNo: line.lineNo,
      qty,
      serialNos: flow.isSn(s.order, line) ? serialNos : undefined,
      operator: flow.operator,
    })
    if (!res.ok) {
      void flow.notice(t('pdaPutaway.saveFailed'), t(res.errorKey))
      return false
    }
    flow.setCount(s.order, undefined)
    choose(undefined)
    const saved = t('pdaPutaway.saved', { sku: line.skuCode, qty, location })
    const after = flow.latestOrder(order.putawayNo)
    const afterStops = after ? putawayStops(after, flow.liveLocationContext()) : []
    if (afterStops.length === 0) {
      leavingRef.current = true
      toast.success(saved)
      nav.replace('done', { po: order.putawayNo })
      return true
    }
    if (!afterStops.some((stop) => stop.location === s.current?.location)) {
      const next = currentAndNextStop(afterStops).current.location
      ok(
        next === NO_SUGGESTED_STOP
          ? t('pdaPutaway.okStopDoneAny', { sku: line.skuCode, count: qty, location })
          : t('pdaPutaway.okStopDone', { sku: line.skuCode, count: qty, location, next }),
      )
      arrive({})
      return true
    }
    return ok(saved)
  }

  /** 扫一件 +1；数满本行剩余即自动保存落位 */
  const bump = (s: Snapshot, line: PutawayPlanLine, sn?: string) => {
    if (s.pending && s.pending.lineNo !== line.lineNo) return fail(pendingError(s))
    const remaining = remainingQty(s.order, line.lineNo)
    const qty = (s.pending?.qty ?? 0) + 1
    const serialNos = sn ? [...(s.pending?.serialNos ?? []), sn] : (s.pending?.serialNos ?? [])
    if (qty > remaining) return fail(t('pdaPutaway.errFull', { sku: line.skuCode, count: remaining }))
    choose(line.lineNo)
    if (qty < remaining) {
      flow.setCount(s.order, { lineNo: line.lineNo, qty, serialNos })
      return ok(t('pdaPutaway.okBump', { sku: line.skuCode, count: qty, total: remaining }))
    }
    return save(s, line, qty, serialNos)
  }

  /** 同一站同一商品多行（多批次）时，用正在数的或点选的那一行；没选就提示点选 */
  const pickLine = (s: Snapshot, candidates: PutawayPlanLine[]) =>
    candidates.length === 1
      ? candidates[0]
      : candidates.find((l) => l.lineNo === (s.pending?.lineNo ?? selectedRef.current))

  const onScan = (raw: string): boolean => {
    const code = raw.trim()
    const s = snapshot()
    const here = s.current
    if (!here) return false
    const openLines = s.stops.flatMap((stop) => stop.lines)

    // 库位：到推荐的那一站，或改放到另一个合法库位
    const location = findLocation(flow.locations, s.order.warehouseCode, code)
    if (location) {
      const err = validatePutawayLocation(s.order, location.code, flow.liveLocationContext())
      if (err) return fail(t('pdaPutaway.errLocation', { location: location.code, reason: t(err) }))
      if (s.pending && location.code !== s.target) return fail(pendingError(s))
      choose(undefined)
      const stop = s.stops.find((x) => x.location === location.code)
      arrive({ at: stop ? stop.location : here.location, to: location.code })
      if (stop) return ok(t('pdaPutaway.okArrived', { location: location.code }))
      return here.location === NO_SUGGESTED_STOP
        ? ok(t('pdaPutaway.okTarget', { location: location.code }))
        : ok(t('pdaPutaway.okOther', { location: location.code, suggested: here.location }), 'info')
    }

    /** 本单里已经全部落位的商品：说清是放完了，不当成不认识的码 */
    const placedSku = () => flow.resolveSkuIn(s.order, code)

    if (!s.arrived) {
      const snLine = openLines.find((l) => flow.serialPool(s.order, l).includes(code))
      const sku = snLine?.skuCode ?? flow.resolveSkuIn(s.order, code, openLines.map((l) => l.skuCode))
      const done = sku ? undefined : placedSku()
      if (done) return fail(t('pdaPutaway.errSkuDone', { sku: done }))
      if (here.location === NO_SUGGESTED_STOP) {
        return fail(sku ? t('pdaPutaway.errAnyFirst', { sku }) : t('pdaPutaway.errScanAny', { code }))
      }
      return fail(
        sku
          ? t('pdaPutaway.errLocationFirst', { sku, location: here.location })
          : t('pdaPutaway.errScanLocation', { code, location: here.location }),
      )
    }

    // 批次号：同一站同一商品多批次时用来选行
    const batchLine = here.lines.find((l) => l.batchNo && l.batchNo.toUpperCase() === code.toUpperCase())
    if (batchLine) {
      if (s.pending && s.pending.lineNo !== batchLine.lineNo) return fail(pendingError(s))
      choose(batchLine.lineNo)
      return ok(t('pdaPutaway.okBatch', { batch: batchLine.batchNo }), 'info')
    }

    const sku = flow.resolveSkuIn(s.order, code, here.lines.map((l) => l.skuCode))
    if (sku) {
      const candidates = here.lines.filter((l) => l.skuCode === sku)
      if (candidates.every((l) => flow.isSn(s.order, l))) return fail(t('pdaPutaway.errNeedSn', { sku }))
      const line = pickLine(s, candidates)
      if (!line) return ok(t('pdaPutaway.infoPickBatch', { sku, count: candidates.length }), 'info')
      return bump(s, line)
    }

    const elsewhere = flow.resolveSkuIn(s.order, code, openLines.map((l) => l.skuCode))
    if (elsewhere) {
      const where = s.stops.find((x) => x.lines.some((l) => l.skuCode === elsewhere))?.location
      return fail(
        where === NO_SUGGESTED_STOP
          ? t('pdaPutaway.errOtherStopAny', { sku: elsewhere })
          : t('pdaPutaway.errOtherStop', { sku: elsewhere, location: where }),
      )
    }
    const done = placedSku()
    if (done) return fail(t('pdaPutaway.errSkuDone', { sku: done }))

    // 序列号：本站 SN 行的实收 SN（收货没采集 SN 时按商品 SN 规则认）
    const snLines = here.lines.filter((l) => flow.acceptsSerial(s.order, l, code))
    if (snLines.length > 0) {
      const used = s.pending?.serialNos.includes(code) || s.order.actualLines.some((a) => a.serialNos?.includes(code))
      if (used) return fail(t('pdaPutaway.errSnUsed', { sn: code }))
      const line = pickLine(s, snLines)
      if (!line) return ok(t('pdaPutaway.infoPickBatch', { sku: snLines[0].skuCode, count: snLines.length }), 'info')
      return bump(s, line, code)
    }

    return fail(t('pdaPutaway.errNotInOrder', { code }))
  }

  const savePending = () => {
    const s = snapshot()
    const line = lineOf(s, s.pending?.lineNo)
    if (!s.pending || !line) return
    if (save(s, line, s.pending.qty, s.pending.serialNos)) beep(true)
  }

  /** 点选行：本站另一行还有没保存的计数时先挡住 */
  const select = (line: PutawayPlanLine) => {
    const s = snapshot()
    if (s.pending && s.pending.lineNo !== line.lineNo) {
      beep(false)
      fail(pendingError(s))
      return
    }
    choose(line.lineNo)
  }

  const pendingLine = order.planLines.find((l) => l.lineNo === pending?.lineNo)
  const pendingSn = pendingLine ? flow.isSn(order, pendingLine) : false
  const sameSkuTwice = current.lines.some((l, i) => current.lines.findIndex((x) => x.skuCode === l.skuCode) !== i)
  const stopLocations = stops.map((s) => s.location)
  /** 演示用的「其他可放库位」：不在路径上、校验通过的第一个库位 */
  const another = flow.locations.find(
    (l) => !stopLocations.includes(l.code) && validatePutawayLocation(order, l.code, flow.locationContext) === null,
  )
  const candidates: ScanCandidate[] = arrived
    ? current.lines
        .flatMap((l) => {
          if (flow.isSn(order, l))
            return flow
              .serialPool(order, l)
              .filter((sn) => !pending?.serialNos.includes(sn))
              .slice(0, 2)
              .map((value) => ({ value }))
          const barcode = flow.barcodeOf(order, l.skuCode)
          return [
            { value: barcode, label: barcode !== l.skuCode ? l.skuCode : undefined },
            ...(sameSkuTwice && l.batchNo ? [{ value: l.batchNo }] : []),
          ]
        })
        .filter((c, i, all) => all.findIndex((x) => x.value === c.value) === i)
        .slice(0, 4)
    : [
        ...(anywhere ? [] : [{ value: current.location, label: t('pdaPutaway.suggestedShort') }]),
        ...(next && next.location !== NO_SUGGESTED_STOP ? [{ value: next.location }] : []),
        ...(another ? [{ value: another.code }] : []),
      ]

  return (
    <>
      <PdaHeader title={t('pda.putaway')} onBack={() => nav.back({ step: 'list' })} />
      <PutawayContext flow={flow} order={order} />
      <div ref={mainRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [overflow-anchor:none]">
        <PdaStopCard
          label={anywhere ? t('pdaPutaway.noSuggestStop') : t('pdaPutaway.goTo')}
          arrivedLabel={
            anywhere || target === current.location
              ? t('pdaPutaway.arrivedAt')
              : t('pdaPutaway.placeOther', { suggested: current.location })
          }
          location={arrived || !anywhere ? target : t('pdaPutaway.anyLocation')}
          arrived={arrived}
          nextLabel={t('pdaPutaway.next')}
          next={next ? stopName(next.location) : undefined}
        />
        <ScanInput
          label={
            arrived
              ? t('pdaPutaway.promptItem')
              : anywhere
                ? t('pdaPutaway.promptAny')
                : t('pdaPutaway.promptLocation', { location: current.location })
          }
          onScan={onScan}
          message={message}
          candidates={candidates}
        />
        <PdaSection title={t('pdaPutaway.stopLines', { count: current.lines.length })}>
          {current.lines.map((line) => (
            <PutawayLineCard
              key={line.lineNo}
              flow={flow}
              order={order}
              line={line}
              arrived={arrived}
              active={arrived && line.lineNo === activeLineNo}
              counted={pending?.lineNo === line.lineNo ? pending.qty : 0}
              serialNos={pending?.lineNo === line.lineNo ? pending.serialNos : []}
              onSelect={() => select(line)}
              onClearSerials={() => flow.setCount(order, undefined)}
            />
          ))}
        </PdaSection>
        <PutawayPlacements flow={flow} order={order} />
      </div>
      <PdaFooter
        hint={
          !arrived
            ? anywhere
              ? t('pdaPutaway.hintAny')
              : t('pdaPutaway.hintLocation', { location: current.location })
            : !pending
              ? t('pdaPutaway.hintItem')
              : undefined
        }
      >
        {pending && pendingLine && !pendingSn && (
          <QtyStepper
            hideLabel
            label={t('pdaPutaway.countLabel')}
            value={pending.qty}
            max={remainingQty(order, pendingLine.lineNo)}
            onChange={(qty) => {
              flow.setCount(order, { ...pending, qty })
              return true
            }}
            onScanText={(code) => beep(onScan(code))}
          />
        )}
        <PdaButton className="flex-1" disabled={!pending} onClick={savePending}>
          {pending ? t('pdaPutaway.saveCount', { count: pending.qty }) : t('pdaPutaway.saveIdle')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
