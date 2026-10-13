import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect, YesNoSelect } from '@/components/biz/option-select'
import { Section } from '@/components/biz/page-container'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  enabledZonesForWarehouse,
  findZone,
  PRODUCT_FORM_I18N,
  PRODUCT_FORM_OPTIONS,
  ZONE_TYPE_I18N,
  type LocationMasterFormErrors,
} from '@/lib/location-master'
import { codeNameText, EMPTY_TEXT } from '@/lib/typography'
import { useDb } from '@/mock/db'
import type { LocationMaster, ProductFormFactor } from '@/types/wms'

interface LocationFormFieldsProps {
  mode: 'create' | 'edit'
  form: LocationMaster
  setForm: (next: LocationMaster) => void
  errors: LocationMasterFormErrors
  fieldError: (key: keyof LocationMasterFormErrors) => React.ReactNode
  zoneReadOnly?: boolean
}

/** 货位新增/编辑字段。使用状态不在表单里维护：新建默认启用，启停走列表操作列与详情页头 */
export function LocationFormFields({
  mode,
  form,
  setForm,
  errors,
  fieldError,
  zoneReadOnly = false,
}: LocationFormFieldsProps) {
  const { t } = useTranslation()
  const ph = t('common.inputPlaceholder')
  const zoneMasters = useDb((s) => s.zoneMasters)
  const warehouseMasters = useDb((s) => s.warehouseMasters)

  const zoneOptions =
    form.warehouseCode
      ? enabledZonesForWarehouse(zoneMasters, form.warehouseCode)
      : zoneMasters.filter((z) => z.status === 'ENABLED')

  const onZoneChange = (zoneCode: string) => {
    const zone = findZone(zoneMasters, zoneCode)
    if (!zone) return
    setForm({
      ...form,
      zoneCode: zone.code,
      warehouseCode: zone.warehouseCode,
      zoneType: zone.zoneType,
    })
  }

  const toggleForm = (factor: ProductFormFactor, checked: boolean) => {
    const set = new Set(form.productForms)
    if (checked) set.add(factor)
    else set.delete(factor)
    setForm({ ...form, productForms: [...set] })
  }

  const warehouseName = warehouseMasters.find((w) => w.code === form.warehouseCode)?.name

  const sequenceInput = (key: 'putawaySequence' | 'pickSequence') => (
    <Input
      type="number"
      min={0}
      value={form[key] ?? ''}
      placeholder={ph}
      onChange={(e) => setForm({ ...form, [key]: e.target.value === '' ? undefined : Number(e.target.value) })}
      aria-invalid={!!errors[key]}
    />
  )

  return (
    <>
      <Section title={t('masterLocation.sectionBasic')}>
        <FormGrid>
          <FormField label={t('masterLocation.zoneCode')} required error={fieldError('zoneCode')}>
            <OptionSelect
              value={form.zoneCode}
              onValueChange={onZoneChange}
              disabled={zoneReadOnly}
              invalid={!!errors.zoneCode}
              options={zoneOptions.map((z) => ({ value: z.code, label: codeNameText(z.code, z.name) }))}
            />
          </FormField>
          <FormField label={t('masterLocation.warehouseCode')}>
            <Input readOnly value={form.warehouseCode ? codeNameText(form.warehouseCode, warehouseName) : EMPTY_TEXT} />
          </FormField>
          <FormField label={t('masterLocation.zoneType')}>
            <Input readOnly value={form.zoneType ? t(ZONE_TYPE_I18N[form.zoneType]) : EMPTY_TEXT} />
          </FormField>
          <FormField label={t('masterLocation.code')} required error={fieldError('code')}>
            <Input
              value={form.code}
              readOnly={mode === 'edit'}
              className="tabular-nums"
              placeholder={mode === 'create' ? t('masterLocation.codePlaceholder') : undefined}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              aria-invalid={!!errors.code}
            />
          </FormField>
          <FormField label={t('masterLocation.remark')} span="full">
            <Textarea
              value={form.remark ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
            />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterLocation.sectionMix')}>
        <FormGrid>
          <FormField label={t('masterLocation.allowMixSku')} required>
            <YesNoSelect value={form.allowMixSku} onChange={(v) => setForm({ ...form, allowMixSku: v })} />
          </FormField>
          <FormField label={t('masterLocation.allowMixBatch')} required>
            <YesNoSelect value={form.allowMixBatch} onChange={(v) => setForm({ ...form, allowMixBatch: v })} />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterLocation.sectionOps')}>
        <FormGrid>
          <FormField label={t('masterLocation.putawaySequence')} error={fieldError('putawaySequence')}>
            {sequenceInput('putawaySequence')}
          </FormField>
          <FormField label={t('masterLocation.pickSequence')} error={fieldError('pickSequence')}>
            {sequenceInput('pickSequence')}
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterLocation.sectionStructure')}>
        <FormGrid>
          <FormField label={t('masterLocation.aisle')}>
            <Input value={form.aisle ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, aisle: e.target.value })} />
          </FormField>
          <FormField label={t('masterLocation.bay')}>
            <Input value={form.bay ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, bay: e.target.value })} />
          </FormField>
          <FormField label={t('masterLocation.level')}>
            <Input value={form.level ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterLocation.sectionAdapt')}>
        <div className="flex flex-wrap gap-4">
          {PRODUCT_FORM_OPTIONS.map((factor) => (
            <div key={factor} className="flex items-center gap-2">
              <Checkbox
                id={`form-${factor}`}
                checked={form.productForms.includes(factor)}
                onCheckedChange={(c) => toggleForm(factor, c === true)}
              />
              <Label htmlFor={`form-${factor}`}>{t(PRODUCT_FORM_I18N[factor])}</Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t('masterLocation.productFormHint')}</p>
      </Section>
    </>
  )
}
