import { Download, Radio } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { CodeName, DateTime, DocNo, Num, ProgressCell } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { OptionSelect } from '@/components/biz/option-select'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inboundBizTypeMeta, inboundOrderStatusMeta } from '@/config/status'
import { useInbound } from '@/hooks/use-inbound'
import {
  canConfirmReceiptClose,
  canReceiveInbound,
  putawayProgress,
  receiptProgress,
  skuKindCount,
  sumLines,
} from '@/lib/inbound-derive'
import {
  emptyInboundListFilters,
  INBOUND_ARRIVAL_METHODS,
  matchInboundListFilters,
  type InboundListFilters,
} from '@/lib/inbound-list-match'
import { FILTER_ALL } from '@/lib/master-data'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { InboundBizType, InboundOrder, InboundOrderStatus } from '@/types/wms'
import { InboundMockPushDialog } from './inbound-mock-push-dialog'
import { ReceiptCloseDialog } from './receipt-close-dialog'

type StatusTab = 'ALL' | InboundOrderStatus
const statusTabs: StatusTab[] = [
  'ALL',
  'PENDING_RECEIVE',
  'RECEIVING',
  'PUTAWAYING',
  'COMPLETED',
  'CANCELLED',
]
const bizTypes: InboundBizType[] = ['NORMAL', 'TRANSFER']

function parseListState(params: URLSearchParams): { filters: InboundListFilters; tab: StatusTab } {
  const status = params.get('status') ?? 'ALL'
  const tab = statusTabs.includes(status as StatusTab) ? (status as StatusTab) : 'ALL'
  return {
    tab,
    filters: {
      inboundNo: params.get('inboundNo') ?? '',
      customerId: params.get('customer') ?? FILTER_ALL,
      bizType: params.get('bizType') ?? FILTER_ALL,
      upstreamNo: params.get('upstream') ?? '',
      arrivalMethod: params.get('arrivalMethod') ?? FILTER_ALL,
      containerNo: params.get('container') ?? '',
      trackingNo: params.get('tracking') ?? '',
      createdFrom: params.get('createdFrom') ?? '',
      createdTo: params.get('createdTo') ?? '',
      completedFrom: params.get('completedFrom') ?? '',
      completedTo: params.get('completedTo') ?? '',
    },
  }
}

function toSearchParams(filters: InboundListFilters, tab: StatusTab): URLSearchParams {
  const params = new URLSearchParams()
  if (tab !== 'ALL') params.set('status', tab)
  if (filters.inboundNo) params.set('inboundNo', filters.inboundNo)
  if (filters.customerId !== FILTER_ALL) params.set('customer', filters.customerId)
  if (filters.bizType !== FILTER_ALL) params.set('bizType', filters.bizType)
  if (filters.upstreamNo) params.set('upstream', filters.upstreamNo)
  if (filters.arrivalMethod !== FILTER_ALL) params.set('arrivalMethod', filters.arrivalMethod)
  if (filters.containerNo) params.set('container', filters.containerNo)
  if (filters.trackingNo) params.set('tracking', filters.trackingNo)
  if (filters.createdFrom) params.set('createdFrom', filters.createdFrom)
  if (filters.createdTo) params.set('createdTo', filters.createdTo)
  if (filters.completedFrom) params.set('completedFrom', filters.completedFrom)
  if (filters.completedTo) params.set('completedTo', filters.completedTo)
  return params
}

