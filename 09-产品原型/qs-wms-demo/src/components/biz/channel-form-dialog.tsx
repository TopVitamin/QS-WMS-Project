import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DateTime } from '@/components/biz/display'
import { FormFieldLabel } from '@/components/biz/form-field-label'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usageStatusMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import { channelHasOpenReferences, createEmptyChannelForm, validateChannelMasterForm } from '@/lib/channel-master'
import type { ChannelMasterFormErrors } from '@/lib/channel-master'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import type { ChannelMaster } from '@/types/wms'

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
  const sp = t('common.selectPlaceholder')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel required>{t('masterChannel.carrierCode')}</FormFieldLabel>
              <Select
                value={form.carrierCode}
                disabled={readOnly || carrierLocked || mode === 'edit'}
                onValueChange={(v) => setForm({ ...form, carrierCode: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={sp} />
                </SelectTrigger>
                <SelectContent>
                  {(mode === 'create' ? enabledCarriers : carrierMasters).map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError(errors, 'carrierCode')}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel required>{t('masterChannel.code')}</FormFieldLabel>
              <Input
                value={form.code}
                readOnly={mode !== 'create'}
                placeholder={mode === 'create' ? t('masterChannel.codePlaceholder') : undefined}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              {fieldError(errors, 'code')}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel required>{t('masterChannel.name')}</FormFieldLabel>
              <Input
                value={form.name}
                readOnly={readOnly}
                placeholder={t('masterChannel.namePlaceholder')}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {fieldError(errors, 'name')}
            </div>
            <div className={cn('space-y-1.5', !readOnly && 'sm:col-span-2')}>
              <FormFieldLabel required>{t('masterChannel.channelType')}</FormFieldLabel>
              <Select
                value={form.channelType}
                disabled={readOnly}
                onValueChange={(v) => setForm({ ...form, channelType: v as ChannelMaster['channelType'] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={sp} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPRESS">{t('masterChannel.types.EXPRESS')}</SelectItem>
                  <SelectItem value="TRUCK">{t('masterChannel.types.TRUCK')}</SelectItem>
                  <SelectItem value="PICKUP">{t('masterChannel.types.PICKUP')}</SelectItem>
                  <SelectItem value="OTHER">{t('masterChannel.types.OTHER')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {readOnly && existing && (
              <div className="space-y-1.5">
                <FormFieldLabel>{t('common.status')}</FormFieldLabel>
                <StatusBadge meta={usageStatusMeta[existing.status]} />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel>{t('masterChannel.remark')}</FormFieldLabel>
              <Textarea
                value={form.remark ?? ''}
                rows={2}
                readOnly={readOnly}
                placeholder={readOnly ? undefined : ph}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel required>{t('masterChannel.integrationMode')}</FormFieldLabel>
              <Select
                value={form.integrationMode}
                disabled={readOnly}
                onValueChange={(v) => setForm({ ...form, integrationMode: v as ChannelMaster['integrationMode'] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={sp} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE_HANDOVER">{t('masterChannel.integrationModes.OFFLINE_HANDOVER')}</SelectItem>
                  <SelectItem value="API_RESERVED">{t('masterChannel.integrationModes.API_RESERVED')}</SelectItem>
                </SelectContent>
              </Select>
              {fieldError(errors, 'integrationMode')}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel>{t('masterChannel.externalProductCode')}</FormFieldLabel>
              <Input
                value={form.externalProductCode ?? ''}
                readOnly={readOnly}
                placeholder={readOnly ? undefined : ph}
                onChange={(e) => setForm({ ...form, externalProductCode: e.target.value })}
              />
              {form.integrationMode === 'API_RESERVED' && (
                <p className="text-xs text-muted-foreground">{t('masterChannel.externalProductCodeHint')}</p>
              )}
            </div>
          </div>

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
