import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DateTime } from '@/components/biz/display'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/biz/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { usageStatusMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { channelHasOpenReferences, createEmptyChannelForm, validateChannelMasterForm } from '@/lib/channel-master'
import type { ChannelMasterFormErrors } from '@/lib/channel-master'
import { codeNameText } from '@/lib/typography'
import { useDb } from '@/mock/db'
import type { ChannelMaster } from '@/types/wms'

const CHANNEL_TYPES: ChannelMaster['channelType'][] = ['EXPRESS', 'TRUCK', 'PICKUP', 'OTHER']
const INTEGRATION_MODES: ChannelMaster['integrationMode'][] = ['OFFLINE_HANDOVER', 'API_RESERVED']

type ChannelFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit' | 'view'
  channelCode?: string
  defaultCarrierCode?: string
  onSaved?: () => void
}

export function ChannelFormDialog({
  open,
  onOpenChange,
  mode,
  channelCode,
  defaultCarrierCode,
  onSaved,
}: ChannelFormDialogProps) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const fieldError = useMasterFormFieldError('masterChannel')
  const channelMasters = useDb((s) => s.channelMasters)
  const carrierMasters = useDb((s) => s.carrierMasters)
  const packages = useDb((s) => s.packages)
  const createChannelMaster = useDb((s) => s.createChannelMaster)
  const updateChannelMaster = useDb((s) => s.updateChannelMaster)

  const existing = useMemo(
    () => (channelCode ? channelMasters.find((c) => c.code === channelCode) : undefined),
    [channelCode, channelMasters],
  )

  const carrierLocked = Boolean(
    existing && mode === 'edit' && channelHasOpenReferences(existing.code, packages),
  )

  const enabledCarriers = useMemo(
    () => carrierMasters.filter((c) => c.status === 'ENABLED'),
    [carrierMasters],
  )

  const [form, setForm] = useState(() => createEmptyChannelForm(defaultCarrierCode))
  const [errors, setErrors] = useState<ChannelMasterFormErrors>({})
  const [baseline, setBaseline] = useState('')

  useEffect(() => {
    if (!open) return
    const next =
      mode !== 'create' && existing
        ? { ...existing }
        : createEmptyChannelForm(defaultCarrierCode ?? '')
    setForm(next)
    setBaseline(JSON.stringify(next))
    setErrors({})
  }, [open, mode, existing, defaultCarrierCode])

  const dirty = open && mode !== 'view' && JSON.stringify(form) !== baseline
  const readOnly = mode === 'view'

  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm({
        title: t('masterChannel.discardTitle'),
        description: t('masterChannel.discardDesc'),
        confirmText: t('masterChannel.discardConfirm'),
        cancelText: t('masterChannel.keepEditing'),
      })
      if (!ok) return
    }
    onOpenChange(false)
  }

  const onSave = () => {
    const nextErrors = validateChannelMasterForm(form)
    const code = form.code.trim()
    if (mode === 'create' && !nextErrors.code && channelMasters.some((c) => c.code === code)) {
      nextErrors.code = 'duplicate'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterChannel.saveValidationFailed'))
      return
    }
    const payload: Omit<ChannelMaster, 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'status'> = {
      carrierCode: form.carrierCode.trim(),
      name: form.name.trim(),
      channelType: form.channelType,
      remark: form.remark?.trim() || undefined,
      integrationMode: form.integrationMode,
      externalProductCode: form.externalProductCode?.trim() || undefined,
    }
    const res =
      mode === 'create'
        ? createChannelMaster({ code, ...payload, status: 'ENABLED' })
        : updateChannelMaster(code, { ...payload, status: existing!.status })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterChannel.saveSuccess'))
    onOpenChange(false)
    onSaved?.()
  }

  const titleKey =
    mode === 'create' ? 'masterChannel.createTitle' : mode === 'edit' ? 'masterChannel.editTitle' : 'masterChannel.viewTitle'
  const ph = t('common.inputPlaceholder')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FormGrid columns={2}>
            <FormField label={t('masterChannel.carrierCode')} required span="full" error={fieldError(errors, 'carrierCode')}>
              <OptionSelect
                value={form.carrierCode}
                disabled={readOnly || carrierLocked || mode === 'edit'}
                onValueChange={(v) => setForm({ ...form, carrierCode: v })}
                options={(mode === 'create' ? enabledCarriers : carrierMasters).map((c) => ({
                  value: c.code,
                  label: codeNameText(c.code, c.name),
                }))}
              />
            </FormField>
            <FormField label={t('masterChannel.code')} required span="full" error={fieldError(errors, 'code')}>
              <Input
                value={form.code}
                readOnly={mode !== 'create'}
                className="tabular-nums"
                placeholder={mode === 'create' ? t('masterChannel.codePlaceholder') : undefined}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </FormField>
            <FormField label={t('masterChannel.name')} required span="full" error={fieldError(errors, 'name')}>
              <Input
                value={form.name}
                readOnly={readOnly}
                placeholder={readOnly ? undefined : t('masterChannel.namePlaceholder')}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label={t('masterChannel.channelType')} required span={readOnly ? undefined : 'full'}>
              <OptionSelect
                value={form.channelType}
                disabled={readOnly}
                onValueChange={(v) => setForm({ ...form, channelType: v as ChannelMaster['channelType'] })}
                options={CHANNEL_TYPES.map((ct) => ({ value: ct, label: t(`masterChannel.types.${ct}`) }))}
              />
            </FormField>
            {readOnly && existing && (
              <FormField label={t('common.status')}>
                <div className="flex min-h-8 items-center">
                  <StatusBadge meta={usageStatusMeta[existing.status]} />
                </div>
              </FormField>
            )}
            <FormField label={t('masterChannel.remark')} span="full">
              <Textarea
                value={form.remark ?? ''}
                rows={2}
                readOnly={readOnly}
                placeholder={readOnly ? undefined : ph}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </FormField>
            <FormField
              label={t('masterChannel.integrationMode')}
              required
              span="full"
              error={fieldError(errors, 'integrationMode')}
            >
              <OptionSelect
                value={form.integrationMode}
                disabled={readOnly}
                onValueChange={(v) => setForm({ ...form, integrationMode: v as ChannelMaster['integrationMode'] })}
                options={INTEGRATION_MODES.map((m) => ({ value: m, label: t(`masterChannel.integrationModes.${m}`) }))}
              />
            </FormField>
            <FormField
              label={t('masterChannel.externalProductCode')}
              span="full"
              hint={form.integrationMode === 'API_RESERVED' ? t('masterChannel.externalProductCodeHint') : undefined}
            >
              <Input
                value={form.externalProductCode ?? ''}
                readOnly={readOnly}
                placeholder={readOnly ? undefined : ph}
                onChange={(e) => setForm({ ...form, externalProductCode: e.target.value })}
              />
            </FormField>
          </FormGrid>

          {readOnly && existing && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-medium">{t('masterChannel.sectionAudit')}</h3>
              <Descriptions columns={2}>
                <DescriptionItem label={t('masterChannel.createdBy')}>{existing.createdBy}</DescriptionItem>
                <DescriptionItem label={t('masterChannel.createdAt')}>
                  <DateTime value={existing.createdAt} />
                </DescriptionItem>
                <DescriptionItem label={t('masterChannel.updatedBy')}>{existing.updatedBy}</DescriptionItem>
                <DescriptionItem label={t('masterChannel.updatedAt')}>
                  <DateTime value={existing.updatedAt} />
                </DescriptionItem>
              </Descriptions>
            </div>
          )}
        </div>

        <DialogFooter>
          {readOnly ? (
            <Button type="button" onClick={() => onOpenChange(false)}>{t('masterChannel.close')}</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => requestClose()}>{t('common.cancel')}</Button>
              <Button type="button" onClick={onSave}>{t('common.save')}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
