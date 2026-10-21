import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { inboundBizTypeMeta } from '@/config/status'
import { INBOUND_ARRIVAL_METHODS } from '@/lib/inbound-list-match'
import { codeNameText } from '@/lib/typography'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import { useDb } from '@/mock/db'
import type { InboundArrivalMethod } from '@/types/inbound'
import type { InboundBizType } from '@/types/wms'

const BIZ_TYPES: InboundBizType[] = ['NORMAL', 'TRANSFER']

export function InboundMockPushDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    customerId: string
    warehouseCode: string
    bizType: InboundBizType
    upstreamNo: string
    items: { skuCode: string; plannedQty: number }[]
    arrivalMethod?: InboundArrivalMethod
    containerNo?: string
    trackingNos?: string
    etaAt?: string
  }) => void
}) {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const currentWarehouse = useCurrentWarehouse()
  const customers = useDb((s) => s.customers)
  const skuMasters = useDb((s) => s.skuMasters)
  const [customerId, setCustomerId] = useState('')
  const [bizType, setBizType] = useState<InboundBizType>('NORMAL')
  const [upstreamNo, setUpstreamNo] = useState('OMS-IN-DEMO-001')
  const [lines, setLines] = useState([{ skuCode: 'CABLE-01', plannedQty: '500' }])
  const [arrivalMethod, setArrivalMethod] = useState<InboundArrivalMethod>(currentWarehouse.defaultReceiptMethod)
  const [containerNo, setContainerNo] = useState('')
  const [trackingNos, setTrackingNos] = useState('')
  const [etaAt, setEtaAt] = useState('')

  useEffect(() => {
    if (!open) return
    const ankr = customers.find((c) => c.code === 'ANKR')
    if (ankr) setCustomerId(ankr.id)
  }, [open, customers])

  const ownerSkus = useMemo(
    () => skuMasters.filter((m) => m.customerId === customerId && m.status === 'ENABLED'),
    [customerId, skuMasters],
  )

  // 演示商品以商品资料（skuMasters）为准；选中货主后保证每行 SKU 在可选列表里
  useEffect(() => {
    if (!open) return
    setLines((prev) =>
      prev.map((line) =>
        ownerSkus.some((m) => m.code === line.skuCode) ? line : { ...line, skuCode: ownerSkus[0]?.code ?? '' },
      ),
    )
  }, [open, ownerSkus])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('inbound.mockPush')}</DialogTitle>
        </DialogHeader>
        <FormGrid columns={2}>
          <FormField label={t('common.customer')} required span="full">
            <OptionSelect
              value={customerId}
              onValueChange={setCustomerId}
              options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
            />
          </FormField>
          <FormField label={t('common.warehouse')}>
            <Input value={warehouseCode} readOnly className="tabular-nums" />
          </FormField>
          <FormField label={t('inbound.bizType')} required>
            <OptionSelect
              value={bizType}
              onValueChange={(v) => setBizType(v as InboundBizType)}
              options={BIZ_TYPES.map((b) => ({ value: b, label: t(inboundBizTypeMeta[b].labelKey) }))}
            />
          </FormField>
          <FormField label={t('inbound.upstreamNo')} required span="full">
            <Input
              value={upstreamNo}
              placeholder={t('inbound.filters.upstreamNoPlaceholder')}
              onChange={(e) => setUpstreamNo(e.target.value)}
            />
          </FormField>
          <div className="col-span-full flex flex-col gap-2">
            {lines.map((line, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                <FormField label={t('common.sku')} required>
                  <OptionSelect
                    value={line.skuCode}
                    onValueChange={(v) =>
                      setLines((prev) => prev.map((l, i) => (i === index ? { ...l, skuCode: v } : l)))
                    }
                    options={ownerSkus.map((m) => ({ value: m.code, label: codeNameText(m.code, m.name) }))}
                  />
                </FormField>
                <FormField label={t('inbound.plannedQty')} required>
                  <Input
                    type="number"
                    min={1}
                    value={line.plannedQty}
                    onChange={(e) =>
                      setLines((prev) => prev.map((l, i) => (i === index ? { ...l, plannedQty: e.target.value } : l)))
                    }
                  />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-5 text-muted-foreground"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                >
                  {t('common.remove')}
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                setLines((prev) => [...prev, { skuCode: ownerSkus[0]?.code ?? '', plannedQty: '1' }])
              }
            >
              <Plus data-icon="inline-start" />
              {t('outbound.addLine')}
            </Button>
          </div>
          <FormField label={t('inbound.arrivalMethod')}>
            <OptionSelect
              value={arrivalMethod}
              onValueChange={(v) => setArrivalMethod(v as InboundArrivalMethod)}
              options={INBOUND_ARRIVAL_METHODS.map((m) => ({ value: m, label: t(`enum.arrivalMethod.${m}`) }))}
            />
          </FormField>
          <FormField label={t('inbound.containerNo')}>
            <Input
              value={containerNo}
              placeholder={t('inbound.filters.containerNoPlaceholder')}
              onChange={(e) => setContainerNo(e.target.value)}
            />
          </FormField>
          <FormField label={t('inbound.trackingNos')}>
            <Input
              value={trackingNos}
              placeholder={t('inbound.filters.trackingNoPlaceholder')}
              onChange={(e) => setTrackingNos(e.target.value)}
            />
          </FormField>
          <FormField label={t('inbound.etaAt')}>
            <Input type="datetime-local" value={etaAt} onChange={(e) => setEtaAt(e.target.value)} />
          </FormField>
        </FormGrid>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            onClick={() =>
              onSubmit({
                customerId,
                warehouseCode,
                bizType,
                upstreamNo,
                items: lines.map((line) => ({ skuCode: line.skuCode, plannedQty: Number(line.plannedQty) })),
                arrivalMethod,
                containerNo: containerNo || undefined,
                trackingNos: trackingNos || undefined,
                etaAt: etaAt ? new Date(etaAt).toISOString() : undefined,
              })
            }
          >
            {t('inbound.mockPushSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
