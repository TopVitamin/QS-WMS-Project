import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { beep, ScanInput } from '@/components/pda/scan-input'
import { Button } from '@/components/ui/button'
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
  const nextLine = order.planLines.find((l) => remainingQty(order, l.skuCode) > 0)
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

  const undo = async (locationCode: string, skuCode: string, qty: number) => {
    const ok = await flow.confirm({
      title: t('pdaPutaway.undoTitle'),
      description: t('pdaPutaway.undoDesc', { location: locationCode, sku: skuCode, qty }),
      confirmText: t('pdaPutaway.undo'),
      variant: 'destructive',
    })
    if (!ok) return
    const res = flow.removePutawayLine({ putawayNo: order.putawayNo, locationCode, skuCode, operator: flow.operator })
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
          <div className="flex items-baseline gap-2 rounded-xl bg-background px-3 py-2 shadow-xs">
            <span className="text-sm text-muted-foreground">{t('pdaPutaway.suggested')}</span>
            {suggested ? (
              <span className="font-mono text-2xl font-bold text-primary">{suggested}</span>
            ) : (
              <span className="text-sm">{t('pdaPutaway.noSuggestion')}</span>
            )}
          </div>
        )}

        <div>
          <div className="mb-2 text-sm font-medium">{t('pdaPutaway.planTitle')}</div>
          <div className="flex flex-col gap-2">
            {order.planLines.map((l) => {
              const done = recordedQty(order, l.skuCode) === l.planQty
              return (
                <div key={l.skuCode} className="flex items-center gap-3 rounded-xl bg-background p-3 shadow-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-base font-semibold">{l.skuCode}</div>
                    <div className="line-clamp-2 text-sm">{flow.sku(l.skuCode)?.name}</div>
                  </div>
                  <div className={cn('shrink-0 text-base font-semibold tabular-nums', done ? 'text-success' : 'text-primary')}>
                    {t('pdaPutaway.recorded', { recorded: recordedQty(order, l.skuCode), plan: l.planQty })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {pendingLines.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">{t('pdaPutaway.actualTitle')}</div>
            <div className="flex flex-col gap-2">
              {pendingLines.map((a) => (
                <div
                  key={`${a.locationCode}|${a.skuCode}`}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-background px-3 py-2 shadow-xs"
                >
                  <span className="font-mono text-base font-bold">{a.locationCode}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">{a.skuCode}</span>
                  <span className="text-base font-semibold tabular-nums">{a.qty}</span>
                  <button
                    type="button"
                    className="min-h-8 px-1 text-sm text-destructive"
                    onClick={() => undo(a.locationCode, a.skuCode, a.qty)}
                  >
                    {t('pdaPutaway.undo')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <PdaFooter hint={remaining > 0 ? t('pdaPutaway.remainToPlace', { count: remaining }) : undefined}>
        <Button className="h-12 flex-1 text-base" disabled={!isFullyRecorded(order)} onClick={submit}>
          {t('pdaPutaway.submit')}
        </Button>
      </PdaFooter>
    </>
  )
}
