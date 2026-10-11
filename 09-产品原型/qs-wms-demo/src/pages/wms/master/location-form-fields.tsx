import { useTranslation } from 'react-i18next'
import { FormFieldLabel } from '@/components/biz/form-field-label'
import { Panel } from '@/components/biz/page-container'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  enabledZonesForWarehouse,
  findZone,
  PRODUCT_FORM_I18N,
  PRODUCT_FORM_OPTIONS,
  ZONE_TYPE_I18N,
  type LocationMasterFormErrors,
} from '@/lib/location-master'
import { useDb } from '@/mock/db'
import type { LocationMaster, ProductFormFactor, UsageStatus } from '@/types/wms'

export function createEmptyLocationForm(warehouseCode = '', zoneCode = ''): LocationMaster {
  const now = ''
  return {
    warehouseCode,
    zoneCode,
    zoneType: 'PICK',
    code: '',
    status: 'ENABLED',
    allowMixSku: true,
    allowMixBatch: false,
    productForms: [],
    createdAt: now,
    createdBy: '',
    updatedAt: now,
    updatedBy: '',
  }
}

interface LocationFormFieldsProps {
  mode: 'create' | 'edit'
  form: LocationMaster
  setForm: (next: LocationMaster) => void
  errors: LocationMasterFormErrors
  fieldError: (key: keyof LocationMasterFormErrors) => React.ReactNode
  zoneReadOnly?: boolean
}

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
  const sp = t('common.selectPlaceholder')
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

  const warehouseName =
    warehouseMasters.find((w) => w.code === form.warehouseCode)?.name ?? form.warehouseCode

  return (
    <>
      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionBasic')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterLocation.zoneCode')}</FormFieldLabel>
            <Select
              value={form.zoneCode || undefined}
              onValueChange={onZoneChange}
              disabled={zoneReadOnly}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errors.zoneCode}>
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {zoneOptions.map((z) => (
                  <SelectItem key={z.code} value={z.code}>
                    {z.code} · {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('zoneCode')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.warehouseCode')}</FormFieldLabel>
            <Input readOnly value={form.warehouseCode ? `${form.warehouseCode} · ${warehouseName}` : '-'} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.zoneType')}</FormFieldLabel>
            <Input readOnly value={form.zoneType ? t(ZONE_TYPE_I18N[form.zoneType]) : '-'} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterLocation.code')}</FormFieldLabel>
            <Input
              value={form.code}
              readOnly={mode === 'edit'}
              className="tabular-nums"
              placeholder={mode === 'create' ? t('masterLocation.codePlaceholder') : undefined}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              aria-invalid={!!errors.code}
            />
            {fieldError('code')}
          </div>
          <div className="flex flex-col gap-1.5">
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
          <div className="col-span-full flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.remark')}</FormFieldLabel>
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
        <h2 className="text-sm font-medium">{t('masterLocation.sectionMix')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterLocation.allowMixSku')}</FormFieldLabel>
            <Select
              value={form.allowMixSku ? 'yes' : 'no'}
              onValueChange={(v) => setForm({ ...form, allowMixSku: v === 'yes' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t('common.yes')}</SelectItem>
                <SelectItem value="no">{t('common.no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel required>{t('masterLocation.allowMixBatch')}</FormFieldLabel>
            <Select
              value={form.allowMixBatch ? 'yes' : 'no'}
              onValueChange={(v) => setForm({ ...form, allowMixBatch: v === 'yes' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={sp} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{t('common.yes')}</SelectItem>
                <SelectItem value="no">{t('common.no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionOps')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.putawaySequence')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              value={form.putawaySequence ?? ''}
              placeholder={ph}
              onChange={(e) =>
                setForm({
                  ...form,
                  putawaySequence: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              aria-invalid={!!errors.putawaySequence}
            />
            {fieldError('putawaySequence')}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.pickSequence')}</FormFieldLabel>
            <Input
              type="number"
              min={0}
              value={form.pickSequence ?? ''}
              placeholder={ph}
              onChange={(e) =>
                setForm({
                  ...form,
                  pickSequence: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              aria-invalid={!!errors.pickSequence}
            />
            {fieldError('pickSequence')}
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionStructure')}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-3 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.aisle')}</FormFieldLabel>
            <Input value={form.aisle ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, aisle: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.bay')}</FormFieldLabel>
            <Input value={form.bay ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, bay: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FormFieldLabel>{t('masterLocation.level')}</FormFieldLabel>
            <Input value={form.level ?? ''} placeholder={ph} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionAdapt')}</h2>
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
      </Panel>
    </>
  )
}
