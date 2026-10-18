import { Download } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, CodeName, DateTime, DocNo, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import { FILTER_ALL } from '@/lib/master-data'
import { planQty, skuKindCount, submittedQty } from '@/lib/putaway'
import {
  emptyPutawayListFilters,
  matchPutawayListFilters,
  PUTAWAY_SOURCE_TYPES,
  type PutawayListFilters,
} from '@/lib/putaway-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutawayOrder, PutawayOrderStatus } from '@/types/inbound'
import type { QualityType } from '@/types/wms'

type StatusTab = 'ALL' | PutawayOrderStatus
const statusTabs: StatusTab[] = ['ALL', 'PENDING', 'PUTAWAYING', 'COMPLETED']
const qualityTypes: QualityType[] = ['GOOD', 'DEFECTIVE']

function parseListState(params: URLSearchParams): { filters: PutawayListFilters; tab: StatusTab } {
  const status = params.get('status') ?? 'ALL'
  return {
    tab: statusTabs.includes(status as StatusTab) ? (status as StatusTab) : 'ALL',
    filters: {
      putawayNo: params.get('putawayNo') ?? '',
      sourceNo: params.get('sourceNo') ?? '',
      containerNo: params.get('container') ?? '',
      customerId: params.get('customer') ?? FILTER_ALL,
      qualityType: params.get('quality') ?? FILTER_ALL,
      sourceType: params.get('sourceType') ?? FILTER_ALL,
      createdFrom: params.get('createdFrom') ?? '',
      createdTo: params.get('createdTo') ?? '',
      submittedFrom: params.get('submittedFrom') ?? '',
      submittedTo: params.get('submittedTo') ?? '',
    },
  }
}

function toSearchParams(filters: PutawayListFilters, tab: StatusTab): URLSearchParams {
  const params = new URLSearchParams()
  if (tab !== 'ALL') params.set('status', tab)
  if (filters.putawayNo) params.set('putawayNo', filters.putawayNo)
  if (filters.sourceNo) params.set('sourceNo', filters.sourceNo)
  if (filters.containerNo) params.set('container', filters.containerNo)
  if (filters.customerId !== FILTER_ALL) params.set('customer', filters.customerId)
  if (filters.qualityType !== FILTER_ALL) params.set('quality', filters.qualityType)
  if (filters.sourceType !== FILTER_ALL) params.set('sourceType', filters.sourceType)
  if (filters.createdFrom) params.set('createdFrom', filters.createdFrom)
  if (filters.createdTo) params.set('createdTo', filters.createdTo)
  if (filters.submittedFrom) params.set('submittedFrom', filters.submittedFrom)
  if (filters.submittedTo) params.set('submittedTo', filters.submittedTo)
  return params
}

