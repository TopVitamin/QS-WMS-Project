import { Download, MoreHorizontal, Plus, Truck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, DocNo, Num } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { StatusTabs } from '@/components/biz/status-tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { inboundStatusMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useInbound } from '@/hooks/use-inbound'
import { useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { InboundBizType, InboundOrder, InboundStatus } from '@/types/wms'
import { InboundDetailSheet } from './inbound-detail-sheet'
import { PrintLabelDialog } from './print-label-dialog'

type StatusTab = 'ALL' | InboundStatus
const statusTabs: StatusTab[] = ['ALL', 'PENDING', 'ARRIVED', 'RECEIVING', 'PARTIAL_PUT', 'COMPLETED', 'ABNORMAL', 'CANCELLED']
const bizTypes: InboundBizType[] = ['STANDARD', 'FBA_RETURN', 'TRANSFER']
const ALL = '__all'

interface Filters {
  keyword: string
  customerId: string
  bizType: string
  created: 'all' | '7' | '30'
}
const emptyFilters: Filters = { keyword: '', customerId: ALL, bizType: ALL, created: 'all' }
const createdOptions = new Set<Filters['created']>(['all', '7', '30'])

function parseListState(params: URLSearchParams): { filters: Filters; tab: StatusTab } {
  const status = params.get('status') ?? 'ALL'
  const tab = statusTabs.includes(status as StatusTab) ? (status as StatusTab) : 'ALL'
  const created = params.get('created') ?? 'all'
  return {
    tab,
    filters: {
      keyword: params.get('keyword') ?? '',
      customerId: params.get('customer') ?? ALL,
      bizType: params.get('bizType') ?? ALL,
      created: createdOptions.has(created as Filters['created']) ? (created as Filters['created']) : 'all',
    },
  }
}

function toSearchParams(filters: Filters, tab: StatusTab): URLSearchParams {
  const params = new URLSearchParams()
  if (tab !== 'ALL') params.set('status', tab)
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.customerId !== ALL) params.set('customer', filters.customerId)
  if (filters.bizType !== ALL) params.set('bizType', filters.bizType)
  if (filters.created !== 'all') params.set('created', filters.created)
  return params
}

const sum = (o: InboundOrder, key: 'plannedQty' | 'receivedGoodQty' | 'receivedDefectQty' | 'putawayQty') =>
  o.items.reduce((s, i) => s + i[key], 0)

