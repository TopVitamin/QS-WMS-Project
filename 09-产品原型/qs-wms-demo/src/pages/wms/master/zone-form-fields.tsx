import { useTranslation } from 'react-i18next'
import { FormFieldLabel } from '@/components/biz/form-field-label'
import { Panel } from '@/components/biz/page-container'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  enabledWarehousesForZoneForm,
  ZONE_TYPE_I18N,
  ZONE_TYPE_OPTIONS,
  type ZoneMasterFormErrors,
} from '@/lib/zone-master'
import type { ZoneMaster } from '@/types/wms'
import { useDb } from '@/mock/db'

export function createEmptyZoneForm(warehouseCode = ''): ZoneMaster {
  const now = ''
  return {
    warehouseCode,
    code: '',
    name: '',
    zoneType: 'STORAGE',
    status: 'ENABLED',
    remark: '',
    createdAt: now,
    createdBy: '',
    updatedAt: now,
    updatedBy: '',
  }
}

interface ZoneFormFieldsProps {
  mode: 'create' | 'edit'
  form: ZoneMaster
  setForm: (next: ZoneMaster) => void
  errors: ZoneMasterFormErrors
  fieldError: (key: keyof ZoneMasterFormErrors) => React.ReactNode
  warehouseReadOnly?: boolean
}

export function ZoneFormFields({
  mode,
  form,
  setForm,
  errors,
  fieldError,
  warehouseReadOnly,
}: ZoneFormFieldsProps) {
  const { t } = useTranslation()
  const ph = t('common.inputPlaceholder')
  const sp = t('common.selectPlaceholder')
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const enabledWarehouses = enabledWarehousesForZoneForm(warehouseMasters)

  return (
    <Panel className="space-y-4 p-4">
      <h2 className="text-sm font-medium">{t('masterZone.sectionBasic')}</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <FormFieldLabel required>{t('masterZone.warehouseCode')}</FormFieldLabel>
          <Select
            value={form.warehouseCode || undefined}
            disabled={mode === 'edit' && warehouseReadOnly}
            onValueChange={(v) => setForm({ ...form, warehouseCode: v })}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.warehouseCode}>
              <SelectValue placeholder={sp} />
            </SelectTrigger>
            <SelectContent>
              {enabledWarehouses.map((w) => (
                <SelectItem key={w.code} value={w.code}>
                  {w.code} · {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError('warehouseCode')}
        </div>
        <div className="flex flex-col gap-1.5">
          <FormFieldLabel required>{t('masterZone.code')}</FormFieldLabel>
          <Input
            value={form.code}
            readOnly={mode === 'edit'}
            className="tabular-nums"
            placeholder={mode === 'create' ? t('masterZone.codePlaceholder') : undefined}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            aria-invalid={!!errors.code}
          />
          {fieldError('code')}
        </div>
        <div className="flex flex-col gap-1.5">
          <FormFieldLabel required>{t('masterZone.name')}</FormFieldLabel>
          <Input
            value={form.name}
            placeholder={t('masterZone.namePlaceholder')}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={!!errors.name}
          />
          {fieldError('name')}
        </div>
        <div className="flex flex-col gap-1.5">
          <FormFieldLabel required>{t('masterZone.zoneType')}</FormFieldLabel>
          <Select value={form.zoneType} onValueChange={(v) => setForm({ ...form, zoneType: v as ZoneMaster['zoneType'] })}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.zoneType}>
              <SelectValue placeholder={sp} />
            </SelectTrigger>
            <SelectContent>
              {ZONE_TYPE_OPTIONS.map((zt) => (
                <SelectItem key={zt} value={zt}>{t(ZONE_TYPE_I18N[zt])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError('zoneType')}
        </div>
        <div className="flex flex-col gap-1.5">
          <FormFieldLabel required>{t('common.status')}</FormFieldLabel>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ZoneMaster['status'] })}>
            <SelectTrigger className="w-full" aria-invalid={!!errors.status}>
              <SelectValue placeholder={sp} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENABLED">{t('status.usage.ENABLED')}</SelectItem>
              <SelectItem value="DISABLED">{t('status.usage.DISABLED')}</SelectItem>
            </SelectContent>
          </Select>
          {fieldError('status')}
        </div>
        <div className="col-span-full flex flex-col gap-1.5">
          <FormFieldLabel>{t('masterZone.remark')}</FormFieldLabel>
          <Textarea
            value={form.remark ?? ''}
            rows={3}
            placeholder={ph}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
          />
        </div>
      </div>
    </Panel>
  )
}
