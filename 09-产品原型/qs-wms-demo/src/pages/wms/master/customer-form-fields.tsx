import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Section } from '@/components/biz/page-container'
import { WarehouseFullAddressPreview } from '@/components/biz/warehouse-full-address-preview'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  OWNER_TYPE_I18N,
  PUTAWAY_RECOMMEND_I18N,
  PUTAWAY_RECOMMEND_OPTIONS,
  type CustomerMasterFormErrors,
} from '@/lib/customer-master'
import { formatDateTime } from '@/lib/format'
import { EMPTY_TEXT } from '@/lib/typography'
import { countryLabelKey, WAREHOUSE_COUNTRY_OPTIONS } from '@/lib/warehouse-master'
import { useDisplayTimezone } from '@/stores/settings'
import type { CustomerMaster } from '@/types/wms'

interface CustomerFormFieldsProps {
  form: CustomerMaster
  setForm: (next: CustomerMaster) => void
  errors: CustomerMasterFormErrors
  fieldError: (key: keyof CustomerMasterFormErrors) => React.ReactNode
}

/** 货主编辑字段：编码、类型、上游标识、同步时间、完整地址始终只读 */
export function CustomerFormFields({ form, setForm, errors, fieldError }: CustomerFormFieldsProps) {
  const { t } = useTranslation()
  const tz = useDisplayTimezone()
  const ph = t('common.inputPlaceholder')

  return (
    <>
      <Section title={t('masterCustomer.sectionBasic')}>
        <FormGrid>
          <FormField label={t('masterCustomer.code')}>
            <Input value={form.code} readOnly className="tabular-nums" />
          </FormField>
          <FormField label={t('masterCustomer.name')} required error={fieldError('name')}>
            <Input
              value={form.name}
              placeholder={t('masterCustomer.namePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
          </FormField>
          <FormField label={t('masterCustomer.ownerType')}>
            <Input value={t(OWNER_TYPE_I18N[form.ownerType])} readOnly />
          </FormField>
          <FormField
            label={t('masterCustomer.putawayRecommendTiming')}
            required
            error={fieldError('putawayRecommendTiming')}
          >
            <OptionSelect
              value={form.putawayRecommendTiming}
              onValueChange={(v) =>
                setForm({ ...form, putawayRecommendTiming: v as CustomerMaster['putawayRecommendTiming'] })
              }
              invalid={!!errors.putawayRecommendTiming}
              options={PUTAWAY_RECOMMEND_OPTIONS.map((opt) => ({ value: opt, label: t(PUTAWAY_RECOMMEND_I18N[opt]) }))}
            />
          </FormField>
          <FormField label={t('masterCustomer.remark')} span="full">
            <Textarea
              value={form.remark ?? ''}
              rows={2}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterCustomer.sectionUpstream')}>
        <FormGrid>
          <FormField label={t('masterCustomer.upstreamOwnerId')}>
            <Input value={form.upstreamOwnerId} readOnly className="tabular-nums" />
          </FormField>
          <FormField label={t('masterCustomer.lastSyncAt')}>
            <Input value={form.lastSyncAt ? formatDateTime(form.lastSyncAt, tz) : EMPTY_TEXT} readOnly />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterCustomer.sectionAddress')}>
        <FormGrid>
          <FormField label={t('masterCustomer.countryCode')}>
            <OptionSelect
              value={form.countryCode ?? ''}
              onValueChange={(v) => setForm({ ...form, countryCode: v })}
              options={WAREHOUSE_COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
          </FormField>
          <FormField label={t('masterCustomer.state')}>
            <Input value={form.state ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </FormField>
          <FormField label={t('masterCustomer.city')}>
            <Input value={form.city ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </FormField>
          <FormField label={t('masterCustomer.district')}>
            <Input
              value={form.district ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterCustomer.address1')} span="full">
            <Textarea
              value={form.address1 ?? ''}
              rows={2}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterCustomer.address2')} span="full">
            <Textarea
              value={form.address2 ?? ''}
              rows={2}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterCustomer.postalCode')}>
            <Input
              value={form.postalCode ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterCustomer.fullAddress')} span={3}>
            <WarehouseFullAddressPreview data={form} countryLabel={t(countryLabelKey(form.countryCode))} />
          </FormField>
        </FormGrid>
      </Section>

      <Section title={t('masterCustomer.sectionContact')}>
        <FormGrid>
          <FormField label={t('masterCustomer.contactName')}>
            <Input
              value={form.contactName ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterCustomer.contactPhone')}>
            <Input
              value={form.contactPhone ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </FormField>
          <FormField label={t('masterCustomer.contactEmail')} error={fieldError('contactEmail')}>
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
