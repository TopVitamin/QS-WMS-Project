import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge } from '@/components/biz/status-badge'
import { PdaButton, PdaCard, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { inboundOrderStatusMeta } from '@/config/status'
import { lineUnreceivedQty } from '@/lib/inbound-derive'
import { EMPTY_TEXT } from '@/lib/typography'
import type { ReceiveFlow } from './use-receive-flow'

/** 选单（PDA 收货 PRD §2、§3）：扫入库单号或柜号、点选可收货单；有未提交作业时先接续 */
export function ReceiveOrderStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, receivable, lineCount, order, orderReceivable, warehouse } = flow
  const [message, setMessage] = useState<ScanMessage>()
  const location = useLocation()
  const presetNo = (location.state as { inboundNo?: string } | null)?.inboundNo
  const presetHandled = useRef(false)
  const hasDraft = lineCount > 0
  const draftBoxes = session.boxes.filter((b) => b.lines.length > 0)

  const selectOrder = (inboundNo: string) => {
    if (hasDraft && session.inboundNo !== inboundNo) {
      void flow.notice(t('pdaReceive.blockedTitle'), t('pdaReceive.sessionConflict', { no: session.inboundNo }))
      return false
    }
    if (session.inboundNo !== inboundNo) session.start(inboundNo)
    nav.go('container')
    return true
  }

  // 管理端「PDA 收货」带单号进入：直达扫容器；先清掉一次性的入口参数，返回到这里时不再自动跳转
  useEffect(() => {
    if (!presetNo || presetHandled.current) return
    presetHandled.current = true
    nav.replace('order')
    if (receivable.some((o) => o.inboundNo === presetNo)) selectOrder(presetNo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetNo])

  const onScan = (code: string) => {
    const key = code.trim().toUpperCase()
    const found = receivable.find((o) => o.inboundNo.toUpperCase() === key || o.containerNo?.toUpperCase() === key)
    if (!found) {
      setMessage({ tone: 'error', text: t('pda.inboundInvalid') })
      return false
    }
    return selectOrder(found.inboundNo)
  }

  const resume = () => {
    if (!order || !orderReceivable) {
      void flow.notice(t('pdaReceive.blockedTitle'), t('pdaReceive.sessionInvalid', { no: session.inboundNo }))
      return
    }
    const active = session.activeKey && session.boxes.some((b) => b.key === session.activeKey) ? session.activeKey : undefined
    if (active) nav.go('box', { box: active })
    else nav.go('container')
  }

  const discard = async () => {
    const ok = await flow.confirm({
      title: t('pdaReceive.discardTitle'),
      description: t('pdaReceive.discardDesc', { boxes: draftBoxes.length, lines: lineCount }),
      confirmText: t('pdaReceive.discard'),
      variant: 'destructive',
    })
    if (ok) session.reset()
  }

  return (
    <>
      <PdaHeader title={t('pda.receive')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {hasDraft && session.inboundNo && (
          <PdaCard className="border border-warning/40">
            <div className="text-sm font-medium text-warning-text">{t('pdaReceive.pendingTitle')}</div>
            <DocNoTail value={session.inboundNo} tail={4} className="mt-1 text-lg" />
            <div className="text-sm text-muted-foreground">
              {t('pdaReceive.pendingSummary', {
                boxes: draftBoxes.length,
                lines: lineCount,
                time: session.updatedAt
                  ? dayjs(session.updatedAt).tz(warehouse.timezone).format('MM-DD HH:mm')
                  : EMPTY_TEXT,
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <PdaButton variant="outline" className="flex-1 text-destructive" onClick={discard}>
                {t('pdaReceive.discard')}
              </PdaButton>
              <PdaButton className="flex-1" onClick={resume}>
                {t('pdaReceive.resume')}
              </PdaButton>
            </div>
          </PdaCard>
        )}

        <ScanInput
          label={t('pdaReceive.promptOrder')}
          onScan={onScan}
          message={message}
          candidates={receivable.slice(0, 4).map((o) => ({ value: o.inboundNo }))}
        />

        <PdaSection title={t('pdaReceive.receivableList', { count: receivable.length })}>
          {receivable.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('pdaReceive.noReceivable')}</div>
          )}
          {receivable.map((o) => (
            <PdaListItem key={o.inboundNo} onClick={() => selectOrder(o.inboundNo)}>
              <div className="flex items-center justify-between gap-2">
                <DocNoTail value={o.inboundNo} tail={4} className="text-base" />
                <StatusBadge meta={inboundOrderStatusMeta[o.status]} />
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {t('pdaReceive.orderSummary', {
                  owner: flow.customerName(o.customerId),
                  kinds: o.items.length,
                  remain: o.items.reduce((sum, i) => sum + lineUnreceivedQty(i), 0),
                })}
              </div>
            </PdaListItem>
          ))}
        </PdaSection>
      </div>
    </>
  )
}
