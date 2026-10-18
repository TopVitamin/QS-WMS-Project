import { useState } from 'react'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { outboundStatusMeta, outboundTypeMeta } from '@/config/status'
import { sum } from '@/lib/outbound-derive'
import { toVerifyQty } from '@/lib/outbound-verify'
import type { VerifyFlow } from './use-verify-flow'

/** 选出库单（PDA复核 PRD 第二节）：扫面单或拣货单上的出库单号，或点下方本仓待复核单 */
export function VerifyListStep({ flow }: { flow: VerifyFlow }) {
  const { t, nav, openOrders } = flow
  const [message, setMessage] = useState<ScanMessage>()

  const onScan = (code: string) => {
    const key = code.trim().toUpperCase()
    const order = flow.orders.find((o) => o.no.toUpperCase() === key && o.warehouseCode === flow.warehouseCode)
    if (!order || !flow.verifiable(order)) {
      setMessage({
        tone: 'error',
        text: t('outbound.pdaVerify.orderMiss', { code: code.trim(), reason: flow.unavailableReason(order) }),
      })
      return false
    }
    setMessage(undefined)
    nav.go('scan', { no: order.no })
    return true
  }

  return (
    <>
      <PdaHeader title={t('outbound.pdaVerify.title')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput
          label={t('outbound.pdaVerify.scanOrder')}
          onScan={onScan}
          message={message}
          candidates={openOrders.slice(0, 3).map((o) => ({ value: o.no }))}
        />
        <PdaSection title={t('outbound.pdaVerify.listTitle', { count: openOrders.length })}>
          {openOrders.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('outbound.ui.stationNoCandidates')}</div>
          )}
          {openOrders.map((o) => (
            <PdaListItem key={o.no} onClick={() => nav.go('scan', { no: o.no })}>
              <div className="flex items-center gap-2">
                <DocNoTail value={o.no} tail={4} className="text-base whitespace-nowrap" />
                <span className="ml-auto">
                  <StatusBadge meta={outboundStatusMeta[o.status]} />
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <TagLabel meta={outboundTypeMeta[o.type]} />
                <span>{t('outbound.pdaVerify.picked', { count: sum(o.items, (i) => i.pickedQty) })}</span>
                <span className="ml-auto text-base font-semibold text-primary tabular-nums">
                  {t('outbound.pdaVerify.ctxToVerify', { count: toVerifyQty(o) })}
                </span>
              </div>
            </PdaListItem>
          ))}
        </PdaSection>
      </div>
    </>
  )
}
