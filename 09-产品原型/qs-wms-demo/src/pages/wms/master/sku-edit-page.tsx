import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { findSkuMaster, skuDetailPath, validateSkuMasterForm, type SkuMasterFormErrors } from '@/lib/sku-master'
import { useDb } from '@/mock/db'
import type { SkuMaster } from '@/types/wms'
import { SkuFormFields } from './sku-form-fields'

export function SkuEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ownerCode, skuCode } = useParams<{ ownerCode: string; skuCode: string }>()
  const leave = useMasterDiscardNavigate('masterSku')
  const fieldError = useMasterFormFieldError('masterSku')
  const updateSkuMaster = useDb((s) => s.updateSkuMaster)
  const customers = useDb((s) => s.customers)

  const master = useDb((s) =>
    ownerCode && skuCode ? findSkuMaster(s.skuMasters, ownerCode, skuCode) : undefined,
  )

  const [form, setForm] = useState<SkuMaster | null>(null)
  const [errors, setErrors] = useState<SkuMasterFormErrors>({})

  useEffect(() => {
    if (master) setForm({ ...master })
  }, [master])

  const dirty = useMemo(() => {
    if (!master || !form) return false
    return JSON.stringify(form) !== JSON.stringify(master)
  }, [form, master])

  if (!ownerCode || !skuCode) return <Navigate to="/wms/master/skus" replace />
  if (!master) return <Navigate to="/wms/master/skus" replace />
  if (!form) return null

  const ownerName = customers.find((c) => c.code === ownerCode)?.name ?? ownerCode

  const showFieldError = (key: keyof SkuMasterFormErrors) => fieldError(errors, key)

  const onSave = () => {
    const nextErrors = validateSkuMasterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterSku.saveValidationFailed'))
      return
    }
    const res = updateSkuMaster(ownerCode, skuCode, {
      name: form.name,
      nameEn: form.nameEn,
      spec: form.spec,
      unit: form.unit,
      status: form.status,
      remark: form.remark,
      productForm: form.productForm,
      isBattery: form.isBattery,
      snEnabled: form.snEnabled,
      snFormat: form.snFormat,
      batchEnabled: form.batchEnabled,
      expiryEnabled: form.expiryEnabled,
      shelfLifeDays: form.shelfLifeDays,
      inboundDays: form.inboundDays,
      nearExpiryDays: form.nearExpiryDays,
      expiredDays: form.expiredDays,
      qcRequired: form.qcRequired,
      qcFlowType: form.qcFlowType,
      grossWeightKg: form.grossWeightKg,
      netWeightKg: form.netWeightKg,
      lengthCm: form.lengthCm,
      widthCm: form.widthCm,
      heightCm: form.heightCm,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterSku.saveSuccess'))
    navigate(skuDetailPath(ownerCode, skuCode))
  }

  return (
    <PageContainer
      title={t('masterSku.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave(skuDetailPath(ownerCode, skuCode), dirty)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <SkuFormFields
        mode="edit"
        form={form}
        setForm={setForm}
        errors={errors}
        fieldError={showFieldError}
        ownerName={ownerName}
      />
    </PageContainer>
  )
}
