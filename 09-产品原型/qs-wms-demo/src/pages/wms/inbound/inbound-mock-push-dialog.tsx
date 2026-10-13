import { useEffect, useState } from 'react'
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
import { codeNameText } from '@/lib/typography'
import { useSettings } from '@/stores/settings'
import { useDb } from '@/mock/db'
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
    skuCode: string
    plannedQty: number
  }) => void
}) {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const customers = useDb((s) => s.customers)
  const skuMasters = useDb((s) => s.skuMasters)
  const [customerId, setCustomerId] = useState('')
  const [bizType, setBizType] = useState<InboundBizType>('NORMAL')
  const [upstreamNo, setUpstreamNo] = useState('OMS-IN-DEMO-001')
  const [skuCode, setSkuCode] = useState('CABLE-01')
  const [plannedQty, setPlannedQty] = useState('500')

  useEffect(() => {
    if (!open) return
    const ankr = customers.find((c) => c.code === 'ANKR')
    if (ankr) setCustomerId(ankr.id)
  }, [open, customers])

  const ownerSkus = skuMasters.filter((m) => m.customerId === customerId && m.status === 'ENABLED')

  // 演示商品以商品资料（skuMasters）为准；选中货主后保证当前 SKU 在可选列表里
  useEffect(() => {
    if (!open) return
    setSkuCode((prev) => (ownerSkus.some((m) => m.code === prev) ? prev : (ownerSkus[0]?.code ?? '')))
  }, [open, ownerSkus])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
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
          <FormField label={t('common.sku')} required>
            <OptionSelect
              value={skuCode}
              onValueChange={setSkuCode}
              options={ownerSkus.map((m) => ({ value: m.code, label: codeNameText(m.code, m.name) }))}
            />
          </FormField>
          <FormField label={t('inbound.plannedQty')} required>
            <Input type="number" min={1} value={plannedQty} onChange={(e) => setPlannedQty(e.target.value)} />
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
                skuCode,
                plannedQty: Number(plannedQty),
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
