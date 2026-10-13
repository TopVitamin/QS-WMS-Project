import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, Num } from '@/components/biz/display'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { canConfirmReceiptClose, lineUnreceivedQty } from '@/lib/inbound-derive'
import type { InboundOrder } from '@/types/wms'
import { useLookups } from '@/mock/db'

export function ReceiptCloseDialog({
  order,
  onClose,
  onConfirm,
}: {
  order?: InboundOrder
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const { sku } = useLookups()

  const lines = useMemo(
    () => (order ? order.items.filter((line) => lineUnreceivedQty(line) > 0) : []),
    [order],
  )
  const totalUnreceived = lines.reduce((s, line) => s + lineUnreceivedQty(line), 0)

  const columns = useMemo(() => {
    const col = createDataColumns<(typeof lines)[number]>()
    return col.columns([
      col.accessor('skuCode', {
        header: t('common.sku'),
        enableSorting: false,
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('skuCode', {
        id: 'skuName',
        header: t('masterSku.name'),
        enableSorting: false,
        cell: ({ getValue }) => sku(getValue())?.name ?? getValue(),
      }),
      col.accessor((line) => lineUnreceivedQty(line), {
        id: 'unreceived',
        header: t('inbound.unreceivedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t, sku])

  const open = !!order && canConfirmReceiptClose(order)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inbound.receiptCloseTitle')}</DialogTitle>
          <DialogDescription>{t('inbound.receiptCloseDesc')}</DialogDescription>
        </DialogHeader>
        {order && (
          <DataTable
            data={lines}
            columns={columns}
            getRowId={(line) => String(line.lineNo)}
            selectable={false}
            showColumnSettings={false}
            paginate={false}
          />
        )}
        <p className="text-sm text-muted-foreground">
          {t('inbound.receiptCloseTotal', { count: totalUnreceived })}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={onConfirm}>{t('inbound.receiptClose')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
