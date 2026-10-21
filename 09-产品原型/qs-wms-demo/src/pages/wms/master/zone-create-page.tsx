import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterForm } from '@/hooks/use-master-form'
import {
  createEmptyZoneForm,
  validateZoneMasterForm,
  zoneDetailPath,
  type ZoneMasterFormErrors,
} from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { ZoneMaster } from '@/types/wms'
import { ZoneFormFields } from './zone-form-fields'

type CreatePreset = { warehouseCode?: string }

export function ZoneCreatePage() {
  const { t } = useTranslation()
  const { state } = useLocation() as { state?: CreatePreset }
  const createZoneMaster = useDb((s) => s.createZoneMaster)
  const zoneMasters = useDb((s) => s.zoneMasters)
  const empty = useMemo(() => createEmptyZoneForm(state?.warehouseCode ?? ''), [state?.warehouseCode])

  const { form, setForm, errors, fieldError, onSave, onCancel } = useMasterForm<ZoneMaster, ZoneMasterFormErrors>({
    scope: 'masterZone',
    initial: empty,
    validate: (next) => {
      const nextErrors = validateZoneMasterForm(next)
      const code = next.code.trim()
      if (!nextErrors.code && zoneMasters.some((z) => z.warehouseCode === next.warehouseCode && z.code === code)) {
        nextErrors.code = 'duplicate'
      }
      return nextErrors
    },
    save: (next) =>
      createZoneMaster({
        warehouseCode: next.warehouseCode,
        code: next.code.trim(),
        name: next.name.trim(),
        zoneType: next.zoneType,
        status: 'ENABLED',
        remark: next.remark?.trim() || undefined,
      }),
    backTo: (next) => zoneDetailPath(next.warehouseCode, next.code.trim()),
  })

  return (
    <PageContainer
      title={t('masterZone.createTitle')}
      actions={
        <>
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <ZoneFormFields mode="create" form={form} setForm={setForm} errors={errors} fieldError={fieldError} />
    </PageContainer>
  )
}
