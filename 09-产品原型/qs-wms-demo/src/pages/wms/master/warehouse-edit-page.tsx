import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterForm } from '@/hooks/use-master-form'
import {
  createEmptyWarehouseForm,
  validateWarehouseMasterForm,
  type WarehouseMasterFormErrors,
} from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { WarehouseMaster } from '@/types/wms'
import { WarehouseFormFields } from './warehouse-form-fields'

export function WarehouseEditPage() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const warehouse = useDb((s) => (code ? s.warehouseMasters.find((w) => w.code === code) : undefined))
  const updateWarehouseMaster = useDb((s) => s.updateWarehouseMaster)

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<
    WarehouseMaster,
    WarehouseMasterFormErrors
  >({
    scope: 'masterWarehouse',
    initial: warehouse ?? createEmptyWarehouseForm(),
    validate: validateWarehouseMasterForm,
    save: (next) =>
      updateWarehouseMaster(code ?? '', {
        name: next.name.trim(),
        timezone: next.timezone,
        currency: next.currency,
        status: next.status,
        remark: next.remark?.trim() || undefined,
        countryCode: next.countryCode,
        state: next.state?.trim() || undefined,
        city: next.city.trim(),
        district: next.district?.trim() || undefined,
        address1: next.address1.trim(),
        address2: next.address2?.trim() || undefined,
        postalCode: next.postalCode?.trim() || undefined,
        contactName: next.contactName?.trim() || undefined,
        contactPhone: next.contactPhone?.trim() || undefined,
        contactEmail: next.contactEmail?.trim() || undefined,
      }),
    backTo: () => `/wms/master/warehouses/${code}`,
  })

  if (!code || code === 'new') return <Navigate to="/wms/master/warehouses" replace />
  if (!warehouse) return <Navigate to="/wms/master/warehouses" replace />

  return (
    <PageContainer
      title={t('masterWarehouse.editTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <WarehouseFormFields mode="edit" form={form} setForm={setForm} errors={errors} fieldError={fieldError} />
    </PageContainer>
  )
}
