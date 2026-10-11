import { useTranslation } from 'react-i18next'
import { FormFieldLabel } from '@/components/biz/form-field-label'
import { WarehouseFullAddressPreview } from '@/components/biz/warehouse-full-address-preview'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  WAREHOUSE_COUNTRY_OPTIONS,
  WAREHOUSE_TIMEZONE_OPTIONS,
  type WarehouseMasterFormErrors,
} from '@/lib/warehouse-master'
import type { CurrencyCode, WarehouseMaster } from '@/types/wms'
import { Panel } from '@/components/biz/page-container'

const CURRENCIES: CurrencyCode[] = ['HKD', 'USD', 'EUR', 'GBP', 'JPY', 'CNY']

export function createEmptyWarehouseForm(): WarehouseMaster {
  const now = ''
  return {
    code: '',
    name: '',
    timezone: WAREHOUSE_TIMEZONE_OPTIONS[0],
    currency: 'USD',
    status: 'ENABLED',
    countryCode: 'HK',
    city: '',
    address1: '',
    createdAt: now,
    createdBy: '',
    updatedAt: now,
    updatedBy: '',
  }
}

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
  const sp = t('common.selectPlaceholder')
  const countryLabel = t(
    WAREHOUSE_COUNTRY_OPTIONS.find((c) => c.value === form.countryCode)?.labelKey ?? 'masterWarehouse.country.OTHER',
  )

  return (
    <>
      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterWarehouse.sectionBasic')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterWarehouse.code')}</FormFieldLabel>
            <Input
              value={form.code}
              readOnly={mode === 'edit'}
              className="tabular-nums"
              placeholder={mode === 'create' ? t('masterWarehouse.codePlaceholder') : undefined}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              aria-invalid={!!errors.code}
            />
            {fieldError('code')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterWarehouse.name')}</FormFieldLabel>
            <Input
              value={form.name}
              placeholder={t('masterWarehouse.namePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
            />
            {fieldError('name')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterWarehouse.timezone')}</FormFieldLabel>
            <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.timezone}>
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSE_TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('timezone')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterWarehouse.currency')}</FormFieldLabel>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v as CurrencyCode })}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.currency}>
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('currency')}
          </div>
          <div className="flex flex-col gap-1.5 xl:col-span-4">
            <FormFieldLabel>{t('masterWarehouse.remark')}</FormFieldLabel>
            <Textarea
              value={form.remark ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterWarehouse.sectionAddress')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterWarehouse.countryName')}</FormFieldLabel>
            <Select value={form.countryCode} onValueChange={(v) => setForm({ ...form, countryCode: v })}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.countryCode}>
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSE_COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{t(c.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('countryCode')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterWarehouse.state')}</FormFieldLabel>
            <Input value={form.state ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterWarehouse.city')}</FormFieldLabel>
            <Input
              value={form.city}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              aria-invalid={!!errors.city}
            />
            {fieldError('city')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterWarehouse.district')}</FormFieldLabel>
            <Input
              value={form.district ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 xl:col-span-2">
            <FormFieldLabel required>{t('masterWarehouse.address1')}</FormFieldLabel>
            <Textarea
              value={form.address1}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
              rows={2}
              aria-invalid={!!errors.address1}
            />
            {fieldError('address1')}
          </div>
          <div className="flex flex-col gap-1.5 xl:col-span-2">
            <FormFieldLabel>{t('masterWarehouse.address2')}</FormFieldLabel>
            <Textarea
              value={form.address2 ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterWarehouse.postalCode')}</FormFieldLabel>
            <Input
              value={form.postalCode ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 xl:col-span-3">
            <FormFieldLabel>{t('masterWarehouse.fullAddress')}</FormFieldLabel>
            <WarehouseFullAddressPreview data={form} countryLabel={countryLabel} />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterWarehouse.sectionContact')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterWarehouse.contactName')}</FormFieldLabel>
            <Input
              value={form.contactName ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterWarehouse.contactPhone')}</FormFieldLabel>
            <Input
              value={form.contactPhone ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterWarehouse.contactEmail')}</FormFieldLabel>
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
