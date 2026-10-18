import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, DateTime, Empty, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { TagLabel } from '@/components/biz/status-badge'
import { useDb, useLookups } from '@/mock/db'
import type { OutboundVerification, VerifyLine } from '@/types/outbound'

/** 复核记录 Sheet（出库单前端Demo版PRD·详情页 §5）：只读，不放业务按钮 */
export function VerificationSheet({ record, onClose }: { record?: OutboundVerification; onClose: () => void }) {
  const { t } = useTranslation()
  const { sku } = useLookups()
  const tasks = useDb((s) => s.outboundPickTasks)
  const batchOf = useMemo(() => {
    const map = new Map<string, string | undefined>()
    tasks.forEach((task) =>
      task.assignments.forEach((a) => map.set(a.id, task.lines.find((l) => l.id === a.lineId)?.batchNo)),
    )
    return (assignmentId: string) => map.get(assignmentId)
  }, [tasks])

  const columns = useMemo(() => {
    const col = createDataColumns<VerifyLine>()
    return col.columns([
      col.accessor('itemNo', { header: t('outbound.ui.orderLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} />,
      }),
      col.accessor((l) => batchOf(l.assignmentId) ?? '', {
        id: 'batch',
        header: t('outbound.ui.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((l) => l.serialNos.join(t('common.listSeparator')), {
        id: 'serial',
        header: t('outbound.ui.serial'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('qty', {
        header: t('outbound.ui.verifyQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('effectiveQty', {
        header: t('outbound.ui.activeQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t, sku, batchOf])

  return (
    <DetailSheet
      open={!!record}
      onClose={onClose}
      title={
        record ? (
          <span className="flex items-center gap-2">
            {t('outbound.ui.verifyNo')} · <BizCode className="text-base">{record.no}</BizCode>
            {record.deleted && <TagLabel>{t('outbound.ui.deleted')}</TagLabel>}
          </span>
        ) : null
      }
    >
      {record && (
        <>
          <Descriptions columns={4}>
            <DescriptionItem label={t('outbound.ui.method')}>{t(`outbound.verifyMethods.${record.method}`)}</DescriptionItem>
            <DescriptionItem label={t('outbound.ui.containerType')}>
              {t(`outbound.containers.${record.containerType}`)}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.containerNo')}>
              {record.containerNo ? <BizCode>{record.containerNo}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.tracking')}>
              {record.trackingNo ? <BizCode>{record.trackingNo}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.weight')}>
              {record.weightKg ? record.weightKg : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.verifier')}>{record.operator}</DescriptionItem>
            <DescriptionItem label={t('outbound.ui.verifiedAt')}>
              <DateTime value={record.at} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.verifyRemark')} multiline>
              {record.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
          <DataTable
            data={record.lines}
            columns={columns}
            getRowId={(l) => `${l.assignmentId}-${l.itemNo}`}
            selectable={false}
            showColumnSettings={false}
            paginate={false}
          />
        </>
      )}
    </DetailSheet>
  )
}
