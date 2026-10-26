import { useState } from 'react'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { outboundPickStatusMeta, pickSourceMeta } from '@/config/status'
import { taskOwnerDoc, taskTotals } from '@/lib/outbound-derive'
import { pickLineRemaining } from '@/lib/outbound-pick-route'
import { taskOrderNos } from '@/mock/outbound-actions'
import type { OutboundPickTask } from '@/types/outbound'
import type { PickFlow } from './use-pick-flow'

/** 选任务：混合波次必须扫波次号；单任务可扫任务号或出库单号。 */
export function PickListStep({ flow }: { flow: PickFlow }) {
  const { t, nav, openTasks } = flow
  const [message, setMessage] = useState<ScanMessage>()

  const open = (task: OutboundPickTask) => nav.go('work', { no: task.no })

  const onScan = (code: string) => {
    const key = code.trim().toUpperCase()
    const hit =
      openTasks.find((x) => x.waveNo?.toUpperCase() === key) ??
      openTasks.find(
        (x) =>
          !x.waveNo &&
          (x.no.toUpperCase() === key || taskOrderNos(x).some((no) => no.toUpperCase() === key)),
      )
    if (!hit) {
      setMessage({ tone: 'error', text: t('outbound.pdaPick.taskNotFound', { code: code.trim() }) })
      return false
    }
    setMessage(undefined)
    open(hit)
    return true
  }

  return (
    <>
      <PdaHeader title={t('outbound.pdaPick.title')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput
          label={t('outbound.pdaPick.scanTask')}
          onScan={onScan}
          message={message}
          candidates={openTasks.slice(0, 3).map((x) => ({ value: x.waveNo ?? x.no }))}
        />
        <PdaSection title={t('outbound.pdaPick.listTitle', { count: openTasks.length })}>
          {openTasks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('outbound.pdaPick.listEmpty')}</div>
          )}
          {openTasks.map((task) => {
            const qty = taskTotals(task)
            const owner = taskOwnerDoc(task)
            const openLines = task.lines.filter((l) => pickLineRemaining(l) > 0)
            return (
              <PdaListItem
                key={task.no}
                onClick={() => {
                  if (task.waveNo) {
                    setMessage({ tone: 'error', text: t('outbound.pdaPick.scanWaveFirst') })
                    return
                  }
                  open(task)
                }}
              >
                <div className="flex items-center gap-2">
                  <DocNoTail value={task.no} tail={4} className="text-base whitespace-nowrap" />
                  <span className="ml-auto">
                    <StatusBadge meta={outboundPickStatusMeta[task.status]} />
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <TagLabel meta={pickSourceMeta[task.source]} />
                  {owner && <DocNoTail value={owner.no} tail={4} className="text-sm" />}
                  {owner && <span>·</span>}
                  <span>
                    {t('outbound.pdaPick.taskMeta', {
                      stops: new Set(openLines.map((l) => l.locationCode)).size,
                      skus: new Set(openLines.map((l) => l.skuCode)).size,
                    })}
                  </span>
                  <span className="ml-auto text-base font-semibold text-primary tabular-nums">
                    {t('outbound.pdaPick.progress', { picked: qty.picked, planned: qty.planned })}
                  </span>
                </div>
              </PdaListItem>
            )
          })}
        </PdaSection>
      </div>
    </>
  )
}
