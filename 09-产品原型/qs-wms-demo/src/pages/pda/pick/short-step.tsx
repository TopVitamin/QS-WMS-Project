import { useEffect, useState } from 'react'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaChoiceGroup } from '@/components/pda/pda-choice-group'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { pickLineRemaining, replacementStops } from '@/lib/outbound-pick-route'
import { beep } from '@/lib/scan-beep'
import { openTask } from '@/mock/outbound-actions'
import type { OutboundPickTask, PickLine } from '@/types/outbound'
import { PickContext } from './pick-shared'
import type { PickFlow } from './use-pick-flow'

/**
 * 上报库位缺货（拣货任务主PRD §三.3）：本库位实物不够时，已数的件数先确认下架，差额报缺货；
 * 系统释放这部分分配并换位一次，换到的新库位并入拣货路径。
 */
export function PickShortStep({ flow }: { flow: PickFlow }) {
  const { nav } = flow
  const task = flow.findTask(nav.param('no'))
  const line = task?.lines.find((l) => l.id === nav.param('line'))
  const valid = Boolean(task && openTask(task) && line && pickLineRemaining(line) > 0)

  useEffect(() => {
    if (!task || !openTask(task)) nav.replace('list')
    else if (!valid) nav.returnTo('work', { no: task.no })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.no, task?.status, valid])

  if (!task || !line || !valid) return null
  return <ShortEditor key={line.id} flow={flow} task={task} line={line} />
}

function ShortEditor({ flow, task, line }: { flow: PickFlow; task: OutboundPickTask; line: PickLine }) {
  const { t, nav } = flow
  const count = flow.countOf(task)
  const counted = count?.lineId === line.id ? count.qty : 0
  const max = pickLineRemaining(line) - counted
  const [qty, setQty] = useState(max)
  const [reason, setReason] = useState<'MISSING' | 'DAMAGED'>('MISSING')

  const submit = () => {
    if (counted > 0) {
      const picked = flow.pick(task, line, counted, count?.serialNos ?? [])
      if (!picked.ok) {
        void flow.notice(t('outbound.pdaPick.pickFailed'), t(picked.errorKey, picked.params))
        return
      }
      flow.setCount(task, undefined)
    }
    const before = flow.latestTask(task.no)?.lines ?? task.lines
    const res = flow.run({ type: 'SHORTAGE', no: task.no, lineId: line.id, qty, reason })
    if (!res.ok) {
      void flow.notice(t('outbound.pdaPick.shortFailed'), t(res.errorKey, res.params))
      return
    }
    const moved = replacementStops(before, flow.latestTask(task.no)?.lines ?? [], flow.locationMasters, task.warehouseCode)
    beep(true)
    toast.success(
      moved.length
        ? t('outbound.pdaPick.doneShortReplaced', {
            sku: line.skuCode,
            count: qty,
            locations: moved.map((m) => `${m.location} × ${m.qty}`).join(t('common.listSeparator')),
          })
        : t('outbound.pdaPick.doneShortNone', { sku: line.skuCode, count: qty }),
    )
    // 缺货页总是从作业页压进来的：退一步回到同一库位（换位到本库位的新行会接着显示）
    nav.back({ step: 'work', params: { no: task.no, at: line.locationCode } })
  }

  return (
    <>
      <PdaHeader
        title={t('outbound.pdaPick.shortTitle')}
        onBack={() => nav.back({ step: 'work', params: { no: task.no, at: line.locationCode } })}
      />
      <PickContext flow={flow} task={task} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-base font-semibold">
              {line.locationCode} · {line.skuCode}
            </div>
            <div className="mt-0.5 line-clamp-2 text-sm">{flow.skuName(line.skuCode, task.customerId)}</div>
            {line.batchNo && <div className="mt-0.5 font-mono text-sm text-muted-foreground">{line.batchNo}</div>}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm text-muted-foreground">{t('outbound.pdaPick.toPick')}</div>
            <div className="text-2xl leading-tight font-bold text-primary tabular-nums">{pickLineRemaining(line)}</div>
          </div>
        </PdaCard>
        {counted > 0 && (
          <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
            {t('outbound.pdaPick.shortCounted', { count: counted })}
          </p>
        )}
        <PdaCard>
          <QtyStepper
            label={t('outbound.pdaPick.shortQty')}
            value={qty}
            max={max}
            tone="danger"
            onChange={(v) => {
              setQty(v)
              return true
            }}
          />
        </PdaCard>
        <PdaSection title={t('outbound.pdaPick.shortReason')}>
          <PdaChoiceGroup
            columns={2}
            value={reason}
            onChange={setReason}
            options={(['MISSING', 'DAMAGED'] as const).map((value) => ({
              value,
              label: t(`outbound.shortageReasons.${value}`),
            }))}
          />
        </PdaSection>
        <p className="text-sm text-muted-foreground">{t('outbound.pdaPick.shortHint')}</p>
      </div>
      <PdaFooter hint={qty <= 0 ? t('outbound.pdaPick.shortHintQty') : undefined}>
        <PdaButton className="flex-1" disabled={qty <= 0} onClick={submit}>
          {t('outbound.pdaPick.shortSubmit', { count: qty })}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
