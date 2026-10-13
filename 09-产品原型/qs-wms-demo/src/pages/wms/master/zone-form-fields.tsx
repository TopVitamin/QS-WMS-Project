import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Section } from '@/components/biz/page-container'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { codeNameText } from '@/lib/typography'
import {
  enabledWarehousesForZoneForm,
  ZONE_TYPE_I18N,
  ZONE_TYPE_OPTIONS,
  type ZoneMasterFormErrors,
} from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { ZoneMaster } from '@/types/wms'

interface ZoneFormFieldsProps {
  mode: 'create' | 'edit'
  form: ZoneMaster
  setForm: (next: ZoneMaster) => void
  errors: ZoneMasterFormErrors
  fieldError: (key: keyof ZoneMasterFormErrors) => React.ReactNode
  warehouseReadOnly?: boolean
}

/** 库区新增/编辑字段。使用状态不在表单里维护：新建默认启用，启停走列表操作列与详情页头 */
export function ZoneFormFields({
  mode,
  form,
  setForm,
  errors,
  fieldError,
  warehouseReadOnly,
}: ZoneFormFieldsProps) {
  const { t } = useTranslation()
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const enabledWarehouses = enabledWarehousesForZoneForm(warehouseMasters)

  return (
    <Section title={t('masterZone.sectionBasic')}>
      <FormGrid>
        <FormField label={t('masterZone.warehouseCode')} required error={fieldError('warehouseCode')}>
          <OptionSelect
            value={form.warehouseCode}
            disabled={mode === 'edit' && warehouseReadOnly}
            onValueChange={(v) => setForm({ ...form, warehouseCode: v })}
            invalid={!!errors.warehouseCode}
            options={enabledWarehouses.map((w) => ({ value: w.code, label: codeNameText(w.code, w.name) }))}
          />
        </FormField>
        <FormField label={t('masterZone.code')} required error={fieldError('code')}>
          <Input
            value={form.code}
            readOnly={mode === 'edit'}
            className="tabular-nums"
            placeholder={mode === 'create' ? t('masterZone.codePlaceholder') : undefined}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            aria-invalid={!!errors.code}
          />
        </FormField>
        <FormField label={t('masterZone.name')} required error={fieldError('name')}>
          <Input
            value={form.name}
            placeholder={t('masterZone.namePlaceholder')}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={!!errors.name}
          />
        </FormField>
        <FormField label={t('masterZone.zoneType')} required error={fieldError('zoneType')}>
          <OptionSelect
            value={form.zoneType}
            onValueChange={(v) => setForm({ ...form, zoneType: v as ZoneMaster['zoneType'] })}
            invalid={!!errors.zoneType}
            options={ZONE_TYPE_OPTIONS.map((zt) => ({ value: zt, label: t(ZONE_TYPE_I18N[zt]) }))}
          />
        </FormField>
        <FormField label={t('masterZone.remark')} span="full">
          <Textarea
            value={form.remark ?? ''}
            rows={3}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </FormField>
      </FormGrid>
    </Section>
  )
}
