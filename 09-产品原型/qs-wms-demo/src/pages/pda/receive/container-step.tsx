import { useEffect, useState } from 'react'
import { PdaButton, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { isWorkContainerUsedOnInbound } from '@/lib/inbound-receipt-container'
import { cn } from '@/lib/utils'
import { boxKeyOf } from '@/stores/pda-receive-session'
import { useDb } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import { QtyTriple, ReceiveContext } from './receive-shared'
import type { ReceiveFlow } from './use-receive-flow'

/** 扫容器（PDA 收货 PRD §3、§5）：绑定下一个作业容器或无容器收货；列出本次作业已有容器 */
export function ReceiveContainerStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, order, orderReceivable } = flow
  const bindContainer = useDb((s) => s.bindContainer)
  const operator = useSettings((s) => s.operator)
  const [message, setMessage] = useState<ScanMessage>()

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
    if (!bulkPiece && containerNo && order) {
      const bound = bindContainer({
        warehouseCode: order.warehouseCode,
        customerId: order.customerId,
        containerNo,
        operator,
      })
      if (!bound.ok) {
        setMessage({ tone: 'error', text: t(bound.errorKey, bound.params) })
        return
      }
    }
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
      setMessage({ tone: 'error', text: t('pdaReceive.notContainer', { kind: t(`pdaReceive.kind.${kind}`) }) })
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
        <ScanInput label={t('pdaReceive.promptContainer')} onScan={onScan} candidates={candidates} message={message} />

        {boxes.length > 0 && (
          <PdaSection title={t('pdaReceive.sessionBoxes', { count: boxes.length })}>
            {boxes.map((b) => (
              <PdaListItem key={b.key} chevron onClick={() => openBox(b.containerNo, b.bulkPiece)}>
                <div className="flex items-center gap-2">
                  <span className={cn('text-base font-semibold', !b.bulkPiece && 'font-mono')}>{flow.boxLabel(b)}</span>
                  <span className="text-sm text-muted-foreground">
                    {b.status === 'STASHED' ? t('pdaReceive.boxStashed') : t('pdaReceive.boxOpen')} ·{' '}
                    {t('pdaReceive.lineCount', { count: b.lines.length })}
                  </span>
                </div>
                <QtyTriple lines={b.lines} />
              </PdaListItem>
            ))}
          </PdaSection>
        )}
      </div>
      <PdaFooter>
        <PdaButton variant="outline" className="flex-1" onClick={() => openBox(undefined, true)}>
          {t('inbound.bulkPiece')}
        </PdaButton>
        {boxes.length > 0 && (
          <PdaButton className="flex-1" onClick={() => nav.go('submit')}>
            {t('pdaReceive.submitReceiptCount', { count: boxes.length })}
          </PdaButton>
        )}
      </PdaFooter>
    </>
  )
}
