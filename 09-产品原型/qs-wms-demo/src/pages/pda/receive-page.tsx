import { CheckCircle2, PackageOpen } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { inboundStatusMeta } from '@/config/status'
import { useInbound, useReceivableInbounds } from '@/hooks/use-inbound'
import { cn } from '@/lib/utils'
import { useLookups } from '@/mock/db'
import { remainInboundItemQty } from '@/services/inbound'
import { useSettings } from '@/stores/settings'
import type { InboundOrder } from '@/types/wms'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput } from '@/components/pda/scan-input'
import { StepBar } from '@/components/pda/step-bar'

/**
 * PDA 收货：扫入库单 → 扫商品 → 录良品/不良品数量 → 确认。
 * 新增 PDA 流程时照着这个结构写：step 状态机 + ScanInput + 底部主按钮。
 */
export function PdaReceivePage() {
  const { t } = useTranslation()
  const { warehouseCode, operator } = useSettings()
  const { inbounds, receiveInboundItem } = useInbound()
  const receivable = useReceivableInbounds(warehouseCode)
  const { sku, customerName } = useLookups()

  const [inboundNo, setInboundNo] = useState<string>()
  const [skuCode, setSkuCode] = useState<string>()
  const [goodQty, setGoodQty] = useState(0)
  const [defectQty, setDefectQty] = useState(0)

  const order = inbounds.find((o) => o.inboundNo === inboundNo)
  const item = order?.items.find((i) => i.skuCode === skuCode)
  const remainItems = order?.items.filter((i) => remainInboundItemQty(i) > 0) ?? []
  const step = !order ? 1 : !item ? 2 : 3

  const selectItem = (target: InboundOrder['items'][number]) => {
    setSkuCode(target.skuCode)
    setGoodQty(remainInboundItemQty(target))
    setDefectQty(0)
  }

  const scanOrder = (code: string) => {
    const found = receivable.find((o) => o.inboundNo === code.toUpperCase() || o.containerNo === code.toUpperCase())
    if (!found) {
      toast.error(t('pda.inboundInvalid'))
      return false
    }
    setInboundNo(found.inboundNo)
    return true
  }

  const scanSku = (code: string) => {
    const upper = code.toUpperCase()
    const hit = order?.items.find((i) => i.skuCode === upper || sku(i.skuCode)?.barcode === code)
    if (!hit) {
      toast.error(t('pda.notInOrder'))
      return false
    }
    selectItem(hit)
    return true
  }

  const confirm = () => {
    if (!order || !item) return
    const res = receiveInboundItem({ inboundNo: order.inboundNo, skuCode: item.skuCode, goodQty, defectQty, operator })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('pda.receiveSuccess', { sku: item.skuCode, count: goodQty + defectQty }))
    setSkuCode(undefined)
  }

  return (
    <>
      <PdaHeader
        title={t('pda.receive')}
        onBack={step === 3 ? () => setSkuCode(undefined) : step === 2 ? () => setInboundNo(undefined) : undefined}
      />
      <StepBar step={step} labels={[t('pda.stepOrder'), t('pda.stepSku'), t('pda.stepQty')]} />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {step === 1 && (
          <ScanInput
            label={t('pda.scanInbound')}
            onScan={scanOrder}
            candidates={receivable.slice(0, 6).map((o) => ({ value: o.inboundNo }))}
          />
        )}

        {order && (
          <div className="rounded-xl bg-background p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-semibold">{order.inboundNo}</span>
              <StatusBadge meta={inboundStatusMeta[order.status]} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{customerName(order.customerId)}</div>
            <div className="mt-0.5 font-mono text-xs text-muted-foreground">{order.containerNo}</div>
          </div>
        )}

        {step === 2 && order && (
          <>
            {remainItems.length > 0 ? (
              <>
                <ScanInput
                  label={t('pda.scanSku')}
                  onScan={scanSku}
                  candidates={remainItems.map((i) => ({ value: sku(i.skuCode)?.barcode ?? i.skuCode, label: i.skuCode }))}
                />
                <div>
                  <div className="mb-2 text-sm font-medium">{t('pda.orderItems')}</div>
                  <div className="flex flex-col gap-2">
                    {order.items.map((i) => {
                      const remain = remainInboundItemQty(i)
                      return (
                        <button
                          key={i.skuCode}
                          type="button"
                          disabled={remain === 0}
                          onClick={() => selectItem(i)}
                          className="flex items-center gap-3 rounded-xl bg-background p-3 text-left shadow-xs active:bg-accent disabled:opacity-50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-sm font-medium">{i.skuCode}</div>
                            <div className="truncate text-xs text-muted-foreground">{sku(i.skuCode)?.name}</div>
                          </div>
                          <div className="text-right">
                            <div className={cn('text-sm font-semibold', remain ? 'text-primary' : 'text-emerald-600')}>
                              {remain ? t('pda.remain', { count: remain }) : <CheckCircle2 className="size-5" />}
                            </div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {i.receivedGoodQty + i.receivedDefectQty}/{i.plannedQty}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="size-14 text-emerald-500" />
                <div className="text-base font-medium">{t('pda.receiveAllDone')}</div>
              </div>
            )}
          </>
        )}

        {step === 3 && item && (
          <div className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                <PackageOpen className="size-6 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-base font-semibold">{item.skuCode}</div>
                <div className="text-sm text-muted-foreground">{sku(item.skuCode)?.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{sku(item.skuCode)?.barcode}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 rounded-lg bg-muted/60 py-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">{t('inbound.plannedQty')}</div>
                <div className="text-lg font-semibold tabular-nums">{item.plannedQty}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('inbound.receivedQty')}</div>
                <div className="text-lg font-semibold tabular-nums">{item.receivedGoodQty + item.receivedDefectQty}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('pda.remainLabel')}</div>
                <div className="text-lg font-semibold text-primary tabular-nums">{remainInboundItemQty(item)}</div>
              </div>
            </div>
            <QtyStepper label={t('pda.goodQty')} value={goodQty} onChange={setGoodQty} />
            <QtyStepper label={t('pda.defectQty')} value={defectQty} onChange={setDefectQty} tone="danger" />
          </div>
        )}
      </div>

      {step === 2 && (
        <PdaFooter>
          <Button variant="outline" className="h-12 flex-1 text-base" onClick={() => setInboundNo(undefined)}>
            {t('pda.switchOrder')}
          </Button>
        </PdaFooter>
      )}
      {step === 3 && (
        <PdaFooter>
          <Button variant="outline" className="h-12 w-24 text-base" onClick={() => setSkuCode(undefined)}>
            {t('common.back')}
          </Button>
          <Button className="h-12 flex-1 text-base" disabled={goodQty + defectQty <= 0} onClick={confirm}>
            {t('pda.confirmReceive')} ({goodQty + defectQty})
          </Button>
        </PdaFooter>
      )}
    </>
  )
}
