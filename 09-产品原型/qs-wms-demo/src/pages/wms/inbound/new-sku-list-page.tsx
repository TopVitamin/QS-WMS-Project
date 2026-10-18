import { Download, Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FILTER_ALL } from '@/lib/master-data'
import { codeNameText } from '@/lib/typography'
import { formatDimensions, formatGrossWeight, lengthUnitLabel, weightUnitLabel } from '@/lib/unit'
import { useDb, useLookups } from '@/mock/db'
import { useUnitSystem } from '@/stores/settings'
import type { NewSkuRecord } from '@/types/inbound'
import { NewSkuDetailSheet } from './new-sku-detail-sheet'
import { NewSkuMeasureDialog } from './new-sku-measure-dialog'

interface NewSkuListFilters {
  recordNo: string
  customerId: string
  skuCode: string
  warehouseCode: string
  sourceInboundNo: string
  maintainedFrom: string
  maintainedTo: string
}

const emptyFilters: NewSkuListFilters = {
  recordNo: '',
  customerId: FILTER_ALL,
  skuCode: '',
  warehouseCode: FILTER_ALL,
  sourceInboundNo: '',
  maintainedFrom: '',
  maintainedTo: '',
}

function parseListState(params: URLSearchParams): NewSkuListFilters {
  return {
    recordNo: params.get('recordNo') ?? '',
    customerId: params.get('customer') ?? FILTER_ALL,
    skuCode: params.get('sku') ?? '',
    warehouseCode: params.get('warehouse') ?? FILTER_ALL,
    sourceInboundNo: params.get('sourceInboundNo') ?? '',
    maintainedFrom: params.get('maintainedFrom') ?? '',
    maintainedTo: params.get('maintainedTo') ?? '',
  }
}

function toSearchParams(filters: NewSkuListFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.recordNo) params.set('recordNo', filters.recordNo)
  if (filters.customerId !== FILTER_ALL) params.set('customer', filters.customerId)
  if (filters.skuCode) params.set('sku', filters.skuCode)
  if (filters.warehouseCode !== FILTER_ALL) params.set('warehouse', filters.warehouseCode)
  if (filters.sourceInboundNo) params.set('sourceInboundNo', filters.sourceInboundNo)
  if (filters.maintainedFrom) params.set('maintainedFrom', filters.maintainedFrom)
  if (filters.maintainedTo) params.set('maintainedTo', filters.maintainedTo)
  return params
}

function matchDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true
  const ts = new Date(iso).getTime()
  if (from && ts < new Date(from).getTime()) return false
  if (to && ts > new Date(to).getTime() + 86_400_000) return false
  return true
}

