import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageContainer } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { zoneDetailPath, validateZoneMasterForm, type ZoneMasterFormErrors } from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { ZoneMaster } from '@/types/wms'
import { createEmptyZoneForm, ZoneFormFields } from './zone-form-fields'

type CreatePreset = { warehouseCode?: string }

export function ZoneCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation() as { state?: CreatePreset }
  const leave = useMasterDiscardNavigate('masterZone')
  const fieldError = useMasterFormFieldError('masterZone')
  const createZoneMaster = useDb((s) => s.createZoneMaster)
  const zoneMasters = useDb((s) => s.zoneMasters)

  const empty = useMemo(() => createEmptyZoneForm(state?.warehouseCode ?? ''), [state?.warehouseCode])

  const [form, setForm] = useState<ZoneMaster>(() => empty)
  const [errors, setErrors] = useState<ZoneMasterFormErrors>({})

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(empty), [form, empty])

  const onSave = () => {
    const nextErrors = validateZoneMasterForm(form)
    const code = form.code.trim()
    const wh = form.warehouseCode
    if (!nextErrors.code && zoneMasters.some((z) => z.warehouseCode === wh && z.code === code)) {
      nextErrors.code = 'duplicate'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterZone.saveValidationFailed'))
      return
    }
    const res = createZoneMaster({
      warehouseCode: wh,
      code,
      name: form.name.trim(),
      zoneType: form.zoneType,
      status: form.status,
      remark: form.remark?.trim() || undefined,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterZone.saveSuccess'))
    navigate(zoneDetailPath(wh, code))
  }

  const showFieldError = (key: keyof ZoneMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={t('masterZone.createTitle')}
      actions={
        <>
          <Button variant="outline" onClick={() => leave('/wms/master/zones', dirty)}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </>
      }
    >
      <ZoneFormFields mode="create" form={form} setForm={setForm} errors={errors} fieldError={showFieldError} />
    </PageContainer>
  )
}
