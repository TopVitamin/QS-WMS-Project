import { createDataColumns } from '@/components/biz/data-table'
import { DateTime, Empty } from '@/components/biz/display'
import type { AuditLog } from '@/types/wms'

type Translate = (k: string, opts?: Record<string, unknown>) => string

/**
 * 详情页「操作日志」页签的列：时间、操作、操作人、说明（库里新记录在前，不再排序）。
 * 入库单详情会混入其上架单的记录，传 withPutawayNo 时在说明前带上架单号以便区分。
 */
export function auditLogColumns(t: Translate, { withPutawayNo = false }: { withPutawayNo?: boolean } = {}) {
  const col = createDataColumns<AuditLog>()
  return col.columns([
    col.accessor('createdAt', {
      header: t('inbound.tabs.logTime'),
      cell: ({ getValue }) => <DateTime value={getValue()} />,
    }),
    col.accessor('action', { header: t('inbound.tabs.logAction'), cell: ({ getValue }) => t(`audit.action.${getValue()}`) }),
    col.accessor('operator', { header: t('common.operator') }),
    col.accessor('detail', {
      header: t('inbound.tabs.logDetail'),
      cell: ({ row }) => {
        const { refType, refNo, detail } = row.original
        if (!withPutawayNo || refType !== 'PUTAWAY') return detail ?? <Empty />
        return detail ? `${refNo} · ${detail}` : refNo
      },
    }),
  ])
}
