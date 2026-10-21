import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterForm } from '@/hooks/use-master-form'
import {
  blockingLocationCodes,
  createEmptyZoneForm,
  parseZoneWarehouse,
  validateZoneMasterForm,
  zoneDetailPath,
  type ZoneMasterFormErrors,
} from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { ZoneMaster } from '@/types/wms'
import { ZoneFormFields } from './zone-form-fields'

export function ZoneEditPage() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const [search] = useSearchParams()
  const warehouseCode = parseZoneWarehouse(search.toString()) ?? ''
  const updateZoneMaster = useDb((s) => s.updateZoneMaster)
  const locationMasters = useDb((s) => s.locationMasters)
  const inventory = useDb((s) => s.inventory)
  const zone = useDb((s) =>
    warehouseCode && code ? s.zoneMasters.find((z) => z.warehouseCode === warehouseCode && z.code === code) : undefined,
  )

  const warehouseReadOnly = useMemo(
    () => (zone ? blockingLocationCodes(zone, locationMasters, inventory).length > 0 : false),
    [zone, locationMasters, inventory],
  )

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<ZoneMaster, ZoneMasterFormErrors>({
    scope: 'masterZone',
    initial: zone ?? createEmptyZoneForm(warehouseCode),
    validate: validateZoneMasterForm,
    save: (next) =>
      updateZoneMaster(warehouseCode, code ?? '', {
        name: next.name.trim(),
        zoneType: next.zoneType,
        remark: next.remark?.trim() || undefined,
        warehouseCode: warehouseReadOnly ? warehouseCode : next.warehouseCode,
      }),
    backTo: (next) => zoneDetailPath(warehouseReadOnly ? warehouseCode : next.warehouseCode, code ?? ''),
  })

  if (!code || !warehouseCode) return <Navigate to="/wms/master/zones" replace />
  if (!zone) return <Navigate to="/wms/master/zones" replace />

  return (
    <PageContainer
      title={t('masterZone.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <ZoneFormFields
        mode="edit"
        form={form}
        setForm={setForm}
        errors={errors}
        fieldError={fieldError}
        warehouseReadOnly={warehouseReadOnly}
      />
    </PageContainer>
  )
}
