import { ChevronRight } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput } from '@/components/pda/scan-input'
import { Button } from '@/components/ui/button'
import { lineUnreceivedQty } from '@/lib/inbound-derive'
import { QtyTriple, ReceiveContext } from './receive-shared'
import type { ReceiveFlow } from './use-receive-flow'

/** 容器作业（PDA 收货 PRD §3、§5）：在当前容器里逐个扫商品；新增容器、提交收货 */
export function ReceiveBoxStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, order, orderReceivable } = flow
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

  const openLine = (skuCode: string, entry: 'scan' | 'pick') => nav.go('line', { box: box.key, sku: skuCode, entry })

  const onScan = (code: string) => {
    const skuCode = flow.resolveSku(code)
    if (!skuCode) {
      toast.error(t('pda.notInOrder'))
      return false
    }
    const inBox = box.lines.some((l) => l.skuCode === skuCode)
    if (!inBox && flow.thisRemain(skuCode, box.key) <= 0) {
      toast.error(t('pdaReceive.fullThisTime', { sku: skuCode }))
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
          candidates={openItems
            .filter((i) => flow.thisRemain(i.skuCode) > 0 || box.lines.some((l) => l.skuCode === i.skuCode))
            .map((i) => ({ value: flow.sku(i.skuCode)?.barcode ?? i.skuCode, label: i.skuCode }))}
        />

        {box.lines.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">{t('pdaReceive.boxLines', { count: box.lines.length })}</div>
            <div className="flex flex-col gap-2">
              {box.lines.map((l) => (
                <button
                  key={l.skuCode}
                  type="button"
                  onClick={() => openLine(l.skuCode, 'pick')}
                  className="flex min-h-14 items-center gap-2 rounded-xl bg-background p-3 text-left shadow-xs active:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-base font-semibold">{l.skuCode}</div>
                    <div className="line-clamp-2 text-sm">{flow.sku(l.skuCode)?.name}</div>
                    <QtyTriple lines={[l]} />
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-sm font-medium">{t('pdaReceive.remainTitle')}</div>
          <div className="flex flex-col gap-2">
            {openItems.map((i) => {
              const remain = flow.thisRemain(i.skuCode)
              return (
                <button
                  key={i.skuCode}
                  type="button"
                  onClick={() => {
                    if (remain <= 0 && !box.lines.some((l) => l.skuCode === i.skuCode)) {
                      flow.failScan(t('pdaReceive.fullThisTime', { sku: i.skuCode }))
                      return
                    }
                    openLine(i.skuCode, 'pick')
                  }}
                  className="flex min-h-14 items-center gap-3 rounded-xl bg-background p-3 text-left shadow-xs active:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-base font-semibold">{i.skuCode}</div>
                    <div className="line-clamp-2 text-sm">{flow.sku(i.skuCode)?.name}</div>
                  </div>
                  <div className="shrink-0 text-right text-base font-semibold text-primary tabular-nums">
                    {t('pdaReceive.thisRemain', { count: remain })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <PdaFooter hint={hasSessionLines ? undefined : t('pdaReceive.boxEmptyHint')}>
        <Button variant="outline" className="h-12 flex-1 text-base" onClick={addContainer}>
          {t('pdaReceive.addContainer')}
        </Button>
        <Button className="h-12 flex-1 text-base" disabled={!hasSessionLines} onClick={submit}>
          {t('pdaReceive.submitReceipt')}
        </Button>
      </PdaFooter>
    </>
  )
}