export function InboundOrderListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { inbounds, customers, confirmReceiptClose, mockPushInboundInstruction } = useInbound()
  const { customerCode, customerName } = useLookups()
  const [searchParams, setSearchParams] = useSearchParams()

  const { filters, tab } = useMemo(() => parseListState(searchParams), [searchParams])
  const [draft, setDraft] = useState<InboundListFilters>(filters)
  const [mockOpen, setMockOpen] = useState(false)
  const [closeOrder, setCloseOrder] = useState<InboundOrder>()

  // URL 上的筛选变化（返回、分享链接）时同步草稿
  const [syncedFilters, setSyncedFilters] = useState(filters)
  if (syncedFilters !== filters) {
    setSyncedFilters(filters)
    setDraft(filters)
  }

  const updateListState = useCallback(
    (nextFilters: InboundListFilters, nextTab: StatusTab) => {
      setSearchParams(toSearchParams(nextFilters, nextTab), { replace: true })
    },
    [setSearchParams],
  )

  const warehouseRows = useMemo(
    () => inbounds.filter((o) => o.warehouseCode === warehouseCode),
    [inbounds, warehouseCode],
  )

  const filtered = useMemo(
    () => inbounds.filter((o) => matchInboundListFilters(o, warehouseCode, filters)),
    [inbounds, warehouseCode, filters],
  )

  const rows = useMemo(() => {
    const base = tab === 'ALL' ? filtered : filtered.filter((o) => o.status === tab)
    /** 默认排序：创建时间降序 */
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [filtered, tab])

  const tabItems = statusTabs.map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(inboundOrderStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((o) => o.status === s).length,
  }))

  const warehouseLabel = warehouseMasters.find((w) => w.code === warehouseCode)?.name ?? warehouseCode

  const openReceiptClose = useCallback(
    (order: InboundOrder) => {
      if (!canConfirmReceiptClose(order)) {
        toast.error(t('inbound.receiptCloseStale'))
        return
      }
      setCloseOrder(order)
    },
    [t],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<InboundOrder>()
    return col.columns([
      col.accessor('inboundNo', {
        header: t('inbound.inboundNo'),
        enableHiding: false,
        enableSorting: true,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/inbound/orders/${getValue()}`, { state: { listSearch: searchParams.toString() } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        cell: ({ getValue }) => <StatusBadge meta={inboundOrderStatusMeta[getValue()]} />,
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        enableSorting: false,
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />
        ),
      }),
      col.accessor('bizType', {
        header: t('inbound.bizType'),
        enableSorting: false,
        cell: ({ getValue }) => <TagLabel meta={inboundBizTypeMeta[getValue()]} />,
      }),
      col.accessor('upstreamNo', {
        header: t('inbound.upstreamNo'),
        enableSorting: false,
      }),
      col.accessor((o) => skuKindCount(o), {
        id: 'skuCount',
        header: t('inbound.skuCount'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((o) => sumLines(o, (l) => l.plannedQty), {
        id: 'plannedQty',
        header: t('inbound.plannedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((o) => sumLines(o, (l) => l.receivedQty), {
        id: 'receivedQty',
        header: t('inbound.receivedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((o) => sumLines(o, (l) => l.rejectedQty), {
        id: 'rejectedQty',
        header: t('inbound.rejectedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((o) => sumLines(o, (l) => l.putawayQty), {
        id: 'putawayQty',
        header: t('inbound.putawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.display({
        id: 'receiptProgress',
        header: t('inbound.receiptProgress'),
        cell: ({ row }) => <ProgressCell {...receiptProgress(row.original)} />,
      }),
      col.display({
        id: 'putawayProgress',
        header: t('inbound.putawayProgress'),
        cell: ({ row }) => <ProgressCell {...putawayProgress(row.original)} />,
      }),
      col.accessor('createdAt', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableHiding: false,
        meta: { pin: 'right' },
        cell: ({ row }) => {
          const o = row.original
          const canReceive = canReceiveInbound(o)
          const listSearch = searchParams.toString()
          // 横排、最多露 2 个；三个都可用时「PDA 收货」收进「更多」
          return (
            <RowActions
              actions={[
                {
                  key: 'receive',
                  label: t('inbound.receive.action'),
                  hidden: !canReceive,
                  onClick: () => navigate(`/wms/inbound/orders/${o.inboundNo}/receive`, { state: { listSearch } }),
                },
                {
                  key: 'close',
                  label: t('inbound.receiptClose'),
                  hidden: !canConfirmReceiptClose(o),
                  onClick: () => openReceiptClose(o),
                },
                {
                  key: 'pda',
                  label: t('inbound.openPdaReceive'),
                  hidden: !canReceive,
                  onClick: () => navigate('/pda/receive', { state: { inboundNo: o.inboundNo } }),
                },
              ]}
            />
          )
        },
      }),
    ])
  }, [t, customerCode, customerName, navigate, openReceiptClose, searchParams])

  return (
    <PageContainer
      fill
      title={t('menu.inboundOrders')}
      actions={
        <>
          <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
          <Button variant="outline" onClick={() => setMockOpen(true)}>
            <Radio data-icon="inline-start" />
            {t('inbound.mockPush')}
          </Button>
        </>
      }
    >
      {warehouseRows.length === 0 && (
        <Alert className="border-warning/40 bg-warning/5">
          <AlertTitle>{t('inbound.emptyWarehouseTitle')}</AlertTitle>
          <AlertDescription>{t('inbound.emptyWarehouseHint', { warehouse: warehouseLabel })}</AlertDescription>
        </Alert>
      )}

      <Panel className="p-4">
        <FilterBar
          onSearch={() => updateListState(draft, tab)}
          onReset={() => {
            setDraft(emptyInboundListFilters)
            updateListState(emptyInboundListFilters, tab)
          }}
          advanced={
            <>
              <FilterItem label={t('inbound.arrivalMethod')}>
                <OptionSelect
                  allOption
                  value={draft.arrivalMethod}
                  onValueChange={(v) => setDraft({ ...draft, arrivalMethod: v })}
                  options={INBOUND_ARRIVAL_METHODS.map((m) => ({ value: m, label: t(`enum.arrivalMethod.${m}`) }))}
                />
              </FilterItem>
              <FilterItem label={t('inbound.containerNo')}>
                <Input
                  value={draft.containerNo}
                  placeholder={t('inbound.filters.containerNoPlaceholder')}
                  onChange={(e) => setDraft({ ...draft, containerNo: e.target.value })}
                />
              </FilterItem>
              <FilterItem label={t('inbound.trackingNos')}>
                <Input
                  value={draft.trackingNo}
                  placeholder={t('inbound.filters.trackingNoPlaceholder')}
                  onChange={(e) => setDraft({ ...draft, trackingNo: e.target.value })}
                />
              </FilterItem>
              <FilterItem label={t('inbound.completedAt')}>
                <DateRangePickerField
                  value={{ from: draft.completedFrom, to: draft.completedTo }}
                  placeholder={t('inbound.filters.completedRangePlaceholder')}
                  onChange={(range) => setDraft({ ...draft, completedFrom: range.from, completedTo: range.to })}
                />
              </FilterItem>
            </>
          }
        >
          <FilterItem label={t('inbound.inboundNo')}>
            <Input
              value={draft.inboundNo}
              placeholder={t('inbound.filters.inboundNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, inboundNo: e.target.value })}
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
          <FilterItem label={t('inbound.bizType')}>
            <OptionSelect
              allOption
              value={draft.bizType}
              onValueChange={(v) => setDraft({ ...draft, bizType: v })}
              options={bizTypes.map((b) => ({ value: b, label: t(inboundBizTypeMeta[b].labelKey) }))}
            />
          </FilterItem>
          <FilterItem label={t('inbound.upstreamNo')}>
            <Input
              value={draft.upstreamNo}
              placeholder={t('inbound.filters.upstreamNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, upstreamNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('common.createdAt')}>
            <DateRangePickerField
              value={{ from: draft.createdFrom, to: draft.createdTo }}
              placeholder={t('inbound.filters.createdRangePlaceholder')}
              onChange={(range) => setDraft({ ...draft, createdFrom: range.from, createdTo: range.to })}
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
          getRowId={(o) => o.inboundNo}
          selectable={false}
          initialColumnVisibility={{ upstreamNo: false, rejectedQty: false }}
        />
      </Panel>

      <InboundMockPushDialog
        open={mockOpen}
        onClose={() => setMockOpen(false)}
        onSubmit={(input) => {
          const res = mockPushInboundInstruction(input)
          if (!res.ok) {
            toast.error(t(res.errorKey))
            return
          }
          toast.success(t('inbound.mockPushSuccess', { no: res.inboundNo }))
          setMockOpen(false)
        }}
      />

      <ReceiptCloseDialog
        order={closeOrder}
        onClose={() => setCloseOrder(undefined)}
        onConfirm={() => {
          if (!closeOrder) return
          const res = confirmReceiptClose(closeOrder.inboundNo)
          if (!res.ok) toast.error(t(res.errorKey))
          else toast.success(t('inbound.receiptCloseSuccess'))
          setCloseOrder(undefined)
        }}
      />

    </PageContainer>
  )
}
