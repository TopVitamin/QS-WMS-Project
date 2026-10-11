import { useEffect, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDb } from '@/mock/db'
import type { SkuBarcode, UsageStatus } from '@/types/wms'

export type SkuBarcodeDialogState =
  | { mode: 'create'; ownerCode: string; skuCode: string }
  | { mode: 'edit'; row: SkuBarcode }
  | null

interface SkuBarcodeDialogProps {
  state: SkuBarcodeDialogState
  onClose: () => void
}

export function SkuBarcodeDialog({ state, onClose }: SkuBarcodeDialogProps) {
  const { t } = useTranslation()
  const saveSkuBarcode = useDb((s) => s.saveSkuBarcode)

  const [barcode, setBarcode] = useState('')
  const [isPrimary, setIsPrimary] = useState(true)
  const [status, setStatus] = useState<UsageStatus>('ENABLED')

  useEffect(() => {
    if (!state) return
    if (state.mode === 'edit') {
      setBarcode(state.row.barcode)
      setIsPrimary(state.row.isPrimary)
      setStatus(state.row.status)
    } else {
      setBarcode('')
      setIsPrimary(false)
      setStatus('ENABLED')
    }
  }, [state])

  if (!state) return null

  const ownerCode = state.mode === 'edit' ? state.row.ownerCode : state.ownerCode
  const skuCode = state.mode === 'edit' ? state.row.skuCode : state.skuCode
  const readOnlyBarcode = state.mode === 'edit'

  const onSave = () => {
    const res = saveSkuBarcode({
      id: state.mode === 'edit' ? state.row.id : undefined,
      ownerCode,
      skuCode,
      barcode,
      isPrimary,
      status,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterSku.barcodeSaveSuccess'))
    onClose()
  }

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state.mode === 'create' ? t('masterSku.barcodeCreateTitle') : t('masterSku.barcodeEditTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FormFieldLabel>{t('masterSku.ownerCode')}</FormFieldLabel>
              <Input readOnly value={ownerCode} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <FormFieldLabel>{t('masterSku.code')}</FormFieldLabel>
              <Input readOnly value={skuCode} className="font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel required>{t('masterSku.barcode')}</FormFieldLabel>
            <Input
              readOnly={readOnlyBarcode}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <FormFieldLabel required>{t('masterSku.isPrimaryBarcode')}</FormFieldLabel>
            <RadioGroup
              value={isPrimary ? 'yes' : 'no'}
              onValueChange={(v) => setIsPrimary(v === 'yes')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="primary-yes" />
                <Label htmlFor="primary-yes">{t('common.yes')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="primary-no" />
                <Label htmlFor="primary-no">{t('common.no')}</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            <FormFieldLabel>{t('masterSku.barcodeStatus')}</FormFieldLabel>
            <Select value={status} onValueChange={(v) => setStatus(v as UsageStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENABLED">{t('status.usage.ENABLED')}</SelectItem>
                <SelectItem value="DISABLED">{t('status.usage.DISABLED')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
