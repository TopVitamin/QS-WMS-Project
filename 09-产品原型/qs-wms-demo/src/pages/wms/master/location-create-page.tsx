import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import {
  createEmptyLocationForm,
  locationDetailPath,
  validateLocationMasterForm,
  type LocationMasterFormErrors,
} from '@/lib/location-master'
import { useDb } from '@/mock/db'
import type { LocationMaster } from '@/types/wms'
import { LocationFormFields } from './location-form-fields'

type CreatePreset = { warehouseCode?: string; zoneCode?: string }

export function LocationCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: CreatePreset }
  const leave = useMasterDiscardNavigate('masterLocation')
  const fieldError = useMasterFormFieldError('masterLocation')
  const createLocationMaster = useDb((s) => s.createLocationMaster)
  const locationMasters = useDb((s) => s.locationMasters)

  const empty = useMemo(
    () => createEmptyLocationForm(state?.warehouseCode ?? '', state?.zoneCode ?? ''),
    [state?.warehouseCode, state?.zoneCode],
  )

  const [form, setForm] = useState<LocationMaster>(() => empty)
  const [errors, setErrors] = useState<LocationMasterFormErrors>({})

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(empty), [form, empty])

  const onSave = () => {
    const nextErrors = validateLocationMasterForm(form)
    const code = form.code.trim()
    const wh = form.warehouseCode
    if (!nextErrors.code && locationMasters.some((l) => l.warehouseCode === wh && l.code === code)) {
      nextErrors.code = 'duplicate'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterLocation.saveValidationFailed'))
      return
    }
    const res = createLocationMaster({
      warehouseCode: wh,
      zoneCode: form.zoneCode,
      zoneType: form.zoneType,
      code,
      status: 'ENABLED',
      remark: form.remark?.trim() || undefined,
      allowMixSku: form.allowMixSku,
      allowMixBatch: form.allowMixBatch,
      putawaySequence: form.putawaySequence,
      pickSequence: form.pickSequence,
      aisle: form.aisle?.trim() || undefined,
      bay: form.bay?.trim() || undefined,
      level: form.level?.trim() || undefined,
      productForms: form.productForms,
      occupyingCustomerId: undefined,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterLocation.saveSuccess'))
    navigate(locationDetailPath(wh, code))
  }

  const showFieldError = (key: keyof LocationMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={t('masterLocation.createTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave('/wms/master/locations', dirty)}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <LocationFormFields mode="create" form={form} setForm={setForm} errors={errors} fieldError={showFieldError} />
    </PageContainer>
  )
}
