import { createDataColumns } from '@/components/biz/data-table'
import { DateTime, Empty } from '@/components/biz/display'
import type { AuditLog } from '@/types/wms'

type Translate = (k: string, opts?: Record<string, unknown>) => string

/**
 * 出库四个详情共用的「操作日志」列。出库单详情会混入其任务、返库单的记录，
 * 传 ownerNo 时，refNo 不是本单的记录在说明前带上对象单号。
 */
export function outboundLogColumns(t: Translate, ownerNo?: string) {
  const col = createDataColumns<AuditLog>()
  return col.columns([
    col.accessor('createdAt', {
      header: t('outbound.ui.logTime'),
      cell: ({ getValue }) => <DateTime value={getValue()} />,
    }),
    col.accessor((l) => l.command ?? l.detail ?? l.action, {
      id: 'action',
      header: t('outbound.ui.logAction'),
      cell: ({ row }) =>
        row.original.command
          ? t(`outbound.actions.${row.original.command}`)
          : t(`outbound.actions.${row.original.detail}`, { defaultValue: t(`audit.action.${row.original.action}`) }),
    }),
    col.accessor('operator', { header: t('outbound.ui.operator') }),
    col.accessor('detail', {
      header: t('outbound.ui.logDetail'),
      cell: ({ row }) => {
        const { refNo, detail, command } = row.original
        const text = command ? detail : undefined
        const prefix = ownerNo && refNo !== ownerNo ? refNo : undefined
        if (!prefix && !text) return <Empty />
        return [prefix, text].filter(Boolean).join(' · ')
      },
    }),
  ])
}

/** 按对象取日志：出库单另合并其任务与返库单的记录，时间倒序 */
export function outboundLogs(logs: AuditLog[], refNos: string[]) {
  const set = new Set(refNos)
  return logs.filter((l) => set.has(l.refNo)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
