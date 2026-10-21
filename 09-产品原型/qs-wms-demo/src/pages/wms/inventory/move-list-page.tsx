import { Download } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, CodeName, DateTime, DocNo, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { moveSummary } from '@/lib/inventory-derive'
import { emptyMoveFilters, matchMove } from '@/lib/inventory-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { StockMove } from '@/types/inventory'

const NO_STATUS: readonly never[] = []

/** 源、目标库位摘要：单一库位显示编码，多个显示「首个库位等 n 个」，悬停列全 */
export function LocationSummary({ codes }: { codes: string[] }) {
  const { t } = useTranslation()
  if (codes.length <= 1) return <BizCode>{codes[0]}</BizCode>
  return (
    <span title={codes.join(t('common.listSeparator'))} aria-label={codes.join(t('common.listSeparator'))}>
      {t('inventory.move.summaryMore', { first: codes[0], count: codes.length, rest: codes.length - 1 })}
    </span>
  )
}

/** 移库作业列表（移库作业前端Demo版PRD 第二节）：只查询 PDA 已提交的记录，不新建、不撤销 */
export function MoveListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const moves = useDb((s) => s.stockMoves)
  const customers = useDb((s) => s.customers)
  const { sku, customerCode, customerName } = useLookups()
  const list = useUrlListState(emptyMoveFilters, NO_STATUS)
  const { draft, setDraft, filters, listSearch } = list
  const skuName = useCallback((code: string) => sku(code)?.name, [sku])

  const inWarehouse = useMemo(() => moves.filter((m) => m.warehouseCode === warehouseCode), [moves, warehouseCode])
  const rows = useMemo(
    () =>
      inWarehouse
        .filter((m) => matchMove(m, filters, skuName))
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.no.localeCompare(a.no)),
    [filters, inWarehouse, skuName],
  )
  const operators = useMemo(() => [...new Set(inWarehouse.map((m) => m.operator))].sort(), [inWarehouse])

  const columns = useMemo(() => {
    const col = createDataColumns<StockMove>()
    return col.columns([
      col.accessor('no', {
        header: t('inventory.move.moveNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/inventory/moves/${getValue()}`, { state: { listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('customerId', {
        header: t('inventory.owner'),
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-48" />
        ),
      }),
      col.accessor((m) => m.lines.length, {
        id: 'lineCount',
        header: t('inventory.move.lineCount'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((m) => moveSummary(m).totalQty, {
        id: 'totalQty',
        header: t('inventory.move.totalQty'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((m) => moveSummary(m).sources.join(','), {
        id: 'sources',
        header: t('inventory.move.sourceSummary'),
        cell: ({ row }) => <LocationSummary codes={moveSummary(row.original).sources} />,
      }),
      col.accessor((m) => moveSummary(m).targets.join(','), {
        id: 'targets',
        header: t('inventory.move.targetSummary'),
        cell: ({ row }) => <LocationSummary codes={moveSummary(row.original).targets} />,
      }),
      col.accessor('operator', { header: t('inventory.operator') }),
      col.accessor('submittedAt', {
        header: t('inventory.move.submittedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [customerCode, customerName, listSearch, navigate, t])

  return (
    <PageContainer
      fill
      title={t('menu.moves')}
      description={t('inventory.move.readOnlyHint')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar
          columns={6}
          onSearch={list.search}
          onReset={list.reset}
          advanced={
            <>
              <FilterItem label={t('inventory.move.submittedAt')}>
                <DateRangePickerField
                  value={{ from: draft.submittedFrom, to: draft.submittedTo }}
                  placeholder={t('inventory.move.submittedRangePlaceholder')}
                  onChange={(range) => setDraft({ ...draft, submittedFrom: range.from, submittedTo: range.to })}
                />
              </FilterItem>
              <FilterItem label={t('inventory.operator')}>
                <OptionSelect
                  allOption
                  value={draft.operator}
                  onValueChange={(v) => setDraft({ ...draft, operator: v })}
                  options={operators.map((o) => ({ value: o, label: o }))}
                />
              </FilterItem>
            </>
          }
        >
          <FilterItem label={t('inventory.move.moveNo')}>
            <Input
              value={draft.no}
              placeholder={t('inventory.move.moveNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, no: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inventory.skuKeyword')}>
            <Input
              value={draft.sku}
              placeholder={t('inventory.stock.skuKeywordPlaceholder')}
              onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inventory.owner')}>
            <OptionSelect
              allOption
              value={draft.customerId}
              onValueChange={(v) => setDraft({ ...draft, customerId: v })}
              options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
            />
          </FilterItem>
          <FilterItem label={t('inventory.move.sourceLocation')}>
            <Input
              value={draft.source}
              placeholder={t('inventory.stock.locationPlaceholder')}
              onChange={(e) => setDraft({ ...draft, source: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inventory.move.targetLocation')}>
            <Input
              value={draft.target}
              placeholder={t('inventory.stock.locationPlaceholder')}
              onChange={(e) => setDraft({ ...draft, target: e.target.value })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(m) => m.no}
          emptyText={t('inventory.move.empty')}
        />
      </Panel>
    </PageContainer>
  )
}
