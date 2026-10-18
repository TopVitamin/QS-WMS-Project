import { Download } from 'lucide-react'
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
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { outboundCompositionMeta, outboundStatusMeta, outboundTypeMeta } from '@/config/status'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { orderComposition, orderTotals } from '@/lib/outbound-derive'
import { emptyOrderListFilters, matchOrder } from '@/lib/outbound-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundOrder, OutboundStatus } from '@/types/outbound'
import { MessagesDialog } from './messages-dialog'
import { OutboundMockDialog } from './mock-dialog'
import { outboundTypes } from './outbound-helpers'
import { useOutboundRun } from './use-outbound-action'

const STATUSES: OutboundStatus[] = [
  'PENDING_HANDLE',
  'PENDING_PICK',
  'PENDING_VERIFY',
  'PENDING_SHIPMENT',
  'SHIPPED',
  'CANCELLED',
]
const canWave = (o: OutboundOrder) => o.type === 'B2C' && o.status === 'PENDING_HANDLE'
const canOrganizePick = (o: OutboundOrder) => o.status === 'PENDING_HANDLE'

/** 出库单列表：待处理单可勾选；工具栏按单生成任务或组波批量拣货 */
export function OutboundOrderListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const orders = useDb((s) => s.outboundOrders)
  const customers = useDb((s) => s.customers)
  const channelMasters = useDb((s) => s.channelMasters)
  const carrierMasters = useDb((s) => s.carrierMasters)
  const { customerCode, customerName } = useLookups()
  const channelByCode = useMemo(() => new Map(channelMasters.map((c) => [c.code, c])), [channelMasters])
  const carrierByCode = useMemo(() => new Map(carrierMasters.map((c) => [c.code, c])), [carrierMasters])
  const run = useOutboundRun()
  const list = useUrlListState(emptyOrderListFilters, STATUSES)
  const [dialog, setDialog] = useState<'CREATE' | 'MANUAL' | 'MESSAGES'>()
  const [selected, setSelected] = useState<OutboundOrder[]>([])

  const filtered = useMemo(
    () => orders.filter((o) => matchOrder(o, warehouseCode, list.filters)),
    [orders, warehouseCode, list.filters],
  )
  const rows = useMemo(() => {
    const base = list.tab === 'ALL' ? filtered : filtered.filter((o) => o.status === list.tab)
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.no.localeCompare(a.no))
  }, [filtered, list.tab])
  const tabItems = (['ALL', ...STATUSES] as const).map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(outboundStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((o) => o.status === s).length,
  }))

  const listSearch = list.listSearch
  const columns = useMemo(() => {
    const col = createDataColumns<OutboundOrder>()
    const qty = (
      id: 'demand' | 'reserved' | 'shortage' | 'waiting' | 'picked' | 'verified' | 'shipped',
      header: string,
    ) =>
      col.accessor((o) => orderTotals(o)[id] ?? -1, {
        id,
        header,
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => (getValue() < 0 ? <Empty /> : <Num value={getValue()} />),
      })
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.no'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/orders/${getValue()}`, { state: { listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={outboundStatusMeta[getValue()]} />,
      }),
      col.accessor('type', {
        header: t('outbound.ui.type'),
        cell: ({ getValue }) => <TagLabel meta={outboundTypeMeta[getValue()]} />,
      }),
      col.accessor((o) => orderComposition(o), {
        id: 'composition',
        header: t('outbound.ui.composition'),
        cell: ({ getValue }) => <TagLabel meta={outboundCompositionMeta[getValue()]} />,
      }),
      col.accessor('channelCode', {
        header: t('outbound.ui.channel'),
        cell: ({ getValue }) => {
          const ch = getValue() ? channelByCode.get(getValue()!) : undefined
          return ch ? <CodeName code={ch.code} name={ch.name} className="max-w-44" /> : <Empty />
        },
      }),
      col.accessor((o) => channelByCode.get(o.channelCode ?? '')?.carrierCode, {
        id: 'carrier',
        header: t('outbound.ui.carrier'),
        cell: ({ getValue }) => {
          const c = getValue() ? carrierByCode.get(getValue()!) : undefined
          return c ? <CodeName code={c.code} name={c.name} className="max-w-40" /> : <Empty />
        },
      }),
      col.accessor('customerId', {
        header: t('outbound.ui.owner'),
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />
        ),
      }),
      qty('demand', t('outbound.ui.demand')),
      qty('reserved', t('outbound.ui.reserved')),
      qty('shortage', t('outbound.ui.shortage')),
      qty('waiting', t('outbound.ui.waiting')),
      qty('picked', t('outbound.ui.picked')),
      qty('verified', t('outbound.ui.verified')),
      // 实发未出库时为 undefined，列表按 0 显示，与字段清单「确认时定型」一致
      col.accessor((o) => orderTotals(o).shipped ?? 0, {
        id: 'shipped',
        header: t('outbound.ui.shipped'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('createdAt', {
        header: t('outbound.ui.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('upstreamNo', {
        header: t('outbound.ui.upstream'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('recipient', {
        header: t('outbound.ui.recipient'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('phone', {
        header: t('outbound.ui.phone'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('source', {
        header: t('outbound.ui.source'),
        cell: ({ getValue }) => <TagLabel meta={{ tone: 'gray', labelKey: `outbound.sources.${getValue()}` }} />,
      }),
    ])
  }, [carrierByCode, channelByCode, customerCode, customerName, listSearch, navigate, t])

  const operator = useSettings((s) => s.operator)
  const { draft, setDraft } = list
  const selectedAllHandle = selected.length > 0 && selected.every(canOrganizePick)
  const canWaveSelection = selected.length >= 2 && selected.every(canWave)

  const allocateSelected = () => {
    let ok = 0
    let lastTaskNo: string | undefined
    for (const o of selected) {
      const result = useDb.getState().outboundAction({ type: 'ALLOCATE', no: o.no }, operator)
      if (!result.ok) {
        toast.error(t(result.errorKey, result.params))
        break
      }
      ok += 1
      lastTaskNo = result.no
    }
    if (ok > 0) {
      toast.success(
        ok === 1 && lastTaskNo
          ? t('outbound.ui.toastAllocated', { no: lastTaskNo })
          : t('outbound.ui.toastAllocatedBatch', { count: ok }),
      )
      setSelected([])
    }
  }

  return (
    <PageContainer
      fill
      title={t('menu.outboundOrders')}
      actions={
        <>
          <Button onClick={() => setDialog('MANUAL')}>{t('outbound.ui.createOther')}</Button>
          <Button variant="outline" onClick={() => setDialog('CREATE')}>
            {t('outbound.ui.mock')}
          </Button>
          <Button variant="outline" onClick={() => setDialog('MESSAGES')}>
            {t('outbound.ui.messages')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar
          onSearch={list.search}
          onReset={list.reset}
          advanced={
            <FilterItem label={t('outbound.ui.originalInbound')}>
              <Input
                value={draft.inbound}
                placeholder={t('outbound.ui.inboundPlaceholder')}
                onChange={(e) => setDraft({ ...draft, inbound: e.target.value })}
              />
            </FilterItem>
          }
        >
          <FilterItem label={t('outbound.ui.no')}>
            <Input
              value={draft.no}
              placeholder={t('outbound.ui.noPlaceholder')}
              onChange={(e) => setDraft({ ...draft, no: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.upstream')}>
            <Input
              value={draft.upstream}
              placeholder={t('outbound.ui.upstreamPlaceholder')}
              onChange={(e) => setDraft({ ...draft, upstream: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.type')}>
            <OptionSelect
              allOption
              value={draft.type}
              placeholder={t('common.selectPlaceholder')}
              onValueChange={(v) => setDraft({ ...draft, type: v })}
              options={outboundTypes.map((v) => ({ value: v, label: t(outboundTypeMeta[v].labelKey) }))}
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
          <FilterItem label={t('outbound.ui.createdAt')}>
            <DateRangePickerField
              value={{ from: draft.createdFrom, to: draft.createdTo }}
              placeholder={t('outbound.ui.createdRangePlaceholder')}
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
          getRowId={(o) => o.no}
          selectable
          canSelectRow={canOrganizePick}
          onSelectionChange={setSelected}
          initialColumnVisibility={{ source: false, recipient: false, phone: false }}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
                {selectedAllHandle && (
                  <Button size="sm" onClick={allocateSelected}>
                    {t('outbound.ui.listAllocateByOrder')}
                  </Button>
                )}
                {canWaveSelection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const r = run({ type: 'WAVE', orderNos: selected.map((o) => o.no) }, (no) =>
                        t('outbound.ui.toastWave', { no, count: selected.length }),
                      )
                      if (r?.no) {
                        setSelected([])
                        navigate(`/wms/outbound/waves/${r.no}`)
                      }
                    }}
                  >
                    {t('outbound.ui.listCreateWave')}
                  </Button>
                )}
                {!selectedAllHandle && !canWaveSelection && (
                  <span className="text-xs text-muted-foreground">{t('outbound.ui.organizePickHint')}</span>
                )}
              </div>
          }
        />
      </Panel>

      {(dialog === 'CREATE' || dialog === 'MANUAL') && (
        <OutboundMockDialog
          mode={dialog}
          onClose={() => setDialog(undefined)}
          onCreated={(no) => navigate(`/wms/outbound/orders/${no}`)}
        />
      )}
      {dialog === 'MESSAGES' && <MessagesDialog onClose={() => setDialog(undefined)} />}
    </PageContainer>
  )
}
