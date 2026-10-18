import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaStopCard } from '@/components/pda/pda-stop-card'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { currentAndNextStop, putbackLineRemaining, putbackStops, type PutbackStop } from '@/lib/outbound-pick-route'
import { beep } from '@/lib/scan-beep'
import type { PdaPickCount } from '@/stores/pda-outbound-session'
import type { OutboundPutback, PutbackLine } from '@/types/outbound'
import { ReturnContext, ReturnLineCard, ReturnPlacements } from './return-shared'
import type { ReturnFlow } from './use-return-flow'

/**
 * 按库位返库（PDA返库上架 PRD 第三节）：一屏一个建议库位，先扫目标库位（可改放到其他合法库位），
 * 再扫商品计数；一行数满自动保存落位，本站放完自动跳到下一站，全部保存后进入整单提交。保存不动库存。
 */
export function ReturnWorkStep({ flow }: { flow: ReturnFlow }) {
  const { t, nav } = flow
  const putback = flow.findPutback(nav.param('no'))
  const stops = putback ? putbackStops(putback) : []

  useEffect(() => {
    if (!putback) nav.replace('list')
    else if (putback.status === 'COMPLETED') {
      toast.info(t('outbound.pdaReturn.closed', { no: putback.no }))
      nav.replace('list')
    } else if (stops.length === 0) nav.replace('done', { no: putback.no })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [putback?.no, putback?.status, stops.length])

  if (!putback || putback.status === 'COMPLETED' || stops.length === 0) return null
  return <ReturnStopWorkspace key={putback.no} flow={flow} putback={putback} stops={stops} />
}

/** 到站：哪一站（建议库位）、实际放到哪个库位 */
interface Arrival {
  at?: string
  to?: string
}

/** 一次扫码或按钮动作所依据的现场 */
interface Snapshot {
  putback: OutboundPutback
  stops: PutbackStop[]
  current?: PutbackStop
  arrived: boolean
  target?: string
  pending?: PdaPickCount
}

function ReturnStopWorkspace({
  flow,
  putback,
  stops,
}: {
  flow: ReturnFlow
  putback: OutboundPutback
  stops: PutbackStop[]
}) {
  const { t, nav } = flow
  const at = nav.param('at')
  const to = nav.param('to')
  const { current, next } = currentAndNextStop(stops, at)
  /** 扫过目标库位才算到站；目标可以不是建议库位 */
  const arrived = Boolean(to) && at === current.location
  const target = arrived ? to! : current.location
  const count = flow.countOf(putback)
  const countLine = count ? current.lines.find((l) => l.id === count.lineId) : undefined
  /** 计数要落到扫过的目标库位上：没到站（如刷新后丢了目标）时先不显示，重扫目标后接着数 */
  const pending = arrived && countLine && count && count.qty > 0 ? count : undefined
  const [selectedId, setSelectedId] = useState<string>()
  const [message, setMessage] = useState<ScanMessage>()
  /** 扫码处理读的到站信息：路由切换是过渡更新，扫完库位紧跟的一枪可能还拿着旧渲染 */
  const arrivalRef = useRef<Arrival>({ at, to })
  useEffect(() => {
    arrivalRef.current = { at, to }
  }, [at, to])
  const leavingRef = useRef(false)
  /** 换站时主区回到顶部：新库位卡在最上面，跳站后一眼能看到 */
  const mainRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [current.location])

  const activeId =
    countLine?.id ??
    (current.lines.some((l) => l.id === selectedId) ? selectedId : undefined) ??
    (current.lines.length === 1 ? current.lines[0].id : undefined)

  const stopKey = stops.map((s) => s.location).join('|')
  useEffect(() => {
    if (leavingRef.current) return
    if (at && !stops.some((s) => s.location === at)) {
      arrivalRef.current = {}
      nav.replace('work', { no: putback.no })
      return
    }
    if (count && !stops.some((s) => s.lines.some((l) => l.id === count.lineId))) flow.setCount(putback, undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, stopKey, count?.lineId])

  /** 按最新数据取现场（动作刚写入 store、路由刚切换时组件可能还没重渲染） */
  const snapshot = (): Snapshot => {
    const live = flow.latestPutback(putback.no) ?? putback
    const liveStops = putbackStops(live)
    const { at: liveAt, to: liveTo } = arrivalRef.current
    const stop = currentAndNextStop(liveStops, liveAt)
    const isArrived = Boolean(liveTo) && stop.current?.location === liveAt
    const liveCount = flow.liveCountOf(putback.no)
    const onStop = liveCount && stop.current?.lines.some((l) => l.id === liveCount.lineId)
    return {
      putback: live,
      stops: liveStops,
      current: stop.current,
      arrived: isArrived,
      target: isArrived ? liveTo : stop.current?.location,
      pending: isArrived && onStop && liveCount.qty > 0 ? liveCount : undefined,
    }
  }

  const arrive = (arrival: Arrival) => {
    arrivalRef.current = arrival
    nav.replace('work', { no: putback.no, ...arrival })
  }
  const lineOf = (s: Snapshot, id?: string) => s.putback.lines.find((l) => l.id === id)
  const pendingError = (s: Snapshot) =>
    t('outbound.pdaReturn.errPending', { sku: lineOf(s, s.pending?.lineId)?.skuCode, count: s.pending?.qty })
  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  const ok = (text: string, tone: ScanMessage['tone'] = 'success') => {
    setMessage({ tone, text })
    return true
  }

  /** 保存落位（不动库存）；本站放完跳下一站，全部放完进入提交 */
  const save = (s: Snapshot, line: PutbackLine, qty: number, serialNos: string[]) => {
    const location = s.target!
    const res = flow.run({
      type: 'SAVE_PUTBACK',
      no: putback.no,
      lineId: line.id,
      location,
      qty,
      serialNos: flow.isSn(line) ? serialNos : undefined,
    })
    if (!res.ok) {
      void flow.notice(t('outbound.pdaReturn.saveFailed'), t(res.errorKey, res.params))
      return false
    }
    flow.setCount(s.putback, undefined)
    setSelectedId(undefined)
    const saved = t('outbound.pdaReturn.okSaved', { sku: line.skuCode, count: qty, location })
    const after = flow.latestPutback(putback.no)
    const afterStops = after ? putbackStops(after) : []
    if (afterStops.length === 0) {
      leavingRef.current = true
      toast.success(saved)
      nav.replace('done', { no: putback.no })
      return true
    }
    if (!afterStops.some((stop) => stop.location === line.suggestedLocation)) {
      ok(
        t('outbound.pdaReturn.okStopDone', {
          sku: line.skuCode,
          count: qty,
          location,
          next: currentAndNextStop(afterStops).current.location,
        }),
      )
      arrive({})
      return true
    }
    return ok(saved)
  }

  const bump = (s: Snapshot, line: PutbackLine, sn?: string) => {
    if (s.pending && s.pending.lineId !== line.id) return fail(pendingError(s))
    const remaining = putbackLineRemaining(line)
    const qty = (s.pending?.qty ?? 0) + 1
    const serialNos = sn ? [...(s.pending?.serialNos ?? []), sn] : (s.pending?.serialNos ?? [])
    if (qty > remaining) return fail(t('outbound.pdaReturn.errFull', { sku: line.skuCode, count: remaining }))
    setSelectedId(line.id)
    if (qty < remaining) {
      flow.setCount(s.putback, { lineId: line.id, qty, serialNos })
      return ok(t('outbound.pdaPick.okBump', { sku: line.skuCode, count: qty, total: remaining }))
    }
    return save(s, line, qty, serialNos)
  }

  const onScan = (raw: string): boolean => {
    const code = raw.trim()
    const s = snapshot()
    const here = s.current
    if (!here) return false
    const openLines = s.stops.flatMap((stop) => stop.lines)

    const location = flow.targetOf(code)
    if (location) {
      if (!location.usable) return fail(t('outbound.pdaReturn.errTarget', { location: location.code }))
      if (s.pending && location.code !== s.target) return fail(pendingError(s))
      setSelectedId(undefined)
      const stop = s.stops.find((x) => x.location === location.code)
      arrive({ at: stop ? stop.location : here.location, to: location.code })
      return stop
        ? ok(t('outbound.pdaReturn.okArrived', { location: location.code }))
        : ok(t('outbound.pdaReturn.okOther', { location: location.code, suggested: here.location }), 'info')
    }

    if (!s.arrived) {
      const snLine = openLines.find((l) => flow.serialsLeft(l).includes(code))
      const sku =
        snLine?.skuCode ??
        flow.resolveSku(
          s.putback,
          code,
          openLines.map((l) => l.skuCode),
        )
      return fail(
        sku
          ? t('outbound.pdaReturn.errTargetFirst', { sku, location: here.location })
          : t('outbound.pdaReturn.errScanLocation', { code, location: here.location }),
      )
    }

    const snLine = here.lines.find((l) => flow.serialsLeft(l).includes(code))
    if (snLine) {
      if (s.pending?.serialNos.includes(code)) return fail(t('outbound.pdaPick.errSnUsed', { sn: code }))
      return bump(s, snLine, code)
    }

    const sku = flow.resolveSku(
      s.putback,
      code,
      here.lines.map((l) => l.skuCode),
    )
    if (sku) {
      const candidates = here.lines.filter((l) => l.skuCode === sku)
      if (candidates.every((l) => flow.isSn(l))) return fail(t('outbound.pdaPick.errNeedSn', { sku }))
      const chosen = s.pending?.lineId ?? selectedId
      const line = candidates.length === 1 ? candidates[0] : candidates.find((l) => l.id === chosen)
      if (!line) return ok(t('outbound.pdaPick.infoPickBatch', { sku, count: candidates.length }), 'info')
      return bump(s, line)
    }

    const elsewhere = flow.resolveSku(
      s.putback,
      code,
      openLines.map((l) => l.skuCode),
    )
    if (elsewhere) {
      const where = s.stops.find((x) => x.lines.some((l) => l.skuCode === elsewhere))?.location
      return fail(t('outbound.pdaReturn.errOtherStop', { sku: elsewhere, location: where }))
    }
    return fail(t('outbound.pdaReturn.errNotInOrder', { code }))
  }

  const savePending = () => {
    const s = snapshot()
    const line = lineOf(s, s.pending?.lineId)
    if (!s.pending || !line) return
    if (save(s, line, s.pending.qty, s.pending.serialNos)) beep(true)
  }

  const select = (line: PutbackLine) => {
    const s = snapshot()
    if (s.pending && s.pending.lineId !== line.id) {
      beep(false)
      fail(pendingError(s))
      return
    }
    setSelectedId(line.id)
  }

  const pendingLine = putback.lines.find((l) => l.id === pending?.lineId)
  const pendingSn = pendingLine ? flow.isSn(pendingLine) : false
  const candidates = arrived
    ? current.lines
        .flatMap((l) =>
          flow.isSn(l)
            ? flow
                .serialsLeft(l)
                .filter((sn) => !pending?.serialNos.includes(sn))
                .slice(0, 2)
                .map((value) => ({ value }))
            : [{ value: flow.master(putback, l.skuCode)?.primaryBarcode ?? l.skuCode }],
        )
        .filter((c, i, all) => all.findIndex((x) => x.value === c.value) === i)
        .slice(0, 4)
    : [{ value: current.location, label: t('outbound.pdaReturn.suggestedShort') }, ...(next ? [{ value: next.location }] : [])]

  return (
    <>
      <PdaHeader title={t('outbound.pdaReturn.title')} onBack={() => nav.back({ step: 'list' })} />
      <ReturnContext flow={flow} putback={putback} />
      <div ref={mainRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [overflow-anchor:none]">
        <PdaStopCard
          label={t('outbound.pdaReturn.goTo')}
          arrivedLabel={
            target === current.location
              ? t('outbound.pdaReturn.arrivedAt')
              : t('outbound.pdaReturn.placeOther', { suggested: current.location })
          }
          location={target}
          arrived={arrived}
          nextLabel={t('outbound.pdaPick.next')}
          next={next?.location}
        />
        <ScanInput
          label={
            arrived
              ? t('outbound.pdaReturn.promptItem')
              : t('outbound.pdaReturn.promptLocation', { location: current.location })
          }
          onScan={onScan}
          message={message}
          candidates={candidates}
        />
        <PdaSection title={t('outbound.pdaReturn.stopLines', { count: current.lines.length })}>
          {current.lines.map((line) => (
            <ReturnLineCard
              key={line.id}
              flow={flow}
              line={line}
              arrived={arrived}
              active={arrived && line.id === activeId}
              counted={pending?.lineId === line.id ? pending.qty : 0}
              serialNos={pending?.lineId === line.id ? pending.serialNos : []}
              onSelect={() => select(line)}
            />
          ))}
        </PdaSection>
        <ReturnPlacements flow={flow} putback={putback} />
      </div>
      <PdaFooter
        hint={
          !arrived
            ? t('outbound.pdaReturn.hintLocation', { location: current.location })
            : !pending
              ? t('outbound.pdaReturn.hintItem')
              : undefined
        }
      >
        {pending && pendingLine && !pendingSn && (
          <QtyStepper
            hideLabel
            label={t('outbound.pdaPick.countLabel')}
            value={pending.qty}
            max={putbackLineRemaining(pendingLine)}
            onChange={(qty) => {
              flow.setCount(putback, { ...pending, qty })
              return true
            }}
            onScanText={(code) => beep(onScan(code))}
          />
        )}
        {pending && pendingSn && (
          <PdaButton variant="outline" className="w-24" onClick={() => flow.setCount(putback, undefined)}>
            {t('outbound.pdaPick.clearCount')}
          </PdaButton>
        )}
        <PdaButton className="flex-1" disabled={!pending} onClick={savePending}>
          {pending ? t('outbound.pdaReturn.save', { count: pending.qty }) : t('outbound.pdaReturn.saveIdle')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
