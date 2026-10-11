import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import {
  createEmptyCarrierForm,
  validateCarrierMasterForm,
  type CarrierMasterFormErrors,
} from '@/lib/carrier-master'
import { useDb } from '@/mock/db'
type CarrierFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  carrierCode?: string
  onSaved?: () => void
}

export function CarrierFormDialog({ open, onOpenChange, mode, carrierCode, onSaved }: CarrierFormDialogProps) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const fieldError = useMasterFormFieldError('masterCarrier')
  const carrierMasters = useDb((s) => s.carrierMasters)
  const createCarrierMaster = useDb((s) => s.createCarrierMaster)
  const updateCarrierMaster = useDb((s) => s.updateCarrierMaster)

  const existing = useMemo(
    () => (mode === 'edit' && carrierCode ? carrierMasters.find((c) => c.code === carrierCode) : undefined),
    [carrierCode, carrierMasters, mode],
  )

  const [form, setForm] = useState(() => createEmptyCarrierForm())
  const [errors, setErrors] = useState<CarrierMasterFormErrors>({})
  const [baseline, setBaseline] = useState('')

  useEffect(() => {
    if (!open) return
    const next = mode === 'edit' && existing ? { ...existing } : createEmptyCarrierForm()
    setForm(next)
    setBaseline(JSON.stringify(next))
    setErrors({})
  }, [open, mode, existing])

  const dirty = open && JSON.stringify(form) !== baseline

  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm({
        title: t('masterCarrier.discardTitle'),
        description: t('masterCarrier.discardDesc'),
        confirmText: t('masterCarrier.discardConfirm'),
        cancelText: t('masterCarrier.keepEditing'),
      })
      if (!ok) return
    }
    onOpenChange(false)
  }

  const onSave = () => {
    const nextErrors = validateCarrierMasterForm(form)
    const code = form.code.trim()
    if (mode === 'create' && !nextErrors.code && carrierMasters.some((c) => c.code === code)) {
      nextErrors.code = 'duplicate'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterCarrier.saveValidationFailed'))
      return
    }
    const payload = {
      name: form.name.trim(),
      shortName: form.shortName?.trim() || undefined,
      remark: form.remark?.trim() || undefined,
      contactName: form.contactName?.trim() || undefined,
      contactPhone: form.contactPhone?.trim() || undefined,
      contactEmail: form.contactEmail?.trim() || undefined,
      externalCarrierCode: form.externalCarrierCode?.trim() || undefined,
    }
    const res =
      mode === 'create'
        ? createCarrierMaster({ code, ...payload, status: 'ENABLED' })
        : updateCarrierMaster(carrierCode!, { ...payload, status: existing!.status })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterCarrier.saveSuccess'))
    onOpenChange(false)
    onSaved?.()
  }

  const title = mode === 'create' ? t('masterCarrier.createTitle') : t('masterCarrier.editTitle')
  const ph = t('common.inputPlaceholder')

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">{t('masterCarrier.sectionBasic')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel required>{t('masterCarrier.code')}</FormFieldLabel>
              <Input
                value={form.code}
                readOnly={mode === 'edit'}
                placeholder={mode === 'create' ? t('masterCarrier.codePlaceholder') : undefined}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              {fieldError(errors, 'code')}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel required>{t('masterCarrier.name')}</FormFieldLabel>
              <Input
                value={form.name}
                placeholder={t('masterCarrier.namePlaceholder')}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {fieldError(errors, 'name')}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel>{t('masterCarrier.shortName')}</FormFieldLabel>
              <Input
                value={form.shortName ?? ''}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel>{t('masterCarrier.remark')}</FormFieldLabel>
              <Textarea
                value={form.remark ?? ''}
                rows={2}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </div>
          </div>

          <h3 className="text-sm font-medium">{t('masterCarrier.sectionContact')}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FormFieldLabel>{t('masterCarrier.contactName')}</FormFieldLabel>
              <Input
                value={form.contactName ?? ''}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel>{t('masterCarrier.contactPhone')}</FormFieldLabel>
              <Input
                value={form.contactPhone ?? ''}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FormFieldLabel>{t('masterCarrier.contactEmail')}</FormFieldLabel>
              <Input
                value={form.contactEmail ?? ''}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
              {fieldError(errors, 'contactEmail')}
            </div>
          </div>

          <h3 className="text-sm font-medium">{t('masterCarrier.sectionIntegration')}</h3>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterCarrier.externalCarrierCode')}</FormFieldLabel>
            <Input
              value={form.externalCarrierCode ?? ''}
              placeholder={ph}
              onChange={(e) => setForm({ ...form, externalCarrierCode: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => requestClose()}>{t('common.cancel')}</Button>
          <Button type="button" onClick={onSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
