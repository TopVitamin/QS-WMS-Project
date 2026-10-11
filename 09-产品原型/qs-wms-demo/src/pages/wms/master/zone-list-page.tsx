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
import { useZoneMasterStatusToggle } from '@/hooks/use-zone-master-status'
import { FILTER_ALL, masterCompositeRowId, sortByUpdatedAtDesc } from '@/lib/master-data'
import {
  hasEnabledWarehouse,
  zoneDetailPath,
  zoneEditPath,
  ZONE_TYPE_I18N,
} from '@/lib/zone-master'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import type { UsageStatus, ZoneMaster, ZoneType } from '@/types/wms'

interface Filters {
  warehouseCode: string
  code: string
  name: string
  status: string
}

const emptyFilters: Filters = {
  warehouseCode: FILTER_ALL,
  code: '',
  name: '',
  status: FILTER_ALL,
}

function matchZone(row: ZoneMaster, filters: Filters): boolean {
  if (filters.warehouseCode !== FILTER_ALL && row.warehouseCode !== filters.warehouseCode) return false
  if (filters.code && !row.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.name && !row.name.toLowerCase().includes(filters.name.trim().toLowerCase())) return false
  if (filters.status !== FILTER_ALL && row.status !== filters.status) return false
  return true
}

export function ZoneListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const zoneMasters = useDb((s) => s.zoneMasters)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const toggleStatus = useZoneMasterStatusToggle()

  const { filters, draft, setDraft, applySearch, reset } = useMasterListFilters(emptyFilters)

  const canCreate = hasEnabledWarehouse(warehouseMasters)

  const rows = useMemo(() => {
    return sortByUpdatedAtDesc(zoneMasters.filter((z) => matchZone(z, filters)))
  }, [zoneMasters, filters])

  const warehouseLabel = (code: string) => {
    const w = warehouseMasters.find((x) => x.code === code)
    return w ? `${w.code} · ${w.name}` : code
  }

  const columns = useMemo(() => {
    const col = createDataColumns<ZoneMaster>()
    return col.columns([
      col.accessor('warehouseCode', {
        header: t('masterZone.warehouseCode'),
        enableSorting: false,
        meta: { label: t('masterZone.warehouseCode') },
        cell: ({ getValue }) => warehouseLabel(getValue()),
      }),
      col.accessor('code', {
        header: t('masterZone.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterZone.code') },
        cell: ({ row }) => (
          <DocNo onClick={() => navigate(zoneDetailPath(row.original.warehouseCode, row.original.code))}>
            {row.original.code}
          </DocNo>
        ),
      }),
      col.accessor('name', {
        header: t('masterZone.name'),
        enableSorting: false,
        meta: { label: t('masterZone.name') },
      }),
      col.accessor('zoneType', {
        header: t('masterZone.zoneType'),
        enableSorting: false,
        meta: { label: t('masterZone.zoneType') },
        cell: ({ getValue }) => t(ZONE_TYPE_I18N[getValue() as ZoneType]),
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        meta: { label: t('common.status') },
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.accessor('updatedAt', {
        header: t('masterZone.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        meta: { label: t('masterZone.updatedAt') },
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('updatedBy', {
        header: t('masterZone.updatedBy'),
        enableSorting: false,
        meta: { label: t('masterZone.updatedBy') },
      }),
      col.accessor('remark', {
        header: t('masterZone.remark'),
        enableSorting: false,
        meta: { label: t('masterZone.remark') },
        cell: ({ getValue }) => {
          const v = getValue() as string | undefined
          return v ? <span className="max-w-[160px] truncate" title={v}>{v}</span> : <span className="text-muted-foreground">-</span>
        },
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const zone = row.original
          const enabled = zone.status === 'ENABLED'
          return (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                className={textLink}
                onClick={() => navigate(zoneEditPath(zone.warehouseCode, zone.code))}
              >
                {t('masterZone.edit')}
              </button>
              <button
                type="button"
                className={cn(textLink, enabled ? 'text-destructive' : undefined)}
                onClick={() => toggleStatus(zone, enabled ? 'DISABLED' : 'ENABLED')}
              >
                {t(enabled ? 'masterZone.disableAction' : 'masterZone.enableAction')}
              </button>
            </span>
          )
        },
      }),
    ])
  }, [navigate, t, toggleStatus, warehouseMasters])

  const onCreate = () => {
    if (!canCreate) {
      toast.warning(t('masterZone.needEnabledWarehouse'))
      return
    }
    const preset = draft.warehouseCode !== FILTER_ALL ? { warehouseCode: draft.warehouseCode } : undefined
    navigate('/wms/master/zones/new', { state: preset })
  }

  return (
    <PageContainer
      fill
      title={t('menu.zones')}
      actions={
        <>
          <Button onClick={onCreate} disabled={!canCreate}>
            <Plus data-icon="inline-start" />
            {t('masterZone.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('masterZone.exportMock'))}>
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
          <FilterItem label={t('masterZone.warehouseCode')}>
            <Select value={draft.warehouseCode} onValueChange={(v) => setDraft({ ...draft, warehouseCode: v })}>
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
          <FilterItem label={t('masterZone.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterZone.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterZone.name')}>
            <Input
              value={draft.name}
              placeholder={t('masterZone.namePlaceholder')}
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
