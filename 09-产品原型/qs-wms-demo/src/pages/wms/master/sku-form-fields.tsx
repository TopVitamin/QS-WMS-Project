import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect, YesNoSelect } from '@/components/biz/option-select'
import { Section } from '@/components/biz/page-container'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PRODUCT_FORM_I18N, PRODUCT_FORM_OPTIONS, type SkuMasterFormErrors } from '@/lib/sku-master'
import { codeNameText, EMPTY_TEXT } from '@/lib/typography'
import type { ProductFormFactor, SkuMaster } from '@/types/wms'

const QC_FLOW_OPTIONS = ['STANDARD', 'SPOT'] as const

type NumberKey =
  | 'shelfLifeDays'
  | 'inboundDays'
  | 'nearExpiryDays'
  | 'expiredDays'
  | 'grossWeightKg'
  | 'netWeightKg'
  | 'lengthCm'
  | 'widthCm'
  | 'heightCm'

interface SkuFormFieldsProps {
  mode: 'edit'
  form: SkuMaster
  setForm: (next: SkuMaster) => void
  errors: SkuMasterFormErrors
  fieldError: (key: keyof SkuMasterFormErrors) => React.ReactNode
  ownerName: string
}

/** 商品编辑字段。使用状态不在表单里维护，启停走列表操作列与详情页头 */
export function SkuFormFields({ form, setForm, fieldError, ownerName }: SkuFormFieldsProps) {
  const { t } = useTranslation()
  const ph = t('common.inputPlaceholder')

  const numberInput = (key: NumberKey, opts?: { min?: number; step?: string }) => (
    <Input
      type="number"
      min={opts?.min ?? 0}
      step={opts?.step}
      value={form[key] ?? ''}
      placeholder={ph}
      onChange={(e) => setForm({ ...form, [key]: e.target.value ? Number(e.target.value) : undefined })}
    />
  )

  return (
    <>
      <Section title={t('masterSku.sectionIdentity')}>
        <p className="text-xs text-muted-foreground">{t('masterSku.barcodeEditHint')}</p>
        <FormGrid>
          <FormField label={t('masterSku.ownerCode')}>
            <Input readOnly value={codeNameText(form.ownerCode, ownerName)} />
          </FormField>
          <FormField label={t('masterSku.code')}>
            <Input readOnly value={form.code} className="tabular-nums" />
          </FormField>
          <FormField label={t('masterSku.upstreamSkuId')}>
            <Input readOnly value={form.upstreamSkuId} className="tabular-nums" />
          </FormField>
          <FormField label={t('masterSku.primaryBarcode')}>
            <Input readOnly value={form.primaryBarcode || EMPTY_TEXT} className="tabular-nums" />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterSku.sectionBasic')}>
        <FormGrid>
          <FormField label={t('masterSku.name')} required span={2} error={fieldError('name')}>
            <Input
              value={form.name}
              placeholder={t('masterSku.namePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterSku.nameEn')} span={2}>
            <Input
              value={form.nameEn ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterSku.spec')} span="full">
            <Textarea
              value={form.spec ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, spec: e.target.value })}
              rows={2}
            />
          </FormField>
          <FormField label={t('masterSku.unit')} required error={fieldError('unit')}>
            <Input value={form.unit} placeholder={ph} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </FormField>
          <FormField label={t('masterSku.remark')} span="full">
            <Textarea
              value={form.remark ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
            />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterSku.sectionForm')}>
        <FormGrid>
          <FormField label={t('masterSku.productForm')} required error={fieldError('productForm')}>
            <OptionSelect
              value={form.productForm}
              onValueChange={(v) => setForm({ ...form, productForm: v as ProductFormFactor })}
              options={PRODUCT_FORM_OPTIONS.map((pf) => ({ value: pf, label: t(PRODUCT_FORM_I18N[pf]) }))}
            />
          </FormField>
          <FormField label={t('masterSku.isBattery')}>
            <YesNoSelect value={!!form.isBattery} onChange={(v) => setForm({ ...form, isBattery: v })} />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterSku.sectionTrace')}>
        <FormGrid>
          <FormField label={t('masterSku.snEnabled')} required>
            <YesNoSelect value={form.snEnabled} onChange={(v) => setForm({ ...form, snEnabled: v })} />
          </FormField>
          {form.snEnabled ? (
            <FormField label={t('masterSku.snFormat')} span={2} error={fieldError('snFormat')}>
              <Input
                value={form.snFormat ?? ''}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, snFormat: e.target.value })}
              />
            </FormField>
          ) : null}
          <FormField label={t('masterSku.batchEnabled')} required>
            <YesNoSelect value={form.batchEnabled} onChange={(v) => setForm({ ...form, batchEnabled: v })} />
          </FormField>
          <FormField label={t('masterSku.expiryEnabled')} required>
            <YesNoSelect value={form.expiryEnabled} onChange={(v) => setForm({ ...form, expiryEnabled: v })} />
          </FormField>
          {form.expiryEnabled ? (
            <>
              <FormField label={t('masterSku.shelfLifeDays')} required error={fieldError('shelfLifeDays')}>
                {numberInput('shelfLifeDays', { min: 1 })}
              </FormField>
              <FormField label={t('masterSku.inboundDays')} required error={fieldError('inboundDays')}>
                {numberInput('inboundDays')}
              </FormField>
              <FormField label={t('masterSku.nearExpiryDays')} required error={fieldError('nearExpiryDays')}>
                {numberInput('nearExpiryDays')}
              </FormField>
              <FormField label={t('masterSku.expiredDays')} required error={fieldError('expiredDays')}>
                {numberInput('expiredDays')}
              </FormField>
              {fieldError('expiryInequality') ? (
                <div className="col-span-full">{fieldError('expiryInequality')}</div>
              ) : null}
            </>
          ) : null}
        </FormGrid>
      </Section>

      <Section title={t('masterSku.sectionQc')}>
        <FormGrid>
          <FormField label={t('masterSku.qcRequired')} required>
            <YesNoSelect value={form.qcRequired} onChange={(v) => setForm({ ...form, qcRequired: v })} />
          </FormField>
          {form.qcRequired ? (
            <FormField label={t('masterSku.qcFlowType')} required error={fieldError('qcFlowType')}>
              <OptionSelect
                value={form.qcFlowType ?? ''}
                onValueChange={(v) => setForm({ ...form, qcFlowType: v })}
                options={QC_FLOW_OPTIONS.map((q) => ({ value: q, label: t(`masterSku.qcFlow.${q}`) }))}
              />
            </FormField>
          ) : null}
        </FormGrid>
      </Section>

      <Section title={t('masterSku.sectionDims')}>
        <FormGrid>
          <FormField label={t('masterSku.grossWeightKg')}>{numberInput('grossWeightKg', { step: '0.01' })}</FormField>
          <FormField label={t('masterSku.netWeightKg')}>{numberInput('netWeightKg', { step: '0.01' })}</FormField>
          <FormField label={t('masterSku.lengthCm')}>{numberInput('lengthCm')}</FormField>
          <FormField label={t('masterSku.widthCm')}>{numberInput('widthCm')}</FormField>
          <FormField label={t('masterSku.heightCm')}>{numberInput('heightCm')}</FormField>
        </FormGrid>
      </Section>
    </>
  )
}
