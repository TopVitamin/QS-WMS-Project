import {
  columnVisibilityFeature,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataColumnMeta {
  align?: 'left' | 'right' | 'center'
  /** 固定列：left 只支持第一个数据列；right 一般用于操作列 */
  pin?: 'left' | 'right'
  /** 列设置里显示的名称；header 是函数时必须提供 */
  label?: string
}

export const dataTableFeatures = tableFeatures({
  rowSelectionFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  columnMeta: {} as DataColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

/** 页面里定义列：const col = createDataColumns<InboundOrder>() */
export const createDataColumns = <TData extends RowData>() => createColumnHelper<DataTableFeatures, TData>()

const SELECT_WIDTH = 40

interface DataTableProps<TData extends RowData> {
  data: TData[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<DataTableFeatures, TData, any>[]
  getRowId: (row: TData) => string
  selectable?: boolean
  onSelectionChange?: (rows: TData[]) => void
  /** 表格上方工具栏左侧（批量操作按钮等） */
  toolbar?: React.ReactNode
  pageSize?: number
  className?: string
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  selectable,
  onSelectionChange,
  toolbar,
  pageSize = 20,
  className,
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const allColumns = useMemo(() => {
    if (!selectable) return columns
    const helper = createDataColumns<TData>()
    const selectColumn = helper.display({
      id: '__select',
      enableHiding: false,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label="select all"
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox aria-label="select row" checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
      ),
    })
    return [selectColumn, ...columns]
  }, [columns, selectable])

  const table = useTable({
    features: dataTableFeatures,
    columns: allColumns,
    data,
    getRowId,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageIndex: 0, pageSize } },
    autoResetPageIndex: true,
  })

  // 数据源变化（筛选、切换仓库）时清掉已失效的勾选
  const [prevData, setPrevData] = useState(data)
  if (prevData !== data) {
    setPrevData(data)
    setRowSelection({})
  }

  const callbacks = useRef({ getRowId, onSelectionChange })
  useEffect(() => {
    callbacks.current = { getRowId, onSelectionChange }
  })
  useEffect(() => {
    const { getRowId: idOf, onSelectionChange: notify } = callbacks.current
    if (!notify) return
    const ids = new Set(Object.keys(rowSelection).filter((k) => rowSelection[k]))
    notify(data.filter((d) => ids.has(idOf(d))))
  }, [rowSelection, data])

  const { pageIndex, pageSize: currentSize } = table.state.pagination
  const pageCount = Math.max(1, table.getPageCount())
  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const rows = table.getRowModel().rows

  const pinClass = (meta: DataColumnMeta | undefined, isHeader: boolean) => {
    if (meta?.pin === 'right')
      return cn('sticky right-0 z-[1] shadow-[-6px_0_8px_-6px_rgb(0_0_0/0.12)]', isHeader ? 'z-20 bg-muted' : 'bg-card group-hover:bg-muted')
    if (meta?.pin === 'left')
      return cn('sticky z-[1] shadow-[6px_0_8px_-6px_rgb(0_0_0/0.12)]', isHeader ? 'z-20 bg-muted' : 'bg-card group-hover:bg-muted')
    return ''
  }
  const pinStyle = (meta: DataColumnMeta | undefined) =>
    meta?.pin === 'left' ? { left: selectable ? SELECT_WIDTH : 0 } : undefined

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          {toolbar}
          {selectable && selectedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('common.selected', { count: selectedCount })}
              <button type="button" className="ml-2 text-primary hover:underline" onClick={() => setRowSelection({})}>
                {t('common.clearSelection')}
              </button>
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('common.columns')}>
              <Settings2 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('common.columns')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  onCheckedChange={(v) => c.toggleVisibility(!!v)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {c.columnDef.meta?.label ?? (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-y">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="[&_tr]:border-b-0">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.column.id === '__select' ? SELECT_WIDTH : undefined, ...pinStyle(meta) }}
                      className={cn(
                        'sticky top-0 z-10',
                        header.column.id === '__select' && 'left-0 z-20',
                        meta?.align === 'right' && 'text-right',
                        meta?.align === 'center' && 'text-center',
                        pinClass(meta, true),
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={cn('inline-flex items-center gap-1 hover:text-foreground', meta?.align === 'right' && 'flex-row-reverse')}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined} className="group">
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta
                  return (
                    <TableCell
                      key={cell.id}
                      style={pinStyle(meta)}
                      className={cn(
                        cell.column.id === '__select' && 'sticky left-0 z-[1] bg-card group-hover:bg-muted',
                        meta?.align === 'right' && 'text-right',
                        meta?.align === 'center' && 'text-center',
                        pinClass(meta, false),
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </table>
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Inbox className="size-8 opacity-40" />
            {t('common.noData')}
          </div>
        )}
      </div>

      <div className="flex h-12 shrink-0 items-center justify-end gap-3 px-4 text-xs text-muted-foreground">
        <span>{t('common.total', { count: data.length })}</span>
        <Select value={String(currentSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((s) => (
              <SelectItem key={s} value={String(s)}>
                {t('common.pageSize', { size: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">{t('common.pageOf', { page: pageIndex + 1, total: pageCount })}</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('common.prevPage')}
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('common.nextPage')}
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
