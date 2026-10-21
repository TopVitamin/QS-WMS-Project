import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterForm } from '@/hooks/use-master-form'
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
  const { state } = useLocation() as { state?: CreatePreset }
  const createLocationMaster = useDb((s) => s.createLocationMaster)
  const locationMasters = useDb((s) => s.locationMasters)
  const empty = useMemo(
    () => createEmptyLocationForm(state?.warehouseCode ?? '', state?.zoneCode ?? ''),
    [state?.warehouseCode, state?.zoneCode],
  )

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<
    LocationMaster,
    LocationMasterFormErrors
  >({
    scope: 'masterLocation',
    initial: empty,
    validate: (next) => {
      const nextErrors = validateLocationMasterForm(next)
      const code = next.code.trim()
      if (!nextErrors.code && locationMasters.some((l) => l.warehouseCode === next.warehouseCode && l.code === code)) {
        nextErrors.code = 'duplicate'
      }
      return nextErrors
    },
    save: (next) =>
      createLocationMaster({
        warehouseCode: next.warehouseCode,
        zoneCode: next.zoneCode,
        zoneType: next.zoneType,
        code: next.code.trim(),
        status: 'ENABLED',
        remark: next.remark?.trim() || undefined,
        putawaySequence: next.putawaySequence,
        pickSequence: next.pickSequence,
        aisle: next.aisle?.trim() || undefined,
        bay: next.bay?.trim() || undefined,
        level: next.level?.trim() || undefined,
        productForms: next.productForms,
        occupyingCustomerId: undefined,
      }),
    backTo: (next) => locationDetailPath(next.warehouseCode, next.code.trim()),
  })

  return (
    <PageContainer
      title={t('masterLocation.createTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <LocationFormFields mode="create" form={form} setForm={setForm} errors={errors} fieldError={fieldError} />
    </PageContainer>
  )
}
