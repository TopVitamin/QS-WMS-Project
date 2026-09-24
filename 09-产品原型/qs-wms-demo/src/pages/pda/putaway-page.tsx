import { ArrowDown, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePutaway } from '@/hooks/use-putaway'
import { useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput } from '@/components/pda/scan-input'
import { StepBar } from '@/components/pda/step-bar'

/** PDA 上架：扫商品（或选任务）→ 扫货位 → 确认数量 */
export function PdaPutawayPage() {
  const { t } = useTranslation()
  const { warehouseCode, operator } = useSettings()
  const { tasks, pendingTasks: pending, locations, putaway } = usePutaway(warehouseCode)
  const { sku } = useLookups()

  const [taskNo, setTaskNo] = useState<string>()
  const [locationCode, setLocationCode] = useState<string>()
  const [qty, setQty] = useState(0)

  const task = tasks.find((x) => x.putawayNo === taskNo)
  const remain = task ? task.planQty - task.actualQty : 0
  const step = !task ? 1 : !locationCode ? 2 : 3

  const selectTask = (no: string) => {
    const x = tasks.find((k) => k.putawayNo === no)
    setTaskNo(no)
    setLocationCode(undefined)
    setQty(x ? x.planQty - x.actualQty : 0)
  }

  const scanSku = (code: string) => {
    const upper = code.toUpperCase()
    const hit = pending.find((x) => x.skuCode === upper || sku(x.skuCode)?.barcode === code)
    if (!hit) {
      toast.error(t('pda.unknownBarcode', { code }))
      return false
    }
    selectTask(hit.putawayNo)
    return true
  }

  const scanLocation = (code: string) => {
    const upper = code.toUpperCase()
    const loc = locations.find((l) => l.code === upper)
    if (!loc || loc.type === 'STAGING') {
      toast.error(t('error.locationNotFound'))
      return false
    }
    setLocationCode(loc.code)
    if (task && loc.code !== task.suggestedLocationCode) toast.warning(t('pda.locationMismatch'))
    return true
  }

  const confirm = () => {
    if (!task || !locationCode) return
    const res = putaway({ putawayNo: task.putawayNo, locationCode, qty, operator })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('pda.putawaySuccess', { sku: task.skuCode, count: qty, location: locationCode }))
    setTaskNo(undefined)
    setLocationCode(undefined)
  }

  const otherLocation = locations.find((l) => l.type === 'STORAGE' && l.code !== task?.suggestedLocationCode)

  return (
    <>
      <PdaHeader
        title={t('pda.putaway')}
        onBack={step === 3 ? () => setLocationCode(undefined) : step === 2 ? () => setTaskNo(undefined) : undefined}
      />
      <StepBar step={step} labels={[t('pda.stepSku'), t('pda.stepLocation'), t('pda.stepQty')]} />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {step === 1 && (
          <>
            <ScanInput
              label={t('pda.scanSku')}
              onScan={scanSku}
              candidates={[...new Set(pending.slice(0, 6).map((x) => sku(x.skuCode)?.barcode ?? x.skuCode))].map((v) => ({
                value: v,
              }))}
            />
            <div>
              <div className="mb-2 text-sm font-medium">
                {t('pda.selectTask')} ({pending.length})
              </div>
              {pending.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">{t('pda.noTasks')}</div>
              )}
              <div className="flex flex-col gap-2">
                {pending.slice(0, 30).map((x) => (
                  <button
                    key={x.putawayNo}
                    type="button"
                    onClick={() => selectTask(x.putawayNo)}
                    className="flex items-center gap-3 rounded-xl bg-background p-3 text-left shadow-xs active:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-medium">{x.skuCode}</div>
                      <div className="truncate text-xs text-muted-foreground">{sku(x.skuCode)?.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{x.inboundNo}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-primary tabular-nums">{x.planQty - x.actualQty}</div>
                      <div className="flex items-center gap-0.5 font-mono text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {x.suggestedLocationCode}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {task && (
          <div className="rounded-xl bg-background p-4 shadow-xs">
            <div className="font-mono text-base font-semibold">{task.skuCode}</div>
            <div className="text-sm text-muted-foreground">{sku(task.skuCode)?.name}</div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span className="font-mono">{task.inboundNo}</span>
              <span>
                {t('pda.planQty')} <b className="text-base text-primary tabular-nums">{remain}</b>
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/60 p-3">
              <div className="flex-1 text-center">
                <div className="text-xs text-muted-foreground">{t('common.location')}</div>
                <div className="font-mono text-base">{task.sourceLocationCode}</div>
              </div>
              <ArrowDown className="size-5 -rotate-90 text-muted-foreground" />
              <div className="flex-1 text-center">
                <div className="text-xs text-muted-foreground">{t('pda.suggestedLocation')}</div>
                <div className="font-mono text-2xl font-bold text-primary">{task.suggestedLocationCode}</div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <ScanInput
            label={t('pda.scanLocation')}
            onScan={scanLocation}
            candidates={[
              { value: task!.suggestedLocationCode, label: t('pda.suggestedLocation') },
              ...(otherLocation ? [{ value: otherLocation.code }] : []),
            ]}
          />
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-base">{t('common.location')}</span>
              <span className="flex items-center gap-1 font-mono text-xl font-bold">
                <MapPin className="size-5 text-primary" />
                {locationCode}
              </span>
            </div>
            <QtyStepper label={t('pda.putawayQtyLabel')} value={qty} onChange={setQty} max={remain} />
          </div>
        )}
      </div>

      {step === 3 && (
        <PdaFooter>
          <Button variant="outline" className="h-12 w-24 text-base" onClick={() => setLocationCode(undefined)}>
            {t('common.back')}
          </Button>
          <Button className="h-12 flex-1 text-base" disabled={qty <= 0} onClick={confirm}>
            {t('pda.confirmPutaway')} ({qty})
          </Button>
        </PdaFooter>
      )}
    </>
  )
}
