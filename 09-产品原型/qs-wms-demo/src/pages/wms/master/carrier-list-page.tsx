import { Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, DocNo } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { UsageStatusFilter } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usageStatusMeta } from '@/config/status'
import { useCarrierMasterStatusToggle } from '@/hooks/use-carrier-master-status'
import { useListFilters } from '@/hooks/use-list-filters'
import { carrierDetailPath, carrierShortDisplay } from '@/lib/carrier-master'
import { FILTER_ALL, sortByUpdatedAtDesc } from '@/lib/master-data'
import { useDb } from '@/mock/db'
import type { CarrierMaster, UsageStatus } from '@/types/wms'
import { CarrierFormDialog } from './carrier-form-dialog'

interface Filters {
  code: string
  name: string
  status: string
}

const emptyFilters: Filters = { code: '', name: '', status: FILTER_ALL }

function matchCarrier(c: CarrierMaster, filters: Filters): boolean {
  if (filters.code && !c.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.name && !c.name.includes(filters.name.trim()) && !(c.shortName?.includes(filters.name.trim()))) return false
  if (filters.status !== FILTER_ALL && c.status !== filters.status) return false
  return true
}

export function CarrierListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const carrierMasters = useDb((s) => s.carrierMasters)
  const toggleStatus = useCarrierMasterStatusToggle()
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; code?: string } | null>(null)

  const rows = useMemo(() => {
    const list = carrierMasters.filter((c) => matchCarrier(c, filters))
    return sortByUpdatedAtDesc(list)
  }, [carrierMasters, filters])

  const columns = useMemo(() => {
    const col = createDataColumns<CarrierMaster>()
    return col.columns([
      col.accessor('code', {
        header: t('masterCarrier.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterCarrier.code') },
        cell: ({ getValue }) => <DocNo onClick={() => navigate(carrierDetailPath(getValue()))}>{getValue()}</DocNo>,
      }),
      col.accessor('name', {
        header: t('masterCarrier.name'),
        enableSorting: false,
        meta: { label: t('masterCarrier.name') },
      }),
      col.accessor((row) => carrierShortDisplay(row), {
        id: 'shortName',
        header: t('masterCarrier.shortName'),
        enableSorting: false,
        meta: { label: t('masterCarrier.shortName') },
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        meta: { label: t('common.status') },
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.accessor('updatedAt', {
        header: t('masterCarrier.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        meta: { label: t('masterCarrier.updatedAt') },
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('updatedBy', {
        header: t('masterCarrier.updatedBy'),
        enableSorting: false,
        meta: { label: t('masterCarrier.updatedBy') },
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const c = row.original
          const enabled = c.status === 'ENABLED'
          return (
            <RowActions
              actions={[
                { key: 'edit', label: t('masterCarrier.edit'), onClick: () => setDialog({ mode: 'edit', code: c.code }) },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterCarrier.disableAction' : 'masterCarrier.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(c.code, enabled ? 'DISABLED' : 'ENABLED'),
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
      title={t('menu.carriers')}
      actions={
        <>
          <Button onClick={() => setDialog({ mode: 'create' })}>
            <Plus data-icon="inline-start" />
            {t('masterCarrier.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('masterCarrier.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6} onSearch={applySearch} onReset={reset}>
          <FilterItem label={t('masterCarrier.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterCarrier.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterCarrier.name')}>
            <Input
              value={draft.name}
              placeholder={t('masterCarrier.namePlaceholder')}
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
          getRowId={(c) => c.code}
          pageSize={20}
          initialColumnVisibility={{ updatedBy: false }}
        />
      </Panel>

      <CarrierFormDialog
        open={dialog !== null}
        mode={dialog?.mode ?? 'create'}
        carrierCode={dialog?.code}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </PageContainer>
  )
}
