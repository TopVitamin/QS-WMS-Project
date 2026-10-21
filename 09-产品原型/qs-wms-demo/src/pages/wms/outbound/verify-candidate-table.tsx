import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { CodeName, DocNoTail, Num } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { outboundTypeMeta } from '@/config/status'
import { sum } from '@/lib/outbound-derive'
import { toVerifyQty } from '@/lib/outbound-verify'
import { useLookups } from '@/mock/db'
import type { OutboundOrder } from '@/types/outbound'

/** 复核工作台未开单时的候选出库单列表；行点击直接打开该单 */
export function VerifyCandidateTable({ orders, onOpen }: { orders: OutboundOrder[]; onOpen: (no: string) => void }) {
  const { t } = useTranslation()
  const { customerCode, customerName } = useLookups()

  const columns = useMemo(() => {
    const col = createDataColumns<OutboundOrder>()
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.no'),
        meta: { pin: 'left' },
        cell: ({ getValue }) => <DocNoTail value={getValue()} tail={4} className="text-base" />,
      }),
      col.accessor('type', {
        header: t('outbound.ui.type'),
        cell: ({ getValue }) => <TagLabel meta={outboundTypeMeta[getValue()]} />,
      }),
      col.accessor('customerId', {
        header: t('outbound.ui.owner'),
        cell: ({ getValue }) => <CodeName code={customerCode(getValue())} name={customerName(getValue())} />,
      }),
      col.accessor((o) => sum(o.items, (i) => i.pickedQty), {
        id: 'picked',
        header: t('outbound.ui.picked'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor(toVerifyQty, {
        id: 'toVerify',
        header: t('outbound.ui.stationToVerify'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className="text-lg font-semibold" />,
      }),
    ])
  }, [customerCode, customerName, t])

  return (
    <DataTable
      data={orders}
      columns={columns}
      getRowId={(o) => o.no}
      paginate={false}
      showColumnSettings={false}
      onRowClick={(o) => onOpen(o.no)}
      emptyText={t('outbound.ui.stationNoCandidates')}
    />
  )
}