/** 上架单列表：管理端查询入口（上架单主PRD 第四节）；保存与提交只在 PDA */
export function PutawayListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const putawayOrders = useDb((s) => s.putawayOrders)
  const customers = useDb((s) => s.customers)
  const { customerCode, customerName } = useLookups()
  const [searchParams, setSearchParams] = useSearchParams()

  const { filters, tab } = useMemo(() => parseListState(searchParams), [searchParams])
  const [draft, setDraft] = useState<PutawayListFilters>(filters)

  const [syncedFilters, setSyncedFilters] = useState(filters)
  if (syncedFilters !== filters) {
    setSyncedFilters(filters)
    setDraft(filters)
  }

  const updateListState = useCallback(
    (nextFilters: PutawayListFilters, nextTab: StatusTab) => {
      setSearchParams(toSearchParams(nextFilters, nextTab), { replace: true })
    },
    [setSearchParams],
  )

  const filtered = useMemo(
    () => putawayOrders.filter((p) => matchPutawayListFilters(p, warehouseCode, filters)),
    [putawayOrders, warehouseCode, filters],
  )

  const rows = useMemo(() => {
    const base = tab === 'ALL' ? filtered : filtered.filter((p) => p.status === tab)
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [filtered, tab])

  const tabItems = statusTabs.map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(putawayOrderStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((p) => p.status === s).length,
  }))

  const columns = useMemo(() => {
    const col = createDataColumns<PutawayOrder>()
    return col.columns([
      col.accessor('putawayNo', {
        header: t('putaway.putawayNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo
            onClick={() =>
              navigate(`/wms/inbound/putaway/${getValue()}`, { state: { listSearch: searchParams.toString() } })
            }
          >
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={putawayOrderStatusMeta[getValue()]} />,
      }),
      col.accessor('qualityType', {
        header: t('inventory.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor('sourceType', {
        header: t('putaway.sourceType'),
        cell: ({ getValue }) => (
          <TagLabel tone={getValue() === 'RETURN' ? 'purple' : 'gray'}>
            {t(`enum.putawaySource.${getValue()}`)}
          </TagLabel>
        ),
      }),
      col.accessor('sourceNo', {
        header: t('putaway.sourceNo'),
        cell: ({ row }) =>
          row.original.sourceType === 'INBOUND' ? (
            <DocNo onClick={() => navigate(`/wms/inbound/orders/${row.original.sourceNo}`)}>{row.original.sourceNo}</DocNo>
          ) : (
            row.original.sourceNo
          ),
      }),
      col.accessor('containerNo', {
        header: t('inbound.workContainerNo'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : t('putaway.noContainer')),
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        cell: ({ getValue }) => <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />,
      }),
      col.accessor((p) => skuKindCount(p), {
        id: 'skuCount',
        header: t('inbound.skuCount'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((p) => planQty(p), {
        id: 'planQty',
        header: t('putaway.planQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((p) => submittedQty(p), {
        id: 'putawayQty',
        header: t('putaway.putawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('createdAt', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('submittedAt', {
        header: t('putaway.submittedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableHiding: false,
        meta: { pin: 'right' },
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                key: 'entry',
                label: t('putaway.entry.action'),
                hidden: row.original.status === 'COMPLETED',
                onClick: () =>
                  navigate(`/wms/inbound/putaway/${row.original.putawayNo}/entry`, {
                    state: { listSearch: searchParams.toString() },
                  }),
              },
              {
                key: 'pda',
                label: t('putaway.openPda'),
                hidden: row.original.status === 'COMPLETED',
                onClick: () => navigate('/pda/putaway', { state: { putawayNo: row.original.putawayNo } }),
              },
            ]}
          />
        ),
      }),
    ])
  }, [customerCode, customerName, navigate, searchParams, t])

  return (
    <PageContainer
      fill
      title={t('menu.putawayTasks')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar
          onSearch={() => updateListState(draft, tab)}
          onReset={() => {
            setDraft(emptyPutawayListFilters)
            updateListState(emptyPutawayListFilters, tab)
          }}
          advanced={
            <>
              <FilterItem label={t('putaway.sourceType')}>
                <OptionSelect
                  allOption
                  value={draft.sourceType}
                  onValueChange={(v) => setDraft({ ...draft, sourceType: v })}
                  options={PUTAWAY_SOURCE_TYPES.map((s) => ({ value: s, label: t(`enum.putawaySource.${s}`) }))}
                />
              </FilterItem>
              <FilterItem label={t('common.createdAt')}>
                <DateRangePickerField
                  value={{ from: draft.createdFrom, to: draft.createdTo }}
                  placeholder={t('putaway.filters.createdRangePlaceholder')}
                  onChange={(range) => setDraft({ ...draft, createdFrom: range.from, createdTo: range.to })}
                />
              </FilterItem>
              <FilterItem label={t('putaway.submittedAt')}>
                <DateRangePickerField
                  value={{ from: draft.submittedFrom, to: draft.submittedTo }}
                  placeholder={t('putaway.filters.submittedRangePlaceholder')}
                  onChange={(range) => setDraft({ ...draft, submittedFrom: range.from, submittedTo: range.to })}
                />
              </FilterItem>
            </>
          }
        >
          <FilterItem label={t('putaway.putawayNo')}>
            <Input
              value={draft.putawayNo}
              placeholder={t('putaway.filters.putawayNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, putawayNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('putaway.sourceNo')}>
            <Input
              value={draft.sourceNo}
              placeholder={t('putaway.filters.sourceNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, sourceNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inbound.workContainerNo')}>
            <Input
              value={draft.containerNo}
              placeholder={t('putaway.filters.containerNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, containerNo: e.target.value })}
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
              value={draft.qualityType}
              onValueChange={(v) => setDraft({ ...draft, qualityType: v })}
              options={qualityTypes.map((q) => ({ value: q, label: t(qualityMeta[q].labelKey) }))}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StatusTabs items={tabItems} value={tab} onChange={(nextTab) => updateListState(filters, nextTab)} />
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(p) => p.putawayNo}
          selectable={false}
          initialColumnVisibility={{ sourceType: false }}
        />
      </Panel>
    </PageContainer>
  )
}
