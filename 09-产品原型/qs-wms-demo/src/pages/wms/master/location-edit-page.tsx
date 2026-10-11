import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import {
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
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const [search] = useSearchParams()
  const warehouseCode = parseLocationWarehouse(search.toString())
  const leave = useMasterDiscardNavigate('masterLocation')
  const fieldError = useMasterFormFieldError('masterLocation')

  const location = useDb((s) =>
    warehouseCode && code
      ? s.locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code === code)
      : undefined,
  )
  const inventory = useDb((s) => s.inventory)
  const updateLocationMaster = useDb((s) => s.updateLocationMaster)

  const [form, setForm] = useState<LocationMaster | null>(null)
  const [errors, setErrors] = useState<LocationMasterFormErrors>({})

  useEffect(() => {
    if (location) setForm({ ...location })
  }, [location])

  const snapshot = useMemo(() => (location ? JSON.stringify(location) : ''), [location])

  if (!code || !warehouseCode) return <Navigate to="/wms/master/locations" replace />
  if (!location) return <Navigate to="/wms/master/locations" replace />
  if (!form) return null

  const occupied = isLocationOccupied(location, inventory)
  const dirty = JSON.stringify(form) !== snapshot

  const onSave = () => {
    const nextErrors = validateLocationMasterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterLocation.saveValidationFailed'))
      return
    }
    const res = updateLocationMaster(warehouseCode, code, {
      ...(occupied ? {} : { zoneCode: form.zoneCode }),
      status: form.status,
      remark: form.remark?.trim() || undefined,
      allowMixSku: form.allowMixSku,
      allowMixBatch: form.allowMixBatch,
      putawaySequence: form.putawaySequence,
      pickSequence: form.pickSequence,
      aisle: form.aisle?.trim() || undefined,
      bay: form.bay?.trim() || undefined,
      level: form.level?.trim() || undefined,
      productForms: form.productForms,
      occupyingCustomerId: location.occupyingCustomerId,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterLocation.saveSuccess'))
    navigate(locationDetailPath(warehouseCode, code))
  }

  const showFieldError = (key: keyof LocationMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={t('masterLocation.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave(locationDetailPath(warehouseCode, code), dirty)}>
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
        fieldError={showFieldError}
        zoneReadOnly={occupied}
      />
    </PageContainer>
  )
}
