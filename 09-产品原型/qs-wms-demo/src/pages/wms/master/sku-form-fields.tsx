import { useTranslation } from 'react-i18next'
import { FormFieldLabel } from '@/components/biz/form-field-label'
import { Panel } from '@/components/biz/page-container'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PRODUCT_FORM_I18N, PRODUCT_FORM_OPTIONS, type SkuMasterFormErrors } from '@/lib/sku-master'
import type { ProductFormFactor, SkuMaster, UsageStatus } from '@/types/wms'

const QC_FLOW_OPTIONS = ['STANDARD', 'SPOT'] as const

interface SkuFormFieldsProps {
  mode: 'edit'
  form: SkuMaster
  setForm: (next: SkuMaster) => void
  errors: SkuMasterFormErrors
  fieldError: (key: keyof SkuMasterFormErrors) => React.ReactNode
  ownerName: string
}

export function SkuFormFields({ form, setForm, errors, fieldError, ownerName }: SkuFormFieldsProps) {
  const { t } = useTranslation()
  const ph = t('common.inputPlaceholder')
  const sp = t('common.selectPlaceholder')

  const boolSelect = (value: boolean, onChange: (v: boolean) => void) => (
    <Select value={value ? 'yes' : 'no'} onValueChange={(v) => onChange(v === 'yes')}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={sp} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="yes">{t('common.yes')}</SelectItem>
        <SelectItem value="no">{t('common.no')}</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <>
      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionIdentity')}</h2>
        <p className="text-xs text-muted-foreground">{t('masterSku.barcodeEditHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.ownerCode')}</FormFieldLabel>
            <Input readOnly value={`${form.ownerCode} · ${ownerName}`} />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.code')}</FormFieldLabel>
            <Input readOnly value={form.code} className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.upstreamSkuId')}</FormFieldLabel>
            <Input readOnly value={form.upstreamSkuId} className="font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.primaryBarcode')}</FormFieldLabel>
            <Input readOnly value={form.primaryBarcode || '—'} className="font-mono text-xs" />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionBasic')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-2">
            <FormFieldLabel required>{t('masterSku.name')}</FormFieldLabel>
            <Input
              value={form.name}
              placeholder={t('masterSku.namePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {fieldError('name')}
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <FormFieldLabel>{t('masterSku.nameEn')}</FormFieldLabel>
            <Input
              value={form.nameEn ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 lg:col-span-4">
            <FormFieldLabel>{t('masterSku.spec')}</FormFieldLabel>
            <Textarea
              value={form.spec ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, spec: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.unit')}</FormFieldLabel>
            <Input value={form.unit} placeholder={ph} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            {fieldError('unit')}
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('common.status')}</FormFieldLabel>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as UsageStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENABLED">{t('status.usage.ENABLED')}</SelectItem>
                <SelectItem value="DISABLED">{t('status.usage.DISABLED')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 lg:col-span-4">
            <FormFieldLabel>{t('masterSku.remark')}</FormFieldLabel>
            <Textarea
              value={form.remark ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionForm')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.productForm')}</FormFieldLabel>
            <Select
              value={form.productForm}
              onValueChange={(v) => setForm({ ...form, productForm: v as ProductFormFactor })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_FORM_OPTIONS.map((pf) => (
                  <SelectItem key={pf} value={pf}>{t(PRODUCT_FORM_I18N[pf])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('productForm')}
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.isBattery')}</FormFieldLabel>
            {boolSelect(!!form.isBattery, (v) => setForm({ ...form, isBattery: v }))}
          </div>
        </div>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionTrace')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.snEnabled')}</FormFieldLabel>
            {boolSelect(form.snEnabled, (v) => setForm({ ...form, snEnabled: v }))}
          </div>
          {form.snEnabled ? (
            <div className="space-y-1.5 lg:col-span-2">
              <FormFieldLabel>{t('masterSku.snFormat')}</FormFieldLabel>
              <Input
                value={form.snFormat ?? ''}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, snFormat: e.target.value })}
                className="font-mono text-xs"
              />
              {fieldError('snFormat')}
            </div>
          ) : null}
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.batchEnabled')}</FormFieldLabel>
            {boolSelect(form.batchEnabled, (v) => setForm({ ...form, batchEnabled: v }))}
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.expiryEnabled')}</FormFieldLabel>
            {boolSelect(form.expiryEnabled, (v) => setForm({ ...form, expiryEnabled: v }))}
          </div>
          {form.expiryEnabled ? (
            <>
              <div className="space-y-1.5">
                <FormFieldLabel required>{t('masterSku.shelfLifeDays')}</FormFieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.shelfLifeDays ?? ''}
                  placeholder={ph}
                  onChange={(e) =>
                    setForm({ ...form, shelfLifeDays: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                {fieldError('shelfLifeDays')}
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel required>{t('masterSku.inboundDays')}</FormFieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.inboundDays ?? ''}
                  placeholder={ph}
                  onChange={(e) =>
                    setForm({ ...form, inboundDays: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                {fieldError('inboundDays')}
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel required>{t('masterSku.nearExpiryDays')}</FormFieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.nearExpiryDays ?? ''}
                  placeholder={ph}
                  onChange={(e) =>
                    setForm({ ...form, nearExpiryDays: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                {fieldError('nearExpiryDays')}
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel required>{t('masterSku.expiredDays')}</FormFieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={form.expiredDays ?? ''}
                  placeholder={ph}
                  onChange={(e) =>
                    setForm({ ...form, expiredDays: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
                {fieldError('expiredDays')}
              </div>
              {errors.expiryInequality ? (
                <p className="text-sm text-destructive lg:col-span-4">{fieldError('expiryInequality')}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionQc')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.qcRequired')}</FormFieldLabel>
            {boolSelect(form.qcRequired, (v) => setForm({ ...form, qcRequired: v }))}
          </div>
          {form.qcRequired ? (
            <div className="space-y-1.5">
              <FormFieldLabel required>{t('masterSku.qcFlowType')}</FormFieldLabel>
              <Select
                value={form.qcFlowType ?? ''}
                onValueChange={(v) => setForm({ ...form, qcFlowType: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {QC_FLOW_OPTIONS.map((q) => (
                    <SelectItem key={q} value={q}>{t(`masterSku.qcFlow.${q}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError('qcFlowType')}
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionDims')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.grossWeightKg')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.grossWeightKg ?? ''}
              placeholder={ph}
              onChange={(e) =>
                setForm({ ...form, grossWeightKg: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.netWeightKg')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.netWeightKg ?? ''}
              placeholder={ph}
              onChange={(e) =>
                setForm({ ...form, netWeightKg: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.lengthCm')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              value={form.lengthCm ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, lengthCm: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.widthCm')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              value={form.widthCm ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, widthCm: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.heightCm')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              value={form.heightCm ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      </Panel>
    </>
  )
}