/** 新品维护列表：NS 记录按货主＋SKU 四仓共用，不按顶栏仓库过滤（新品维护主PRD 第五节） */
export function NewSkuListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const records = useDb((s) => s.newSkuRecords)
  const customers = useDb((s) => s.customers)
  const warehouses = useDb((s) => s.warehouses)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { sku, customerCode, customerName } = useLookups()
  const unit = useUnitSystem()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseListState(searchParams), [searchParams])
  const [draft, setDraft] = useState<NewSkuListFilters>(filters)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [detail, setDetail] = useState<NewSkuRecord>()

  const [syncedFilters, setSyncedFilters] = useState(filters)
  if (syncedFilters !== filters) {
    setSyncedFilters(filters)
    setDraft(filters)
  }

  const applyFilters = useCallback(
    (next: NewSkuListFilters) => {
      setSearchParams(toSearchParams(next), { replace: true })
    },
    [setSearchParams],
  )

  const warehouseName = useCallback(
    (code: string) => {
      const master = warehouseMasters.find((w) => w.code === code)
      return master ? `${code} ${master.name}` : code
    },
    [warehouseMasters],
  )

  const rows = useMemo(
    () =>
      records
        .filter((r) => {
          if (filters.recordNo && !r.recordNo.toLowerCase().includes(filters.recordNo.trim().toLowerCase())) return false
          if (filters.customerId !== FILTER_ALL && r.customerId !== filters.customerId) return false
          if (filters.skuCode && !r.skuCode.toLowerCase().includes(filters.skuCode.trim().toLowerCase())) return false
          if (filters.warehouseCode !== FILTER_ALL && r.warehouseCode !== filters.warehouseCode) return false
          if (
            filters.sourceInboundNo &&
            !(r.sourceInboundNo ?? '').toLowerCase().includes(filters.sourceInboundNo.trim().toLowerCase())
          ) {
            return false
          }
          return matchDateRange(r.maintainedAt, filters.maintainedFrom, filters.maintainedTo)
        })
        .sort((a, b) => b.maintainedAt.localeCompare(a.maintainedAt)),
    [records, filters],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<NewSkuRecord>()
    return col.columns([
      col.accessor('recordNo', {
        header: t('newSku.recordNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ row }) => <DocNo onClick={() => setDetail(row.original)}>{row.original.recordNo}</DocNo>,
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        cell: ({ getValue }) => <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />,
      }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('skuCode', {
        id: 'skuName',
        header: t('masterSku.name'),
        cell: ({ getValue }) => sku(getValue())?.name ?? getValue(),
      }),
      col.accessor((r) => formatDimensions(r.lengthCm, r.widthCm, r.heightCm, unit), {
        id: 'dimensions',
        header: t('newSku.dimensionColumn', { unit: lengthUnitLabel(unit) }),
        meta: { align: 'right' },
      }),
      col.accessor((r) => formatGrossWeight(r.grossWeightKg, unit), {
        id: 'grossWeight',
        header: t('newSku.weightColumn', { unit: weightUnitLabel(unit) }),
        meta: { align: 'right' },
      }),
      col.accessor('warehouseCode', {
        header: t('newSku.maintainedWarehouse'),
        cell: ({ getValue }) => warehouseName(getValue()),
      }),
      col.accessor('sourceInboundNo', {
        header: t('newSku.sourceInboundNo'),
        cell: ({ row }) =>
          row.original.sourceInboundNo ? (
            <DocNo onClick={() => navigate(`/wms/inbound/orders/${row.original.sourceInboundNo}`)}>
              {row.original.sourceInboundNo}
            </DocNo>
          ) : (
            <Empty />
          ),
      }),
      col.accessor('maintainedBy', { header: t('newSku.maintainedBy') }),
      col.accessor('maintainedAt', {
        header: t('newSku.maintainedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [customerCode, customerName, navigate, sku, t, unit, warehouseName])

  return (
    <PageContainer
      fill
      title={t('menu.newSku')}
      actions={
        <>
          <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
          <Button onClick={() => setMeasureOpen(true)}>
            <Plus data-icon="inline-start" />
            {t('newSku.create')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar
          onSearch={() => applyFilters(draft)}
          onReset={() => {
            setDraft(emptyFilters)
            applyFilters(emptyFilters)
          }}
          advanced={
            <FilterItem label={t('newSku.sourceInboundNo')}>
              <Input
                value={draft.sourceInboundNo}
                placeholder={t('newSku.filters.inboundNoPlaceholder')}
                onChange={(e) => setDraft({ ...draft, sourceInboundNo: e.target.value })}
              />
            </FilterItem>
          }
        >
          <FilterItem label={t('newSku.recordNo')}>
            <Input
              value={draft.recordNo}
              placeholder={t('newSku.filters.recordNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, recordNo: e.target.value })}
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
          <FilterItem label={t('common.sku')}>
            <Input
              value={draft.skuCode}
              placeholder={t('newSku.filters.skuPlaceholder')}
              onChange={(e) => setDraft({ ...draft, skuCode: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('newSku.maintainedWarehouse')}>
            <OptionSelect
              allOption
              value={draft.warehouseCode}
              onValueChange={(v) => setDraft({ ...draft, warehouseCode: v })}
              options={warehouses.map((w) => ({ value: w.code, label: `${w.code} ${t(w.nameKey)}` }))}
            />
          </FilterItem>
          <FilterItem label={t('newSku.maintainedAt')}>
            <DateRangePickerField
              value={{ from: draft.maintainedFrom, to: draft.maintainedTo }}
              placeholder={t('newSku.filters.maintainedRangePlaceholder')}
              onChange={(range) => setDraft({ ...draft, maintainedFrom: range.from, maintainedTo: range.to })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(r) => r.recordNo}
          selectable={false}
          initialColumnVisibility={{ maintainedBy: false }}
        />
      </Panel>

      <NewSkuMeasureDialog open={measureOpen} mode="standalone" onClose={() => setMeasureOpen(false)} />
      <NewSkuDetailSheet record={detail} onClose={() => setDetail(undefined)} unit={unit} />
    </PageContainer>
  )
}
