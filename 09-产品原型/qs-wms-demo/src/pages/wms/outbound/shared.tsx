import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, Empty, Num } from '@/components/biz/display'
/** PDA 作业页的就近错误提示（PDA 设计规范的反馈分级）；管理端改用 toast */
export function ActionError({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {error}
    </div>
  ) : null
}

export type GridRow = { id: string; [key: string]: ReactNode }
/**
 * 通用行表格：库存盘点、库存与日志页仍在用（出库页面已改为 createDataColumns 强类型列）。
 * 字符串列按 `outbound.<key>` 取表头；`type: 'num' | 'time'` 要求行里存原始值。
 */
export type GridCol =
  | string
  | {
      key: string
      labelKey?: string
      type?: 'num' | 'time'
      align?: 'left' | 'right'
      sortable?: boolean
      pin?: 'left' | 'right'
    }
export function OutboundGrid({
  rows,
  columns,
  selectable,
  onSelect,
  toolbar,
}: {
  rows: GridRow[]
  columns: GridCol[]
  selectable?: boolean
  onSelect?: (rows: GridRow[]) => void
  toolbar?: ReactNode
}) {
  const { t } = useTranslation()
  const cols = useMemo(() => {
    const col = createDataColumns<GridRow>()
    return columns.map((spec, i) => {
      const c = typeof spec === 'string' ? { key: spec } : spec
      return col.accessor(c.key, {
        header: t(c.labelKey ?? `outbound.${c.key}`),
        enableSorting: c.sortable ?? false,
        meta: {
          align: c.align ?? (c.type === 'num' ? 'right' : undefined),
          pin: c.pin ?? (i === 0 ? 'left' : c.key === 'action' ? 'right' : undefined),
          label: t(c.labelKey ?? `outbound.${c.key}`),
        },
        cell: (info) => {
          const v = info.getValue() as unknown
          if (c.type === 'num') return typeof v === 'number' ? <Num value={v} /> : (v as ReactNode)
          if (c.type === 'time') return v ? <DateTime value={v as string} /> : <Empty />
          return v as ReactNode
        },
      })
    })
  }, [columns, t])
  return (
    <DataTable
      data={rows}
      getRowId={(r) => r.id}
      selectable={selectable}
      onSelectionChange={onSelect}
      columns={cols}
      toolbar={toolbar}
    />
  )
}

/** 出库四个详情共用的找不到空态：单号不存在或不属当前仓 */
export function OutboundNotFound({ title, backTo }: { title: string; backTo: string }) {
  const { t } = useTranslation()
  return (
    <PageContainer title={title}>
      <Panel className="flex flex-col items-center gap-4 p-10 text-sm text-muted-foreground">
        {title}
        <Button variant="outline" asChild>
          <Link to={backTo}>{t('outbound.ui.backToList')}</Link>
        </Button>
      </Panel>
    </PageContainer>
  )
}

/** 详情「返回列表」：带回列表页进入时的筛选 */
export function useBackTo(listPath: string) {
  const location = useLocation()
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  return listSearch ? `${listPath}?${listSearch}` : listPath
}
