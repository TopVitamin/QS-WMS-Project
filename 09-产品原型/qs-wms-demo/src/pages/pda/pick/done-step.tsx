import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { taskTotals } from '@/lib/outbound-derive'
import { pickStops } from '@/lib/outbound-pick-route'
import { beep } from '@/lib/scan-beep'
import { cn } from '@/lib/utils'
import { openTask } from '@/mock/outbound-actions'
import { PickContext } from './pick-shared'
import type { PickFlow } from './use-pick-flow'

/** 全部拣完（拣货任务主PRD §三.4）：汇总应拣/实拣/缺货，提示送到出库暂存位，提交只结束进度、不再移库 */
export function PickDoneStep({ flow }: { flow: PickFlow }) {
  const { t, nav } = flow
  const task = flow.findTask(nav.param('no'))
  const hasOpenLines = task ? pickStops(task).length > 0 : false
  /** 本页刚提交成功、正在回到列表时，不再按「已结束」纠正与提示 */
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    if (!task || !openTask(task)) nav.replace('list')
    else if (hasOpenLines) nav.replace('work', { no: task.no })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.no, task?.status, hasOpenLines])

  if (!task || !openTask(task) || hasOpenLines) return null
  const qty = taskTotals(task)

  const submit = async () => {
    const ok = await flow.confirm({
      title: t('outbound.pdaPick.submitTitle', { no: task.no }),
      description: t('outbound.pdaPick.submitDesc', { picked: qty.picked, short: qty.short }),
      confirmText: t('outbound.pdaPick.submit'),
    })
    if (!ok) return
    doneRef.current = true
    const res = flow.run({ type: 'FINISH_PICK', no: task.no })
    if (!res.ok) {
      doneRef.current = false
      void flow.notice(t('outbound.pdaPick.submit'), t(res.errorKey, res.params))
      return
    }
    beep(true)
    toast.success(t('outbound.pdaPick.submitDone', { no: task.no }))
    nav.returnTo('list')
  }

  const metrics = [
    { label: t('outbound.ui.planned'), value: qty.planned },
    { label: t('outbound.ui.pickedQty'), value: qty.picked, tone: 'text-primary' },
    { label: t('outbound.ui.reported'), value: qty.reported, tone: qty.reported ? 'text-warning-text' : undefined },
    { label: t('outbound.ui.short'), value: qty.short, tone: qty.short ? 'text-destructive' : undefined },
  ]

  return (
    <>
      <PdaHeader title={t('outbound.pdaPick.title')} onBack={() => nav.back({ step: 'list' })} />
      <PickContext flow={flow} task={task} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="flex flex-col items-center gap-3 py-4">
          <CircleCheck className="size-10 text-success-text" />
          <div className="text-lg font-semibold">{t('outbound.pdaPick.doneTitle')}</div>
          <div className="grid w-full grid-cols-4 divide-x text-center">
            {metrics.map((m) => (
              <div key={m.label} className="px-1">
                <div className="text-sm text-muted-foreground">{m.label}</div>
                <div className={cn('text-xl font-bold tabular-nums', m.tone)}>{m.value}</div>
              </div>
            ))}
          </div>
        </PdaCard>
        <div className="rounded-xl border-l-4 border-l-primary bg-background px-3 py-2.5 shadow-xs">
          <div className="text-sm text-muted-foreground">{t('outbound.pdaPick.doneStaging')}</div>
          <div className="font-mono text-2xl font-bold text-primary">{task.stagingCode}</div>
        </div>
        <p className="text-sm text-muted-foreground">{t('outbound.pdaPick.doneHint')}</p>
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={submit}>
          {t('outbound.pdaPick.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
