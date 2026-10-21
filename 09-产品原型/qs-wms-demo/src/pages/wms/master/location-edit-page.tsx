import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterForm } from '@/hooks/use-master-form'
import {
  createEmptyLocationForm,
  isLocationOccupied,
  locationDetailPath,
  parseLocationWarehouse,
  validateLocationMasterForm,
  type LocationMasterFormErrors,
} from '@/lib/location-master'
import { useDb } from '@/mock/db'
import type { LocationMaster } from '@/types/wms'
import { LocationFormFields } from './location-form-fields'

export function LocationEditPage() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const [search] = useSearchParams()
  const warehouseCode = parseLocationWarehouse(search.toString()) ?? ''
  const location = useDb((s) =>
    warehouseCode && code
      ? s.locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code === code)
      : undefined,
  )
  const inventory = useDb((s) => s.inventory)
  const updateLocationMaster = useDb((s) => s.updateLocationMaster)
  const occupied = location ? isLocationOccupied(location, inventory) : false

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<
    LocationMaster,
    LocationMasterFormErrors
  >({
    scope: 'masterLocation',
    initial: location ?? createEmptyLocationForm(warehouseCode),
    validate: validateLocationMasterForm,
    save: (next) =>
      updateLocationMaster(warehouseCode, code ?? '', {
        ...(occupied ? {} : { zoneCode: next.zoneCode }),
        remark: next.remark?.trim() || undefined,
        allowMixSku: next.allowMixSku,
        allowMixBatch: next.allowMixBatch,
        putawaySequence: next.putawaySequence,
        pickSequence: next.pickSequence,
        aisle: next.aisle?.trim() || undefined,
        bay: next.bay?.trim() || undefined,
        level: next.level?.trim() || undefined,
        productForms: next.productForms,
        occupyingCustomerId: location?.occupyingCustomerId,
      }),
    backTo: () => locationDetailPath(warehouseCode, code ?? ''),
  })

  if (!code || !warehouseCode) return <Navigate to="/wms/master/locations" replace />
  if (!location) return <Navigate to="/wms/master/locations" replace />

  return (
    <PageContainer
      title={t('masterLocation.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <LocationFormFields
        mode="edit"
        form={form}
        setForm={setForm}
        errors={errors}
        fieldError={fieldError}
        zoneReadOnly={occupied}
      />
    </PageContainer>
  )
}
