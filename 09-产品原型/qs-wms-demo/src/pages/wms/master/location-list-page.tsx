import { Download, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect, UsageStatusFilter } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usageStatusMeta } from '@/config/status'
import { useListFilters } from '@/hooks/use-list-filters'
import { useLocationMasterStatusToggle } from '@/hooks/use-location-master-status'
import { FILTER_ALL, masterCompositeRowId, sortByUpdatedAtDesc } from '@/lib/master-data'
import {
  enabledZonesForWarehouse,
  hasAnyEnabledZone,
  locationDetailPath,
  locationEditPath,
  ZONE_TYPE_I18N,
} from '@/lib/location-master'
import { codeNameText } from '@/lib/typography'
import { useDb } from '@/mock/db'
import type { LocationMaster, UsageStatus, ZoneType } from '@/types/wms'

interface Filters {
  warehouseCode: string
  zoneCode: string
  code: string
  zoneType: string
  status: string
}

const emptyFilters: Filters = {
  warehouseCode: FILTER_ALL,
  zoneCode: FILTER_ALL,
  code: '',
  zoneType: FILTER_ALL,
  status: FILTER_ALL,
}

function matchLocation(row: LocationMaster, filters: Filters): boolean {
  if (filters.warehouseCode !== FILTER_ALL && row.warehouseCode !== filters.warehouseCode) return false
  if (filters.zoneCode !== FILTER_ALL && row.zoneCode !== filters.zoneCode) return false
  if (filters.code && !row.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.zoneType !== FILTER_ALL && row.zoneType !== filters.zoneType) return false
  if (filters.status !== FILTER_ALL && row.status !== filters.status) return false
  return true
}

export function LocationListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locationMasters = useDb((s) => s.locationMasters)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const zoneMasters = useDb((s) => s.zoneMasters)
  const toggleStatus = useLocationMasterStatusToggle()

  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

  const canCreate = hasAnyEnabledZone(zoneMasters)

  const zoneOptions = useMemo(() => {
    if (draft.warehouseCode === FILTER_ALL) return zoneMasters.filter((z) => z.status === 'ENABLED')
    return enabledZonesForWarehouse(zoneMasters, draft.warehouseCode)
  }, [draft.warehouseCode, zoneMasters])

  const rows = useMemo(() => {
    return sortByUpdatedAtDesc(locationMasters.filter((l) => matchLocation(l, filters)))
  }, [locationMasters, filters])

  const columns = useMemo(() => {
    const warehouseName = (code: string) => warehouseMasters.find((x) => x.code === code)?.name
    const zoneName = (code: string) => zoneMasters.find((x) => x.code === code)?.name
    const col = createDataColumns<LocationMaster>()
    return col.columns([
      col.accessor('warehouseCode', {
        header: t('masterLocation.warehouseCode'),
        enableSorting: false,
        meta: { label: t('masterLocation.warehouseCode') },
        cell: ({ getValue }) => <CodeName code={getValue()} name={warehouseName(getValue())} />,
      }),
      col.accessor('zoneCode', {
        header: t('masterLocation.zoneCode'),
        enableSorting: false,
        meta: { label: t('masterLocation.zoneCode') },
        cell: ({ getValue }) => <CodeName code={getValue()} name={zoneName(getValue())} />,
      }),
      col.accessor('code', {
        header: t('masterLocation.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterLocation.code') },
        cell: ({ row }) => (
          <DocNo onClick={() => navigate(locationDetailPath(row.original.warehouseCode, row.original.code))}>
            {row.original.code}
          </DocNo>
        ),
      }),
      col.accessor('zoneType', {
        header: t('masterLocation.zoneType'),
        enableSorting: false,
        meta: { label: t('masterLocation.zoneType') },
        cell: ({ getValue }) => t(ZONE_TYPE_I18N[getValue() as ZoneType]),
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        meta: { label: t('common.status') },
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.accessor('updatedAt', {
        header: t('masterLocation.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        meta: { label: t('masterLocation.updatedAt') },
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('updatedBy', {
        header: t('masterLocation.updatedBy'),
        enableSorting: false,
        meta: { label: t('masterLocation.updatedBy') },
      }),
      col.accessor('remark', {
        header: t('masterLocation.remark'),
        enableSorting: false,
        meta: { label: t('masterLocation.remark') },
        cell: ({ getValue }) => {
          const v = getValue() as string | undefined
          return v ? <span className="block max-w-40 truncate" title={v}>{v}</span> : <Empty />
        },
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const loc = row.original
          const enabled = loc.status === 'ENABLED'
          return (
            <RowActions
              actions={[
                {
                  key: 'edit',
                  label: t('masterLocation.edit'),
                  onClick: () => navigate(locationEditPath(loc.warehouseCode, loc.code)),
                },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterLocation.disableAction' : 'masterLocation.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(loc.warehouseCode, loc.code, enabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
          )
        },
      }),
    ])
  }, [navigate, t, toggleStatus, warehouseMasters, zoneMasters])

  const onCreate = () => {
    if (!canCreate) {
      toast.warning(t('masterLocation.needEnabledZone'))
      return
    }
    const preset =
      draft.warehouseCode !== FILTER_ALL && draft.zoneCode !== FILTER_ALL
        ? { warehouseCode: draft.warehouseCode, zoneCode: draft.zoneCode }
        : undefined
    navigate('/wms/master/locations/new', { state: preset })
  }

  return (
    <PageContainer
      fill
      title={t('menu.locations')}
      actions={
        <>
          <Button onClick={onCreate} disabled={!canCreate}>
            <Plus data-icon="inline-start" />
            {t('masterLocation.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('masterLocation.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6} onSearch={applySearch} onReset={reset}>
          <FilterItem label={t('masterLocation.warehouseCode')}>
            <OptionSelect
              allOption
              value={draft.warehouseCode}
              onValueChange={(v) => setDraft({ ...draft, warehouseCode: v, zoneCode: FILTER_ALL })}
              options={warehouseMasters.map((w) => ({ value: w.code, label: codeNameText(w.code, w.name) }))}
            />
          </FilterItem>
          <FilterItem label={t('masterLocation.zoneCode')}>
            <OptionSelect
              allOption
              value={draft.zoneCode}
              onValueChange={(v) => setDraft({ ...draft, zoneCode: v })}
              options={zoneOptions.map((z) => ({ value: z.code, label: codeNameText(z.code, z.name) }))}
            />
          </FilterItem>
          <FilterItem label={t('masterLocation.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterLocation.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterLocation.zoneType')}>
            <OptionSelect
              allOption
              value={draft.zoneType}
              onValueChange={(v) => setDraft({ ...draft, zoneType: v })}
              options={(Object.keys(ZONE_TYPE_I18N) as ZoneType[]).map((zt) => ({
                value: zt,
                label: t(ZONE_TYPE_I18N[zt]),
              }))}
            />
          </FilterItem>
          <FilterItem label={t('common.status')}>
            <UsageStatusFilter value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })} />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(r) => masterCompositeRowId(r.warehouseCode, r.code)}
          pageSize={20}
          initialColumnVisibility={{ remark: false }}
        />
      </Panel>
    </PageContainer>
  )
}
