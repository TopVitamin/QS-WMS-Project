import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inbound.mockPush')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('common.customer')}</span>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('common.warehouse')}</span>
            <Input value={warehouseCode} readOnly />
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('inbound.bizType')}</span>
            <Select value={bizType} onValueChange={(v) => setBizType(v as InboundBizType)}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {BIZ_TYPES.map((b) => (
                  <SelectItem key={b} value={b}>{t(`enum.inboundBizType.${b}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('inbound.upstreamNo')}</span>
            <Input
              value={upstreamNo}
              placeholder={t('inbound.filters.upstreamNoPlaceholder')}
              onChange={(e) => setUpstreamNo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('common.sku')}</span>
            <Select value={skuCode} onValueChange={setSkuCode}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {ownerSkus.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.code} · {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t('inbound.plannedQty')}</span>
            <Input
              type="number"
              min={1}
              value={plannedQty}
              onChange={(e) => setPlannedQty(e.target.value)}
            />
          </div>
        </div>
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
