import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, Num } from '@/components/biz/display'
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
import { returnSourceMeta } from '@/config/status'
import { codeNameText, EMPTY_TEXT } from '@/lib/typography'
import { canConfirmReturnReceiptClose, returnLineUnreceived } from '@/lib/return-derive'
import { useDb } from '@/mock/db'
import { useCurrentWarehouse } from '@/stores/settings'
import type { ReturnOrder, ReturnSourceType } from '@/types/return'

const SOURCES: ReturnSourceType[] = ['CUSTOMER', 'PLATFORM']

export function ReturnForecastDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (returnNo: string) => void
}) {
  const { t } = useTranslation()
  const warehouse = useCurrentWarehouse()
  const customers = useDb((s) => s.customers)
  const masters = useDb((s) => s.skuMasters)
  const forecast = useDb((s) => s.mockReturnForecast)
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [sourceType, setSourceType] = useState<ReturnSourceType>('CUSTOMER')
  const [upstreamNo] = useState(() => `OMS-RT-DEMO-${Date.now()}`)
  const [skuCode, setSkuCode] = useState('')
  const [plannedQty, setPlannedQty] = useState('1')
  const [trackingNo, setTrackingNo] = useState('')
  const [platformReturnNo, setPlatformReturnNo] = useState('')
  const [originalOutboundNo, setOriginalOutboundNo] = useState('')
  const [originalSalesNo, setOriginalSalesNo] = useState('')
  const [originalTrackingNo, setOriginalTrackingNo] = useState('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState<string>()

  const ownerSkus = useMemo(
    () => masters.filter((m) => m.customerId === customerId && m.status === 'ENABLED'),
    [customerId, masters],
  )
  const selectedSku = ownerSkus.some((m) => m.code === skuCode) ? skuCode : (ownerSkus[0]?.code ?? '')

  const submit = () => {
    const result = forecast({
      customerId,
      warehouseCode: warehouse.code,
      sourceType,
      upstreamNo,
      skuCode: selectedSku,
      plannedQty: Number(plannedQty),
      trackingNo,
      platformReturnNo,
      originalOutboundNo,
      originalSalesNo,
      originalTrackingNo,
      remark,
    })
    if (!result.ok) {
      setError(t(result.errorKey))
      return
    }
    toast.success(t('return.forecast.success', { no: result.returnNo }))
    if (result.returnNo) onCreated(result.returnNo)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('return.forecast.title')}</DialogTitle>
          <DialogDescription>{t('return.forecast.identificationHint')}</DialogDescription>
        </DialogHeader>
        <FormGrid columns={2}>
          <FormField label={t('common.customer')} required>
            <OptionSelect
              value={customerId}
              onValueChange={setCustomerId}
              options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
            />
          </FormField>
          <FormField label={t('return.forecast.source')} required>
            <OptionSelect
              value={sourceType}
              onValueChange={(v) => setSourceType(v as ReturnSourceType)}
              options={SOURCES.map((s) => ({ value: s, label: t(returnSourceMeta[s].labelKey) }))}
            />
          </FormField>
          {sourceType === 'CUSTOMER' && (
            <FormField label={t('return.forecast.trackingNo')} required>
              <Input
                value={trackingNo}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setTrackingNo(e.target.value)}
              />
            </FormField>
          )}
          {sourceType === 'PLATFORM' && (
            <FormField label={t('return.forecast.platformReturnNo')} required>
              <Input
                value={platformReturnNo}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setPlatformReturnNo(e.target.value)}
              />
            </FormField>
          )}
          <FormField label={t('return.forecast.sku')} required>
            <OptionSelect
              value={selectedSku}
              onValueChange={setSkuCode}
              options={ownerSkus.map((m) => ({ value: m.code, label: codeNameText(m.code, m.name) }))}
            />
          </FormField>
          <FormField label={t('return.forecast.qty')} required>
            <Input type="number" min={1} value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} />
          </FormField>
          <FormField label={t('return.forecast.originalSalesNo')}>
            <Input
              value={originalSalesNo}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setOriginalSalesNo(e.target.value)}
            />
          </FormField>
          <FormField label={t('return.forecast.originalOutboundNo')}>
            <Input
              value={originalOutboundNo}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setOriginalOutboundNo(e.target.value)}
            />
          </FormField>
          <FormField label={t('return.forecast.originalTrackingNo')}>
            <Input
              value={originalTrackingNo}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setOriginalTrackingNo(e.target.value)}
            />
          </FormField>
          <FormField label={t('return.forecast.remark')} span="full">
            <Textarea
              rows={2}
              value={remark}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setRemark(e.target.value)}
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
          <Button onClick={submit}>{t('return.forecast.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReturnCancelDialog({ order, onClose }: { order: ReturnOrder; onClose: () => void }) {
  const { t } = useTranslation()
  const cancel = useDb((s) => s.cancelReturnOrder)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  const submit = () => {
    const result = cancel(order.returnNo, reason)
    if (!result.ok) {
      setError(t(result.errorKey))
      return
    }
    toast.success(t('return.cancel.success', { no: order.returnNo }))
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('return.cancel.title', { no: order.returnNo })}</DialogTitle>
          <DialogDescription>{t('return.cancel.hint')}</DialogDescription>
        </DialogHeader>
        <FormField label={t('return.cancel.reason')}>
          <Textarea
            rows={3}
            value={reason}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={submit}>
            {t('return.cancel.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReturnReceiptCloseDialog({
  order,
  onClose,
  onConfirm,
}: {
  order?: ReturnOrder
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const lines = useMemo(
    () => (order ? order.items.filter((line) => returnLineUnreceived(line) > 0) : []),
    [order],
  )
  const totalShort = lines.reduce((sum, line) => sum + returnLineUnreceived(line), 0)
  const columns = useMemo(() => {
    const col = createDataColumns<(typeof lines)[number]>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('originalPackageNo', {
        header: t('return.receive.originalPackage'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : EMPTY_TEXT),
      }),
      col.accessor('skuCode', {
        header: t('common.sku'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor((line) => returnLineUnreceived(line), {
        id: 'shortQty',
        header: t('return.detail.finalShortQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])

  return (
    <Dialog open={!!order && canConfirmReturnReceiptClose(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('return.detail.receiptCloseTitle', { no: order?.returnNo })}</DialogTitle>
          <DialogDescription>{t('return.detail.receiptCloseHint')}</DialogDescription>
        </DialogHeader>
        <DataTable
          data={lines}
          columns={columns}
          getRowId={(line) => String(line.lineNo)}
          selectable={false}
          showColumnSettings={false}
          paginate={false}
        />
        <p className="text-sm text-muted-foreground">
          {t('return.detail.receiptCloseTotal', { count: totalShort })}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={onConfirm}>{t('return.detail.receiptClose')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
