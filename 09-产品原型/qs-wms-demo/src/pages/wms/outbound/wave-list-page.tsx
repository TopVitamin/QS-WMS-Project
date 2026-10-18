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
import { StatusBadge } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { outboundWaveStatusMeta } from '@/config/status'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { taskTotals, waveStatus } from '@/lib/outbound-derive'
import { emptyWaveListFilters, matchWave } from '@/lib/outbound-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundWave } from '@/types/outbound'

const STATUSES = ['ALLOCATED', 'RELEASED', 'COMPLETED', 'CANCELLED'] as const
type Row = OutboundWave & { status: (typeof STATUSES)[number]; planned: number; picked: number }

/** 波次列表（波次前端Demo版PRD 第三节）：只读查询，组波入口在出库单列表 */
export function OutboundWaveListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const waves = useDb((s) => s.outboundWaves)
  const tasks = useDb((s) => s.outboundPickTasks)
  const customers = useDb((s) => s.customers)
  const { customerCode, customerName } = useLookups()
  const list = useUrlListState(emptyWaveListFilters, STATUSES)
  const { draft, setDraft, listSearch } = list

  const filtered = useMemo<Row[]>(
    () =>
      waves
        .filter((w) => matchWave(w, warehouseCode, list.filters))
        .map((w) => {
          const task = tasks.find((x) => x.no === w.taskNo)
          const qty = task ? taskTotals(task) : { planned: 0, picked: 0 }
          return { ...w, status: waveStatus(w, tasks), planned: qty.planned, picked: qty.picked }
        }),
    [waves, tasks, warehouseCode, list.filters],
  )
  const rows = useMemo(() => {
    const base = list.tab === 'ALL' ? filtered : filtered.filter((w) => w.status === list.tab)
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [filtered, list.tab])
  const tabItems = (['ALL', ...STATUSES] as const).map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(outboundWaveStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((w) => w.status === s).length,
  }))

  const columns = useMemo(() => {
    const col = createDataColumns<Row>()
    const qty = (id: 'planned' | 'picked', header: string) =>
      col.accessor(id, {
        header,
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.waveNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/waves/${getValue()}`, { state: { listSearch } })}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={outboundWaveStatusMeta[getValue()]} />,
      }),
      col.accessor('customerId', {
        header: t('outbound.ui.owner'),
        cell: ({ getValue }) => (
          <CodeName code={customerCode(getValue())} name={customerName(getValue())} className="max-w-52" />
        ),
      }),
      col.accessor('taskNo', {
        header: t('outbound.ui.waveTask'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/pick-tasks/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor((w) => w.members.length, {
        id: 'memberCount',
        header: t('outbound.ui.waveOrderCount'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      qty('planned', t('outbound.ui.planned')),
      qty('picked', t('outbound.ui.pickedQty')),
      col.accessor('createdAt', {
        header: t('outbound.ui.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [customerCode, customerName, listSearch, navigate, t])

  return (
    <PageContainer
      fill
      title={t('menu.outboundWaves')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar onSearch={list.search} onReset={list.reset}>
          <FilterItem label={t('outbound.ui.waveNo')}>
            <Input
              value={draft.no}
              placeholder={t('outbound.ui.waveNoPlaceholder')}
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
        <DataTable className="flex-1" data={rows} columns={columns} getRowId={(w) => w.no} selectable={false} />
      </Panel>
    </PageContainer>
  )
}
