import { ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput } from '@/components/pda/scan-input'
import { Button } from '@/components/ui/button'
import { isWorkContainerUsedOnInbound } from '@/lib/inbound-receipt-container'
import { cn } from '@/lib/utils'
import { boxKeyOf } from '@/stores/pda-receive-session'
import { QtyTriple, ReceiveContext } from './receive-shared'
import type { ReceiveFlow } from './use-receive-flow'

/** 扫容器（PDA 收货 PRD §3、§5）：绑定下一个作业容器或无容器收货；列出本次作业已有容器 */
export function ReceiveContainerStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, order, orderReceivable } = flow

  useEffect(() => {
    if (!order || !orderReceivable) {
      nav.replace('order')
      return
    }
    // 空容器不保留（PDA 收货 PRD §5.1）
    session.boxes.filter((b) => b.lines.length === 0).forEach((b) => session.dropEmptyBox(b.key))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.inboundNo, orderReceivable])

  if (!order) return null
  const boxes = session.boxes.filter((b) => b.lines.length > 0)
  const tail = order.inboundNo.slice(-4)
  const candidates = Array.from({ length: 9 }, (_, i) => `BOX-${tail}-0${i + 1}`)
    .filter(
      (c) =>
        !isWorkContainerUsedOnInbound(flow.receipts, order.inboundNo, c) &&
        !session.boxes.some((b) => b.key === boxKeyOf(c, false)),
    )
    .slice(0, 3)
    .map((value) => ({ value }))

  const openBox = (containerNo: string | undefined, bulkPiece: boolean) => {
    const key = session.openBox({ containerNo, bulkPiece })
    nav.go('box', { box: key })
  }

  const onScan = (code: string) => {
    const containerNo = code.trim()
    if (session.boxes.some((b) => b.key === boxKeyOf(containerNo, false))) {
      openBox(containerNo, false)
      return true
    }
    const kind = flow.classifyNonContainer(containerNo)
    if (kind) {
      toast.error(t('pdaReceive.notContainer', { kind: t(`pdaReceive.kind.${kind}`) }))
      return false
    }
    if (isWorkContainerUsedOnInbound(flow.receipts, order.inboundNo, containerNo)) {
      void flow.notice(t('pdaReceive.blockedTitle'), t('inbound.receive.containerAlreadyUsed', { no: containerNo }))
      return false
    }
    openBox(containerNo, false)
    return true
  }

  return (
    <>
      <PdaHeader title={t('pda.receive')} onBack={() => nav.back({ step: 'order' })} />
      <ReceiveContext flow={flow} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput label={t('pdaReceive.promptContainer')} onScan={onScan} candidates={candidates} />

        {boxes.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">{t('pdaReceive.sessionBoxes', { count: boxes.length })}</div>
            <div className="flex flex-col gap-2">
              {boxes.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => openBox(b.containerNo, b.bulkPiece)}
                  className="flex min-h-14 items-center gap-2 rounded-xl bg-background p-3 text-left shadow-xs active:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-base font-semibold', !b.bulkPiece && 'font-mono')}>{flow.boxLabel(b)}</span>
                      <span className="text-sm text-muted-foreground">
                        {b.status === 'STASHED' ? t('pdaReceive.boxStashed') : t('pdaReceive.boxOpen')} ·{' '}
                        {t('pdaReceive.lineCount', { count: b.lines.length })}
                      </span>
                    </div>
                    <QtyTriple lines={b.lines} />
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <PdaFooter>
        <Button variant="outline" className="h-12 flex-1 text-base" onClick={() => openBox(undefined, true)}>
          {t('inbound.bulkPiece')}
        </Button>
        {boxes.length > 0 && (
          <Button className="h-12 flex-1 text-base" onClick={() => nav.go('submit')}>
            {t('pdaReceive.submitReceiptCount', { count: boxes.length })}
          </Button>
        )}
      </PdaFooter>
    </>
  )
}
