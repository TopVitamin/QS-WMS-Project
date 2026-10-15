import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DocNoTail } from '@/components/biz/display'
import { PdaButton, PdaCard, PdaListItem } from '@/components/pda/pda-card'
import { PdaContextBar } from '@/components/pda/pda-context-bar'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { beep } from '@/lib/scan-beep'
import { canReceiveInbound } from '@/lib/inbound-derive'
import { cn } from '@/lib/utils'
import { getInbound } from '@/services/inbound'
import { QtyTriple } from './receive-shared'
import { lineTotals, type ReceiveFlow } from './use-receive-flow'

/** 提交收货（PDA 收货 PRD §5.2）：勾选本次要提交的容器，一次提交生成一条收货记录；未勾选的留在作业中 */
export function ReceiveSubmitStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, order, orderReceivable } = flow
  const boxes = session.boxes.filter((b) => b.lines.length > 0)
  const [selected, setSelected] = useState<string[]>(() => boxes.map((b) => b.key))
  /** 提交成功后正在后退到上一屏，此时不再做步骤纠正 */
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    if (!order || !orderReceivable) nav.replace('order')
    else if (boxes.length === 0) nav.replace('container')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.inboundNo, orderReceivable, boxes.length])

  if (!order || boxes.length === 0) return null
  const chosen = boxes.filter((b) => selected.includes(b.key))
  const totals = lineTotals(chosen.flatMap((b) => b.lines))
  const received = totals.good + totals.defect

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const submit = () => {
    const invalid = flow.validateBoxes(chosen, chosen)
    if (invalid) {
      void flow.notice(
        t('pdaReceive.submitBlocked'),
        t('pdaReceive.lineInvalid', { box: flow.boxLabel(invalid.box), sku: invalid.skuCode, reason: t(invalid.errorKey) }),
      )
      return
    }
    const res = flow.submitReceipt({
      inboundNo: order.inboundNo,
      operator: flow.operator,
      containers: chosen.map((b) => ({
        containerNo: b.containerNo,
        bulkPiece: b.bulkPiece,
        lines: b.lines.map(({ skuCode, goodQty, defectQty, rejectedQty, rejectReason }) => ({
          skuCode,
          goodQty,
          defectQty,
          rejectedQty,
          rejectReason,
        })),
      })),
    })
    if (!res.ok) {
      void flow.notice(t('pdaReceive.submitBlocked'), t(res.errorKey))
      return
    }
    doneRef.current = true
    beep(true)
    toast.success(
      t('pdaReceive.submitSuccess', { boxes: chosen.length, received, rejected: totals.rejected }),
    )
    session.removeBoxes(chosen.map((b) => b.key))
    const updated = getInbound(order.inboundNo)
    if (!updated || !canReceiveInbound(updated)) {
      toast.success(t('pda.receiveAllDone'))
      session.reset()
      nav.returnTo('order')
      return
    }
    nav.returnTo('container')
  }

  return (
    <>
      <PdaHeader title={t('pdaReceive.submitTitle')} onBack={() => nav.back({ step: 'container' })} />
      <PdaContextBar>
        <DocNoTail value={order.inboundNo} tail={4} className="text-base" />
      </PdaContextBar>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {boxes.map((b) => {
          const on = selected.includes(b.key)
          return (
            <PdaListItem
              key={b.key}
              role="checkbox"
              selectable
              selected={on}
              onClick={() => toggle(b.key)}
              className={on ? undefined : 'opacity-70'}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md border-2',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {on && <Check className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-base font-semibold', !b.bulkPiece && 'font-mono')}>{flow.boxLabel(b)}</span>
                    <span className="text-sm text-muted-foreground">{t('pdaReceive.lineCount', { count: b.lines.length })}</span>
                  </div>
                  <QtyTriple lines={b.lines} />
                </div>
              </div>
            </PdaListItem>
          )
        })}
        <PdaCard className="mt-2 text-sm">
          <div className="text-base font-medium tabular-nums">
            {t('pdaReceive.selectedSummary', { boxes: chosen.length, received, rejected: totals.rejected })}
          </div>
          <div className="mt-1 text-muted-foreground">{t('pdaReceive.submitHint')}</div>
        </PdaCard>
      </div>
      <PdaFooter hint={chosen.length === 0 ? t('pdaReceive.nothingSelected') : undefined}>
        <PdaButton variant="outline" className="w-24" onClick={() => nav.back({ step: 'container' })}>
          {t('common.back')}
        </PdaButton>
        <PdaButton className="flex-1" disabled={chosen.length === 0} onClick={submit}>
          {t('pdaReceive.confirmSubmit', { count: chosen.length })}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
