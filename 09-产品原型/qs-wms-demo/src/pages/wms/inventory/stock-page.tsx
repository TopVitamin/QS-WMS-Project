import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, DateTime, Dimension, Empty, Money, Num, Weight } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatCard } from '@/components/biz/stat-card'
import { TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { qualityMeta } from '@/config/status'
import { useInventory } from '@/hooks/use-inventory'
import { useListFilters } from '@/hooks/use-list-filters'
import { FILTER_ALL } from '@/lib/master-data'
import { toneTextClass } from '@/lib/tone-styles'
import { codeNameText } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useLookups } from '@/mock/db'
import type { InventoryRecord, QualityType } from '@/types/wms'

interface Filters {
  keyword: string
  customerId: string
  quality: string
}
const emptyFilters: Filters = { keyword: '', customerId: FILTER_ALL, quality: FILTER_ALL }
const QUALITIES: QualityType[] = ['GOOD', 'DEFECTIVE']

export function StockPage() {
  const { t } = useTranslation()
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)
  const { rows, summary, locations, customers, warehouseCode } = useInventory(filters)
  const { customerCode, sku } = useLookups()

  const columns = useMemo(() => {
    const col = createDataColumns<InventoryRecord>()
    const locType = (code: string) => locations.find((l) => l.warehouseCode === warehouseCode && l.code === code)?.type
    return col.columns([
      col.accessor('locationCode', {
        header: t('common.location'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => <BizCode className="font-medium">{getValue()}</BizCode>,
      }),
      col.accessor((r) => locType(r.locationCode) ?? '', {
        id: 'locationType',
        header: t('inventory.locationType'),
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? t(`enum.locationType.${getValue()}`) : <Empty />),
      }),
      col.accessor('skuCode', {
        header: t('common.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor((r) => sku(r.skuCode)?.barcode ?? '', {
        id: 'barcode',
        header: t('common.barcode'),
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        enableSorting: false,
        cell: ({ getValue }) => <BizCode>{customerCode(getValue())}</BizCode>,
      }),
      col.accessor('qualityType', {
        header: t('inventory.quality'),
        enableSorting: false,
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor('onHandQty', {
        header: t('inventory.onHand'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className="font-medium" />,
      }),
      col.accessor('lockedQty', {
        header: t('inventory.locked'),
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <Num value={getValue()} className={getValue() ? toneTextClass.orange : toneTextClass.gray} />
        ),
      }),
      col.accessor((r) => r.onHandQty - r.lockedQty, {
        id: 'available',
        header: t('inventory.available'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className={cn('font-medium', toneTextClass.green)} />,
      }),
      col.display({
        id: 'weight',
        header: t('inventory.weight'),
        meta: { label: t('inventory.weight') },
        cell: ({ row }) => {
          const s = sku(row.original.skuCode)
          return s ? <Weight grams={s.weightG} /> : <Empty />
        },
      }),
      col.display({
        id: 'dimension',
        header: t('inventory.dimension'),
        meta: { label: t('inventory.dimension') },
        cell: ({ row }) => {
          const s = sku(row.original.skuCode)
          return s ? <Dimension l={s.lengthCm} w={s.widthCm} h={s.heightCm} /> : <Empty />
        },
      }),
      col.display({
        id: 'declaredValue',
        header: t('inventory.declaredValue'),
        meta: { label: t('inventory.declaredValue'), align: 'right' },
        cell: ({ row }) => {
          const s = sku(row.original.skuCode)
          return s ? <Money value={s.declaredValue} /> : <Empty />
        },
      }),
      col.accessor((r) => Math.floor((Date.now() - new Date(r.firstInboundAt).getTime()) / 86_400_000), {
        id: 'age',
        header: t('inventory.age'),
        meta: { align: 'right' },
        cell: ({ getValue }) => t('common.day', { count: getValue() }),
      }),
      col.accessor('firstInboundAt', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [t, sku, customerCode, locations, warehouseCode])

  return (
    <PageContainer
      fill
      title={t('menu.stock')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('inventory.totalSku')} value={summary.skus} />
        <StatCard label={t('inventory.totalQty')} value={summary.qty} />
        <StatCard label={t('inventory.totalLocations')} value={summary.locations} />
        <StatCard label={t('inventory.stockValue')} value={<Money value={summary.value} />} />
      </div>

      <Panel className="p-4">
        <FilterBar onSearch={applySearch} onReset={reset}>
          <FilterItem label={t('common.sku')}>
            <Input
              value={draft.keyword}
              placeholder={t('inventory.searchPlaceholder')}
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('common.customer')}>
            <OptionSelect
              allOption
              value={draft.customerId}
              onValueChange={(v) => setDraft({ ...draft, customerId: v })}
              options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
            />
          </FilterItem>
          <FilterItem label={t('inventory.quality')}>
            <OptionSelect
              allOption
              value={draft.quality}
              onValueChange={(v) => setDraft({ ...draft, quality: v })}
              options={QUALITIES.map((q) => ({ value: q, label: t(qualityMeta[q].labelKey) }))}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-105 flex-1 flex-col overflow-hidden">
        <DataTable className="flex-1" data={rows} columns={columns} getRowId={(r) => r.id} />
      </Panel>
    </PageContainer>
  )
}
