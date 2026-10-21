import { useEffect, useRef, useState } from 'react'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaStopCard } from '@/components/pda/pda-stop-card'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { currentAndNextStop, pickLineRemaining, pickStops, type PickStop } from '@/lib/outbound-pick-route'
import { beep } from '@/lib/scan-beep'
import { openTask } from '@/mock/outbound-actions'
import type { PdaPickCount } from '@/stores/pda-outbound-session'
import type { OutboundPickTask, PickLine } from '@/types/outbound'
import { PickContext, PickLineCard } from './pick-shared'
import type { PickFlow } from './use-pick-flow'

/**
 * 按库位拣货（PDA拣货 PRD 第三节）：一屏一个库位，先扫库位确认到站，再扫商品计数；
 * 一行数满自动确认下架，一个库位拣完自动跳到下一个库位，全部拣完进入提交。
 */
export function PickWorkStep({ flow }: { flow: PickFlow }) {
  const { t, nav } = flow
  const task = flow.findTask(nav.param('no'))
  const stops = task ? pickStops(task) : []

  useEffect(() => {
    if (!task) nav.replace('list')
    else if (!openTask(task)) {
      toast.info(t('outbound.pdaPick.taskClosed', { no: task.no }))
      nav.replace('list')
    } else if (stops.length === 0) nav.replace('done', { no: task.no })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.no, task?.status, stops.length])

  if (!task || !openTask(task) || stops.length === 0) return null
  return <StopWorkspace key={task.no} flow={flow} task={task} stops={stops} />
}

/** 一次扫码或按钮动作所依据的现场：当前站、是否到站、本站未确认的计数 */
interface Snapshot {
  task: OutboundPickTask
  stops: PickStop[]
  current?: PickStop
  arrived: boolean
  pending?: PdaPickCount
}

