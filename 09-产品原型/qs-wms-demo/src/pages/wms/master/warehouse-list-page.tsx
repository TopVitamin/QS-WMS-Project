import { Download, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, DateTime, DocNo } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usageStatusMeta } from '@/config/status'
import { useMasterListFilters } from '@/hooks/use-master-list-filters'
import { useWarehouseMasterStatusToggle } from '@/hooks/use-warehouse-master-status'
import { FILTER_ALL } from '@/lib/master-data'
import { formatWarehouseFullAddress } from '@/lib/warehouse-master'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import type { UsageStatus, WarehouseMaster } from '@/types/wms'

interface Filters {
  code: string
  name: string
  status: string
  countryCode: string
  updatedFrom: string
  updatedTo: string
}

const emptyFilters: Filters = {
  code: '',
  name: '',
  status: FILTER_ALL,
  countryCode: FILTER_ALL,
  updatedFrom: '',
  updatedTo: '',
}

function matchWarehouse(w: WarehouseMaster, filters: Filters): boolean {
  if (filters.code && !w.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.name && !w.name.includes(filters.name.trim())) return false
  if (filters.status !== FILTER_ALL && w.status !== filters.status) return false
  if (filters.countryCode !== FILTER_ALL && w.countryCode !== filters.countryCode) return false
  if (filters.updatedFrom) {
    const from = new Date(filters.updatedFrom).getTime()
    if (new Date(w.updatedAt).getTime() < from) return false
  }
  if (filters.updatedTo) {
    const to = new Date(filters.updatedTo).getTime() + 86_400_000
    if (new Date(w.updatedAt).getTime() > to) return false
  }
  return true
}

export function WarehouseListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const toggleStatus = useWarehouseMasterStatusToggle()
  const { filters, draft, setDraft, applySearch, reset } = useMasterListFilters(emptyFilters)

  const rows = useMemo(() => {
    const list = warehouseMasters.filter((w) => matchWarehouse(w, filters))
    return [...list].sort((a, b) => a.code.localeCompare(b.code))
  }, [warehouseMasters, filters])

  const columns = useMemo(() => {
    const col = createDataColumns<WarehouseMaster>()
    return col.columns([
      col.accessor('code', {
        header: t('masterWarehouse.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterWarehouse.code') },
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/master/warehouses/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('name', {
        header: t('masterWarehouse.name'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.name') },
      }),
      col.accessor('timezone', {
        header: t('masterWarehouse.timezone'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.timezone') },
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        meta: { label: t('common.status') },
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.accessor((row) => formatWarehouseFullAddress(row), {
        id: 'fullAddress',
        header: t('masterWarehouse.fullAddress'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.fullAddress') },
        cell: ({ getValue }) => (
          <span className="max-w-[240px] truncate" title={getValue()}>{getValue()}</span>
        ),
      }),
      col.accessor('updatedAt', {
        header: t('masterWarehouse.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        meta: { label: t('masterWarehouse.updatedAt') },
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('updatedBy', {
        header: t('masterWarehouse.updatedBy'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.updatedBy') },
      }),
      col.accessor('currency', {
        header: t('masterWarehouse.currency'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.currency') },
      }),
      col.accessor('city', {
        header: t('masterWarehouse.city'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.city') },
      }),
      col.accessor('contactName', {
        header: t('masterWarehouse.contactName'),
        enableSorting: false,
        meta: { label: t('masterWarehouse.contactName') },
        cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">-</span>,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const w = row.original
          const enabled = w.status === 'ENABLED'
          return (
            <span className="inline-flex items-center gap-2">
              <button type="button" className={textLink} onClick={() => navigate(`/wms/master/warehouses/${w.code}/edit`)}>
                {t('masterWarehouse.edit')}
              </button>
              <button
                type="button"
                className={cn(textLink, enabled ? 'text-destructive' : undefined)}
                onClick={() => toggleStatus(w.code, enabled ? 'DISABLED' : 'ENABLED')}
              >
                {t(enabled ? 'masterWarehouse.disableAction' : 'masterWarehouse.enableAction')}
              </button>
            </span>
          )
        },
      }),
    ])
  }, [navigate, t, toggleStatus])

  return (
    <PageContainer
      fill
      title={t('menu.warehouses')}
      actions={
        <>
          <Button onClick={() => navigate('/wms/master/warehouses/new')}>
            <Plus data-icon="inline-start" />
            {t('masterWarehouse.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('masterWarehouse.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar
          columns={6}
          onSearch={applySearch}
          onReset={reset}
        >
          <FilterItem label={t('masterWarehouse.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterWarehouse.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterWarehouse.name')}>
            <Input
              value={draft.name}
              placeholder={t('masterWarehouse.namePlaceholder')}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('common.status')}>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                <SelectItem value="ENABLED">{t('status.usage.ENABLED')}</SelectItem>
                <SelectItem value="DISABLED">{t('status.usage.DISABLED')}</SelectItem>
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem label={t('masterWarehouse.countryName')}>
            <Select value={draft.countryCode} onValueChange={(v) => setDraft({ ...draft, countryCode: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                <SelectItem value="HK">{t('masterWarehouse.country.HK')}</SelectItem>
                <SelectItem value="US">{t('masterWarehouse.country.US')}</SelectItem>
                <SelectItem value="DE">{t('masterWarehouse.country.DE')}</SelectItem>
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem label={t('masterWarehouse.updatedRange')}>
            <DateRangePickerField
              value={{ from: draft.updatedFrom, to: draft.updatedTo }}
              onChange={(range) => setDraft({ ...draft, updatedFrom: range.from, updatedTo: range.to })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(w) => w.code}
          pageSize={20}
          initialColumnVisibility={{
            currency: false,
            city: false,
            contactName: false,
          }}
        />
      </Panel>
    </PageContainer>
  )
}
