import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { usageStatusMeta } from '@/config/status'
import { useDb } from '@/mock/db'
import type { SkuBarcode, UsageStatus } from '@/types/wms'

/** 条码是商品的子记录，按商品 PRD 可在弹窗里维护条码状态 */
const USAGE_STATUSES: UsageStatus[] = ['ENABLED', 'DISABLED']

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
        <FormGrid columns={2}>
          <FormField label={t('masterSku.ownerCode')}>
            <Input readOnly value={ownerCode} className="tabular-nums" />
          </FormField>
          <FormField label={t('masterSku.code')}>
            <Input readOnly value={skuCode} className="tabular-nums" />
          </FormField>
          <FormField label={t('masterSku.barcode')} required span="full">
            <Input
              readOnly={readOnlyBarcode}
              value={barcode}
              placeholder={readOnlyBarcode ? undefined : t('common.inputPlaceholder')}
              onChange={(e) => setBarcode(e.target.value)}
              className="tabular-nums"
            />
          </FormField>
          <FormField label={t('masterSku.isPrimaryBarcode')} required>
            <RadioGroup
              value={isPrimary ? 'yes' : 'no'}
              onValueChange={(v) => setIsPrimary(v === 'yes')}
              className="flex min-h-8 items-center gap-4"
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
          </FormField>
          <FormField label={t('masterSku.barcodeStatus')}>
            <OptionSelect
              value={status}
              onValueChange={(v) => setStatus(v as UsageStatus)}
              options={USAGE_STATUSES.map((u) => ({ value: u, label: t(usageStatusMeta[u].labelKey) }))}
            />
          </FormField>
        </FormGrid>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={onSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