function StopWorkspace({ flow, task, stops }: { flow: PickFlow; task: OutboundPickTask; stops: PickStop[] }) {
  const { t, nav } = flow
  const at = nav.param('at')
  const { current, next, arrived } = currentAndNextStop(stops, at)
  const count = flow.countOf(task)
  /** 未确认的计数只认当前库位上的行 */
  const countLine = count ? current.lines.find((l) => l.id === count.lineId) : undefined
  const pending = countLine && count && count.qty > 0 ? count : undefined
  const [selectedId, setSelectedId] = useState<string>()
  const [message, setMessage] = useState<ScanMessage>()
  /**
   * 到站的库位：路由切换是过渡更新，扫完库位紧跟的一枪可能还拿着旧渲染，
   * 所以扫码处理读这个 ref（扫到库位时立即写入），界面仍按路由参数渲染
   */
  const atRef = useRef(at)
  useEffect(() => {
    atRef.current = at
  }, [at])
  /** 刚提交成功、正在离开本页时不再纠正路由 */
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
  // 路由与草稿对不上时纠正：到站的库位已拣完就清掉；有未确认计数时回到它所在的库位
  useEffect(() => {
    if (leavingRef.current) return
    if (at && !stops.some((s) => s.location === at)) {
      atRef.current = undefined
      nav.replace('work', { no: task.no })
      return
    }
    if (!count) return
    const stop = stops.find((s) => s.lines.some((l) => l.id === count.lineId))
    if (!stop) flow.setCount(task, undefined)
    else if (!at) {
      atRef.current = stop.location
      nav.replace('work', { no: task.no, at: stop.location })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, stopKey, count?.lineId])

  /** 按最新数据取现场（动作刚写入 store、路由刚切换时组件可能还没重渲染） */
  const snapshot = (): Snapshot => {
    const live = flow.latestTask(task.no) ?? task
    const liveStops = pickStops(live)
    const stop = currentAndNextStop(liveStops, atRef.current)
    const liveCount = flow.liveCountOf(task.no)
    const onStop = liveCount && stop.current?.lines.some((l) => l.id === liveCount.lineId)
    return {
      task: live,
      stops: liveStops,
      current: stop.current,
      arrived: stop.arrived,
      pending: onStop && liveCount.qty > 0 ? liveCount : undefined,
    }
  }

  const arriveAt = (location?: string) => {
    atRef.current = location
    nav.replace('work', location ? { no: task.no, at: location } : { no: task.no })
  }
  const lineOf = (s: Snapshot, id?: string) => s.task.lines.find((l) => l.id === id)
  const pendingError = (s: Snapshot) =>
    t('outbound.pdaPick.errPending', { sku: lineOf(s, s.pending?.lineId)?.skuCode, count: s.pending?.qty })
  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  const ok = (text: string, tone: ScanMessage['tone'] = 'success') => {
    setMessage({ tone, text })
    return true
  }

  /** 确认下架；本库位拣完则跳到下一库位，全部拣完进入提交 */
  const confirmPick = (s: Snapshot, line: PickLine, qty: number, serialNos: string[]) => {
    const res = flow.pick(s.task, line, qty, serialNos)
    if (!res.ok) {
      void flow.notice(t('outbound.pdaPick.pickFailed'), t(res.errorKey, res.params))
      return false
    }
    flow.setCount(s.task, undefined)
    setSelectedId(undefined)
    const picked = t('outbound.pdaPick.okLinePicked', { sku: line.skuCode, count: qty })
    const after = flow.latestTask(task.no)
    const afterStops = after ? pickStops(after) : []
    if (afterStops.length === 0) {
      leavingRef.current = true
      toast.success(picked)
      nav.replace('done', { no: task.no })
      return true
    }
    if (!afterStops.some((stop) => stop.location === line.locationCode)) {
      ok(
        t('outbound.pdaPick.okStopDone', {
          sku: line.skuCode,
          count: qty,
          location: line.locationCode,
          next: currentAndNextStop(afterStops).current.location,
        }),
      )
      arriveAt(undefined)
      return true
    }
    return ok(picked)
  }

  /** 扫一件 +1；数满本行剩余即自动确认下架 */
  const bump = (s: Snapshot, line: PickLine, sn?: string) => {
    if (s.pending && s.pending.lineId !== line.id) return fail(pendingError(s))
    const remaining = pickLineRemaining(line)
    const qty = (s.pending?.qty ?? 0) + 1
    const serialNos = sn ? [...(s.pending?.serialNos ?? []), sn] : (s.pending?.serialNos ?? [])
    if (qty > remaining) return fail(t('outbound.pdaPick.errFull', { sku: line.skuCode, count: remaining }))
    setSelectedId(line.id)
    if (qty < remaining) {
      flow.setCount(s.task, { lineId: line.id, qty, serialNos })
      return ok(t('outbound.pdaPick.okBump', { sku: line.skuCode, count: qty, total: remaining }))
    }
    return confirmPick(s, line, qty, serialNos)
  }

  const onScan = (raw: string): boolean => {
    const code = raw.trim()
    const s = snapshot()
    const here = s.current
    if (!here) return false
    const openLines = s.stops.flatMap((stop) => stop.lines)

    // 库位：到站确认，或改去另一个还有待拣的库位
    const location = flow.locationOf(code)
    if (location) {
      if (s.stops.some((stop) => stop.location === location)) {
        if (s.pending && location !== here.location) return fail(pendingError(s))
        setSelectedId(undefined)
        if (location !== atRef.current) arriveAt(location)
        return ok(t('outbound.pdaPick.okArrived', { location }))
      }
      if (s.task.lines.some((l) => l.locationCode === location))
        return fail(t('outbound.pdaPick.errLocationDone', { location, next: here.location }))
      return fail(t('outbound.pdaPick.errNotStop', { code: location, location: here.location }))
    }

    if (!s.arrived) {
      const snLine = openLines.find((l) => flow.isSn(s.task, l.skuCode) && flow.lineSerials(l).includes(code))
      const sku =
        snLine?.skuCode ??
        flow.resolveSku(
          s.task,
          code,
          openLines.map((l) => l.skuCode),
        )
      return fail(
        sku
          ? t('outbound.pdaPick.errLocationFirst', { sku, location: here.location })
          : t('outbound.pdaPick.errScanLocation', { code, location: here.location }),
      )
    }

    // 序列号：属于本库位某行的来源库存，本次没扫过
    const snLine = here.lines.find((l) => flow.isSn(s.task, l.skuCode) && flow.lineSerials(l).includes(code))
    if (snLine) {
      if (s.pending?.serialNos.includes(code)) return fail(t('outbound.pdaPick.errSnUsed', { sn: code }))
      return bump(s, snLine, code)
    }

    // 批次号：同一商品多批次时用来选行
    const batchLine = here.lines.find((l) => l.batchNo && l.batchNo.toUpperCase() === code.toUpperCase())
    if (batchLine) {
      if (s.pending && s.pending.lineId !== batchLine.id) return fail(pendingError(s))
      setSelectedId(batchLine.id)
      return ok(t('outbound.pdaPick.okBatch', { batch: batchLine.batchNo }), 'info')
    }

    const sku = flow.resolveSku(
      s.task,
      code,
      here.lines.map((l) => l.skuCode),
    )
    if (sku) {
      if (flow.isSn(s.task, sku)) return fail(t('outbound.pdaPick.errNeedSn', { sku }))
      const candidates = here.lines.filter((l) => l.skuCode === sku)
      const chosen = s.pending?.lineId ?? selectedId
      const line = candidates.length === 1 ? candidates[0] : candidates.find((l) => l.id === chosen)
      if (!line) return ok(t('outbound.pdaPick.infoPickBatch', { sku, count: candidates.length }), 'info')
      return bump(s, line)
    }

    const elsewhere = flow.resolveSku(
      s.task,
      code,
      openLines.map((l) => l.skuCode),
    )
    if (elsewhere) {
      const where = s.stops.find((stop) => stop.lines.some((l) => l.skuCode === elsewhere))?.location
      return fail(t('outbound.pdaPick.errOtherStop', { sku: elsewhere, location: where }))
    }
    return fail(t('outbound.pdaPick.errNotInTask', { code }))
  }

  /** 数量框收到扫码内容：按本屏扫码处理，数量保持原值（规范 §4.2） */
  const scanFromQty = (code: string) => beep(onScan(code))

  const confirmPending = () => {
    const s = snapshot()
    const line = lineOf(s, s.pending?.lineId)
    if (!s.pending || !line) return
    if (confirmPick(s, line, s.pending.qty, s.pending.serialNos)) beep(true)
  }

  /** 点选行或缺货前：本站另一行还有没确认的计数时先挡住 */
  const guardPending = (line: PickLine) => {
    const s = snapshot()
    if (s.pending && s.pending.lineId !== line.id) {
      beep(false)
      fail(pendingError(s))
      return false
    }
    return true
  }

  const pendingLine = task.lines.find((l) => l.id === pending?.lineId)
  const pendingSn = pendingLine ? flow.isSn(task, pendingLine.skuCode) : false
  const sameSkuTwice = current.lines.some((l, i) => current.lines.findIndex((x) => x.skuCode === l.skuCode) !== i)
  const candidates = arrived
    ? current.lines
        .flatMap((l) => {
          if (flow.isSn(task, l.skuCode))
            return flow
              .lineSerials(l)
              .filter((sn) => !pending?.serialNos.includes(sn))
              .slice(0, 2)
              .map((value) => ({ value }))
          const barcode = flow.master(task, l.skuCode)?.primaryBarcode ?? l.skuCode
          return [
            { value: barcode, label: barcode !== l.skuCode ? l.skuCode : undefined },
            ...(sameSkuTwice && l.batchNo ? [{ value: l.batchNo }] : []),
          ]
        })
        .filter((c, i, all) => all.findIndex((x) => x.value === c.value) === i)
        .slice(0, 4)
    : [{ value: current.location }, ...(next ? [{ value: next.location }] : [])]

  return (
    <>
      <PdaHeader title={t('outbound.pdaPick.title')} onBack={() => nav.back({ step: 'list' })} />
      <PickContext flow={flow} task={task} />
      <div ref={mainRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [overflow-anchor:none]">
        <PdaStopCard
          label={t('outbound.pdaPick.goTo')}
          arrivedLabel={t('outbound.pdaPick.arrivedAt')}
          location={current.location}
          arrived={arrived}
          nextLabel={t('outbound.pdaPick.next')}
          next={next?.location}
        />
        <ScanInput
          label={
            arrived
              ? t('outbound.pdaPick.promptItem')
              : t('outbound.pdaPick.promptLocation', { location: current.location })
          }
          onScan={onScan}
          message={message}
          candidates={candidates}
        />
        <PdaSection title={t('outbound.pdaPick.stopLines', { count: current.lines.length })}>
          {current.lines.map((line) => (
            <PickLineCard
              key={line.id}
              flow={flow}
              task={task}
              line={line}
              arrived={arrived}
              active={arrived && line.id === activeId}
              counted={pending?.lineId === line.id ? pending.qty : 0}
              serialNos={pending?.lineId === line.id ? pending.serialNos : []}
              onSelect={() => guardPending(line) && setSelectedId(line.id)}
              onShort={() =>
                guardPending(line) && nav.go('short', { no: task.no, at: current.location, line: line.id })
              }
            />
          ))}
        </PdaSection>
      </div>
      <PdaFooter
        hint={
          !arrived
            ? t('outbound.pdaPick.hintLocation', { location: current.location })
            : !pending
              ? t('outbound.pdaPick.hintItem')
              : undefined
        }
      >
        {pending && pendingLine && !pendingSn && (
          <QtyStepper
            hideLabel
            label={t('outbound.pdaPick.countLabel')}
            value={pending.qty}
            max={pickLineRemaining(pendingLine)}
            onChange={(qty) => {
              flow.setCount(task, { ...pending, qty })
              return true
            }}
            onScanText={scanFromQty}
          />
        )}
        {pending && pendingSn && (
          <PdaButton variant="outline" className="w-24" onClick={() => flow.setCount(task, undefined)}>
            {t('outbound.pdaPick.clearCount')}
          </PdaButton>
        )}
        <PdaButton className="flex-1" disabled={!pending} onClick={confirmPending}>
          {pending ? t('outbound.pdaPick.confirm', { count: pending.qty }) : t('outbound.pdaPick.confirmIdle')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
