import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { beep } from '@/components/pda/scan-input'
import { Button } from '@/components/ui/button'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import { findLocation, remainingQty, suggestPutawayLocation, validatePutawayLocation } from '@/lib/putaway'
import { cn } from '@/lib/utils'
import type { PutawayOrder } from '@/types/inbound'
import type { Location } from '@/types/wms'
import { PutawayContext } from './putaway-shared'
import type { PutawayFlow } from './use-putaway-flow'

/** 落位录入（PDA 上架 PRD §3、§5）：选商品、填数量，保存到刚扫的目标货位；只记进度不动库存 */
export function PutawayPlaceStep({ flow }: { flow: PutawayFlow }) {
  const { nav } = flow
  const order = flow.findOrder(nav.param('po'))
  const locParam = nav.param('loc')
  const location = order && locParam ? findLocation(flow.locations, order.warehouseCode, locParam) : undefined
  const locationValid = Boolean(order && location && !validatePutawayLocation(order, location.code, flow.locationContext))

  useEffect(() => {
    if (!order || order.status === 'COMPLETED') nav.replace('list')
    else if (!locationValid) nav.returnTo('work', { po: order.putawayNo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.putawayNo, order?.status, locationValid])

  if (!order || order.status === 'COMPLETED' || !location || !locationValid) return null
  return <PlaceEditor key={`${order.putawayNo}|${location.code}`} flow={flow} order={order} location={location} />
}

function PlaceEditor({ flow, order, location }: { flow: PutawayFlow; order: PutawayOrder; location: Location }) {
  const { t, nav } = flow
  const ctx = flow.locationContext
  const openLines = order.planLines.filter((l) => remainingQty(order, l.skuCode) > 0)
  const only = openLines.length === 1 ? openLines[0].skuCode : undefined
  const [skuCode, setSkuCode] = useState<string | undefined>(only)
  const [qty, setQty] = useState(() => (only ? remainingQty(order, only) : 0))
  const remain = skuCode ? remainingQty(order, skuCode) : 0

  const select = (code: string) => {
    setSkuCode(code)
    setQty(remainingQty(order, code))
  }

  /** 扫商品：选中该行；扫货位：校验后切换目标货位 */
  const onScan = (code: string) => {
    const hit = flow.resolveSkuIn(order, code)
    if (hit) {
      if (remainingQty(order, hit) <= 0) {
        flow.failScan(t('pdaPutaway.lineDone', { sku: hit }))
        return
      }
      beep(true)
      select(hit)
      return
    }
    const next = findLocation(flow.locations, order.warehouseCode, code)
    if (next) {
      const err = validatePutawayLocation(order, next.code, ctx)
      if (err) {
        flow.failScan(t(err))
        return
      }
      beep(true)
      toast.info(t('pdaPutaway.locationSwitched', { location: next.code }))
      nav.replace('place', { po: order.putawayNo, loc: next.code })
      return
    }
    flow.failScan(t('pdaPutaway.notInOrder'))
  }
  usePdaScanListener(onScan)

  const afterSave = (savedSku: string, savedQty: number) => {
    const suggested = suggestPutawayLocation(order, savedSku, ctx)
    beep(true)
    toast.success(t('pdaPutaway.saved', { sku: savedSku, qty: savedQty, location: location.code }))
    if (suggested && suggested !== location.code) toast.info(t('pdaPutaway.locationDiffers'))
    nav.returnTo('work', { po: order.putawayNo })
  }

  const save = () => {
    if (!skuCode) return
    const res = flow.savePutawayLine({
      putawayNo: order.putawayNo,
      locationCode: location.code,
      skuCode,
      qty,
      operator: flow.operator,
    })
    if (!res.ok) {
      void flow.notice(t('pdaPutaway.save'), t(res.errorKey))
      return
    }
    afterSave(skuCode, qty)
  }

  /** 整箱落位：本单所有剩余数量都记到当前货位 */
  const placeAll = () => {
    let total = 0
    for (const line of openLines) {
      const lineQty = remainingQty(order, line.skuCode)
      const res = flow.savePutawayLine({
        putawayNo: order.putawayNo,
        locationCode: location.code,
        skuCode: line.skuCode,
        qty: lineQty,
        operator: flow.operator,
      })
      if (!res.ok) {
        void flow.notice(t('pdaPutaway.placeAll'), t(res.errorKey))
        return
      }
      total += lineQty
    }
    afterSave(openLines.map((l) => l.skuCode).join(', '), total)
  }

  return (
    <>
      <PdaHeader title={t('pda.putaway')} onBack={() => nav.back({ step: 'work', params: { po: order.putawayNo } })} />
      <PutawayContext flow={flow} order={order} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="rounded-xl bg-background px-3 py-2 shadow-xs">
          <div className="text-sm text-muted-foreground">{t('pdaPutaway.targetLocation')}</div>
          <div className="font-mono text-2xl font-bold text-primary">{location.code}</div>
        </div>
        <div className="text-sm font-medium">{t('pdaPutaway.promptSku')}</div>
        <div className="flex flex-col gap-2" role="radiogroup">
          {openLines.map((l) => (
            <button
              key={l.skuCode}
              type="button"
              role="radio"
              aria-checked={skuCode === l.skuCode}
              onClick={() => select(l.skuCode)}
              className={cn(
                'flex min-h-14 items-center gap-3 rounded-xl border bg-background p-3 text-left active:bg-accent',
                skuCode === l.skuCode ? 'border-primary' : 'border-transparent shadow-xs',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-base font-semibold">{l.skuCode}</div>
                <div className="line-clamp-2 text-sm">{flow.sku(l.skuCode)?.name}</div>
              </div>
              <div className="shrink-0 text-base font-semibold text-primary tabular-nums">
                {t('pdaPutaway.lineRemain', { count: remainingQty(order, l.skuCode) })}
              </div>
            </button>
          ))}
        </div>
        {skuCode && (
          <div className="rounded-xl bg-background p-3 shadow-xs">
            <QtyStepper
              label={t('pdaPutaway.qty')}
              value={qty}
              max={remain}
              onChange={(v) => {
                setQty(v)
                return true
              }}
              onScanText={onScan}
            />
          </div>
        )}
      </div>
      <PdaFooter hint={skuCode ? undefined : t('pdaPutaway.pickSku')}>
        <Button variant="outline" className="h-12 flex-1 text-base" onClick={placeAll}>
          {t('pdaPutaway.placeAll')}
        </Button>
        <Button className="h-12 flex-1 text-base" disabled={!skuCode || qty <= 0} onClick={save}>
          {t('pdaPutaway.save')}
        </Button>
      </PdaFooter>
    </>
  )
}
