import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { CodeName, DateTime, DocNo, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { outboundPutbackStatusMeta, unpickReasonMeta } from '@/config/status'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { putbackExpected, putbackReturned } from '@/lib/outbound-derive'
import { emptyPutbackListFilters, matchPutback } from '@/lib/outbound-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundPutback } from '@/types/outbound'

const STATUSES: OutboundPutback['status'][] = ['PENDING', 'PUTAWAYING', 'COMPLETED']
const REASONS: OutboundPutback['reason'][] = ['CANCEL', 'MISSING', 'DAMAGED']

/** 返库上架单列表（返库上架单前端Demo版PRD 第三节）：只读查询，返库在 PDA 完成 */
export function OutboundPutbackListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const putbacks = useDb((s) => s.outboundPutbacks)
  const customers = useDb((s) => s.customers)
  const { customerCode, customerName } = useLookups()
  const list = useUrlListState(emptyPutbackListFilters, STATUSES)
  const { draft, setDraft, listSearch } = list

  const filtered = useMemo(
    () => putbacks.filter((p) => matchPutback(p, warehouseCode, list.filters)),
    [putbacks, warehouseCode, list.filters],
  )
  const rows = useMemo(() => {
    const base = list.tab === 'ALL' ? filtered : filtered.filter((p) => p.status === list.tab)
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.no.localeCompare(a.no))
  }, [filtered, list.tab])
  const tabItems = (['ALL', ...STATUSES] as const).map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(outboundPutbackStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((p) => p.status === s).length,
  }))

  const columns = useMemo(() => {
    const col = createDataColumns<OutboundPutback>()
    const qty = (id: string, header: string, value: (p: OutboundPutback) => number) =>
      col.accessor(value, {
        id,
        header,
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.putbackNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/return-putaway/${getValue()}`, { state: { listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={outboundPutbackStatusMeta[getValue()]} />,
      }),
      col.accessor('reason', {
        header: t('outbound.ui.reason'),
        cell: ({ getValue }) => <TagLabel meta={unpickReasonMeta[getValue()]} />,
      }),
      col.accessor('orderNo', {
        header: t('outbound.ui.sourceOrder'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/orders/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('customerId', {
        header: t('outbound.ui.owner'),
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />
        ),
      }),
      qty('expected', t('outbound.ui.expected'), putbackExpected),
      qty('returned', t('outbound.ui.returned'), putbackReturned),
      col.accessor('createdAt', {
        header: t('outbound.ui.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('completedAt', {
        header: t('outbound.ui.submittedAt'),
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
                key: 'entry',
                label: t('outbound.entry.returnAction'),
                hidden: row.original.status === 'COMPLETED',
                onClick: () => navigate(`/wms/outbound/return-putaway/${row.original.no}/entry`),
              },
              {
                key: 'putback',
                label: t('outbound.ui.goPutback'),
                hidden: row.original.status === 'COMPLETED',
                onClick: () => navigate(`/pda/return-putaway?step=work&no=${row.original.no}`),
              },
            ]}
          />
        ),
      }),
    ])
  }, [customerCode, customerName, listSearch, navigate, t])

  return (
    <PageContainer
      fill
      title={t('menu.outboundPutbacks')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar onSearch={list.search} onReset={list.reset}>
          <FilterItem label={t('outbound.ui.putbackNo')}>
            <Input
              value={draft.no}
              placeholder={t('outbound.ui.putbackNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, no: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.sourceOrder')}>
            <Input
              value={draft.orderNo}
              placeholder={t('outbound.ui.noPlaceholder')}
              onChange={(e) => setDraft({ ...draft, orderNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.reason')}>
            <OptionSelect
              allOption
              value={draft.reason}
              placeholder={t('common.selectPlaceholder')}
              onValueChange={(v) => setDraft({ ...draft, reason: v })}
              options={REASONS.map((v) => ({ value: v, label: t(unpickReasonMeta[v].labelKey) }))}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.owner')}>
            <OptionSelect
              allOption
              value={draft.customerId}
              placeholder={t('common.selectPlaceholder')}
              onValueChange={(v) => setDraft({ ...draft, customerId: v })}
              options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
            />
          </FilterItem>
        </FilterBar>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <StatusTabs items={tabItems} value={list.tab} onChange={list.setTab} />
        <DataTable className="flex-1" data={rows} columns={columns} getRowId={(p) => p.no} selectable={false} />
      </Panel>
    </PageContainer>
  )
}
