import { useState } from 'react'
import { toast } from 'sonner'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge } from '@/components/biz/status-badge'
import { PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput } from '@/components/pda/scan-input'
import { putawayOrderStatusMeta } from '@/config/status'
import { planQty, recordedQty } from '@/lib/putaway'
import { QualityTag } from './putaway-shared'
import type { PutawayFlow } from './use-putaway-flow'

/** 选上架单（PDA 上架 PRD §3）：扫上架单号、容器号或商品条码定位；命中多张时只列命中的 */
export function PutawayListStep({ flow }: { flow: PutawayFlow }) {
  const { t, nav, pendingOrders } = flow
  const [matched, setMatched] = useState<string[]>()
  const shown = matched ? pendingOrders.filter((p) => matched.includes(p.putawayNo)) : pendingOrders

  const open = (putawayNo: string) => nav.go('work', { po: putawayNo })

  const onScan = (code: string) => {
    const key = code.trim().toUpperCase()
    const byNo = pendingOrders.find((p) => p.putawayNo.toUpperCase() === key)
    if (byNo) {
      open(byNo.putawayNo)
      return true
    }
    const byContainer = pendingOrders.filter((p) => p.containerNo?.toUpperCase() === key)
    const hits = byContainer.length > 0 ? byContainer : pendingOrders.filter((p) => flow.resolveSkuIn(p, code))
    if (hits.length === 1) {
      open(hits[0].putawayNo)
      return true
    }
    if (hits.length > 1) {
      setMatched(hits.map((h) => h.putawayNo))
      toast.info(t('pdaPutaway.multiMatch', { count: hits.length }))
      return true
    }
    toast.error(t('pdaPutaway.orderNotFound', { code: code.trim() }))
    return false
  }

  const containers = [...new Set(pendingOrders.map((p) => p.containerNo).filter((c): c is string => Boolean(c)))]
  const candidates = [
    ...pendingOrders.slice(0, 2).map((p) => ({ value: p.putawayNo })),
    ...containers.slice(0, 1).map((c) => ({ value: c })),
  ]

  return (
    <>
      <PdaHeader title={t('pda.putaway')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput label={t('pdaPutaway.promptOrder')} onScan={onScan} candidates={candidates} />
        <PdaSection
          title={t('pdaPutaway.pendingList', { count: shown.length })}
          extra={
            matched && (
              <button type="button" className="min-h-8 px-1 text-primary" onClick={() => setMatched(undefined)}>
                {t('pdaPutaway.showAll')}
              </button>
            )
          }
        >
          {shown.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('pdaPutaway.noOrders')}</div>
          )}
          {shown.map((p) => (
            <PdaListItem key={p.putawayNo} onClick={() => open(p.putawayNo)}>
              <div className="flex items-center gap-2">
                <DocNoTail value={p.putawayNo} tail={4} className="text-base" />
                <QualityTag order={p} />
                <span className="ml-auto">
                  <StatusBadge meta={putawayOrderStatusMeta[p.status]} />
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className={p.containerNo ? 'font-mono text-foreground' : undefined}>{flow.containerLabel(p)}</span>
                <span>·</span>
                <DocNoTail value={p.sourceNo} tail={4} className="text-sm" />
                <span className="ml-auto text-base font-semibold text-primary tabular-nums">
                  {t('pdaPutaway.recorded', { recorded: recordedQty(p), plan: planQty(p) })}
                </span>
              </div>
            </PdaListItem>
          ))}
        </PdaSection>
      </div>
    </>
  )
}
