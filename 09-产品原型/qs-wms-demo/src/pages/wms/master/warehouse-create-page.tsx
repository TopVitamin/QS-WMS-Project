import { useTranslation } from 'react-i18next'
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

export function WarehouseCreatePage() {
  const { t } = useTranslation()
  const createWarehouseMaster = useDb((s) => s.createWarehouseMaster)
  const warehouseMasters = useDb((s) => s.warehouseMasters)

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<
    WarehouseMaster,
    WarehouseMasterFormErrors
  >({
    scope: 'masterWarehouse',
    initial: createEmptyWarehouseForm(),
    validate: (next) => {
      const nextErrors = validateWarehouseMasterForm(next)
      const code = next.code.trim()
      if (!nextErrors.code && warehouseMasters.some((w) => w.code === code)) nextErrors.code = 'duplicate'
      return nextErrors
    },
    save: (next) =>
      createWarehouseMaster({
        code: next.code.trim(),
        name: next.name.trim(),
        timezone: next.timezone,
        currency: next.currency,
        status: 'ENABLED',
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
    backTo: (next) => `/wms/master/warehouses/${next.code.trim()}`,
  })

  return (
    <PageContainer
      title={t('masterWarehouse.createTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <WarehouseFormFields mode="create" form={form} setForm={setForm} errors={errors} fieldError={fieldError} />
    </PageContainer>
  )
}
