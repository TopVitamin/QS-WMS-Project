import { Download, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, DateTime, DocNo, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect, UsageStatusFilter } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usageStatusMeta } from '@/config/status'
import { useListFilters } from '@/hooks/use-list-filters'
import { useWarehouseMasterStatusToggle } from '@/hooks/use-warehouse-master-status'
import { FILTER_ALL } from '@/lib/master-data'
import { countryLabelKey, formatWarehouseFullAddress, WAREHOUSE_COUNTRY_OPTIONS } from '@/lib/warehouse-master'
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
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

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
      // 含翻译的文本在 cell 里算：accessor 的结果按行缓存，切换语言时不会重算
      col.display({
        id: 'fullAddress',
        header: t('masterWarehouse.fullAddress'),
        meta: { label: t('masterWarehouse.fullAddress') },
        cell: ({ row }) => {
          const v = formatWarehouseFullAddress(row.original, t(countryLabelKey(row.original.countryCode)))
          return v ? <span className="block max-w-60 truncate" title={v}>{v}</span> : <Empty />
        },
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
        cell: ({ getValue }) => getValue() || <Empty />,
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
            <RowActions
              actions={[
                {
                  key: 'edit',
                  label: t('masterWarehouse.edit'),
                  onClick: () => navigate(`/wms/master/warehouses/${w.code}/edit`),
                },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterWarehouse.disableAction' : 'masterWarehouse.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(w.code, enabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
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
        <FilterBar onSearch={applySearch} onReset={reset}>
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
            <UsageStatusFilter value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })} />
          </FilterItem>
          <FilterItem label={t('masterWarehouse.countryName')}>
            <OptionSelect
              allOption
              value={draft.countryCode}
              onValueChange={(v) => setDraft({ ...draft, countryCode: v })}
              options={WAREHOUSE_COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
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
