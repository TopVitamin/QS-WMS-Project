import { useEffect, useState } from 'react'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { lineUnreceivedQty } from '@/lib/inbound-derive'
import { beep } from '@/lib/scan-beep'
import { QtyTriple, ReceiveContext } from './receive-shared'
import type { ReceiveFlow } from './use-receive-flow'

/** 容器作业（PDA 收货 PRD §3、§5）：在当前容器里逐个扫商品；新增容器、提交收货 */
export function ReceiveBoxStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, order, orderReceivable, isNewSkuInOrder } = flow
  const [message, setMessage] = useState<ScanMessage>()
  const boxKey = nav.param('box')
  const box = session.boxes.find((b) => b.key === boxKey)

  useEffect(() => {
    if (!order || !orderReceivable) nav.replace('order')
    else if (!box) nav.replace('container')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.inboundNo, orderReceivable, box?.key])

  if (!order || !box) return null
  const openItems = order.items.filter((i) => lineUnreceivedQty(i) > 0)
  const hasSessionLines = flow.lineCount > 0

  /** 新品先阻断并自动进入量方屏（PDA 新品量方 PRD §3），量方完成回到容器作业 */
  const openLine = (skuCode: string, entry: 'scan' | 'pick') => {
    if (isNewSkuInOrder(skuCode)) {
      beep(false)
      nav.go('measure', { box: box.key, sku: skuCode })
      return
    }
    nav.go('line', { box: box.key, sku: skuCode, entry })
  }

  const onScan = (code: string) => {
    const skuCode = flow.resolveSku(code)
    if (!skuCode) {
      setMessage({ tone: 'error', text: t('pda.notInOrder') })
      return false
    }
    const inBox = box.lines.some((l) => l.skuCode === skuCode)
    if (!inBox && flow.thisRemain(skuCode, box.key) <= 0) {
      setMessage({ tone: 'error', text: t('pdaReceive.fullThisTime', { sku: skuCode }) })
      return false
    }
    openLine(skuCode, 'scan')
    return true
  }

  /** 新增容器、提交收货前：校验并暂存当前容器（PDA 收货 PRD §5.1） */
  const stashCurrent = () => {
    if (box.lines.length === 0) return true
    const invalid = flow.validateBoxes([box])
    if (invalid) {
      void flow.notice(
        t('pdaReceive.blockedTitle'),
        t('pdaReceive.lineInvalid', { box: flow.boxLabel(box), sku: invalid.skuCode, reason: t(invalid.errorKey) }),
      )
      return false
    }
    session.stashBox(box.key)
    return true
  }

  const addContainer = () => {
    if (box.lines.length === 0) {
      session.dropEmptyBox(box.key)
      nav.returnTo('container')
      return
    }
    if (!stashCurrent()) return
    toast.success(t('pdaReceive.stashed', { box: flow.boxLabel(box) }))
    nav.returnTo('container')
  }

  const submit = () => {
    if (!stashCurrent()) return
    nav.go('submit')
  }

  return (
    <>
      <PdaHeader title={t('pda.receive')} onBack={() => nav.back({ step: 'container' })} />
      <ReceiveContext flow={flow} box={box} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput
          label={t('pdaReceive.promptSku')}
          onScan={onScan}
          message={message}
          candidates={openItems
            .filter((i) => flow.thisRemain(i.skuCode) > 0 || box.lines.some((l) => l.skuCode === i.skuCode))
            .map((i) => ({ value: flow.sku(i.skuCode)?.barcode ?? i.skuCode, label: i.skuCode }))}
        />

        {box.lines.length > 0 && (
          <PdaSection title={t('pdaReceive.boxLines', { count: box.lines.length })}>
            {box.lines.map((l) => (
              <PdaListItem key={l.skuCode} chevron onClick={() => openLine(l.skuCode, 'pick')}>
                <div className="font-mono text-base font-semibold">{l.skuCode}</div>
                <div className="line-clamp-2 text-sm">{flow.sku(l.skuCode)?.name}</div>
                <QtyTriple lines={[l]} />
              </PdaListItem>
            ))}
          </PdaSection>
        )}

        <PdaSection title={t('pdaReceive.remainTitle')}>
          {openItems.map((i) => {
            const remain = flow.thisRemain(i.skuCode)
            return (
              <PdaListItem
                key={i.skuCode}
                onClick={() => {
                  if (remain <= 0 && !box.lines.some((l) => l.skuCode === i.skuCode)) {
                    flow.failScan(t('pdaReceive.fullThisTime', { sku: i.skuCode }))
                    return
                  }
                  openLine(i.skuCode, 'pick')
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-base font-semibold">{i.skuCode}</div>
                    <div className="line-clamp-2 text-sm">{flow.sku(i.skuCode)?.name}</div>
                  </div>
                  <div className="shrink-0 text-right text-base font-semibold text-primary tabular-nums">
                    {t('pdaReceive.thisRemain', { count: remain })}
                  </div>
                </div>
              </PdaListItem>
            )
          })}
        </PdaSection>
      </div>
      <PdaFooter hint={hasSessionLines ? undefined : t('pdaReceive.boxEmptyHint')}>
        <PdaButton variant="outline" className="flex-1" onClick={addContainer}>
          {t('pdaReceive.addContainer')}
        </PdaButton>
        <PdaButton className="flex-1" disabled={!hasSessionLines} onClick={submit}>
          {t('pdaReceive.submitReceipt')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
