import { Download, Radio } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { returnOrderStatusMeta, returnSourceMeta } from '@/config/status'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { codeNameText } from '@/lib/typography'
import { canReceiveReturn, sumReturnLines } from '@/lib/return-derive'
import { emptyReturnListFilters, matchReturn } from '@/lib/return-list-match'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { ReturnOrder, ReturnOrderStatus, ReturnSourceType } from '@/types/return'
import { ReturnForecastDialog } from './return-dialogs'

const STATUSES: ReturnOrderStatus[] = ['PENDING_RECEIVE', 'RECEIVING', 'PUTAWAYING', 'COMPLETED', 'CANCELLED']
const SOURCES: ReturnSourceType[] = ['CUSTOMER', 'PLATFORM', 'DELIVERY_FAILED']

export function ReturnListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const orders = useDb((s) => s.returnOrders)
  const customers = useDb((s) => s.customers)
  const { customerCode, customerName } = useLookups()
  const list = useUrlListState(emptyReturnListFilters, STATUSES)
  const { draft, setDraft, filters } = list
  const [forecastOpen, setForecastOpen] = useState(false)

  const filtered = useMemo(
    () => orders.filter((o) => matchReturn(o, warehouseCode, filters)),
    [filters, orders, warehouseCode],
  )
  const rows = useMemo(() => {
    const base = list.tab === 'ALL' ? filtered : filtered.filter((o) => o.status === list.tab)
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.returnNo.localeCompare(a.returnNo))
  }, [filtered, list.tab])
  const tabItems = (['ALL', ...STATUSES] as const).map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(returnOrderStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((o) => o.status === s).length,
  }))

  const columns = useMemo(() => {
    const col = createDataColumns<ReturnOrder>()
    const qty = (id: 'planned' | 'received' | 'rejected' | 'putaway', header: string) =>
      col.accessor((o) => {
        if (id === 'planned') return sumReturnLines(o, (l) => l.plannedQty)
        if (id === 'received') return sumReturnLines(o, (l) => l.receivedQty)
        if (id === 'rejected') return sumReturnLines(o, (l) => l.rejectedQty)
        return sumReturnLines(o, (l) => l.putawayQty)
      }, {
        id,
        header,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('returnNo', {
        header: t('return.returnNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/returns/orders/${getValue()}`, { state: { listSearch: list.listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={returnOrderStatusMeta[getValue()]} />,
      }),
      col.accessor('sourceType', {
        header: t('return.sourceType'),
        cell: ({ getValue }) => <TagLabel meta={returnSourceMeta[getValue()]} />,
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />
        ),
      }),
      col.accessor('upstreamNo', { header: t('return.upstreamNo') }),
      col.accessor('originalOutboundNo', {
        header: t('return.originalOutboundNo'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((o) => new Set(o.items.map((line) => line.skuCode)).size, {
        id: 'skuCount',
        header: t('return.columns.skuCount'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      qty('planned', t('return.columns.plannedQty')),
      qty('received', t('return.columns.receivedQty')),
      qty('rejected', t('return.columns.rejectedQty')),
      qty('putaway', t('return.columns.putawayQty')),
      col.accessor('createdAt', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                key: 'receive',
                label: t('return.receive.action'),
                hidden: !canReceiveReturn(row.original),
                onClick: () =>
                  navigate(`/wms/returns/orders/${row.original.returnNo}/receive`, {
                    state: { listSearch: list.listSearch },
                  }),
              },
              {
                key: 'pda',
                label: t('return.receive.openPda'),
                hidden: !canReceiveReturn(row.original),
                onClick: () => navigate(`/pda/return-receive?no=${row.original.returnNo}`),
              },
            ]}
          />
        ),
      }),
    ])
  }, [customerCode, customerName, list.listSearch, navigate, t])

  return (
    <PageContainer
      fill
      title={t('menu.returnOrders')}
      actions={
        <>
          <Button onClick={() => setForecastOpen(true)}>
            <Radio data-icon="inline-start" />
            {t('return.forecast.action')}
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
          <FilterItem label={t('return.returnNo')}>
            <Input
              value={draft.returnNo}
              placeholder={t('return.filters.returnNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, returnNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('return.upstreamNo')}>
            <Input
              value={draft.upstreamNo}
              placeholder={t('return.filters.upstreamNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, upstreamNo: e.target.value })}
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
          <FilterItem label={t('return.sourceType')}>
            <OptionSelect
              allOption
              value={draft.sourceType}
              onValueChange={(v) => setDraft({ ...draft, sourceType: v })}
              options={SOURCES.map((s) => ({ value: s, label: t(returnSourceMeta[s].labelKey) }))}
            />
          </FilterItem>
          <FilterItem label={t('common.createdAt')}>
            <DateRangePickerField
              value={{ from: draft.createdFrom, to: draft.createdTo }}
              placeholder={t('return.filters.createdRangePlaceholder')}
              onChange={(r) => setDraft({ ...draft, createdFrom: r.from, createdTo: r.to })}
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
          getRowId={(o) => o.returnNo}
          selectable={false}
          emptyText={t('common.noData')}
        />
      </Panel>
      {forecastOpen && (
        <ReturnForecastDialog
          onClose={() => setForecastOpen(false)}
          onCreated={(no) => navigate(`/wms/returns/orders/${no}`)}
        />
      )}
    </PageContainer>
  )
}
