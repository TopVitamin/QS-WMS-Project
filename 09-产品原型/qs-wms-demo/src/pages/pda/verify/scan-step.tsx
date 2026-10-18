import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { sum } from '@/lib/outbound-derive'
import { toVerifyQty } from '@/lib/outbound-verify'
import { beep } from '@/lib/scan-beep'
import type { OutboundOrder } from '@/types/outbound'
import type { WebVerifySession } from '@/stores/web-verify-session'
import { VerifyContext, VerifyRowCard } from './verify-shared'
import type { VerifyFlow } from './use-verify-flow'

/**
 * 逐件复核（PDA复核 PRD 第三节）：扫商品条码 +1，序列号商品扫序列号；不用先选行。
 * 本单扫齐自动进入装箱；件数多的普通商品可扫一件后直接改数量。本次录入是本机草稿，提交才计入有效复核量。
 */
export function VerifyScanStep({ flow }: { flow: VerifyFlow }) {
  const { nav } = flow
  const order = flow.findOrder(nav.param('no'))
  const valid = Boolean(order && flow.verifiable(order))

  useEffect(() => {
    if (!valid) nav.replace('list')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  if (!order || !valid) return null
  return <ScanWorkspace key={order.no} flow={flow} order={order} />
}

function ScanWorkspace({ flow, order }: { flow: VerifyFlow; order: OutboundOrder }) {
  const { t, nav } = flow
  const session = flow.sessionOf(order)
  const rows = flow.rowsOf(order, session)
  const records = flow.records(order)
  const draftTotal = sum(rows, (r) => r.qty)
  const toVerify = toVerifyQty(order)
  const [message, setMessage] = useState<ScanMessage>()

  /** 改本次复核都基于最新草稿（连续快扫时组件可能还没重渲染） */
  const update = (patch: Partial<WebVerifySession>) =>
    flow.saveSession(order, { ...flow.liveOf(order).session, ...patch })
  const setLine = (id: string, qty: number, serialNos: string[]) => {
    const lines = { ...flow.liveOf(order).session.lines }
    if (qty > 0) lines[id] = { qty, serialNos }
    else delete lines[id]
    update({ lines, activeId: id })
    return sum(Object.values(lines), (l) => l.qty)
  }
  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  /** 计数成功；本单扫齐就进入装箱 */
  const bumped = (sku: string, total: number, left: number) => {
    if (total === toVerify) {
      toast.success(t('outbound.ui.stationAllScannedTitle', { count: total }))
      nav.go('pack', { no: order.no })
      return true
    }
    setMessage({ tone: 'success', text: t('outbound.pdaVerify.okBump', { sku, count: total, left }) })
    return true
  }

  const onScan = (raw: string): boolean => {
    const code = raw.trim()
    const { session, rows } = flow.liveOf(order)
    const draftTotal = sum(rows, (r) => r.qty)
    const other = flow.orders.find((o) => o.no.toUpperCase() === code.toUpperCase() && o.no !== order.no)
    if (other) {
      if (draftTotal > 0) return fail(t('outbound.pdaVerify.errSwitch', { count: draftTotal }))
      if (!flow.verifiable(other))
        return fail(t('outbound.pdaVerify.orderMiss', { code: other.no, reason: flow.unavailableReason(other) }))
      nav.replace('scan', { no: other.no })
      return true
    }
    const snRow = rows.find((r) => r.sn && r.serialsLeft.includes(code))
    if (snRow) {
      if (snRow.serialNos.includes(code)) return fail(t('outbound.ui.stationSnDupTitle', { sn: code }))
      const total = setLine(snRow.id, snRow.qty + 1, [...snRow.serialNos, code])
      const left = sum(rows.filter((r) => r.skuCode === snRow.skuCode), (r) => r.remaining - r.qty) - 1
      return bumped(snRow.skuCode, total, left)
    }
    if (records.some((v) => v.lines.some((l) => l.effectiveQty > 0 && l.serialNos.includes(code))))
      return fail(t('outbound.ui.stationSnVerifiedTitle', { sn: code }))
    const sku = flow.resolveSku(
      order,
      code,
      rows.map((r) => r.skuCode),
    )
    if (!sku) return fail(t('outbound.ui.stationMissTitle', { code }))
    if (rows.some((r) => r.skuCode === sku && r.sn)) return fail(t('outbound.ui.stationNeedSnTitle', { sku }))
    const open = rows.filter((r) => r.skuCode === sku && r.qty < r.remaining)
    const row = open.find((r) => r.id === session.activeId) ?? open[0]
    if (!row) return fail(t('outbound.ui.stationFullTitle', { sku }))
    const total = setLine(row.id, row.qty + 1, [])
    const left = sum(rows.filter((r) => r.skuCode === sku), (r) => r.remaining - r.qty) - 1
    return bumped(sku, total, left)
  }

  const clear = async () => {
    const ok = await flow.confirm({
      title: t('outbound.ui.stationClear'),
      description: t('outbound.ui.stationClearConfirm', { count: draftTotal }),
      confirmText: t('outbound.ui.stationClear'),
      variant: 'destructive',
    })
    if (!ok) return
    flow.saveSession(order, undefined)
    setMessage(undefined)
  }

  const active = rows.find((r) => r.id === session.activeId)
  const editable = active && !active.sn && active.qty > 0 ? active : undefined
  const candidates = rows
    .flatMap((r) =>
      r.sn
        ? r.serialsLeft
            .filter((sn) => !r.serialNos.includes(sn))
            .slice(0, 2)
            .map((value) => ({ value }))
        : r.qty < r.remaining
          ? [{ value: r.skuCode }]
          : [],
    )
    .filter((c, i, all) => all.findIndex((x) => x.value === c.value) === i)
    .slice(0, 4)

  return (
    <>
      <PdaHeader title={t('outbound.pdaVerify.title')} onBack={() => nav.back({ step: 'list' })} />
      <VerifyContext flow={flow} order={order} rows={rows} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput label={t('outbound.pdaVerify.promptItem')} onScan={onScan} message={message} candidates={candidates} />
        <PdaSection
          title={t('outbound.pdaVerify.rowsTitle', { count: rows.length })}
          extra={
            draftTotal > 0 && (
              <button type="button" className="min-h-8 px-1 text-sm text-destructive" onClick={() => void clear()}>
                {t('outbound.ui.stationClear')}
              </button>
            )
          }
        >
          {rows.map((r) => (
            <VerifyRowCard
              key={r.id}
              flow={flow}
              row={r}
              active={r.id === session.activeId}
              onSelect={() => update({ activeId: r.id })}
            />
          ))}
        </PdaSection>
      </div>
      <PdaFooter hint={draftTotal === 0 ? t('outbound.pdaVerify.hintScan') : undefined}>
        {editable && (
          <QtyStepper
            hideLabel
            label={t('outbound.pdaVerify.thisTime')}
            value={editable.qty}
            max={editable.remaining}
            onChange={(qty) => {
              setLine(editable.id, qty, [])
              return true
            }}
            onScanText={(code) => beep(onScan(code))}
          />
        )}
        <PdaButton className="flex-1" disabled={draftTotal === 0} onClick={() => nav.go('pack', { no: order.no })}>
          {draftTotal > 0 ? t('outbound.pdaVerify.next', { count: draftTotal }) : t('outbound.pdaVerify.nextIdle')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
