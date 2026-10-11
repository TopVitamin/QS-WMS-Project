import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { validateWarehouseMasterForm, type WarehouseMasterFormErrors } from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { WarehouseMaster } from '@/types/wms'
import { createEmptyWarehouseForm, WarehouseFormFields } from './warehouse-form-fields'

export function WarehouseCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const leave = useMasterDiscardNavigate('masterWarehouse')
  const fieldError = useMasterFormFieldError('masterWarehouse')
  const createWarehouseMaster = useDb((s) => s.createWarehouseMaster)
  const warehouseMasters = useDb((s) => s.warehouseMasters)

  const [form, setForm] = useState<WarehouseMaster>(() => createEmptyWarehouseForm())
  const [errors, setErrors] = useState<WarehouseMasterFormErrors>({})

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(createEmptyWarehouseForm()), [form])

  const onSave = () => {
    const nextErrors = validateWarehouseMasterForm(form)
    const code = form.code.trim()
    if (!nextErrors.code && warehouseMasters.some((w) => w.code === code)) {
      nextErrors.code = 'duplicate'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterWarehouse.saveValidationFailed'))
      return
    }
    const res = createWarehouseMaster({
      code,
      name: form.name.trim(),
      timezone: form.timezone,
      currency: form.currency,
      status: 'ENABLED',
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
    toast.success(t('masterWarehouse.createSuccess'))
    navigate(`/wms/master/warehouses/${code}`)
  }

  const showFieldError = (key: keyof WarehouseMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={t('masterWarehouse.createTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave('/wms/master/warehouses', dirty)}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <WarehouseFormFields mode="create" form={form} setForm={setForm} errors={errors} fieldError={showFieldError} />
    </PageContainer>
  )
}
