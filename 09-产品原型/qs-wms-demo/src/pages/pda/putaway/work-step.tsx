import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput } from '@/components/pda/scan-input'
import { beep } from '@/lib/scan-beep'
import {
  findLocation,
  isFullyRecorded,
  recordedQty,
  remainingQty,
  suggestPutawayLocation,
  validatePutawayLocation,
} from '@/lib/putaway'
import { cn } from '@/lib/utils'
import { PutawayContext } from './putaway-shared'
import type { PutawayFlow } from './use-putaway-flow'

/** 上架单作业（PDA 上架 PRD §3、§5）：扫目标货位落位；看应上架与已录落位；全部落完后提交 */
export function PutawayWorkStep({ flow }: { flow: PutawayFlow }) {
  const { t, nav } = flow
  const order = flow.findOrder(nav.param('po'))
  /** 本页刚提交成功、正在回到列表时，不再按「已提交」纠正与提示 */
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    if (!order) nav.replace('list')
    else if (order.status === 'COMPLETED') {
      toast.info(t('pdaPutaway.error.orderSubmitted'))
      nav.replace('list')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.putawayNo, order?.status])

  if (!order || order.status === 'COMPLETED') return null
  const ctx = flow.locationContext
  const nextLine = order.planLines.find((l) => remainingQty(order, l.lineNo) > 0)
  const suggested = suggestPutawayLocation(order, nextLine?.skuCode, ctx)
  const another = flow.locations.find((l) => l.code !== suggested && validatePutawayLocation(order, l.code, ctx) === null)
  const remaining = remainingQty(order)
  const pendingLines = order.actualLines.filter((a) => !a.submitted)

  const onScan = (code: string) => {
    const location = findLocation(flow.locations, order.warehouseCode, code)
    if (!location) {
      toast.error(flow.resolveSkuIn(order, code) ? t('pdaPutaway.scanLocationFirst') : t('pdaPutaway.error.locationNotFound'))
      return false
    }
    const err = validatePutawayLocation(order, location.code, ctx)
    if (err) {
      toast.error(t(err))
      return false
    }
    nav.go('place', { po: order.putawayNo, loc: location.code })
    return true
  }

  const undo = async (lineNo: number, locationCode: string, skuCode: string, qty: number) => {
    const ok = await flow.confirm({
      title: t('pdaPutaway.undoTitle'),
      description: t('pdaPutaway.undoDesc', { location: locationCode, sku: skuCode, qty }),
      confirmText: t('pdaPutaway.undo'),
      variant: 'destructive',
    })
    if (!ok) return
    const res = flow.removePutawayLine({
      putawayNo: order.putawayNo,
      locationCode,
      planLineNo: lineNo,
      operator: flow.operator,
    })
    if (!res.ok) void flow.notice(t('pdaPutaway.undo'), t(res.errorKey))
  }

  const submit = async () => {
    const ok = await flow.confirm({
      title: t('pdaPutaway.submitTitle', { no: order.putawayNo }),
      description: t('pdaPutaway.submitDesc', { lines: order.actualLines.length }),
      confirmText: t('pdaPutaway.submit'),
    })
    if (!ok) return
    doneRef.current = true
    const res = flow.submitPutawayOrder({ putawayNo: order.putawayNo, operator: flow.operator })
    if (!res.ok) {
      doneRef.current = false
      void flow.notice(t('pdaPutaway.submit'), t(res.errorKey))
      return
    }
    beep(true)
    toast.success(t('pdaPutaway.submitSuccess', { no: order.putawayNo }))
    nav.returnTo('list')
  }

  return (
    <>
      <PdaHeader title={t('pda.putaway')} onBack={() => nav.back({ step: 'list' })} />
      <PutawayContext flow={flow} order={order} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput
          label={t('pdaPutaway.promptLocation')}
          onScan={onScan}
          candidates={[
            ...(suggested ? [{ value: suggested, label: t('pdaPutaway.suggested') }] : []),
            ...(another ? [{ value: another.code }] : []),
          ]}
        />
        {remaining > 0 && (
          <PdaCard className="flex items-baseline gap-2 py-2">
            <span className="text-sm text-muted-foreground">{t('pdaPutaway.suggested')}</span>
            {suggested ? (
              <span className="font-mono text-2xl font-bold text-primary">{suggested}</span>
            ) : (
              <span className="text-sm">{t('pdaPutaway.noSuggestion')}</span>
            )}
          </PdaCard>
        )}

        <PdaSection title={t('pdaPutaway.planTitle')}>
          {order.planLines.map((l) => {
            const done = recordedQty(order, l.lineNo) === l.planQty
            return (
              <PdaCard key={l.lineNo} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-base font-semibold">{l.batchNo ? `${l.skuCode} · ${l.batchNo}` : l.skuCode}</div>
                  <div className="line-clamp-2 text-sm">{flow.sku(l.skuCode)?.name}</div>
                </div>
                <div className={cn('shrink-0 text-base font-semibold tabular-nums', done ? 'text-success-text' : 'text-primary')}>
                  {t('pdaPutaway.recorded', { recorded: recordedQty(order, l.lineNo), plan: l.planQty })}
                </div>
              </PdaCard>
            )
          })}
        </PdaSection>

        {pendingLines.length > 0 && (
          <PdaSection title={t('pdaPutaway.actualTitle')}>
            {pendingLines.map((a) => (
              <PdaCard key={a.lineNo} className="flex min-h-12 items-center gap-3 py-2">
                <span className="font-mono text-base font-bold">{a.locationCode}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">
                  {t('pdaPutaway.actualLineLabel', { sku: a.skuCode, line: a.planLineNo })}
                </span>
                <span className="text-base font-semibold tabular-nums">{a.qty}</span>
                <button
                  type="button"
                  className="min-h-8 px-1 text-sm text-destructive"
                  onClick={() => undo(a.planLineNo, a.locationCode, a.skuCode, a.qty)}
                >
                  {t('pdaPutaway.undo')}
                </button>
              </PdaCard>
            ))}
          </PdaSection>
        )}
      </div>
      <PdaFooter hint={remaining > 0 ? t('pdaPutaway.remainToPlace', { count: remaining }) : undefined}>
        <PdaButton className="flex-1" disabled={!isFullyRecorded(order)} onClick={submit}>
          {t('pdaPutaway.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
