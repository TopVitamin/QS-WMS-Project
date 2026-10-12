import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { receiptContainers } from '@/lib/inbound-receipt-container'
import { useLookups } from '@/mock/db'
import type { ReceiptRecord } from '@/types/inbound'

export function InboundReceiptSheet({
  record,
  onClose,
}: {
  record?: ReceiptRecord
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { sku } = useLookups()

  /** 一次提交可含多个容器（主 PRD R16）：单头列出全部容器，明细按容器分组排列 */
  const containerList = (r: ReceiptRecord) => {
    const { containers, hasBulk } = receiptContainers(r)
    return [...containers, ...(hasBulk ? [t('inbound.bulkPiece')] : [])].join(t('common.listSeparator'))
  }
  const sortByContainer = (r: ReceiptRecord) => {
    const order = receiptContainers(r).containers
    const rank = (c?: string) => (c ? order.indexOf(c.trim()) : order.length)
    return [...r.lines].sort((a, b) => rank(a.containerNo) - rank(b.containerNo))
  }

  const columns = useMemo(() => {
    const col = createDataColumns<ReceiptRecord['lines'][number]>()
    return col.columns([
      col.accessor('skuCode', { header: t('common.sku'), enableSorting: false }),
      col.accessor('skuCode', {
        id: 'name',
        header: t('masterSku.name'),
        cell: ({ getValue }) => sku(getValue())?.name ?? getValue(),
      }),
      col.accessor('containerNo', {
        header: t('inbound.workContainerNo'),
        cell: ({ getValue }) => getValue() ?? t('inbound.bulkPiece'),
      }),
      col.accessor('receivedQty', {
        header: t('inbound.receivedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('rejectedQty', {
        header: t('inbound.rejectedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('rejectReason', {
        header: t('inbound.receive.rejectReasonLabel'),
        cell: ({ getValue }) =>
          getValue() ? t(`inbound.receive.rejectReason.${getValue()}`) : '—',
      }),
      col.accessor('goodQty', {
        header: t('inbound.goodQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('defectQty', {
        header: t('inbound.defectQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('batchNo', {
        header: t('inbound.batchNo'),
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      col.accessor('productionDate', {
        header: t('inbound.productionDate'),
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      col.accessor('expiryDate', {
        header: t('inbound.expiryDate'),
        cell: ({ getValue }) => getValue() ?? '—',
      }),
    ])
  }, [t, sku])

  return (
    <Sheet open={!!record} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:w-[880px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[92vw]">
        {record && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle>{record.receiptNo}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <Descriptions columns={4}>
                <DescriptionItem label={t('inbound.receiptTime')}>
                  <DateTime value={record.receivedAt} />
                </DescriptionItem>
                <DescriptionItem label={t('inbound.receiptOperator')}>{record.operator}</DescriptionItem>
                <DescriptionItem label={t('inbound.stagingLocation')}>{record.stagingLocationCode}</DescriptionItem>
                <DescriptionItem label={t('inbound.workContainerNo')}>{containerList(record)}</DescriptionItem>
              </Descriptions>
              <DataTable
                data={sortByContainer(record)}
                columns={columns}
                getRowId={(line) =>
                  [line.skuCode, line.containerNo ?? '', line.batchNo ?? '', line.receivedQty].join('|')
                }
                selectable={false}
                showColumnSettings={false}
                paginate={false}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
