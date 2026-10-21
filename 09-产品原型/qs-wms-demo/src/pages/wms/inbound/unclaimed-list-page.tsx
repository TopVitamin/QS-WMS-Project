import { Plus, Download } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { unclaimedStatusMeta } from '@/config/status'
import {
  emptyUnclaimedListFilters,
  matchUnclaimedListFilters,
  type UnclaimedListFilters,
} from '@/lib/unclaimed-list-match'
import { useDb } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { UnclaimedRecord } from '@/types/inbound'
import { UnclaimedDetailSheet } from './unclaimed-detail-sheet'
import { UnclaimedRegisterDialog } from './unclaimed-register-dialog'

function parseListState(params: URLSearchParams): UnclaimedListFilters {
  return {
    registerNo: params.get('registerNo') ?? '',
    trackingNo: params.get('trackingNo') ?? '',
    cartonMark: params.get('cartonMark') ?? '',
    containerNo: params.get('container') ?? '',
    registeredFrom: params.get('registeredFrom') ?? '',
    registeredTo: params.get('registeredTo') ?? '',
  }
}

function toSearchParams(filters: UnclaimedListFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.registerNo) params.set('registerNo', filters.registerNo)
  if (filters.trackingNo) params.set('trackingNo', filters.trackingNo)
  if (filters.cartonMark) params.set('cartonMark', filters.cartonMark)
  if (filters.containerNo) params.set('container', filters.containerNo)
  if (filters.registeredFrom) params.set('registeredFrom', filters.registeredFrom)
  if (filters.registeredTo) params.set('registeredTo', filters.registeredTo)
  return params
}

/** 首项 + 「+N」；悬停看全部（无主货登记页面骨架「绘制约定」） */
function CodeListCell({ values }: { values: string[] }) {
  if (values.length === 0) return <Empty />
  const first = values[0]
  if (values.length === 1) return <span className="tabular-nums">{first}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="tabular-nums">
          {first} <span className="text-muted-foreground">+{values.length - 1}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 whitespace-pre-line">
        {values.join('\n')}
      </TooltipContent>
    </Tooltip>
  )
}

/** 无主货登记列表：只查本仓、只登记（无主货登记主PRD 第四节）；无状态页签、无操作列 */
export function UnclaimedListPage() {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const records = useDb((s) => s.unclaimedRecords)
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseListState(searchParams), [searchParams])
  const [draft, setDraft] = useState<UnclaimedListFilters>(filters)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [detail, setDetail] = useState<UnclaimedRecord>()

  const [syncedFilters, setSyncedFilters] = useState(filters)
  if (syncedFilters !== filters) {
    setSyncedFilters(filters)
    setDraft(filters)
  }

  const applyFilters = useCallback(
    (next: UnclaimedListFilters) => {
      setSearchParams(toSearchParams(next), { replace: true })
    },
    [setSearchParams],
  )

  const rows = useMemo(
    () =>
      records
        .filter((r) => matchUnclaimedListFilters(r, warehouseCode, filters))
        .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)),
    [records, warehouseCode, filters],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<UnclaimedRecord>()
    return col.columns([
      col.accessor('registerNo', {
        header: t('unclaimed.registerNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ row }) => (
          <DocNo onClick={() => setDetail(row.original)}>{row.original.registerNo}</DocNo>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={unclaimedStatusMeta[getValue()]} />,
      }),
      col.accessor('trackingNos', {
        header: t('unclaimed.trackingNos'),
        cell: ({ getValue }) => <CodeListCell values={getValue()} />,
      }),
      col.accessor('cartonMarks', {
        header: t('unclaimed.cartonMarks'),
        cell: ({ getValue }) => <CodeListCell values={getValue()} />,
      }),
      col.accessor('containerNo', {
        header: t('unclaimed.containerNo'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor('cartonQty', {
        header: t('unclaimed.cartonQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('description', {
        header: t('unclaimed.description'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('registeredBy', { header: t('unclaimed.registeredBy') }),
      col.accessor('registeredAt', {
        header: t('unclaimed.registeredAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [t])

  return (
    <PageContainer
      fill
      title={t('menu.unclaimed')}
      actions={
        <>
          <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus data-icon="inline-start" />
            {t('unclaimed.create')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6}
          onSearch={() => applyFilters(draft)}
          onReset={() => {
            setDraft(emptyUnclaimedListFilters)
            applyFilters(emptyUnclaimedListFilters)
          }}
        >
          <FilterItem label={t('unclaimed.registerNo')}>
            <Input
              value={draft.registerNo}
              placeholder={t('unclaimed.filters.registerNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, registerNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('unclaimed.trackingNos')}>
            <Input
              value={draft.trackingNo}
              placeholder={t('unclaimed.filters.trackingNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, trackingNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('unclaimed.cartonMarks')}>
            <Input
              value={draft.cartonMark}
              placeholder={t('unclaimed.filters.cartonMarkPlaceholder')}
              onChange={(e) => setDraft({ ...draft, cartonMark: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('unclaimed.containerNo')}>
            <Input
              value={draft.containerNo}
              placeholder={t('unclaimed.filters.containerNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, containerNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('unclaimed.registeredAt')}>
            <DateRangePickerField
              value={{ from: draft.registeredFrom, to: draft.registeredTo }}
              placeholder={t('unclaimed.filters.registeredRangePlaceholder')}
              onChange={(range) => setDraft({ ...draft, registeredFrom: range.from, registeredTo: range.to })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(r) => r.registerNo}
          selectable={false}
          initialColumnVisibility={{ description: false }}
        />
      </Panel>

      <UnclaimedRegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <UnclaimedDetailSheet record={detail} onClose={() => setDetail(undefined)} />
    </PageContainer>
  )
}
