import { AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { MockPhotoField } from '@/components/biz/mock-photo-field'
import { BizCode, Empty } from '@/components/biz/display'
import { OptionSelect } from '@/components/biz/option-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { measureCandidates } from '@/lib/new-sku'
import { codeNameText } from '@/lib/typography'
import { formatDimensions, formatGrossWeight, lengthUnitLabel, weightUnitLabel } from '@/lib/unit'
import { useDb } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import type { NewSkuRecord } from '@/types/inbound'

interface FormState {
  customerId: string
  skuCode: string
  length: string
  width: string
  height: string
  grossWeight: string
  photos: string[]
  remark: string
}

const emptyForm: FormState = {
  customerId: '',
  skuCode: '',
  length: '',
  width: '',
  height: '',
  grossWeight: '',
  photos: [],
  remark: '',
}

function decimalsOf(text: string): number {
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

/**
 * 新品量方弹窗（新品维护主PRD 第三节、Demo PRD 第六节）：
 * - `receive` 模式从收货作业台带出货主、商品与来源入库单，提交后回到作业台继续收货
 * - `standalone` 模式从列表页头进入，先选货主、再选该货主尚无 NS 记录的商品
 */
export function NewSkuMeasureDialog({
  open,
  onClose,
  mode,
  customerId,
  skuCode,
  sourceInboundNo,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  mode: 'standalone' | 'receive'
  customerId?: string
  skuCode?: string
  sourceInboundNo?: string
  onSuccess?: (record: NewSkuRecord) => void
}) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const warehouse = useCurrentWarehouse()
  const operatorName = useSettings((s) => s.operator)
  const records = useDb((s) => s.newSkuRecords)
  const skuMasters = useDb((s) => s.skuMasters)
  const customerMasters = useDb((s) => s.customerMasters)
  const submitNewSkuMeasure = useDb((s) => s.submitNewSkuMeasure)

  const unit = warehouse.unitSystem
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [existing, setExisting] = useState<NewSkuRecord>()
  const [requestId, setRequestId] = useState(() => newRequestId())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      ...emptyForm,
      customerId: customerId ?? '',
      skuCode: skuCode ?? '',
    })
    setErrors({})
    setExisting(undefined)
    setRequestId(newRequestId())
  }, [open, customerId, skuCode])

  const enabledCustomers = useMemo(() => customerMasters.filter((c) => c.status === 'ENABLED'), [customerMasters])
  const candidates = useMemo(
    () => (form.customerId ? measureCandidates(records, skuMasters, form.customerId) : []),
    [form.customerId, records, skuMasters],
  )

  const selectedMaster = skuMasters.find((m) => m.customerId === form.customerId && m.code === form.skuCode)
  const forecast = selectedMaster
  const dirty =
    form.length.trim() !== '' ||
    form.width.trim() !== '' ||
    form.height.trim() !== '' ||
    form.grossWeight.trim() !== '' ||
    form.remark.trim() !== '' ||
    form.photos.length > 0

  const requestClose = async () => {
    if (submitting) return
    if (dirty && !existing) {
      const ok = await confirm({
        title: t('newSku.discardTitle'),
        description: t('newSku.discardBody'),
        confirmText: t('common.discard'),
        cancelText: t('common.keepEditing'),
      })
      if (!ok) return
    }
    onClose()
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.customerId) next.customerId = 'required'
    if (!form.skuCode) next.skuCode = 'required'
    const checkNumber = (key: 'length' | 'width' | 'height' | 'grossWeight', digits: number) => {
      const raw = form[key].trim()
      const value = Number(raw)
      if (!raw) next[key] = t('newSku.fillField', { field: t(`newSku.${key}`) })
      else if (!Number.isFinite(value) || value <= 0 || decimalsOf(raw) > digits) {
        next[key] = t('newSku.fieldInvalid', { field: t(`newSku.${key}`), digits })
      }
    }
    checkNumber('length', 2)
    checkNumber('width', 2)
    checkNumber('height', 2)
    checkNumber('grossWeight', 3)
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = () => {
    if (!validate()) return
    setSubmitting(true)
    const res = submitNewSkuMeasure({
      customerId: form.customerId,
      skuCode: form.skuCode,
      warehouseCode: warehouse.code,
      sourceInboundNo,
      length: Number(form.length),
      width: Number(form.width),
      height: Number(form.height),
      grossWeight: Number(form.grossWeight),
      photos: form.photos,
      remark: form.remark.trim() || undefined,
      requestId,
      operator: operatorName,
    })
    setSubmitting(false)
    if (!res.ok) {
      /** 已被其他仓维护：弹窗内提示已有记录，不覆盖（新品维护主PRD 第四节第 2 条） */
      if (res.errorKey === 'newSku.error.exists' && res.record) {
        setExisting(res.record)
        return
      }
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('newSku.submitSuccess', { recordNo: res.record?.recordNo }))
    if (res.record) onSuccess?.(res.record)
    onClose()
  }

  const blockedByExisting = !!existing
  const title = mode === 'receive' ? t('pdaNewSku.title') : t('newSku.create')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {t('newSku.warehouseUnit', {
            warehouse: `${warehouse.code} ${t(warehouse.nameKey)}`,
            lengthUnit: lengthUnitLabel(unit),
            weightUnit: weightUnitLabel(unit),
          })}
          {sourceInboundNo ? ` · ${t('newSku.sourceInboundNo')} ${sourceInboundNo}` : ''}
        </div>

        {blockedByExisting && existing && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>
              {t('newSku.error.exists', {
                warehouse: existing.warehouseCode,
                recordNo: existing.recordNo,
              })}
            </AlertDescription>
          </Alert>
        )}

        <FormGrid columns={2}>
          <FormField label={t('common.customer')} required>
            {mode === 'receive' ? (
              <Input
                value={codeNameText(
                  enabledCustomers.find((c) => c.id === form.customerId)?.code ?? '',
                  enabledCustomers.find((c) => c.id === form.customerId)?.name,
                )}
                readOnly
              />
            ) : (
              <OptionSelect
                value={form.customerId}
                onValueChange={(v) => setForm({ ...form, customerId: v, skuCode: '' })}
                options={enabledCustomers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
              />
            )}
          </FormField>
          <FormField label={t('common.sku')} required>
            {mode === 'receive' ? (
              <Input value={form.skuCode} readOnly />
            ) : (
              <OptionSelect
                value={form.skuCode}
                onValueChange={(v) => setForm({ ...form, skuCode: v })}
                options={candidates.map((m) => ({ value: m.code, label: codeNameText(m.code, m.name) }))}
                disabled={!form.customerId || candidates.length === 0}
              />
            )}
          </FormField>
          {!form.skuCode && mode === 'standalone' && form.customerId && candidates.length === 0 && (
            <FormField label="" span="full">
              <p className="text-xs text-muted-foreground">{t('newSku.noCandidate')}</p>
            </FormField>
          )}
          <FormField label={t('masterSku.barcode')}>
            {selectedMaster?.primaryBarcode ? <BizCode>{selectedMaster.primaryBarcode}</BizCode> : <Empty />}
          </FormField>
          <FormField label={t('newSku.forecast')}>
            {forecast?.lengthCm && forecast.widthCm && forecast.heightCm
              ? `${formatDimensions(forecast.lengthCm, forecast.widthCm, forecast.heightCm, unit)} · ${formatGrossWeight(forecast.grossWeightKg ?? 0, unit)}`
              : t('common.empty')}
          </FormField>
        </FormGrid>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t('newSku.measured')}</h3>
          <FormGrid columns={2}>
            <FormField
              label={`${t('newSku.length')} (${lengthUnitLabel(unit)})`}
              required
              error={errors.length ? <p className="text-xs text-destructive">{errors.length}</p> : undefined}
            >
              <Input
                type="number"
                inputMode="decimal"
                value={form.length}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
              />
            </FormField>
            <FormField
              label={`${t('newSku.width')} (${lengthUnitLabel(unit)})`}
              required
              error={errors.width ? <p className="text-xs text-destructive">{errors.width}</p> : undefined}
            >
              <Input
                type="number"
                inputMode="decimal"
                value={form.width}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
              />
            </FormField>
            <FormField
              label={`${t('newSku.height')} (${lengthUnitLabel(unit)})`}
              required
              error={errors.height ? <p className="text-xs text-destructive">{errors.height}</p> : undefined}
            >
              <Input
                type="number"
                inputMode="decimal"
                value={form.height}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />
            </FormField>
            <FormField
              label={`${t('newSku.grossWeight')} (${weightUnitLabel(unit)})`}
              required
              error={errors.grossWeight ? <p className="text-xs text-destructive">{errors.grossWeight}</p> : undefined}
            >
              <Input
                type="number"
                inputMode="decimal"
                value={form.grossWeight}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, grossWeight: e.target.value })}
              />
            </FormField>
            <FormField label={t('unclaimed.photo')} span="full">
              <MockPhotoField value={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
            </FormField>
            <FormField label={t('newSku.remark')} span="full">
              <Textarea
                rows={2}
                value={form.remark}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </FormField>
          </FormGrid>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={requestClose} disabled={submitting}>
            {blockedByExisting ? t('common.close') : t('common.cancel')}
          </Button>
          {!blockedByExisting && (
            <Button onClick={submit} disabled={submitting}>
              {t('newSku.submit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function newRequestId() {
  return `ns-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
