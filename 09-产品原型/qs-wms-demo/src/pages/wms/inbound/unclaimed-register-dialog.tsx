import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { MockPhotoField } from '@/components/biz/mock-photo-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { parseCodeLines } from '@/lib/unclaimed'
import { useDb } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import type { UnclaimedRecord } from '@/types/inbound'

interface FormState {
  trackingNos: string
  cartonMarks: string
  containerNo: string
  cartonQty: string
  description: string
  photos: string[]
}

const emptyForm: FormState = {
  trackingNos: '',
  cartonMarks: '',
  containerNo: '',
  cartonQty: '',
  description: '',
  photos: [],
}

/** 登记无主货弹窗（无主货登记主PRD 第二节、Demo PRD 第四节）；只登记，不认领、不指定货主 */
export function UnclaimedRegisterDialog({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean
  onClose: () => void
  onRegistered?: (record: UnclaimedRecord) => void
}) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const warehouse = useCurrentWarehouse()
  const operatorName = useSettings((s) => s.operator)
  const registerUnclaimed = useDb((s) => s.registerUnclaimed)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [clueError, setClueError] = useState(false)
  const [qtyError, setQtyError] = useState(false)
  const [requestId, setRequestId] = useState(() => newRequestId())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setClueError(false)
    setQtyError(false)
    setRequestId(newRequestId())
  }, [open])

  const dirty =
    form.trackingNos.trim() !== '' ||
    form.cartonMarks.trim() !== '' ||
    form.containerNo.trim() !== '' ||
    form.cartonQty.trim() !== '' ||
    form.description.trim() !== '' ||
    form.photos.length > 0

  const requestClose = async () => {
    if (submitting) return
    if (dirty) {
      const ok = await confirm({
        title: t('unclaimed.discardTitle'),
        description: t('unclaimed.discardBody'),
        confirmText: t('common.discard'),
        cancelText: t('common.keepEditing'),
      })
      if (!ok) return
    }
    onClose()
  }

  const submit = () => {
    const trackingNos = parseCodeLines(form.trackingNos)
    const cartonMarks = parseCodeLines(form.cartonMarks)
    const containerNo = form.containerNo.trim()
    const cartonQty = Number(form.cartonQty)
    const nextClueError = trackingNos.length === 0 && cartonMarks.length === 0 && !containerNo
    const nextQtyError = !Number.isInteger(cartonQty) || cartonQty <= 0
    setClueError(nextClueError)
    setQtyError(nextQtyError)
    if (nextClueError || nextQtyError) return

    setSubmitting(true)
    const res = registerUnclaimed({
      warehouseCode: warehouse.code,
      trackingNos,
      cartonMarks,
      containerNo: containerNo || undefined,
      cartonQty,
      description: form.description.trim() || undefined,
      photos: form.photos,
      requestId,
      operator: operatorName,
    })
    setSubmitting(false)
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('unclaimed.submitSuccess', { registerNo: res.record?.registerNo }))
    if (res.record) onRegistered?.(res.record)
    setRequestId(newRequestId())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('unclaimed.create')}</DialogTitle>
        </DialogHeader>

        <Alert>
          <AlertCircle />
          <AlertDescription>{t('unclaimed.scopeHint')}</AlertDescription>
        </Alert>

        <FormGrid columns={2}>
          <FormField label={t('common.warehouse')}>
            <Input value={`${warehouse.code} ${t(warehouse.nameKey)}`} readOnly />
          </FormField>
        </FormGrid>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t('unclaimed.clueGroup')}</h3>
          <FormGrid columns={2}>
            <FormField label={t('unclaimed.trackingNos')} hint={t('unclaimed.onePerLine')}>
              <Textarea
                rows={2}
                value={form.trackingNos}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, trackingNos: e.target.value })}
              />
            </FormField>
            <FormField label={t('unclaimed.cartonMarks')} hint={t('unclaimed.onePerLine')}>
              <Textarea
                rows={2}
                value={form.cartonMarks}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, cartonMarks: e.target.value })}
              />
            </FormField>
            <FormField label={t('unclaimed.containerNo')}>
              <Input
                value={form.containerNo}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, containerNo: e.target.value })}
              />
            </FormField>
            <FormField
              label={t('unclaimed.cartonQty')}
              required
              hint={t('unclaimed.cartonQtyHint')}
              error={qtyError ? <p className="text-xs text-destructive">{t('error.qtyInvalid')}</p> : undefined}
            >
              <Input
                type="number"
                min={1}
                value={form.cartonQty}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setForm({ ...form, cartonQty: e.target.value })}
              />
            </FormField>
          </FormGrid>
          {clueError && <p className="text-xs text-destructive">{t('unclaimed.error.clueRequired')}</p>}
        </div>

        <FormGrid columns={2}>
          <FormField label={t('unclaimed.description')} span="full">
            <Textarea
              rows={2}
              value={form.description}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          <FormField label={t('unclaimed.photo')} span="full">
            <MockPhotoField value={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
          </FormField>
        </FormGrid>

        <DialogFooter>
          <Button variant="outline" onClick={requestClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {t('unclaimed.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function newRequestId() {
  return `ug-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
