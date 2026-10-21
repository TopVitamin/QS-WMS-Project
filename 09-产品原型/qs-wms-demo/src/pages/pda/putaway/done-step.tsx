import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { isFullyRecorded, planQty, recordedQty } from '@/lib/putaway'
import { beep } from '@/lib/scan-beep'
import { cn } from '@/lib/utils'
import { PutawayContext, PutawayPlacements } from './putaway-shared'
import type { PutawayFlow } from './use-putaway-flow'

/** 全部落完（上架单主PRD 第三节）：核对落位，整单提交才把库存从收货暂存库位移到各目标库位 */
export function PutawayDoneStep({ flow }: { flow: PutawayFlow }) {
  const { t, nav } = flow
  const order = flow.findOrder(nav.param('po'))
  const full = order ? isFullyRecorded(order) : false
  /** 本页刚提交成功、正在回到列表时，不再按「已提交」纠正与提示 */
  const doneRef = useRef(false)

  // 撤销了某条落位（剩余又大于 0）就回到按库位上架
  useEffect(() => {
    if (doneRef.current) return
    if (!order) nav.replace('list')
    else if (order.status === 'COMPLETED') {
      toast.info(t('pdaPutaway.error.orderSubmitted'))
      nav.replace('list')
    } else if (!full) nav.replace('work', { po: order.putawayNo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.putawayNo, order?.status, full])

  if (!order || order.status === 'COMPLETED' || !full) return null
  const placements = order.actualLines.filter((a) => !a.submitted).length

  const submit = async () => {
    const ok = await flow.confirm({
      title: t('pdaPutaway.submitTitle', { no: order.putawayNo }),
      description: t('pdaPutaway.submitDesc', { lines: placements }),
      confirmText: t('pdaPutaway.submit'),
    })
    if (!ok) return
    doneRef.current = true
    const res = flow.submitPutawayOrder({ putawayNo: order.putawayNo, operator: flow.operator })
    if (!res.ok) {
      doneRef.current = false
      void flow.notice(t('pdaPutaway.submit'), t(res.errorKey))
      return
    }
    beep(true)
    toast.success(t('pdaPutaway.submitSuccess', { no: order.putawayNo }))
    nav.returnTo('list')
  }

  const metrics = [
    { label: t('pdaPutaway.planTitle'), value: planQty(order) },
    { label: t('pdaPutaway.recordedLabel'), value: recordedQty(order), tone: 'text-primary' },
    { label: t('pdaPutaway.placementCount'), value: placements },
  ]

  return (
    <>
      <PdaHeader title={t('pda.putaway')} onBack={() => nav.back({ step: 'list' })} />
      <PutawayContext flow={flow} order={order} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="flex flex-col items-center gap-3 py-4">
          <CircleCheck className="size-10 text-success-text" />
          <div className="text-lg font-semibold">{t('pdaPutaway.doneTitle')}</div>
          <div className="grid w-full grid-cols-3 divide-x text-center">
            {metrics.map((m) => (
              <div key={m.label} className="px-1">
                <div className="text-sm text-muted-foreground">{m.label}</div>
                <div className={cn('text-xl font-bold tabular-nums', m.tone)}>{m.value}</div>
              </div>
            ))}
          </div>
        </PdaCard>
        <PutawayPlacements flow={flow} order={order} />
        <p className="text-sm text-muted-foreground">{t('pdaPutaway.doneHint')}</p>
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={submit}>
          {t('pdaPutaway.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
