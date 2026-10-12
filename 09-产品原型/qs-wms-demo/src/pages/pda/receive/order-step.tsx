import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge } from '@/components/biz/status-badge'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput } from '@/components/pda/scan-input'
import { Button } from '@/components/ui/button'
import { inboundOrderStatusMeta } from '@/config/status'
import { lineUnreceivedQty } from '@/lib/inbound-derive'
import type { ReceiveFlow } from './use-receive-flow'

/** 选单（PDA 收货 PRD §2、§3）：扫入库单号或柜号、点选可收货单；有未提交作业时先接续 */
export function ReceiveOrderStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, receivable, lineCount, order, orderReceivable, warehouse } = flow
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
      toast.error(t('pda.inboundInvalid'))
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
          <div className="rounded-xl border border-warning/40 bg-background p-3 shadow-xs">
            <div className="text-sm font-medium text-warning">{t('pdaReceive.pendingTitle')}</div>
            <DocNoTail value={session.inboundNo} tail={4} className="mt-1 text-lg" />
            <div className="text-sm text-muted-foreground">
              {t('pdaReceive.pendingSummary', {
                boxes: draftBoxes.length,
                lines: lineCount,
                time: session.updatedAt ? dayjs(session.updatedAt).tz(warehouse.timezone).format('MM-DD HH:mm') : '-',
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="h-12 flex-1 text-base text-destructive" onClick={discard}>
                {t('pdaReceive.discard')}
              </Button>
              <Button className="h-12 flex-1 text-base" onClick={resume}>
                {t('pdaReceive.resume')}
              </Button>
            </div>
          </div>
        )}

        <ScanInput
          label={t('pdaReceive.promptOrder')}
          onScan={onScan}
          candidates={receivable.slice(0, 4).map((o) => ({ value: o.inboundNo }))}
        />

        <div>
          <div className="mb-2 text-sm font-medium">{t('pdaReceive.receivableList', { count: receivable.length })}</div>
          {receivable.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t('pdaReceive.noReceivable')}</div>
          )}
          <div className="flex flex-col gap-2">
            {receivable.map((o) => (
              <button
                key={o.inboundNo}
                type="button"
                onClick={() => selectOrder(o.inboundNo)}
                className="flex min-h-14 flex-col gap-0.5 rounded-xl bg-background p-3 text-left shadow-xs active:bg-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <DocNoTail value={o.inboundNo} tail={4} className="text-base" />
                  <StatusBadge meta={inboundOrderStatusMeta[o.status]} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('pdaReceive.orderSummary', {
                    owner: flow.customerName(o.customerId),
                    kinds: o.items.length,
                    remain: o.items.reduce((s, i) => s + lineUnreceivedQty(i), 0),
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
