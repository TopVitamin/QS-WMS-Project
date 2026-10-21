import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { outboundPickStatusMeta, pickSourceMeta } from '@/config/status'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { taskOwnerDoc, taskTotals } from '@/lib/outbound-derive'
import { emptyTaskListFilters, matchTask } from '@/lib/outbound-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { openTask } from '@/mock/outbound-actions'
import { useSettings } from '@/stores/settings'
import type { OutboundPickTask, PickStatus } from '@/types/outbound'

const STATUSES: PickStatus[] = ['PENDING_PICK', 'PICKING', 'COMPLETED', 'CLOSED']
const SOURCES: OutboundPickTask['source'][] = ['ORDER', 'WAVE', 'SUPPLEMENT']

/** 拣货任务列表（拣货任务前端Demo版PRD 第三节）：只读查询，拣货在 PDA 完成 */
export function OutboundPickTaskListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const tasks = useDb((s) => s.outboundPickTasks)
  const customers = useDb((s) => s.customers)
  const { customerCode, customerName } = useLookups()
  const list = useUrlListState(emptyTaskListFilters, STATUSES)
  const { draft, setDraft, listSearch } = list

  const filtered = useMemo(
    () => tasks.filter((x) => matchTask(x, warehouseCode, list.filters)),
    [tasks, warehouseCode, list.filters],
  )
  const rows = useMemo(() => {
    const base = list.tab === 'ALL' ? filtered : filtered.filter((x) => x.status === list.tab)
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.no.localeCompare(a.no))
  }, [filtered, list.tab])
  const tabItems = (['ALL', ...STATUSES] as const).map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(outboundPickStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((x) => x.status === s).length,
  }))

  const columns = useMemo(() => {
    const col = createDataColumns<OutboundPickTask>()
    const qty = (id: 'planned' | 'picked' | 'short', header: string) =>
      col.accessor((x) => taskTotals(x)[id], {
        id,
        header,
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.taskNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/pick-tasks/${getValue()}`, { state: { listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={outboundPickStatusMeta[getValue()]} />,
      }),
      col.accessor('source', {
        header: t('outbound.ui.taskSource'),
        cell: ({ getValue }) => <TagLabel meta={pickSourceMeta[getValue()]} />,
      }),
      col.accessor((x) => taskOwnerDoc(x)?.no ?? '', {
        id: 'belongsTo',
        header: t('outbound.ui.belongsTo'),
        cell: ({ row }) => {
          const doc = taskOwnerDoc(row.original)
          return doc ? (
            <DocNo onClick={() => navigate(`/wms/outbound/${doc.kind}/${doc.no}`)}>{doc.no}</DocNo>
          ) : (
            <Empty />
          )
        },
      }),
      col.accessor('customerId', {
        header: t('outbound.ui.owner'),
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />
        ),
      }),
      qty('planned', t('outbound.ui.planned')),
      qty('picked', t('outbound.ui.pickedQty')),
      qty('short', t('outbound.ui.short')),
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
                label: t('outbound.entry.pickAction'),
                hidden: !openTask(row.original),
                onClick: () => navigate(`/wms/outbound/pick-tasks/${row.original.no}/entry`),
              },
              {
                key: 'pick',
                label: t('outbound.ui.goPick'),
                hidden: !openTask(row.original),
                onClick: () => navigate(`/pda/pick?step=work&no=${row.original.no}`),
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
      title={t('menu.pickTasks')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6} onSearch={list.search} onReset={list.reset}>
          <FilterItem label={t('outbound.ui.taskNo')}>
            <Input
              value={draft.no}
              placeholder={t('outbound.ui.taskNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, no: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.no')}>
            <Input
              value={draft.orderNo}
              placeholder={t('outbound.ui.noPlaceholder')}
              onChange={(e) => setDraft({ ...draft, orderNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('outbound.ui.taskSource')}>
            <OptionSelect
              allOption
              value={draft.source}
              placeholder={t('common.selectPlaceholder')}
              onValueChange={(v) => setDraft({ ...draft, source: v })}
              options={SOURCES.map((v) => ({ value: v, label: t(pickSourceMeta[v].labelKey) }))}
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
        <DataTable className="flex-1" data={rows} columns={columns} getRowId={(x) => x.no} selectable={false} />
      </Panel>
    </PageContainer>
  )
}
