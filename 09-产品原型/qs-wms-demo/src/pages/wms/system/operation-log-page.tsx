import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, DateTime, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useListFilters } from '@/hooks/use-list-filters'
import { FILTER_ALL } from '@/lib/master-data'
import { useDb } from '@/mock/db'
import type { AuditAction, AuditLog, AuditRefType } from '@/types/wms'

const REF_TYPES: AuditRefType[] = [
  'INBOUND',
  'RETURN',
  'PUTAWAY',
  'OUTBOUND',
  'WAVE',
  'PICK_TASK',
  'PUTBACK',
  'STOCKTAKE',
  'STOCK_MOVE',
  'INVENTORY',
  'MASTER',
  'SYSTEM',
]
const ACTIONS: AuditAction[] = [
  'INBOUND_MOCK_PUSH',
  'INBOUND_MOCK_CHANGE',
  'INBOUND_MOCK_CANCEL',
  'INBOUND_RECEIVE',
  'INBOUND_RECEIPT_CLOSE',
  'INBOUND_RESULT_RETRY',
  'RETURN_RECEIVE',
  'RETURN_MOCK_FORECAST',
  'RETURN_DELIVERY_FAILED_CREATE',
  'RETURN_RESULT_RETRY',
  'RETURN_CANCEL',
  'MASTER_MOCK_PUSH',
  'PUTAWAY_SAVE',
  'PUTAWAY_REMOVE',
  'PUTAWAY',
  'OUTBOUND_ACTION',
  'INVENTORY_ACTION',
  'NEW_SKU_MEASURE',
  'UNCLAIMED_REGISTER',
  'DEMO_RESET',
]

interface Filters {
  refNo: string
  refType: string
  action: string
  operator: string
  from: string
  to: string
}
const empty: Filters = {
  refNo: '',
  refType: FILTER_ALL,
  action: FILTER_ALL,
  operator: FILTER_ALL,
  from: '',
  to: '',
}

function match(log: AuditLog, f: Filters): boolean {
  if (f.refNo.trim() && !log.refNo.toLowerCase().includes(f.refNo.trim().toLowerCase())) return false
  if (f.refType !== FILTER_ALL && log.refType !== f.refType) return false
  if (f.action !== FILTER_ALL && log.action !== f.action) return false
  if (f.operator !== FILTER_ALL && log.operator !== f.operator) return false
  const ts = new Date(log.createdAt).getTime()
  if (f.from && ts < new Date(f.from).getTime()) return false
  if (f.to && ts > new Date(f.to).getTime() + 86_400_000) return false
  return true
}

/** 系统设置 → 操作记录：按对象/动作/操作人/时间查询关键动作留痕 */
export function OperationLogPage() {
  const { t } = useTranslation()
  const logs = useDb((s) => s.auditLogs)
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(empty)
  const operators = useMemo(() => [...new Set(logs.map((l) => l.operator))].sort(), [logs])
  const rows = useMemo(
    () => logs.filter((l) => match(l, filters)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filters, logs],
  )
  const columns = useMemo(() => {
    const col = createDataColumns<AuditLog>()
    return col.columns([
      col.accessor('createdAt', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('action', {
        header: t('inbound.tabs.logAction'),
        cell: ({ getValue }) => t(`audit.action.${getValue()}`),
      }),
      col.accessor('refType', {
        header: t('audit.object'),
        cell: ({ getValue }) => t(`audit.refType.${getValue()}`),
      }),
      col.accessor('refNo', {
        header: t('inbound.inboundNo'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('operator', { header: t('common.operator') }),
      col.accessor('detail', {
        header: t('inbound.tabs.logDetail'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
    ])
  }, [t])

  return (
    <PageContainer
      fill
      title={t('menu.operationLogs')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6} onSearch={applySearch} onReset={reset}>
          <FilterItem label={t('inbound.inboundNo')}>
            <Input
              value={draft.refNo}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setDraft({ ...draft, refNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('audit.object')}>
            <OptionSelect
              allOption
              value={draft.refType}
              onValueChange={(v) => setDraft({ ...draft, refType: v })}
              options={REF_TYPES.map((v) => ({ value: v, label: t(`audit.refType.${v}`) }))}
            />
          </FilterItem>
          <FilterItem label={t('inbound.tabs.logAction')}>
            <OptionSelect
              allOption
              value={draft.action}
              onValueChange={(v) => setDraft({ ...draft, action: v })}
              options={ACTIONS.map((v) => ({ value: v, label: t(`audit.action.${v}`) }))}
            />
          </FilterItem>
          <FilterItem label={t('common.operator')}>
            <OptionSelect
              allOption
              value={draft.operator}
              onValueChange={(v) => setDraft({ ...draft, operator: v })}
              options={operators.map((v) => ({ value: v, label: v }))}
            />
          </FilterItem>
          <FilterItem label={t('common.createdAt')}>
            <DateRangePickerField
              value={{ from: draft.from, to: draft.to }}
              placeholder={t('common.dateRangePlaceholder')}
              onChange={(r) => setDraft({ ...draft, from: r.from, to: r.to })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(l) => l.id}
          selectable={false}
          emptyText={t('audit.empty')}
        />
      </Panel>
    </PageContainer>
  )
}
