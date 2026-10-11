import { useTranslation } from 'react-i18next'
import { FormFieldLabel } from '@/components/biz/form-field-label'
import { Panel } from '@/components/biz/page-container'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  formatCustomerFullAddress,
  OWNER_TYPE_I18N,
  PUTAWAY_RECOMMEND_I18N,
  PUTAWAY_RECOMMEND_OPTIONS,
  type CustomerMasterFormErrors,
} from '@/lib/customer-master'
import { WAREHOUSE_COUNTRY_OPTIONS } from '@/lib/warehouse-master'
import type { CustomerMaster } from '@/types/wms'

interface CustomerFormFieldsProps {
  form: CustomerMaster
  setForm: (next: CustomerMaster) => void
  errors: CustomerMasterFormErrors
  fieldError: (key: keyof CustomerMasterFormErrors) => React.ReactNode
}

export function CustomerFormFields({ form, setForm, errors, fieldError }: CustomerFormFieldsProps) {
  const { t } = useTranslation()
  const ph = t('common.inputPlaceholder')
  const sp = t('common.selectPlaceholder')

  return (
    <>
      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterCustomer.sectionBasic')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.code')}</FormFieldLabel>
            <Input value={form.code} readOnly className="tabular-nums" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterCustomer.name')}</FormFieldLabel>
            <Input
              value={form.name}
              placeholder={t('masterCustomer.namePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
            {fieldError('name')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.ownerType')}</FormFieldLabel>
            <Input value={t(OWNER_TYPE_I18N[form.ownerType])} readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterCustomer.putawayRecommendTiming')}</FormFieldLabel>
            <Select
              value={form.putawayRecommendTiming}
              onValueChange={(v) => setForm({ ...form, putawayRecommendTiming: v as CustomerMaster['putawayRecommendTiming'] })}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errors.putawayRecommendTiming}>
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                {PUTAWAY_RECOMMEND_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{t(PUTAWAY_RECOMMEND_I18N[opt])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('putawayRecommendTiming')}
          </div>
          <div className="col-span-full flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.remark')}</FormFieldLabel>
            <Textarea
              value={form.remark ?? ''}
              rows={2}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterCustomer.sectionUpstream')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.upstreamOwnerId')}</FormFieldLabel>
            <Input value={form.upstreamOwnerId} readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.lastSyncAt')}</FormFieldLabel>
            <Input value={form.lastSyncAt} readOnly />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterCustomer.sectionAddress')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.countryCode')}</FormFieldLabel>
            <Select value={form.countryCode ?? ''} onValueChange={(v) => setForm({ ...form, countryCode: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder={sp} /></SelectTrigger>
              <SelectContent>
                {WAREHOUSE_COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{t(c.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.state')}</FormFieldLabel>
            <Input value={form.state ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.city')}</FormFieldLabel>
            <Input value={form.city ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.district')}</FormFieldLabel>
            <Input
              value={form.district ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
          <div className="col-span-full flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.address1')}</FormFieldLabel>
            <Textarea
              value={form.address1 ?? ''}
              rows={2}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
            />
          </div>
          <div className="col-span-full flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.address2')}</FormFieldLabel>
            <Textarea
              value={form.address2 ?? ''}
              rows={2}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.postalCode')}</FormFieldLabel>
            <Input
              value={form.postalCode ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </div>
          <div className="col-span-3 flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.fullAddress')}</FormFieldLabel>
            <p className="min-h-8 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{formatCustomerFullAddress(form)}</p>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterCustomer.sectionContact')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.contactName')}</FormFieldLabel>
            <Input
              value={form.contactName ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.contactPhone')}</FormFieldLabel>
            <Input
              value={form.contactPhone ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterCustomer.contactEmail')}</FormFieldLabel>
            <Input
              value={form.contactEmail ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              aria-invalid={!!errors.contactEmail}
            />
            {fieldError('contactEmail')}
          </div>
        </div>
      </Panel>
    </>
  )
}
