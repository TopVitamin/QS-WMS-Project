import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { putbackExpected, putbackSaved } from '@/lib/outbound-derive'
import { putbackStops } from '@/lib/outbound-pick-route'
import { beep } from '@/lib/scan-beep'
import { ReturnContext, ReturnPlacements } from './return-shared'
import type { ReturnFlow } from './use-return-flow'

/** 全部保存（返库上架单主PRD §三.3）：核对落位，整单提交才把库存从出库暂存移到各目标库位 */
export function ReturnDoneStep({ flow }: { flow: ReturnFlow }) {
  const { t, nav } = flow
  const putback = flow.findPutback(nav.param('no'))
  const hasOpenLines = putback ? putbackStops(putback).length > 0 : false
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    if (!putback || putback.status === 'COMPLETED') nav.replace('list')
    else if (hasOpenLines) nav.replace('work', { no: putback.no })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [putback?.no, putback?.status, hasOpenLines])

  if (!putback || putback.status === 'COMPLETED' || hasOpenLines) return null
  const placements = putback.lines.reduce((n, l) => n + (l.placements?.length ?? 0), 0)

  const submit = async () => {
    const ok = await flow.confirm({
      title: t('outbound.pdaReturn.submitTitle', { no: putback.no }),
      description: t('outbound.pdaReturn.submitDesc', { count: putbackExpected(putback), placements }),
      confirmText: t('outbound.pdaReturn.submit'),
    })
    if (!ok) return
    doneRef.current = true
    const res = flow.run({ type: 'SUBMIT_PUTBACK', no: putback.no })
    if (!res.ok) {
      doneRef.current = false
      void flow.notice(t('outbound.pdaReturn.submit'), t(res.errorKey, res.params))
      return
    }
    beep(true)
    toast.success(t('outbound.doneReturnSubmitted', { no: putback.no }))
    nav.returnTo('list')
  }

  return (
    <>
      <PdaHeader title={t('outbound.pdaReturn.title')} onBack={() => nav.back({ step: 'list' })} />
      <ReturnContext flow={flow} putback={putback} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="flex flex-col items-center gap-3 py-4">
          <CircleCheck className="size-10 text-success-text" />
          <div className="text-lg font-semibold">{t('outbound.pdaReturn.doneTitle')}</div>
          <div className="grid w-full grid-cols-3 divide-x text-center">
            <div className="px-1">
              <div className="text-sm text-muted-foreground">{t('outbound.ui.expected')}</div>
              <div className="text-xl font-bold tabular-nums">{putbackExpected(putback)}</div>
            </div>
            <div className="px-1">
              <div className="text-sm text-muted-foreground">{t('outbound.saved')}</div>
              <div className="text-xl font-bold text-primary tabular-nums">{putbackSaved(putback)}</div>
            </div>
            <div className="px-1">
              <div className="text-sm text-muted-foreground">{t('outbound.pdaReturn.placementCount')}</div>
              <div className="text-xl font-bold tabular-nums">{placements}</div>
            </div>
          </div>
        </PdaCard>
        {putback.reason === 'MISSING' && (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-text">{t('outbound.missingNotice')}</p>
        )}
        <ReturnPlacements flow={flow} putback={putback} />
        <p className="text-sm text-muted-foreground">{t('outbound.pdaReturn.doneHint')}</p>
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={submit}>
          {t('outbound.pdaReturn.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
