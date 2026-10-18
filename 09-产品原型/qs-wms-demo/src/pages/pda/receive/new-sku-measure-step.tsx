import { useState } from 'react'
import { toast } from 'sonner'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaContextBar } from '@/components/pda/pda-context-bar'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import { beep } from '@/lib/scan-beep'
import { formatDimensions, formatGrossWeight, lengthUnitLabel, weightUnitLabel } from '@/lib/unit'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import type { ReceiveFlow } from './use-receive-flow'

const digits: Record<string, number> = { length: 2, width: 2, height: 2, grossWeight: 3 }

/**
 * PDA 新品量方（《PDA新品量方前端Demo版PRD》）：收货扫到新品时自动进入，
 * 与管理端量方弹窗共用 `submitNewSkuMeasure`；提交成功回到容器作业，该商品即可收货。
 */
export function ReceiveNewSkuStep({ flow }: { flow: ReceiveFlow }) {
  const { t, nav, session, order } = flow
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const { sku } = useLookups()
  const submitNewSkuMeasure = useDb((s) => s.submitNewSkuMeasure)
  const { confirm } = useConfirm()
  const [requestId, setRequestId] = useState(() => newRequestId())
  const [values, setValues] = useState<Record<string, string>>({ length: '', width: '', height: '', grossWeight: '' })
  const [remark, setRemark] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const unit = warehouse.unitSystem

  const skuCode = nav.param('sku')
  const boxKey = nav.param('box')
  const box = session.boxes.find((b) => b.key === boxKey)

  const onScan = (code: string): boolean => {
    const hit = flow.resolveSku(code)
    if (hit && hit === skuCode) {
      toast.info(t('pdaNewSku.sameSku'))
      return true
    }
    /** 数字框获得焦点时收到扫码内容不写入数值：识别为其他商品码就提示，其他码静默忽略 */
    if (hit) {
      toast.error(t('pdaNewSku.finishCurrentFirst', { skuCode }))
      return false
    }
    return true
  }
  usePdaScanListener(onScan)

  if (!order || !skuCode) return null

  const backToBox = () => nav.back(boxKey ? { step: 'box', params: { box: boxKey } } : { step: 'container' })
  const master = sku(skuCode)

  const firstMissing = (() => {
    for (const key of ['length', 'width', 'height', 'grossWeight']) {
      const raw = values[key].trim()
      const value = Number(raw)
      if (!raw) return t('pdaNewSku.fillField', { field: t(`pdaNewSku.${key}`) })
      if (!Number.isFinite(value) || value <= 0 || decimals(raw) > digits[key]) {
        return t('pdaNewSku.fieldInvalid', { field: t(`pdaNewSku.${key}`), digits: digits[key] })
      }
    }
    return undefined
  })()

  const setValue = (key: string, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: raw }))
    const value = Number(raw.trim())
    const invalid = raw.trim() !== '' && (!Number.isFinite(value) || value <= 0 || decimals(raw) > digits[key])
    setFeedback((prev) => ({
      ...prev,
      [key]: invalid ? t('pdaNewSku.fieldInvalid', { field: t(`pdaNewSku.${key}`), digits: digits[key] }) : '',
    }))
  }

  const requestClose = async () => {
    const filled = Object.values(values).some((v) => v.trim() !== '') || remark.trim() !== ''
    if (filled) {
      const ok = await confirm({
        title: t('pdaNewSku.discardTitle'),
        description: t('pdaNewSku.discardBody'),
        confirmText: t('common.discard'),
        cancelText: t('common.keepEditing'),
      })
      if (!ok) return
    }
    backToBox()
  }

  const submit = () => {
    if (firstMissing || submitting) return
    setSubmitting(true)
    const res = submitNewSkuMeasure({
      customerId: order.customerId,
      skuCode,
      warehouseCode: warehouse.code,
      sourceInboundNo: order.inboundNo,
      length: Number(values.length),
      width: Number(values.width),
      height: Number(values.height),
      grossWeight: Number(values.grossWeight),
      photos,
      remark: remark.trim() || undefined,
      requestId,
      operator,
    })
    setSubmitting(false)
    if (!res.ok) {
      /** 已被别处维护：提示已有记录后回到容器作业，该商品已可收（PDA 量方 PRD §5） */
      if (res.errorKey === 'newSku.error.exists' && res.record) {
        const existing = res.record
        beep(false)
        void confirm({
          title: t('newSku.error.exists', { warehouse: existing.warehouseCode, recordNo: existing.recordNo }),
          description: `${t('newSku.maintainedBy')} ${existing.maintainedBy} · ${existing.maintainedAt.slice(0, 16).replace('T', ' ')}`,
          confirmText: t('pda.gotIt'),
          hideCancel: true,
        }).then(() => backToBox())
        return
      }
      beep(false)
      toast.error(t(res.errorKey))
      return
    }
    beep(true)
    toast.success(t('newSku.submitSuccess', { recordNo: res.record?.recordNo }))
    setRequestId(newRequestId())
    void confirm({
      title: t('newSku.submitSuccess', { recordNo: res.record?.recordNo }),
      description: t('pdaNewSku.backToReceive'),
      confirmText: t('pda.gotIt'),
      hideCancel: true,
    }).then(() => backToBox())
  }

  return (
    <>
      <PdaHeader title={t('pdaNewSku.title')} onBack={requestClose} />
      <PdaContextBar>
        <span>{order.inboundNo.slice(-4)}</span>
        {box && <span className="text-muted-foreground">· {flow.boxLabel(box)}</span>}
        <span className="text-muted-foreground">
          · {lengthUnitLabel(unit)} / {weightUnitLabel(unit)}
        </span>
      </PdaContextBar>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="py-2 text-sm text-warning-text">
          {t('pdaNewSku.blockedHint', { skuCode })}
        </PdaCard>

        <PdaSection title={t('pdaNewSku.forecast')}>
          <PdaCard className="py-2">
            <div className="font-mono text-base font-semibold">{skuCode}</div>
            <div className="line-clamp-2 text-sm">{master?.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {master?.lengthCm
                ? `${formatDimensions(master.lengthCm, master.widthCm ?? 0, master.heightCm ?? 0, unit)} · ${formatGrossWeight(master.weightG / 1000, unit)}`
                : t('common.empty')}
            </div>
          </PdaCard>
        </PdaSection>

        <PdaSection title={t('newSku.measured')}>
          {(
            [
              ['length', t('pdaNewSku.length'), lengthUnitLabel(unit)],
              ['width', t('pdaNewSku.width'), lengthUnitLabel(unit)],
              ['height', t('pdaNewSku.height'), lengthUnitLabel(unit)],
              ['grossWeight', t('pdaNewSku.grossWeight'), weightUnitLabel(unit)],
            ] as const
          ).map(([key, label, symbol]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {label} ({symbol})
              </span>
              <Textarea
                rows={1}
                inputMode="decimal"
                value={values[key]}
                className="font-mono text-base"
                onChange={(e) => setValue(key, e.target.value)}
              />
              {feedback[key] && <span className="text-xs text-destructive">{feedback[key]}</span>}
            </label>
          ))}
        </PdaSection>

        <PdaSection title={t('pdaNewSku.remark')}>
          <Textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </PdaSection>

        <PdaSection title={t('pdaNewSku.photo')}>
          <div className="flex items-center gap-2">
            <label className="inline-flex min-h-9 cursor-pointer items-center rounded border px-3 text-sm">
              {t('pdaNewSku.takePhoto')}
              <input
                type="file"
                accept="image/*"
                capture
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) setPhotos((prev) => [...prev, ...Array.from(files).map((f) => f.name)])
                  e.target.value = ''
                }}
              />
            </label>
            <span className="text-sm text-muted-foreground">{photos.length > 0 ? photos.join('、') : '—'}</span>
          </div>
        </PdaSection>
      </div>
      <PdaFooter hint={firstMissing}>
        <PdaButton variant="outline" className="flex-1" onClick={requestClose} disabled={submitting}>
          {t('pdaNewSku.back')}
        </PdaButton>
        <PdaButton className="flex-1" disabled={!!firstMissing || submitting} onClick={submit}>
          {t('newSku.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}

function newRequestId() {
  return `ns-pda-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function decimals(text: string): number {
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}
