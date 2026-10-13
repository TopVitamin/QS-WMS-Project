import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaCard, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { beep } from '@/components/pda/scan-input'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import { findLocation, remainingQty, suggestPutawayLocation, validatePutawayLocation } from '@/lib/putaway'
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
        <PdaCard className="py-2">
          <div className="text-sm text-muted-foreground">{t('pdaPutaway.targetLocation')}</div>
          <div className="font-mono text-2xl font-bold text-primary">{location.code}</div>
        </PdaCard>
        <div role="radiogroup">
          <PdaSection title={t('pdaPutaway.promptSku')}>
            {openLines.map((l) => (
              <PdaListItem
                key={l.skuCode}
                role="radio"
                selectable
                selected={skuCode === l.skuCode}
                onClick={() => select(l.skuCode)}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-base font-semibold">{l.skuCode}</div>
                    <div className="line-clamp-2 text-sm">{flow.sku(l.skuCode)?.name}</div>
                  </div>
                  <div className="shrink-0 text-base font-semibold text-primary tabular-nums">
                    {t('pdaPutaway.lineRemain', { count: remainingQty(order, l.skuCode) })}
                  </div>
                </div>
              </PdaListItem>
            ))}
          </PdaSection>
        </div>
        {skuCode && (
          <PdaCard>
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
          </PdaCard>
        )}
      </div>
      <PdaFooter hint={skuCode ? undefined : t('pdaPutaway.pickSku')}>
        <PdaButton variant="outline" className="flex-1" onClick={placeAll}>
          {t('pdaPutaway.placeAll')}
        </PdaButton>
        <PdaButton className="flex-1" disabled={!skuCode || qty <= 0} onClick={save}>
          {t('pdaPutaway.save')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
