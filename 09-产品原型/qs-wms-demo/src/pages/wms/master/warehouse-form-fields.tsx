import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Section } from '@/components/biz/page-container'
import { WarehouseFullAddressPreview } from '@/components/biz/warehouse-full-address-preview'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  countryLabelKey,
  WAREHOUSE_COUNTRY_OPTIONS,
  WAREHOUSE_TIMEZONE_OPTIONS,
  type WarehouseMasterFormErrors,
} from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { CurrencyCode, UnitSystem, WarehouseMaster, WarehouseReceiptMethod } from '@/types/wms'

const CURRENCIES: CurrencyCode[] = ['HKD', 'USD', 'EUR', 'GBP', 'JPY', 'CNY']

interface WarehouseFormFieldsProps {
  mode: 'create' | 'edit'
  form: WarehouseMaster
  setForm: (next: WarehouseMaster) => void
  errors: WarehouseMasterFormErrors
  fieldError: (key: keyof WarehouseMasterFormErrors) => React.ReactNode
}

export function WarehouseFormFields({ mode, form, setForm, errors, fieldError }: WarehouseFormFieldsProps) {
  const { t } = useTranslation()
  const ph = t('common.inputPlaceholder')
  const locations = useDb((s) => s.locations)
  const stagingOptions = locations
    .filter((l) => l.warehouseCode === form.code && l.type === 'STAGING')
    .map((l) => ({ value: l.code, label: l.code }))
  const receiptMethods: WarehouseReceiptMethod[] = ['CONTAINER', 'LTL', 'EXPRESS', 'OTHER']
  const unitSystems: UnitSystem[] = ['metric', 'imperial']

  return (
    <>
      <Section title={t('masterWarehouse.sectionBasic')}>
        <FormGrid>
          <FormField label={t('masterWarehouse.code')} required error={fieldError('code')}>
            <Input
              value={form.code}
              readOnly={mode === 'edit'}
              className="tabular-nums"
              placeholder={mode === 'create' ? t('masterWarehouse.codePlaceholder') : undefined}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              aria-invalid={!!errors.code}
            />
          </FormField>
          <FormField label={t('masterWarehouse.name')} required error={fieldError('name')}>
            <Input
              value={form.name}
              placeholder={t('masterWarehouse.namePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
          </FormField>
          <FormField label={t('masterWarehouse.timezone')} required error={fieldError('timezone')}>
            <OptionSelect
              value={form.timezone}
              onValueChange={(v) => setForm({ ...form, timezone: v })}
              invalid={!!errors.timezone}
              options={WAREHOUSE_TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz }))}
            />
          </FormField>
          <FormField label={t('masterWarehouse.currency')} required error={fieldError('currency')}>
            <OptionSelect
              value={form.currency}
              onValueChange={(v) => setForm({ ...form, currency: v as CurrencyCode })}
              invalid={!!errors.currency}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </FormField>
          <FormField label={t('masterWarehouse.remark')} span="full">
            <Textarea
              value={form.remark ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
            />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterWarehouse.sectionOperation')}>
        <FormGrid>
          <FormField label={t('masterWarehouse.unitSystem')} required error={fieldError('unitSystem')}>
            <OptionSelect
              value={form.unitSystem}
              onValueChange={(v) => setForm({ ...form, unitSystem: v as UnitSystem })}
              invalid={!!errors.unitSystem}
              options={unitSystems.map((v) => ({ value: v, label: t(`masterWarehouse.unitSystemOption.${v}`) }))}
            />
          </FormField>
          <FormField label={t('masterWarehouse.defaultReceiptMethod')} required error={fieldError('defaultReceiptMethod')}>
            <OptionSelect
              value={form.defaultReceiptMethod}
              onValueChange={(v) => setForm({ ...form, defaultReceiptMethod: v as WarehouseReceiptMethod })}
              invalid={!!errors.defaultReceiptMethod}
              options={receiptMethods.map((v) => ({
                value: v,
                label: t(`enum.arrivalMethod.${v}`),
              }))}
            />
          </FormField>
          <FormField label={t('masterWarehouse.receivingStagingLocation')} required error={fieldError('receivingStagingLocation')}>
            <OptionSelect
              value={form.receivingStagingLocation}
              onValueChange={(v) => setForm({ ...form, receivingStagingLocation: v })}
              invalid={!!errors.receivingStagingLocation}
              options={stagingOptions}
            />
          </FormField>
          <FormField label={t('masterWarehouse.outboundStagingLocation')} required error={fieldError('outboundStagingLocation')}>
            <OptionSelect
              value={form.outboundStagingLocation}
              onValueChange={(v) => setForm({ ...form, outboundStagingLocation: v })}
              invalid={!!errors.outboundStagingLocation}
              options={stagingOptions}
            />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterWarehouse.sectionAddress')}>
        <FormGrid>
          <FormField label={t('masterWarehouse.countryName')} required error={fieldError('countryCode')}>
            <OptionSelect
              value={form.countryCode}
              onValueChange={(v) => setForm({ ...form, countryCode: v })}
              invalid={!!errors.countryCode}
              options={WAREHOUSE_COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
          </FormField>
          <FormField label={t('masterWarehouse.state')}>
            <Input value={form.state ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </FormField>
          <FormField label={t('masterWarehouse.city')} required error={fieldError('city')}>
            <Input
              value={form.city}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              aria-invalid={!!errors.city}
            />
          </FormField>
          <FormField label={t('masterWarehouse.district')}>
            <Input
              value={form.district ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterWarehouse.address1')} required span={2} error={fieldError('address1')}>
            <Textarea
              value={form.address1}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
              rows={2}
              aria-invalid={!!errors.address1}
            />
          </FormField>
          <FormField label={t('masterWarehouse.address2')} span={2}>
            <Textarea
              value={form.address2 ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
              rows={2}
            />
          </FormField>
          <FormField label={t('masterWarehouse.postalCode')}>
            <Input
              value={form.postalCode ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterWarehouse.fullAddress')} span={3}>
            <WarehouseFullAddressPreview data={form} countryLabel={t(countryLabelKey(form.countryCode))} />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterWarehouse.sectionContact')}>
        <FormGrid>
          <FormField label={t('masterWarehouse.contactName')}>
            <Input
              value={form.contactName ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterWarehouse.contactPhone')}>
            <Input
              value={form.contactPhone ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterWarehouse.contactEmail')} error={fieldError('contactEmail')}>
            <Input
              value={form.contactEmail ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              aria-invalid={!!errors.contactEmail}
            />
          </FormField>
        </FormGrid>
      </Section>
    </>
  )
}