export function InboundListPage() {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const { inbounds, customers, signInbound, cancelInbound } = useInbound()
  const { customerCode, customerName } = useLookups()
  const [searchParams, setSearchParams] = useSearchParams()

  const { filters, tab } = useMemo(() => parseListState(searchParams), [searchParams])
  const [draft, setDraft] = useState<Filters>(filters)
  const [selected, setSelected] = useState<InboundOrder[]>([])
  const [detailNo, setDetailNo] = useState<string>()
  const { confirm } = useConfirm()
  const [printOrder, setPrintOrder] = useState<InboundOrder>()

  useEffect(() => {
    setDraft(filters)
  }, [filters])

  const updateListState = useCallback(
    (nextFilters: Filters, nextTab: StatusTab) => {
      setSearchParams(toSearchParams(nextFilters, nextTab), { replace: true })
    },
    [setSearchParams],
  )

  // 先按仓库和筛选条件过滤，状态页签的数量基于这个结果
  const filtered = useMemo(() => {
    const keywords = filters.keyword.trim().toUpperCase().split(/\s+/).filter(Boolean)
    const since = filters.created === 'all' ? 0 : Date.now() - Number(filters.created) * 86_400_000
    return inbounds.filter(
      (o) =>
        o.warehouseCode === warehouseCode &&
        (keywords.length === 0 || keywords.some((k) => o.inboundNo.includes(k) || o.containerNo.includes(k))) &&
        (filters.customerId === ALL || o.customerId === filters.customerId) &&
        (filters.bizType === ALL || o.bizType === filters.bizType) &&
        new Date(o.createdAt).getTime() >= since,
    )
  }, [inbounds, warehouseCode, filters])

  const rows = useMemo(() => (tab === 'ALL' ? filtered : filtered.filter((o) => o.status === tab)), [filtered, tab])

  const tabItems = statusTabs.map((s) => ({
    value: s,
    label: s === 'ALL' ? t('common.all') : t(inboundStatusMeta[s].labelKey),
    count: s === 'ALL' ? filtered.length : filtered.filter((o) => o.status === s).length,
  }))

  const handleSign = useCallback(
    (no: string) => {
      const res = signInbound(no)
      if (res.ok) toast.success(t('inbound.signSuccess', { no }))
      else toast.error(t(res.errorKey))
    },
    [signInbound, t],
  )

  const handleCancel = useCallback(
    async (no: string) => {
      const ok = await confirm({
        title: t('inbound.cancelOrder'),
        description: t('inbound.cancelConfirm', { no }),
        variant: 'destructive',
      })
      if (!ok) return
      const res = cancelInbound(no)
      if (res.ok) toast.success(t('inbound.cancelSuccess', { no }))
      else toast.error(t(res.errorKey))
    },
    [cancelInbound, confirm, t],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<InboundOrder>()
    return col.columns([
      col.accessor('inboundNo', {
        header: t('inbound.inboundNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ getValue }) => <DocNo onClick={() => setDetailNo(getValue())}>{getValue()}</DocNo>,
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        cell: ({ getValue }) => <StatusBadge meta={inboundStatusMeta[getValue()]} />,
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        enableSorting: false,
        cell: ({ getValue }) => (
          <div className="max-w-44 truncate" title={customerName(getValue())}>
            <span className="mr-1.5 font-mono text-xs text-muted-foreground">{customerCode(getValue())}</span>
            {customerName(getValue())}
          </div>
        ),
      }),
      col.accessor('bizType', {
        header: t('inbound.bizType'),
        enableSorting: false,
        cell: ({ getValue }) => (
          <TagLabel tone={getValue() === 'STANDARD' ? 'gray' : getValue() === 'FBA_RETURN' ? 'orange' : 'cyan'}>
            {t(`enum.bizType.${getValue()}`)}
          </TagLabel>
        ),
      }),
      col.accessor('containerNo', {
        header: t('inbound.containerNo'),
        enableSorting: false,
        cell: ({ row, getValue }) => (
          <div className="leading-tight">
            <div className="font-mono text-xs">{getValue()}</div>
            <div className="text-xs text-muted-foreground">{t(`enum.loadType.${row.original.loadType}`)}</div>
          </div>
        ),
      }),
      col.accessor((o) => o.items.length, {
        id: 'skuCount',
        header: t('inbound.skuCount'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((o) => sum(o, 'plannedQty'), {
        id: 'plannedQty',
        header: t('inbound.plannedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((o) => sum(o, 'receivedGoodQty') + sum(o, 'receivedDefectQty'), {
        id: 'receivedQty',
        header: t('inbound.receivedQty'),
        meta: { align: 'right' },
        cell: ({ row, getValue }) => {
          const defect = sum(row.original, 'receivedDefectQty')
          return (
            <span>
              <Num value={getValue()} />
              {defect > 0 && <span className="ml-1 text-xs text-destructive">(-{defect})</span>}
            </span>
          )
        },
      }),
      col.display({
        id: 'progress',
        header: t('inbound.progress'),
        meta: { label: t('inbound.progress') },
        cell: ({ row }) => {
          const planned = sum(row.original, 'plannedQty')
          const put = sum(row.original, 'putawayQty')
          const pct = planned ? Math.round((put / planned) * 100) : 0
          return (
            <div className="flex w-28 items-center gap-2">
              <Progress value={pct} className="h-1.5" />
              <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">{pct}%</span>
            </div>
          )
        },
      }),
      col.accessor('etaAt', {
        header: t('inbound.eta'),
        cell: ({ row, getValue }) => {
          const overdue = row.original.status === 'PENDING' && new Date(getValue()).getTime() < Date.now()
          return (
            <span className={overdue ? 'text-destructive' : undefined}>
              <DateTime value={getValue()} pattern="YYYY-MM-DD" />
              {overdue && <span className="ml-1 text-xs">{t('inbound.etaOverdue')}</span>}
            </span>
          )
        },
      }),
      col.accessor('createdAt', {
        header: t('common.createdAt'),
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableHiding: false,
        meta: { pin: 'right' },
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="flex items-center gap-3 text-sm">
              <button type="button" className="text-primary hover:underline" onClick={() => setDetailNo(o.inboundNo)}>
                {t('common.detail')}
              </button>
              {o.status === 'PENDING' && (
                <button type="button" className="text-primary hover:underline" onClick={() => handleSign(o.inboundNo)}>
                  {t('inbound.sign')}
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="rounded p-0.5 text-muted-foreground hover:bg-muted" aria-label={t('common.more')}>
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setPrintOrder(o)}>{t('inbound.printLabel')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={o.status !== 'PENDING'}
                    onSelect={() => handleCancel(o.inboundNo)}
                  >
                    {t('inbound.cancelOrder')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      }),
    ])
  }, [t, customerCode, customerName, handleSign])

  const pendingSelected = selected.filter((o) => o.status === 'PENDING')

  return (
    <PageContainer
      fill
      title={t('menu.inboundOrders')}
      actions={
        <>
          <Button variant="outline">
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
          <Button onClick={() => toast.info(t('inbound.createHint'))}>
            <Plus data-icon="inline-start" />
            {t('inbound.create')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar
          onSearch={() => updateListState(draft, tab)}
          onReset={() => {
            setDraft(emptyFilters)
            updateListState(emptyFilters, tab)
          }}
          advanced={
            <FilterItem label={t('common.createdAt')}>
              <Select value={draft.created} onValueChange={(v) => setDraft({ ...draft, created: v as Filters['created'] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="7">{t('common.dateLast7')}</SelectItem>
                  <SelectItem value="30">{t('common.dateLast30')}</SelectItem>
                </SelectContent>
              </Select>
            </FilterItem>
          }
        >
          <FilterItem label={t('inbound.inboundNo')}>
            <Input
              value={draft.keyword}
              placeholder={t('inbound.searchPlaceholder')}
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('common.customer')}>
            <Select value={draft.customerId} onValueChange={(v) => setDraft({ ...draft, customerId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem label={t('inbound.bizType')}>
            <Select value={draft.bizType} onValueChange={(v) => setDraft({ ...draft, bizType: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                {bizTypes.map((b) => (
                  <SelectItem key={b} value={b}>
                    {t(`enum.bizType.${b}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          selectable
          onSelectionChange={setSelected}
          toolbar={
            <Button
              variant="outline"
              size="sm"
              disabled={pendingSelected.length === 0}
              onClick={() => {
                pendingSelected.forEach((o) => signInbound(o.inboundNo))
                toast.success(t('inbound.batchSignSuccess', { count: pendingSelected.length }))
              }}
            >
              <Truck data-icon="inline-start" />
              {t('inbound.sign')}
              {pendingSelected.length > 0 && ` (${pendingSelected.length})`}
            </Button>
          }
        />
      </Panel>

      <InboundDetailSheet inboundNo={detailNo} onClose={() => setDetailNo(undefined)} />

      <PrintLabelDialog order={printOrder} onClose={() => setPrintOrder(undefined)} />
    </PageContainer>
  )
}
