import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import {
  blockingLocationCodes,
  parseZoneWarehouse,
  zoneDetailPath,
  validateZoneMasterForm,
  type ZoneMasterFormErrors,
} from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { ZoneMaster } from '@/types/wms'
import { ZoneFormFields } from './zone-form-fields'

export function ZoneEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const [search] = useSearchParams()
  const warehouseCode = parseZoneWarehouse(search.toString())
  const leave = useMasterDiscardNavigate('masterZone')
  const fieldError = useMasterFormFieldError('masterZone')
  const updateZoneMaster = useDb((s) => s.updateZoneMaster)
  const locationMasters = useDb((s) => s.locationMasters)
  const inventory = useDb((s) => s.inventory)

  const zone = useDb((s) =>
    warehouseCode && code
      ? s.zoneMasters.find((z) => z.warehouseCode === warehouseCode && z.code === code)
      : undefined,
  )

  const [form, setForm] = useState<ZoneMaster | null>(null)
  const [errors, setErrors] = useState<ZoneMasterFormErrors>({})

  useEffect(() => {
    if (zone) setForm({ ...zone })
  }, [zone])

  const warehouseReadOnly = useMemo(() => {
    if (!zone) return false
    return blockingLocationCodes(zone, locationMasters, inventory).length > 0
  }, [zone, locationMasters, inventory])

  const dirty = useMemo(() => {
    if (!zone || !form) return false
    return JSON.stringify(form) !== JSON.stringify(zone)
  }, [form, zone])

  if (!code || !warehouseCode) return <Navigate to="/wms/master/zones" replace />
  if (!zone) return <Navigate to="/wms/master/zones" replace />
  if (!form) return null

  const onSave = () => {
    const nextErrors = validateZoneMasterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterZone.saveValidationFailed'))
      return
    }
    const res = updateZoneMaster(warehouseCode, code, {
      name: form.name.trim(),
      zoneType: form.zoneType,
      remark: form.remark?.trim() || undefined,
      warehouseCode: warehouseReadOnly ? warehouseCode : form.warehouseCode,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterZone.saveSuccess'))
    navigate(zoneDetailPath(form.warehouseCode, code))
  }

  const showFieldError = (key: keyof ZoneMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={t('masterZone.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave(zoneDetailPath(warehouseCode, code), dirty)}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <ZoneFormFields
        mode="edit"
        form={form}
        setForm={setForm}
        errors={errors}
        fieldError={showFieldError}
        warehouseReadOnly={warehouseReadOnly}
      />
    </PageContainer>
  )
}
