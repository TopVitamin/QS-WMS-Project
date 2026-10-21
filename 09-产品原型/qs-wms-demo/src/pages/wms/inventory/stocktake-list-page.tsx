import { Download, Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { DateTime, DocNo, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { stocktakeSourceMeta, stocktakeStatusMeta } from '@/config/status'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { stocktakeSummary } from '@/lib/inventory-derive'
import { emptyStocktakeFilters, matchStocktake } from '@/lib/inventory-list-match'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { InventoryCount, StocktakeSource, StocktakeStatus } from '@/types/inventory'
import { StocktakeCreateDialog } from './stocktake-create-dialog'

const STATUSES: StocktakeStatus[] = ['COUNTING', 'COMPLETED', 'CANCELLED']
const SOURCES: StocktakeSource[] = ['PLAN', 'DISCREPANCY']

type Row = InventoryCount & ReturnType<typeof stocktakeSummary>

/** 盘点单列表（盘点单前端Demo版PRD 第二节）：状态页签、5 项筛选、创建计划盘点 */
export function StocktakeListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const counts = useDb((s) => s.inventoryCounts)
  const { sku } = useLookups()
  const list = useUrlListState(emptyStocktakeFilters, STATUSES)
  const { draft, setDraft, filters, listSearch } = list
  const [creating, setCreating] = useState(false)
  const skuName = useCallback((code: string) => sku(code)?.name, [sku])

  const inWarehouse = useMemo(() => counts.filter((c) => c.warehouseCode === warehouseCode), [counts, warehouseCode])
  const filtered = useMemo<Row[]>(
    () =>
      inWarehouse
        .filter((c) => matchStocktake(c, filters, skuName))
        .map((c) => ({ ...c, ...stocktakeSummary(c) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.no.localeCompare(a.no)),
    [filters, inWarehouse, skuName],
  )
  const rows = useMemo(
    () => (list.tab === 'ALL' ? filtered : filtered.filter((c) => c.status === list.tab)),
    [filtered, list.tab],
  )
  const initiators = useMemo(() => [...new Set(inWarehouse.map((c) => c.createdBy))].sort(), [inWarehouse])
  const tabItems = (['ALL', ...STATUSES] as const).map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(stocktakeStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((c) => c.status === s).length,
  }))

  const columns = useMemo(() => {
    const col = createDataColumns<Row>()
    const count = (id: 'skuCount' | 'lineCount' | 'diffCount', header: string) =>
      col.accessor(id, {
        header,
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('no', {
        header: t('inventory.stocktake.no'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/inventory/counts/${getValue()}`, { state: { listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={stocktakeStatusMeta[getValue()]} />,
      }),
      col.accessor('source', {
        header: t('inventory.stocktake.source'),
        cell: ({ getValue }) => <TagLabel meta={stocktakeSourceMeta[getValue()]} />,
      }),
      count('skuCount', t('inventory.stocktake.skuCount')),
      count('lineCount', t('inventory.stocktake.lineCount')),
      count('diffCount', t('inventory.stocktake.diffCount')),
      col.accessor('createdBy', { header: t('inventory.stocktake.createdBy') }),
      col.accessor('createdAt', {
        header: t('inventory.stocktake.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('confirmedAt', {
        header: t('inventory.stocktake.confirmedShort'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [listSearch, navigate, t])

  return (
    <PageContainer
      fill
      title={t('menu.counts')}
      actions={
        <>
          <Button onClick={() => setCreating(true)}>
            <Plus data-icon="inline-start" />
            {t('inventory.stocktake.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6} onSearch={list.search} onReset={list.reset}>
          <FilterItem label={t('inventory.stocktake.no')}>
            <Input
              value={draft.no}
              placeholder={t('inventory.stocktake.noPlaceholder')}
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
          <FilterItem label={t('inventory.stocktake.source')}>
            <OptionSelect
              allOption
              value={draft.source}
              onValueChange={(v) => setDraft({ ...draft, source: v })}
              options={SOURCES.map((v) => ({ value: v, label: t(stocktakeSourceMeta[v].labelKey) }))}
            />
          </FilterItem>
          <FilterItem label={t('inventory.stocktake.createdBy')}>
            <OptionSelect
              allOption
              value={draft.createdBy}
              onValueChange={(v) => setDraft({ ...draft, createdBy: v })}
              options={initiators.map((v) => ({ value: v, label: v }))}
            />
          </FilterItem>
          <FilterItem label={t('inventory.stocktake.createdAt')}>
            <DateRangePickerField
              value={{ from: draft.createdFrom, to: draft.createdTo }}
              placeholder={t('inventory.stocktake.createdRangePlaceholder')}
              onChange={(range) => setDraft({ ...draft, createdFrom: range.from, createdTo: range.to })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StatusTabs items={tabItems} value={list.tab} onChange={list.setTab} />
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(c) => c.no}
          emptyText={t('inventory.stocktake.empty')}
        />
      </Panel>
      {creating && (
        <StocktakeCreateDialog
          onClose={() => setCreating(false)}
          onCreated={(no) => navigate(`/wms/inventory/counts/${no}`, { state: { listSearch } })}
        />
      )}
    </PageContainer>
  )
}
