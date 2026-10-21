import { Download } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { allocationStatusMeta, expiryLevelMeta, inventoryTagMeta, qualityMeta, serialStatusMeta } from '@/config/status'
import { useListState } from '@/hooks/use-list-state'
import { useNow } from '@/hooks/use-now'
import {
  deriveBalances,
  deriveSerials,
  deriveSkuStocks,
  type BalanceRow,
  type SerialRow,
  type SkuStockRow,
} from '@/lib/inventory-derive'
import {
  emptyStockFilters,
  keepOnViewSwitch,
  matchBalance,
  matchSerial,
  matchSkuStock,
  STOCK_VIEWS,
  type StockFilters,
  type StockView,
} from '@/lib/inventory-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import { AvailableQty, LocationCode } from './inventory-shared'
import { StockBalanceSheet } from './stock-balance-sheet'
import { StockSerialSheet } from './stock-serial-sheet'
import { StockSkuSheet } from './stock-sku-sheet'

const QUALITIES = ['GOOD', 'DEFECTIVE'] as const
const EXPIRY_OPTIONS = ['NORMAL', 'NEAR', 'EXPIRED', 'NONE'] as const
const SERIAL_STATUSES = ['IN_STOCK', 'SHIPPED', 'LOST'] as const
const QTY_CONDITIONS = ['HAS_ACTUAL', 'ZERO_ACTUAL', 'ZERO_AVAILABLE', 'NEGATIVE'] as const
const ALLOCATABLE_CONDITIONS = ['POSITIVE', 'ZERO'] as const
const KEEP_PARAMS = ['view'] as const
/** 详情抽屉的 URL 参数：可复制链接恢复 */
const SHEET_PARAMS = { sku: 'skuId', balance: 'inventoryId', serial: 'serialId' } as const

/** 库存数据都从同一份业务事实派生（库存查询前端Demo版PRD 第五节），页面不另存数字 */
function useStockData(warehouseCode: string) {
  const inventory = useDb((s) => s.inventory)
  const inventoryLogs = useDb((s) => s.inventoryLogs)
  const inventoryCounts = useDb((s) => s.inventoryCounts)
  const outboundOrders = useDb((s) => s.outboundOrders)
  const skuAllocationControls = useDb((s) => s.skuAllocationControls)
  const skuMasters = useDb((s) => s.skuMasters)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  const warehouses = useDb((s) => s.warehouses)
  const now = useNow(60_000)
  return useMemo(() => {
    const s = {
      inventory,
      inventoryLogs,
      inventoryCounts,
      outboundOrders,
      skuAllocationControls,
      skuMasters,
      locations,
      locationMasters,
      warehouses,
    }
    return {
      skus: deriveSkuStocks(s, warehouseCode),
      balances: deriveBalances(s, warehouseCode, now),
      serials: deriveSerials(s, warehouseCode),
    }
  }, [
    inventory,
    inventoryLogs,
    inventoryCounts,
    outboundOrders,
    skuAllocationControls,
    skuMasters,
    locations,
    locationMasters,
    warehouses,
    warehouseCode,
    now,
  ])
}

/** 货主：编码＋名称 */
function OwnerCell({ id }: { id: string }) {
  const { customerCode, customerName } = useLookups()
  return <CodeName code={customerCode(id)} name={customerName(id)} className="max-w-48" />
}

