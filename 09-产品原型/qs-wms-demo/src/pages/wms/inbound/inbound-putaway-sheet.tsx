import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/biz/data-table'
import { BizCode, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import { planQty, submittedQty } from '@/lib/putaway'
import type { PutawayOrder } from '@/types/inbound'
import { usePutawayActualColumns, usePutawayPlanColumns } from './putaway-line-columns'

/** 入库单详情里的上架单快览：列与上架单详情页共用，序列号只显示条数（不再叠抽屉） */
export function InboundPutawaySheet({ order, onClose }: { order?: PutawayOrder; onClose: () => void }) {
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
      {order && <PutawaySheetBody order={order} />}
    </DetailSheet>
  )
}

function PutawaySheetBody({ order }: { order: PutawayOrder }) {
  const { t } = useTranslation()
  const planColumns = usePutawayPlanColumns()
  const actualColumns = usePutawayActualColumns(order)

  return (
    <>
      <Descriptions columns={4}>
        <DescriptionItem label={t('inbound.workContainerNo')}>
          {order.containerNo ? <BizCode>{order.containerNo}</BizCode> : t('inbound.bulkPiece')}
        </DescriptionItem>
        <DescriptionItem label={t('putaway.receiptNo')}>
          <BizCode>{order.receiptNo}</BizCode>
        </DescriptionItem>
        <DescriptionItem label={t('putaway.planQty')}>
          <Num value={planQty(order)} />
        </DescriptionItem>
        <DescriptionItem label={t('putaway.putawayQty')}>
          <Num value={submittedQty(order)} />
        </DescriptionItem>
      </Descriptions>
      <DetailTabs
        items={[
          {
            value: 'plan',
            label: t('inbound.putawayPlanTab'),
            count: order.planLines.length,
            content: (
              <DataTable
                data={order.planLines}
                columns={planColumns}
                getRowId={(line) => String(line.lineNo)}
                selectable={false}
                showColumnSettings={false}
                paginate={false}
              />
            ),
          },
          {
            value: 'actual',
            label: t('inbound.putawayActualTab'),
            count: order.actualLines.length,
            content: (
              <DataTable
                data={order.actualLines}
                columns={actualColumns}
                getRowId={(line) => String(line.lineNo)}
                selectable={false}
                showColumnSettings={false}
                paginate={false}
                emptyText={t('putaway.noActualLines')}
              />
            ),
          },
        ]}
      />
    </>
  )
}
