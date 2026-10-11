import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { validateWarehouseMasterForm, type WarehouseMasterFormErrors } from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { WarehouseMaster } from '@/types/wms'
import { WarehouseFormFields } from './warehouse-form-fields'

export function WarehouseEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const leave = useMasterDiscardNavigate('masterWarehouse')
  const fieldError = useMasterFormFieldError('masterWarehouse')
  const { code } = useParams<{ code: string }>()
  const warehouse = useDb((s) => s.warehouseMasters.find((w) => w.code === code))
  const updateWarehouseMaster = useDb((s) => s.updateWarehouseMaster)

  const [form, setForm] = useState<WarehouseMaster | null>(null)
  const [errors, setErrors] = useState<WarehouseMasterFormErrors>({})

  useEffect(() => {
    if (warehouse) setForm({ ...warehouse })
  }, [warehouse])

  const dirty = useMemo(() => {
    if (!warehouse || !form) return false
    return JSON.stringify(warehouse) !== JSON.stringify(form)
  }, [form, warehouse])

  if (!code || code === 'new') return <Navigate to="/wms/master/warehouses" replace />
  if (!warehouse) return <Navigate to="/wms/master/warehouses" replace />
  if (!form) return null

  const onSave = () => {
    const nextErrors = validateWarehouseMasterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterWarehouse.saveValidationFailed'))
      return
    }
    const res = updateWarehouseMaster(code, {
      name: form.name.trim(),
      timezone: form.timezone,
      currency: form.currency,
      status: form.status,
      remark: form.remark?.trim() || undefined,
      countryCode: form.countryCode,
      state: form.state?.trim() || undefined,
      city: form.city.trim(),
      district: form.district?.trim() || undefined,
      address1: form.address1.trim(),
      address2: form.address2?.trim() || undefined,
      postalCode: form.postalCode?.trim() || undefined,
      contactName: form.contactName?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      contactEmail: form.contactEmail?.trim() || undefined,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterWarehouse.saveSuccess'))
    navigate(`/wms/master/warehouses/${code}`)
  }

  const showFieldError = (key: keyof WarehouseMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={t('masterWarehouse.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave(`/wms/master/warehouses/${code}`, dirty)}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <WarehouseFormFields mode="edit" form={form} setForm={setForm} errors={errors} fieldError={showFieldError} />
    </PageContainer>
  )
}
