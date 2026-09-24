import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, Dimension, Money, Num, Weight } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInventory } from '@/hooks/use-inventory'
import { useLookups } from '@/mock/db'
import type { InventoryRecord } from '@/types/wms'

const ALL = '__all'
interface Filters {
  keyword: string
  customerId: string
  quality: string
}
const emptyFilters: Filters = { keyword: '', customerId: ALL, quality: ALL }

export function StockPage() {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [filters, setFilters] = useState<Filters>(emptyFilters)
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
        cell: ({ getValue }) => <span className="font-mono text-[13px] font-medium">{getValue()}</span>,
      }),
      col.accessor((r) => locType(r.locationCode) ?? '', {
        id: 'locationType',
        header: t('inventory.locationType'),
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? t(`enum.locationType.${getValue()}`) : '-'),
      }),
      col.accessor('skuCode', {
        header: t('common.sku'),
        cell: ({ getValue }) => (
          <div className="leading-tight">
            <div className="font-mono text-xs">{getValue()}</div>
            <div className="max-w-52 truncate text-xs text-muted-foreground">{sku(getValue())?.name}</div>
          </div>
        ),
      }),
      col.accessor((r) => sku(r.skuCode)?.barcode ?? '', {
        id: 'barcode',
        header: t('common.barcode'),
        enableSorting: false,
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        enableSorting: false,
        cell: ({ getValue }) => <span className="font-mono text-xs">{customerCode(getValue())}</span>,
      }),
      col.accessor('qualityType', {
        header: t('inventory.quality'),
        enableSorting: false,
        cell: ({ getValue }) => (
          <TagLabel tone={getValue() === 'GOOD' ? 'green' : 'red'}>{t(`enum.quality.${getValue()}`)}</TagLabel>
        ),
      }),
      col.accessor('onHandQty', {
        header: t('inventory.onHand'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className="font-medium" />,
      }),
      col.accessor('lockedQty', {
        header: t('inventory.locked'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className={getValue() ? 'text-amber-600' : 'text-muted-foreground'} />,
      }),
      col.accessor((r) => r.onHandQty - r.lockedQty, {
        id: 'available',
        header: t('inventory.available'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className="text-emerald-700" />,
      }),
      col.display({
        id: 'weight',
        header: t('inventory.weight'),
        meta: { label: t('inventory.weight') },
        cell: ({ row }) => {
          const s = sku(row.original.skuCode)
          return s ? <Weight grams={s.weightG} /> : '-'
        },
      }),
      col.display({
        id: 'dimension',
        header: t('inventory.dimension'),
        meta: { label: t('inventory.dimension') },
        cell: ({ row }) => {
          const s = sku(row.original.skuCode)
          return s ? <Dimension l={s.lengthCm} w={s.widthCm} h={s.heightCm} /> : '-'
        },
      }),
      col.display({
        id: 'declaredValue',
        header: t('inventory.declaredValue'),
        meta: { label: t('inventory.declaredValue'), align: 'right' },
        cell: ({ row }) => {
          const s = sku(row.original.skuCode)
          return s ? <Money value={s.declaredValue} /> : '-'
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
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [t, sku, customerCode, locations, warehouseCode])

  const stats = [
    { label: t('inventory.totalSku'), value: <Num value={summary.skus} /> },
    { label: t('inventory.totalQty'), value: <Num value={summary.qty} /> },
    { label: t('inventory.totalLocations'), value: <Num value={summary.locations} /> },
    { label: t('inventory.stockValue'), value: <Money value={summary.value} /> },
  ]

  return (
    <PageContainer
      fill
      title={t('menu.stock')}
      actions={
        <Button variant="outline">
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Panel key={s.label} className="px-4 py-3">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-xl font-semibold">{s.value}</div>
          </Panel>
        ))}
      </div>

      <Panel className="p-4">
        <FilterBar
          onSearch={() => setFilters(draft)}
          onReset={() => {
            setDraft(emptyFilters)
            setFilters(emptyFilters)
          }}
        >
          <FilterItem label={t('common.sku')}>
            <Input
              value={draft.keyword}
              placeholder={t('inventory.searchPlaceholder')}
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('common.customer')}>
            <Select value={draft.customerId} onValueChange={(v) => setDraft({ ...draft, customerId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem label={t('inventory.quality')}>
            <Select value={draft.quality} onValueChange={(v) => setDraft({ ...draft, quality: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                <SelectItem value="GOOD">{t('enum.quality.GOOD')}</SelectItem>
                <SelectItem value="DEFECTIVE">{t('enum.quality.DEFECTIVE')}</SelectItem>
              </SelectContent>
            </Select>
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-[420px] flex-1 flex-col overflow-hidden">
        <DataTable className="flex-1" data={rows} columns={columns} getRowId={(r) => r.id} />
      </Panel>
    </PageContainer>
  )
}
