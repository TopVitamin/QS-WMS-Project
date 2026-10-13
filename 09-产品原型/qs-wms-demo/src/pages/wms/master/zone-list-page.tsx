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
import { useZoneMasterStatusToggle } from '@/hooks/use-zone-master-status'
import { FILTER_ALL, masterCompositeRowId, sortByUpdatedAtDesc } from '@/lib/master-data'
import { codeNameText } from '@/lib/typography'
import {
  hasEnabledWarehouse,
  zoneDetailPath,
  zoneEditPath,
  ZONE_TYPE_I18N,
} from '@/lib/zone-master'
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

  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

  const canCreate = hasEnabledWarehouse(warehouseMasters)

  const rows = useMemo(() => {
    return sortByUpdatedAtDesc(zoneMasters.filter((z) => matchZone(z, filters)))
  }, [zoneMasters, filters])

  const columns = useMemo(() => {
    const warehouseName = (code: string) => warehouseMasters.find((x) => x.code === code)?.name
    const col = createDataColumns<ZoneMaster>()
    return col.columns([
      col.accessor('warehouseCode', {
        header: t('masterZone.warehouseCode'),
        enableSorting: false,
        meta: { label: t('masterZone.warehouseCode') },
        cell: ({ getValue }) => <CodeName code={getValue()} name={warehouseName(getValue())} />,
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
          const zone = row.original
          const enabled = zone.status === 'ENABLED'
          return (
            <RowActions
              actions={[
                {
                  key: 'edit',
                  label: t('masterZone.edit'),
                  onClick: () => navigate(zoneEditPath(zone.warehouseCode, zone.code)),
                },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterZone.disableAction' : 'masterZone.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(zone, enabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
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
        <FilterBar onSearch={applySearch} onReset={reset}>
          <FilterItem label={t('masterZone.warehouseCode')}>
            <OptionSelect
              allOption
              value={draft.warehouseCode}
              onValueChange={(v) => setDraft({ ...draft, warehouseCode: v })}
              options={warehouseMasters.map((w) => ({ value: w.code, label: codeNameText(w.code, w.name) }))}
            />
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
