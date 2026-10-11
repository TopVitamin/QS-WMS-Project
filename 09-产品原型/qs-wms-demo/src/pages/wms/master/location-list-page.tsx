import { Download, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, DocNo } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usageStatusMeta } from '@/config/status'
import { useMasterListFilters } from '@/hooks/use-master-list-filters'
import { useLocationMasterStatusToggle } from '@/hooks/use-location-master-status'
import { FILTER_ALL, masterCompositeRowId, sortByUpdatedAtDesc } from '@/lib/master-data'
import {
  enabledZonesForWarehouse,
  hasAnyEnabledZone,
  locationDetailPath,
  locationEditPath,
  ZONE_TYPE_I18N,
} from '@/lib/location-master'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import type { LocationMaster, UsageStatus, ZoneType } from '@/types/wms'

interface Filters {
  warehouseCode: string
  zoneCode: string
  code: string
  zoneType: string
  status: string
  allowMixSku: string
  allowMixBatch: string
}

const emptyFilters: Filters = {
  warehouseCode: FILTER_ALL,
  zoneCode: FILTER_ALL,
  code: '',
  zoneType: FILTER_ALL,
  status: FILTER_ALL,
  allowMixSku: FILTER_ALL,
  allowMixBatch: FILTER_ALL,
}

function matchBoolFilter(value: boolean, filter: string): boolean {
  if (filter === FILTER_ALL) return true
  if (filter === 'yes') return value
  return !value
}

function matchLocation(row: LocationMaster, filters: Filters): boolean {
  if (filters.warehouseCode !== FILTER_ALL && row.warehouseCode !== filters.warehouseCode) return false
  if (filters.zoneCode !== FILTER_ALL && row.zoneCode !== filters.zoneCode) return false
  if (filters.code && !row.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.zoneType !== FILTER_ALL && row.zoneType !== filters.zoneType) return false
  if (filters.status !== FILTER_ALL && row.status !== filters.status) return false
  if (!matchBoolFilter(row.allowMixSku, filters.allowMixSku)) return false
  if (!matchBoolFilter(row.allowMixBatch, filters.allowMixBatch)) return false
  return true
}

export function LocationListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locationMasters = useDb((s) => s.locationMasters)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const zoneMasters = useDb((s) => s.zoneMasters)
  const toggleStatus = useLocationMasterStatusToggle()

  const { filters, draft, setDraft, applySearch, reset } = useMasterListFilters(emptyFilters)

  const canCreate = hasAnyEnabledZone(zoneMasters)

  const zoneOptions = useMemo(() => {
    if (draft.warehouseCode === FILTER_ALL) return zoneMasters.filter((z) => z.status === 'ENABLED')
    return enabledZonesForWarehouse(zoneMasters, draft.warehouseCode)
  }, [draft.warehouseCode, zoneMasters])

  const rows = useMemo(() => {
    return sortByUpdatedAtDesc(locationMasters.filter((l) => matchLocation(l, filters)))
  }, [locationMasters, filters])

  const warehouseLabel = (code: string) => {
    const w = warehouseMasters.find((x) => x.code === code)
    return w ? `${w.code} · ${w.name}` : code
  }

  const zoneLabel = (code: string) => {
    const z = zoneMasters.find((x) => x.code === code)
    return z ? `${z.code} · ${z.name}` : code
  }

  const columns = useMemo(() => {
    const col = createDataColumns<LocationMaster>()
    return col.columns([
      col.accessor('warehouseCode', {
        header: t('masterLocation.warehouseCode'),
        enableSorting: false,
        meta: { label: t('masterLocation.warehouseCode') },
        cell: ({ getValue }) => warehouseLabel(getValue()),
      }),
      col.accessor('zoneCode', {
        header: t('masterLocation.zoneCode'),
        enableSorting: false,
        meta: { label: t('masterLocation.zoneCode') },
        cell: ({ getValue }) => zoneLabel(getValue()),
      }),
      col.accessor('code', {
        header: t('masterLocation.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterLocation.code') },
        cell: ({ row }) => (
          <DocNo
            onClick={() => navigate(locationDetailPath(row.original.warehouseCode, row.original.code))}
          >
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
          return v ? <span className="max-w-[160px] truncate" title={v}>{v}</span> : <span className="text-muted-foreground">-</span>
        },
      }),
      col.accessor('allowMixSku', {
        header: t('masterLocation.allowMixSku'),
        enableSorting: false,
        meta: { label: t('masterLocation.allowMixSku') },
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('allowMixBatch', {
        header: t('masterLocation.allowMixBatch'),
        enableSorting: false,
        meta: { label: t('masterLocation.allowMixBatch') },
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
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
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                className={textLink}
                onClick={() => navigate(locationEditPath(loc.warehouseCode, loc.code))}
              >
                {t('masterLocation.edit')}
              </button>
              <button
                type="button"
                className={cn(textLink, enabled ? 'text-destructive' : undefined)}
                onClick={() =>
                  toggleStatus(loc.warehouseCode, loc.code, enabled ? 'DISABLED' : 'ENABLED')
                }
              >
                {t(enabled ? 'masterLocation.disableAction' : 'masterLocation.enableAction')}
              </button>
            </span>
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
        <FilterBar
          columns={6}
          onSearch={applySearch}
          onReset={reset}
          advanced={
            <>
              <FilterItem label={t('masterLocation.allowMixSku')}>
                <Select
                  value={draft.allowMixSku}
                  onValueChange={(v) => setDraft({ ...draft, allowMixSku: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('common.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                    <SelectItem value="yes">{t('common.yes')}</SelectItem>
                    <SelectItem value="no">{t('common.no')}</SelectItem>
                  </SelectContent>
                </Select>
              </FilterItem>
              <FilterItem label={t('masterLocation.allowMixBatch')}>
                <Select
                  value={draft.allowMixBatch}
                  onValueChange={(v) => setDraft({ ...draft, allowMixBatch: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('common.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                    <SelectItem value="yes">{t('common.yes')}</SelectItem>
                    <SelectItem value="no">{t('common.no')}</SelectItem>
                  </SelectContent>
                </Select>
              </FilterItem>
            </>
          }
        >
          <FilterItem label={t('masterLocation.warehouseCode')}>
            <Select
              value={draft.warehouseCode}
              onValueChange={(v) => setDraft({ ...draft, warehouseCode: v, zoneCode: FILTER_ALL })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                {warehouseMasters.map((w) => (
                  <SelectItem key={w.code} value={w.code}>
                    {w.code} · {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem label={t('masterLocation.zoneCode')}>
            <Select value={draft.zoneCode} onValueChange={(v) => setDraft({ ...draft, zoneCode: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                {zoneOptions.map((z) => (
                  <SelectItem key={z.code} value={z.code}>
                    {z.code} · {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>
          <FilterItem label={t('masterLocation.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterLocation.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterLocation.zoneType')}>
            <Select value={draft.zoneType} onValueChange={(v) => setDraft({ ...draft, zoneType: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                {(Object.keys(ZONE_TYPE_I18N) as ZoneType[]).map((zt) => (
                  <SelectItem key={zt} value={zt}>{t(ZONE_TYPE_I18N[zt])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(r) => masterCompositeRowId(r.warehouseCode, r.code)}
          pageSize={20}
          initialColumnVisibility={{
            remark: false,
            allowMixSku: false,
            allowMixBatch: false,
          }}
        />
      </Panel>
    </PageContainer>
  )
}
