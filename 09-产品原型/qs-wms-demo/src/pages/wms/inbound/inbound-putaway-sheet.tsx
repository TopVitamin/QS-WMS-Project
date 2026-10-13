import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import type { PutawayOrder } from '@/types/inbound'

export function InboundPutawaySheet({
  order,
  onClose,
}: {
  order?: PutawayOrder
  onClose: () => void
}) {
  const { t } = useTranslation()

  const planColumns = useMemo(() => {
    const col = createDataColumns<PutawayOrder['planLines'][number]>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('planQty', {
        header: t('inbound.planPutawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])

  const actualColumns = useMemo(() => {
    const col = createDataColumns<PutawayOrder['actualLines'][number]>()
    return col.columns([
      col.accessor('locationCode', {
        header: t('inbound.targetLocation'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('qty', {
        header: t('inbound.putawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])

  return (
    <DetailSheet
      open={!!order}
      onClose={onClose}
      title={
        order ? (
          <>
            <BizCode className="text-base">{order.putawayNo}</BizCode>
            <StatusBadge meta={putawayOrderStatusMeta[order.status]} />
            <TagLabel meta={qualityMeta[order.qualityType]} />
          </>
        ) : null
      }
    >
      {order && (
        <>
          <Descriptions columns={4}>
            <DescriptionItem label={t('inbound.workContainerNo')}>
              {order.containerNo ? <BizCode>{order.containerNo}</BizCode> : t('inbound.bulkPiece')}
            </DescriptionItem>
          </Descriptions>
          <Tabs defaultValue="plan" className="gap-3">
            <TabsList>
              <TabsTrigger value="plan">{t('inbound.putawayPlanTab')}</TabsTrigger>
              <TabsTrigger value="actual">{t('inbound.putawayActualTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="plan">
              <DataTable
                data={order.planLines}
                columns={planColumns}
                getRowId={(line) => String(line.lineNo)}
                selectable={false}
                showColumnSettings={false}
                paginate={false}
              />
            </TabsContent>
            <TabsContent value="actual">
              <DataTable
                data={order.actualLines}
                columns={actualColumns}
                getRowId={(line) => `${line.locationCode}-${line.skuCode}-${line.qty}`}
                selectable={false}
                showColumnSettings={false}
                paginate={false}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </DetailSheet>
  )
}
