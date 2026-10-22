import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentWarehouse } from '@/stores/settings'
import { useDb } from '@/mock/db'
import type { ContainerMaster, ContainerSource, ContainerType } from '@/types/wms'

const TYPES: ContainerType[] = ['CARTON', 'PALLET', 'BAG', 'CAGE', 'PACKAGE']
const SOURCES: ContainerSource[] = ['EXTERNAL_LABEL', 'INTERNAL', 'OUTBOUND_PACK']

interface FormState {
  containerNo: string
  containerType: ContainerType
  source: ContainerSource
  customerId: string
  maxPieces: string
  maxWeightKg: string
  maxVolumeM3: string
  parentContainerNo: string
  remark: string
}

const emptyForm = (customerId: string): FormState => ({
  containerNo: '',
  containerType: 'CARTON',
  source: 'EXTERNAL_LABEL',
  customerId,
  maxPieces: '',
  maxWeightKg: '',
  maxVolumeM3: '',
  parentContainerNo: '',
  remark: '',
})

const fromContainer = (c: ContainerMaster): FormState => ({
  containerNo: c.containerNo,
  containerType: c.containerType,
  source: c.source,
  customerId: c.customerId,
  maxPieces: c.maxPieces?.toString() ?? '',
  maxWeightKg: c.maxWeightKg?.toString() ?? '',
  maxVolumeM3: c.maxVolumeM3?.toString() ?? '',
  parentContainerNo: c.parentContainerNo ?? '',
  remark: c.remark ?? '',
})

const numberOrUndefined = (value: string) => (value.trim() === '' ? undefined : Number(value))

export function ContainerFormDialog({
  open,
  container,
  onClose,
  onCreated,
}: {
  open: boolean
  container?: ContainerMaster
  onClose: () => void
  onCreated?: (containerNo: string) => void
}) {
  const { t } = useTranslation()
  const warehouse = useCurrentWarehouse()
  const customers = useDb((s) => s.customerMasters)
  const create = useDb((s) => s.createContainer)
  const update = useDb((s) => s.updateContainer)
  const [form, setForm] = useState<FormState>(() => emptyForm((customers.find((c) => c.code === 'ANKR' && c.status === 'ENABLED') ?? customers.find((c) => c.status === 'ENABLED'))?.id ?? ''))
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!open) return
    setError(undefined)
    setForm(container ? fromContainer(container) : emptyForm((customers.find((c) => c.code === 'ANKR' && c.status === 'ENABLED') ?? customers.find((c) => c.status === 'ENABLED'))?.id ?? ''))
  }, [open, container, customers])

  const submit = () => {
    const capacity = {
      maxPieces: numberOrUndefined(form.maxPieces),
      maxWeightKg: numberOrUndefined(form.maxWeightKg),
      maxVolumeM3: numberOrUndefined(form.maxVolumeM3),
    }
    if (container) {
      const result = update({
        warehouseCode: container.warehouseCode,
        containerNo: container.containerNo,
        containerType: form.containerType,
        ...capacity,
        parentContainerNo: form.parentContainerNo || undefined,
        remark: form.remark || undefined,
      })
      if (!result.ok) {
        setError(t(result.errorKey, result.params))
        return
      }
      onClose()
      return
    }
    const result = create({
      warehouseCode: warehouse.code,
      containerNo: form.containerNo,
      containerType: form.containerType,
      source: form.source,
      customerId: form.customerId,
      ...capacity,
      parentContainerNo: form.parentContainerNo || undefined,
      remark: form.remark || undefined,
    })
    if (!result.ok) {
      setError(t(result.errorKey, result.params))
      return
    }
    onClose()
    onCreated?.(form.containerNo.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(container ? 'container.editTitle' : 'container.createTitle')}</DialogTitle>
          <DialogDescription>{t('container.formHint')}</DialogDescription>
        </DialogHeader>
        <FormGrid columns={2}>
          <FormField label={t('container.no')} required>
            <Input
              value={form.containerNo}
              readOnly={Boolean(container)}
              placeholder={t('container.noPlaceholder')}
              onChange={(e) => setForm({ ...form, containerNo: e.target.value })}
            />
          </FormField>
          <FormField label={t('container.warehouse')}>
            <Input value={container?.warehouseCode ?? warehouse.code} readOnly />
          </FormField>
          <FormField label={t('container.type')} required>
            <OptionSelect
              value={form.containerType}
              onValueChange={(v) => setForm({ ...form, containerType: v as ContainerType })}
              options={TYPES.map((type) => ({ value: type, label: t(`enum.containerType.${type}`) }))}
            />
          </FormField>
          <FormField label={t('container.source')} required>
            <OptionSelect
              value={form.source}
              onValueChange={(v) => setForm({ ...form, source: v as ContainerSource })}
              options={SOURCES.map((source) => ({ value: source, label: t(`enum.containerSource.${source}`) }))}
              disabled={Boolean(container)}
            />
          </FormField>
          <FormField label={t('common.customer')} required span="full">
            <OptionSelect
              value={form.customerId}
              onValueChange={(v) => setForm({ ...form, customerId: v })}
              options={customers
                .filter((c) => c.status === 'ENABLED')
                .map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }))}
              disabled={Boolean(container)}
            />
          </FormField>
          <FormField label={t('container.maxPieces')}>
            <Input
              type="number"
              min={0}
              value={form.maxPieces}
              placeholder={t('container.capacityEmpty')}
              onChange={(e) => setForm({ ...form, maxPieces: e.target.value })}
            />
          </FormField>
          <FormField label={t('container.maxWeightKg')}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.maxWeightKg}
              placeholder={t('container.capacityEmpty')}
              onChange={(e) => setForm({ ...form, maxWeightKg: e.target.value })}
            />
          </FormField>
          <FormField label={t('container.maxVolumeM3')}>
            <Input
              type="number"
              min={0}
              step="0.001"
              value={form.maxVolumeM3}
              placeholder={t('container.capacityEmpty')}
              onChange={(e) => setForm({ ...form, maxVolumeM3: e.target.value })}
            />
          </FormField>
          <FormField label={t('container.parent')}>
            <Input
              value={form.parentContainerNo}
              placeholder={t('container.parentPlaceholder')}
              onChange={(e) => setForm({ ...form, parentContainerNo: e.target.value })}
            />
          </FormField>
          <FormField label={t('container.remark')} span="full">
            <Textarea
              rows={2}
              value={form.remark}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </FormField>
        </FormGrid>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
