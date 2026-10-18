import { useState } from 'react'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { outboundPutbackStatusMeta, unpickReasonMeta } from '@/config/status'
import { putbackExpected, putbackSaved } from '@/lib/outbound-derive'
import { putbackStops } from '@/lib/outbound-pick-route'
import type { OutboundPutback } from '@/types/outbound'
import type { ReturnFlow } from './use-return-flow'

/** 选返库上架单（PDA返库上架 PRD 第二节）：扫返库单号或原出库单号定位 */
export function ReturnListStep({ flow }: { flow: ReturnFlow }) {
  const { t, nav, openPutbacks } = flow
  const [message, setMessage] = useState<ScanMessage>()

  const open = (p: OutboundPutback) => nav.go('work', { no: p.no })

  const onScan = (code: string) => {
    const key = code.trim().toUpperCase()
    const hit =
      openPutbacks.find((p) => p.no.toUpperCase() === key) ?? openPutbacks.find((p) => p.orderNo.toUpperCase() === key)
    if (!hit) {
      setMessage({ tone: 'error', text: t('outbound.pdaReturn.notFound', { code: code.trim() }) })
      return false
    }
    setMessage(undefined)
    open(hit)
    return true
  }

  return (
    <>
      <PdaHeader title={t('outbound.pdaReturn.title')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput
          label={t('outbound.pdaReturn.scanOrder')}
          onScan={onScan}
          message={message}
          candidates={openPutbacks.slice(0, 3).map((p) => ({ value: p.no }))}
        />
        <PdaSection title={t('outbound.pdaReturn.listTitle', { count: openPutbacks.length })}>
          {openPutbacks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('outbound.pdaReturn.listEmpty')}</div>
          )}
          {openPutbacks.map((p) => (
            <PdaListItem key={p.no} onClick={() => open(p)}>
              <div className="flex items-center gap-2">
                <DocNoTail value={p.no} tail={4} className="text-base whitespace-nowrap" />
                <span className="ml-auto">
                  <StatusBadge meta={outboundPutbackStatusMeta[p.status]} />
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <TagLabel meta={unpickReasonMeta[p.reason]} />
                <DocNoTail value={p.orderNo} tail={4} className="text-sm" />
                <span>·</span>
                <span>{t('outbound.pdaReturn.meta', { stops: putbackStops(p).length, skus: p.lines.length })}</span>
                <span className="ml-auto text-base font-semibold text-primary tabular-nums">
                  {t('outbound.pdaReturn.progress', { saved: putbackSaved(p), expected: putbackExpected(p) })}
                </span>
              </div>
            </PdaListItem>
          ))}
        </PdaSection>
      </div>
    </>
  )
}
