import { serialsInWarehouse } from '@/lib/serial-stock'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import type { BalanceRow, SkuStockRow } from '@/lib/inventory-derive'
import { codeNameText, EMPTY_TEXT } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import type { OwnerNotice } from '@/types/inventory'
import { useInventoryRun } from './inventory-helpers'

const NOTICES: OwnerNotice[] = ['NOTIFIED', 'PENDING', 'NOT_REQUIRED']
const newRequestId = () => `QC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const fieldError = (msg?: string) => (msg ? <p className="text-xs text-destructive">{msg}</p> : undefined)

/**
 * 品质转换（库存查询前端Demo版PRD 第四节）：管理端人工转换，入口在库存明细详情。
 * 原因固定为在库受损；SN可选登记；提交前展示当前品质数量与可用变化，会导致负库存时阻断提交。
 */
export function QualityConvertDialog({
  row,
  skuRow,
  onClose,
  onConverted,
}: {
  row: BalanceRow
  skuRow?: SkuStockRow
  onClose: () => void
  /** 转换成功：回传业务动作标识，明细详情据此分别列出本次两条流水 */
  onConverted: (actionId: string) => void
}) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const run = useInventoryRun()
  const { sku, customerCode, customerName } = useLookups()
  const inventory = useDb((s) => s.inventory)
  const serialStocks = useDb((s) => s.serialStocks)
  const inventoryLogs = useDb((s) => s.inventoryLogs)
  const master = useDb((s) =>
    s.skuMasters.find((m) => m.customerId === row.record.customerId && m.code === row.record.skuCode),
  )
  const snItem = Boolean(master?.snEnabled)
  const [requestId] = useState(newRequestId)
  const [qtyText, setQtyText] = useState('1')
  const [serials, setSerials] = useState<string[]>([])
  const [reasonNote, setReasonNote] = useState('')
  const [evidence, setEvidence] = useState('')
  const [ownerNotice, setOwnerNotice] = useState<OwnerNotice | ''>('')
  const [showErrors, setShowErrors] = useState(false)

  const r = row.record
  const max = row.convertible
  const qty = Number(qtyText)
  const qtyValid = Number.isInteger(qty) && qty > 0 && qty <= max
  const errors = {
    qty: qtyValid ? undefined : t('inventory.convert.max', { max }),
    serials:
      snItem && serials.length > 0 && serials.length !== qty
        ? t('inventory.convert.serialMismatch', { selected: serials.length, qty: Math.max(1, qty) })
        : undefined,
    reasonNote: reasonNote.trim()
      ? undefined
      : t('inventory.convert.required', { field: t('inventory.convert.reasonNote') }),
    evidence: evidence.trim() ? undefined : t('inventory.convert.required', { field: t('inventory.convert.evidence') }),
    ownerNotice: ownerNotice
      ? undefined
      : t('inventory.convert.required', { field: t('inventory.convert.ownerNotice') }),
  }
  const valid = !Object.values(errors).some(Boolean)

  const defective =
    inventory.find(
      (x) =>
        x.warehouseCode === r.warehouseCode &&
        x.customerId === r.customerId &&
        x.skuCode === r.skuCode &&
        x.locationCode === r.locationCode &&
        x.qualityType === 'DEFECTIVE' &&
        (x.batchNo ?? '') === (r.batchNo ?? ''),
    )?.onHandQty ?? 0
  const step = qtyValid ? qty : 0
  const availAfter = (skuRow?.available ?? 0) - step

  const dirty = qtyText !== '1' || serials.length > 0 || reasonNote !== '' || evidence !== '' || ownerNotice !== ''
  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm({
        title: t('inventory.discardTitle'),
        description: t('inventory.discardBody'),
        confirmText: t('common.discard'),
        cancelText: t('common.keepEditing'),
      })
      if (!ok) return
    }
    onClose()
  }

  const submit = () => {
    setShowErrors(true)
    if (!valid || !ownerNotice) return
    const result = run(
      {
        type: 'CONVERT_QUALITY',
        requestId,
        inventoryId: r.id,
        qty,
        serialNos: snItem ? serials : [],
        reasonNote,
        evidence,
        ownerNotice,
      },
      () => t('inventory.convert.success', { qty }),
    )
    if (!result) return
    onConverted(requestId)
    onClose()
  }

  const readOnly = (label: string, value: string) => (
    <FormField label={label}>
      <Input readOnly value={value || EMPTY_TEXT} />
    </FormField>
  )

  return (
    <Dialog open onOpenChange={(next) => !next && void requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inventory.convert.title')}</DialogTitle>
          <DialogDescription>{t('inventory.convert.description')}</DialogDescription>
        </DialogHeader>
        <FormGrid columns={2}>
          {readOnly(t('inventory.warehouse'), r.warehouseCode)}
          {readOnly(t('inventory.owner'), codeNameText(customerCode(r.customerId), customerName(r.customerId)))}
          {readOnly(t('inventory.sku'), codeNameText(r.skuCode, sku(r.skuCode)?.name))}
          {readOnly(t('inventory.location'), r.locationCode)}
          {readOnly(t('inventory.batchNo'), r.batchNo ?? '')}
          {readOnly(t('inventory.quality'), t('enum.quality.GOOD'))}
          {readOnly(t('inventory.actual'), String(r.onHandQty))}
          {readOnly(t('inventory.allocated'), String(row.allocated))}
          {readOnly(t('inventory.convert.convertible'), String(max))}
          <FormField
            label={t('inventory.convert.qty')}
            required
            error={showErrors ? fieldError(errors.qty) : undefined}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              value={qtyText}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setQtyText(e.target.value)}
            />
          </FormField>
          {snItem && (
            <FormField
              label={t('inventory.convert.serials')}
              span="full"
              hint={t('inventory.convert.serialsHint')}
              error={showErrors ? fieldError(errors.serials) : undefined}
            >
              <div
                role="group"
                aria-label={t('inventory.convert.serials')}
                className="grid grid-cols-2 gap-2 rounded-lg border p-3"
              >
                {serialsInWarehouse(
                  { inventory, inventoryLogs, serialStocks },
                  r.warehouseCode,
                  r.customerId,
                  r.skuCode,
                  r.qualityType,
                ).map((sn) => (
                  <Label key={sn} className="flex items-center gap-2 font-normal">
                    <Checkbox
                      checked={serials.includes(sn)}
                      onCheckedChange={(checked) =>
                        setSerials((prev) => (checked ? [...prev, sn] : prev.filter((x) => x !== sn)))
                      }
                    />
                    <span className="tabular-nums">{sn}</span>
                  </Label>
                ))}
              </div>
            </FormField>
          )}
          {readOnly(t('inventory.convert.reason'), t('inventory.reason.DAMAGED'))}
          <FormField
            label={t('inventory.convert.ownerNotice')}
            required
            error={showErrors ? fieldError(errors.ownerNotice) : undefined}
          >
            <OptionSelect
              value={ownerNotice || undefined}
              onValueChange={(v) => setOwnerNotice(v)}
              options={NOTICES.map((v) => ({ value: v, label: t(`inventory.ownerNotice.${v}`) }))}
            />
          </FormField>
          <FormField
            label={t('inventory.convert.reasonNote')}
            required
            span="full"
            error={showErrors ? fieldError(errors.reasonNote) : undefined}
          >
            <Textarea
              value={reasonNote}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setReasonNote(e.target.value)}
            />
          </FormField>
          <FormField
            label={t('inventory.convert.evidence')}
            required
            span="full"
            error={showErrors ? fieldError(errors.evidence) : undefined}
          >
            <Textarea
              value={evidence}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </FormField>
        </FormGrid>
        <div className="flex flex-col gap-1 rounded-lg bg-muted p-3 text-sm">
          <span className="text-xs text-muted-foreground">{t('inventory.convert.preview')}</span>
          <span>
            {t('inventory.convert.previewBalance', {
              goodFrom: r.onHandQty,
              goodTo: r.onHandQty - step,
              badFrom: defective,
              badTo: defective + step,
            })}
          </span>
          {skuRow && (
            <span>
              {t('inventory.convert.previewSku', {
                preFrom: skuRow.preoccupied,
                preTo: skuRow.preoccupied,
                availFrom: skuRow.available,
                availTo: availAfter,
              })}
            </span>
          )}
        </div>
        {skuRow && step > 0 && availAfter < 0 && (
          <Alert variant="destructive">
            <AlertDescription>{t('inventory.convert.negativeWarn')}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => void requestClose()}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('inventory.convert.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
