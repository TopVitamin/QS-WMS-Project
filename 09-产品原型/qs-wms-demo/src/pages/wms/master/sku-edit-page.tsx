import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterForm } from '@/hooks/use-master-form'
import { findSkuMaster, skuDetailPath, validateSkuMasterForm, type SkuMasterFormErrors } from '@/lib/sku-master'
import { useDb } from '@/mock/db'
import type { SkuMaster } from '@/types/wms'
import { SkuFormFields } from './sku-form-fields'

export function SkuEditPage() {
  const { ownerCode, skuCode } = useParams<{ ownerCode: string; skuCode: string }>()
  const master = useDb((s) => (ownerCode && skuCode ? findSkuMaster(s.skuMasters, ownerCode, skuCode) : undefined))

  if (!ownerCode || !skuCode || !master) return <Navigate to="/wms/master/skus" replace />
  return <SkuEditForm master={master} ownerCode={ownerCode} skuCode={skuCode} />
}

function SkuEditForm({ master, ownerCode, skuCode }: { master: SkuMaster; ownerCode: string; skuCode: string }) {
  const { t } = useTranslation()
  const customers = useDb((s) => s.customers)
  const updateSkuMaster = useDb((s) => s.updateSkuMaster)
  const ownerName = customers.find((c) => c.code === ownerCode)?.name ?? ownerCode

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<SkuMaster, SkuMasterFormErrors>({
    scope: 'masterSku',
    initial: master,
    validate: validateSkuMasterForm,
    save: (next) =>
      updateSkuMaster(ownerCode, skuCode, {
        name: next.name,
        nameEn: next.nameEn,
        spec: next.spec,
        unit: next.unit,
        remark: next.remark,
        productForm: next.productForm,
        isBattery: next.isBattery,
        snEnabled: next.snEnabled,
        snFormat: next.snFormat,
        batchEnabled: next.batchEnabled,
        expiryEnabled: next.expiryEnabled,
        shelfLifeDays: next.shelfLifeDays,
        inboundDays: next.inboundDays,
        nearExpiryDays: next.nearExpiryDays,
        expiredDays: next.expiredDays,
        grossWeightKg: next.grossWeightKg,
        netWeightKg: next.netWeightKg,
        lengthCm: next.lengthCm,
        widthCm: next.widthCm,
        heightCm: next.heightCm,
      }),
    backTo: () => skuDetailPath(ownerCode, skuCode),
  })

  return (
    <PageContainer
      title={t('masterSku.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
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
        fieldError={fieldError}
        ownerName={ownerName}
      />
    </PageContainer>
  )
}