/** 库存查询（库存查询前端Demo版PRD）：SKU库存、库存明细、SN库存三个视角，只读查询与追溯 */
export function StockPage() {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const customers = useDb((s) => s.customers)
  const { sku } = useLookups()
  const [params, setParams] = useSearchParams()
  const rawView = params.get('view') as StockView | null
  const view: StockView = rawView && STOCK_VIEWS.includes(rawView) ? rawView : 'sku'
  const list = useListState<StockFilters, never>({ empty: emptyStockFilters, keepParams: KEEP_PARAMS })
  const { filters, draft, setDraft } = list
  const data = useStockData(warehouseCode)
  const skuName = useCallback((code: string, customerId?: string) => sku(code, customerId)?.name, [sku])

  const skuRows = useMemo(
    () =>
      data.skus
        .filter((r) => matchSkuStock(r, filters, skuName))
        .sort(
          (a, b) => (b.lastChangedAt ?? '').localeCompare(a.lastChangedAt ?? '') || a.skuCode.localeCompare(b.skuCode),
        ),
    [data.skus, filters, skuName],
  )
  const balanceRows = useMemo(
    () =>
      data.balances
        .filter((b) => matchBalance(b, filters, skuName))
        .sort(
          (a, b) =>
            a.record.skuCode.localeCompare(b.record.skuCode) ||
            a.record.locationCode.localeCompare(b.record.locationCode) ||
            (a.record.batchNo ?? '').localeCompare(b.record.batchNo ?? ''),
        ),
    [data.balances, filters, skuName],
  )
  const serialRows = useMemo(
    () =>
      data.serials
        .filter((r) => matchSerial(r, filters, skuName))
        .sort(
          (a, b) =>
            (b.lastChangedAt ?? '').localeCompare(a.lastChangedAt ?? '') || a.serialNo.localeCompare(b.serialNo),
        ),
    [data.serials, filters, skuName],
  )

  const sheetParam = SHEET_PARAMS[view]
  const sheetId = params.get(sheetParam)
  const openSheet = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set(sheetParam, id)
      setParams(next, { replace: true })
    },
    [params, setParams, sheetParam],
  )
  const closeSheet = () => {
    const next = new URLSearchParams(params)
    next.delete(sheetParam)
    setParams(next, { replace: true })
  }

  const switchView = (next: StockView) => {
    const nextParams = new URLSearchParams()
    if (next !== 'sku') nextParams.set('view', next)
    keepOnViewSwitch.forEach((key) => {
      if (filters[key] !== emptyStockFilters[key]) nextParams.set(key, filters[key])
    })
    setParams(nextParams, { replace: true })
  }

  const customerOptions = customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))

  const skuColumns = useMemo(() => {
    const col = createDataColumns<SkuStockRow>()
    const num = (id: 'good' | 'defective' | 'orderReserved' | 'actual' | 'preoccupied', header: string) =>
      col.accessor(id, {
        header,
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('skuCode', {
        header: t('inventory.sku'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ row }) => (
          <CodeName
            code={row.original.skuCode}
            name={skuName(row.original.skuCode, row.original.customerId)}
            onClick={() => openSheet(row.original.id)}
            className="max-w-64"
          />
        ),
      }),
      col.accessor('customerId', {
        header: t('inventory.owner'),
        cell: ({ getValue }) => <OwnerCell id={getValue()} />,
      }),
      num('good', t('inventory.goodShort')),
      num('defective', t('inventory.defectiveShort')),
      num('orderReserved', t('inventory.orderReserved')),
      num('actual', t('inventory.actual')),
      num('preoccupied', t('inventory.preoccupied')),
      col.accessor('available', {
        header: t('inventory.available'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <AvailableQty value={getValue()} />,
      }),
      col.accessor((r) => (r.pending ? 'PENDING' : 'NORMAL'), {
        id: 'allocation',
        header: t('inventory.allocation'),
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            {row.original.pending ? (
              <TagLabel meta={inventoryTagMeta.pending} />
            ) : (
              <TagLabel meta={allocationStatusMeta.NORMAL} />
            )}
            {row.original.counting && <TagLabel meta={inventoryTagMeta.counting} />}
          </span>
        ),
      }),
      col.accessor('lastChangedAt', {
        header: t('inventory.lastChangedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [openSheet, skuName, t])

  const balanceColumns = useMemo(() => {
    const col = createDataColumns<BalanceRow>()
    return col.columns([
      col.accessor((b) => b.record.skuCode, {
        id: 'sku',
        header: t('inventory.sku'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ row }) => (
          <CodeName
            code={row.original.record.skuCode}
            name={skuName(row.original.record.skuCode, row.original.record.customerId)}
            onClick={() => openSheet(row.original.id)}
            className="max-w-64"
          />
        ),
      }),
      col.accessor((b) => b.record.customerId, {
        id: 'owner',
        header: t('inventory.owner'),
        cell: ({ getValue }) => <OwnerCell id={getValue()} />,
      }),
      col.accessor((b) => b.record.locationCode, {
        id: 'location',
        header: t('inventory.location'),
        cell: ({ row }) => <LocationCode code={row.original.record.locationCode} usage={row.original.usage} />,
      }),
      col.accessor((b) => b.record.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((b) => b.record.qualityType, {
        id: 'quality',
        header: t('inventory.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor((b) => b.expiry ?? '', {
        id: 'expiry',
        header: t('inventory.expiry'),
        cell: ({ row }) => (row.original.expiry ? <TagLabel meta={expiryLevelMeta[row.original.expiry]} /> : <Empty />),
      }),
      col.accessor((b) => b.record.onHandQty, {
        id: 'actual',
        header: t('inventory.actual'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('allocated', {
        header: t('inventory.allocated'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('allocatable', {
        header: t('inventory.allocatable'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="inline-flex items-center justify-end gap-1.5">
            {row.original.stagingGood && <TagLabel meta={inventoryTagMeta.notAllocatable} />}
            {row.original.counting && <TagLabel meta={inventoryTagMeta.counting} />}
            <Num value={row.original.allocatable} />
          </span>
        ),
      }),
      col.accessor('lastChangedAt', {
        header: t('inventory.lastChangedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [openSheet, skuName, t])

  const serialColumns = useMemo(() => {
    const col = createDataColumns<SerialRow>()
    return col.columns([
      col.accessor('serialNo', {
        header: t('inventory.serialNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ row }) => <DocNo onClick={() => openSheet(row.original.id)}>{row.original.serialNo}</DocNo>,
      }),
      col.accessor('skuCode', {
        header: t('inventory.sku'),
        cell: ({ row }) => (
          <CodeName
            code={row.original.skuCode}
            name={skuName(row.original.skuCode, row.original.customerId)}
            className="max-w-64"
          />
        ),
      }),
      col.accessor('customerId', {
        header: t('inventory.owner'),
        cell: ({ getValue }) => <OwnerCell id={getValue()} />,
      }),
      col.accessor('locationCode', {
        header: t('inventory.currentLocation'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((r) => r.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((r) => r.qualityType ?? '', {
        id: 'quality',
        header: t('inventory.quality'),
        cell: ({ row }) =>
          row.original.qualityType ? <TagLabel meta={qualityMeta[row.original.qualityType]} /> : <Empty />,
      }),
      col.accessor('status', {
        header: t('inventory.serialStatusLabel'),
        cell: ({ getValue }) => <StatusBadge meta={serialStatusMeta[getValue()]} />,
      }),
      col.accessor('lastChangedAt', {
        header: t('inventory.lastChangedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [openSheet, skuName, t])

  const totals = useMemo(
    () => ({
      skus: skuRows.length,
      actual: skuRows.reduce((n, r) => n + r.actual, 0),
      good: skuRows.reduce((n, r) => n + r.good, 0),
      defective: skuRows.reduce((n, r) => n + r.defective, 0),
    }),
    [skuRows],
  )

  const viewTabs = STOCK_VIEWS.map((v) => ({
    value: v,
    label: t(`inventory.stock.${v === 'sku' ? 'viewSku' : v === 'balance' ? 'viewBalance' : 'viewSerial'}`),
    count: v === 'sku' ? skuRows.length : v === 'balance' ? balanceRows.length : serialRows.length,
  }))

  const keywordField = (
    <FilterItem label={t('inventory.skuKeyword')}>
      <Input
        value={draft.keyword}
        placeholder={t('inventory.stock.skuKeywordPlaceholder')}
        onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
      />
    </FilterItem>
  )
  const ownerField = (
    <FilterItem label={t('inventory.owner')}>
      <OptionSelect
        allOption
        value={draft.customerId}
        onValueChange={(v) => setDraft({ ...draft, customerId: v })}
        options={customerOptions}
      />
    </FilterItem>
  )
  const qualityField = (
    <FilterItem label={t('inventory.quality')}>
      <OptionSelect
        allOption
        value={draft.quality}
        onValueChange={(v) => setDraft({ ...draft, quality: v })}
        options={QUALITIES.map((q) => ({ value: q, label: t(qualityMeta[q].labelKey) }))}
      />
    </FilterItem>
  )
  const batchField = (
    <FilterItem label={t('inventory.batchNo')}>
      <Input
        value={draft.batch}
        placeholder={t('inventory.stock.batchPlaceholder')}
        onChange={(e) => setDraft({ ...draft, batch: e.target.value })}
      />
    </FilterItem>
  )

  const filterBar =
    view === 'sku' ? (
      <FilterBar columns={6} onSearch={list.search} onReset={list.reset}>
        {keywordField}
        {ownerField}
        <FilterItem label={t('inventory.allocation')}>
          <OptionSelect
            allOption
            value={draft.allocation}
            onValueChange={(v) => setDraft({ ...draft, allocation: v })}
            options={(['NORMAL', 'PENDING'] as const).map((v) => ({
              value: v,
              label: t(`inventory.allocationStatus.${v}`),
            }))}
          />
        </FilterItem>
        <FilterItem label={t('inventory.stock.qtyCondition')}>
          <OptionSelect
            allOption
            value={draft.qty}
            onValueChange={(v) => setDraft({ ...draft, qty: v })}
            options={QTY_CONDITIONS.map((v) => ({ value: v, label: t(`inventory.qtyCondition.${v}`) }))}
          />
        </FilterItem>
        <FilterItem label={t('inventory.lastChangedAt')}>
          <DateRangePickerField
            value={{ from: draft.changedFrom, to: draft.changedTo }}
            placeholder={t('inventory.stock.updatedRangePlaceholder')}
            onChange={(range) => setDraft({ ...draft, changedFrom: range.from, changedTo: range.to })}
          />
        </FilterItem>
      </FilterBar>
    ) : view === 'balance' ? (
      <FilterBar
        columns={6}
        onSearch={list.search}
        onReset={list.reset}
        advanced={
          <>
            {batchField}
            <FilterItem label={t('inventory.stock.allocatableCondition')}>
              <OptionSelect
                allOption
                value={draft.allocatable}
                onValueChange={(v) => setDraft({ ...draft, allocatable: v })}
                options={ALLOCATABLE_CONDITIONS.map((v) => ({
                  value: v,
                  label: t(`inventory.allocatableCondition.${v}`),
                }))}
              />
            </FilterItem>
          </>
        }
      >
        {keywordField}
        {ownerField}
        <FilterItem label={t('inventory.location')}>
          <Input
            value={draft.location}
            placeholder={t('inventory.stock.locationPlaceholder')}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          />
        </FilterItem>
        {qualityField}
        <FilterItem label={t('inventory.expiry')}>
          <OptionSelect
            allOption
            value={draft.expiry}
            onValueChange={(v) => setDraft({ ...draft, expiry: v })}
            options={EXPIRY_OPTIONS.map((v) => ({ value: v, label: t(`inventory.expiryLevel.${v}`) }))}
          />
        </FilterItem>
      </FilterBar>
    ) : (
      <FilterBar
        columns={6}
        onSearch={list.search}
        onReset={list.reset}
        advanced={
          <>
            {batchField}
            {qualityField}
          </>
        }
      >
        <FilterItem label={t('inventory.serialNo')}>
          <Input
            value={draft.sn}
            placeholder={t('inventory.stock.serialPlaceholder')}
            onChange={(e) => setDraft({ ...draft, sn: e.target.value })}
          />
        </FilterItem>
        {keywordField}
        {ownerField}
        <FilterItem label={t('inventory.serialStatusLabel')}>
          <OptionSelect
            allOption
            value={draft.serialStatus}
            onValueChange={(v) => setDraft({ ...draft, serialStatus: v })}
            options={SERIAL_STATUSES.map((v) => ({ value: v, label: t(serialStatusMeta[v].labelKey) }))}
          />
        </FilterItem>
        <FilterItem label={t('inventory.currentLocation')}>
          <Input
            value={draft.location}
            placeholder={t('inventory.stock.locationPlaceholder')}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          />
        </FilterItem>
      </FilterBar>
    )

  const balanceSheetRow = view === 'balance' && sheetId ? data.balances.find((b) => b.id === sheetId) : undefined
  const emptyText = t('inventory.stock.empty')
  const table =
    view === 'sku' ? (
      <DataTable
        key="sku"
        className="flex-1"
        data={skuRows}
        columns={skuColumns}
        getRowId={(r) => r.id}
        onRowClick={(r) => openSheet(r.id)}
        emptyText={emptyText}
        toolbar={
          <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="text-xs text-muted-foreground">{t('inventory.stock.totalBar')}</span>
            <span>
              {t('inventory.stock.skuCount')} <Num value={totals.skus} className="font-medium" />
            </span>
            <span>
              {t('inventory.stock.totalActual')} <Num value={totals.actual} className="font-medium" />
              <span className="ml-1 text-xs text-muted-foreground">
                {t('inventory.stock.totalBreakdown', { good: totals.good, defective: totals.defective })}
              </span>
            </span>
          </span>
        }
      />
    ) : view === 'balance' ? (
      <DataTable
        key="balance"
        className="flex-1"
        data={balanceRows}
        columns={balanceColumns}
        getRowId={(b) => b.id}
        onRowClick={(b) => openSheet(b.id)}
        emptyText={emptyText}
      />
    ) : (
      <DataTable
        key="serial"
        className="flex-1"
        data={serialRows}
        columns={serialColumns}
        getRowId={(r) => r.id}
        onRowClick={(r) => openSheet(r.id)}
        getRowClassName={(r) => (r.status === 'IN_STOCK' ? undefined : 'text-muted-foreground')}
        emptyText={emptyText}
      />
    )

  return (
    <PageContainer
      fill
      title={t('menu.stock')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('inventory.stock.exportView')}
        </Button>
      }
    >
      <Panel className="overflow-hidden">
        <StatusTabs label={t('inventory.stock.views')} items={viewTabs} value={view} onChange={switchView} />
        <div className="p-4">{filterBar}</div>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">{table}</Panel>

      {view === 'sku' && sheetId && (
        <StockSkuSheet
          row={data.skus.find((r) => r.id === sheetId)}
          balances={data.balances}
          serials={data.serials}
          onClose={closeSheet}
        />
      )}
      {view === 'balance' && sheetId && (
        <StockBalanceSheet
          row={balanceSheetRow}
          skuRow={data.skus.find(
            (r) => r.customerId === balanceSheetRow?.record.customerId && r.skuCode === balanceSheetRow?.record.skuCode,
          )}
          onClose={closeSheet}
        />
      )}
      {view === 'serial' && sheetId && (
        <StockSerialSheet row={data.serials.find((r) => r.id === sheetId)} onClose={closeSheet} />
      )}
    </PageContainer>
  )
}
