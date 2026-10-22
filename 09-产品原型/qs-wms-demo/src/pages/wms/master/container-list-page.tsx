import { Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { containerStatusMeta, containerTypeMeta } from '@/config/status'
import { containerContents, containerSummary } from '@/lib/container-derive'
import { FILTER_ALL } from '@/lib/master-data'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse } from '@/stores/settings'
import type { ContainerMaster, ContainerStatus, ContainerType } from '@/types/wms'
import { ContainerFormDialog } from './container-dialogs'

const TYPES: ContainerType[] = ['CARTON', 'PALLET', 'BAG', 'CAGE', 'PACKAGE']
const STATUSES: ContainerStatus[] = [
  'IDLE',
  'RECEIVING',
  'PUTAWAYING',
  'IN_STOCK',
  'OUTBOUND',
  'SHIPPED',
  'RELEASED',
  'DISABLED',
]

interface Filters {
  containerNo: string
  containerType: string
  customerId: string
  status: string
  locationCode: string
}

const emptyFilters: Filters = {
  containerNo: '',
  containerType: FILTER_ALL,
  customerId: FILTER_ALL,
  status: FILTER_ALL,
  locationCode: '',
}

const match = (c: ContainerMaster, f: Filters) => {
  if (f.containerNo && !c.containerNo.toLowerCase().includes(f.containerNo.trim().toLowerCase())) return false
  if (f.containerType !== FILTER_ALL && c.containerType !== f.containerType) return false
  if (f.customerId !== FILTER_ALL && c.customerId !== f.customerId) return false
  if (f.status !== FILTER_ALL && c.status !== f.status) return false
  if (f.locationCode && !(c.currentLocationCode ?? '').toLowerCase().includes(f.locationCode.trim().toLowerCase())) return false
  return true
}

export function ContainerListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouse = useCurrentWarehouse()
  const containers = useDb((s) => s.containers)
  const customers = useDb((s) => s.customerMasters)
  const setStatus = useDb((s) => s.setContainerStatus)
  const db = useDb()
  const { customerCode, customerName } = useLookups()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [draft, setDraft] = useState<Filters>(emptyFilters)
  const [createOpen, setCreateOpen] = useState(false)

  const rows = useMemo(
    () =>
      containers
        .filter((c) => c.warehouseCode === warehouse.code && match(c, filters))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [containers, filters, warehouse.code],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<ContainerMaster>()
    return col.columns([
      col.accessor('containerNo', {
        header: t('container.no'),
        meta: { pin: 'left', label: t('container.no') },
        cell: ({ getValue, row }) => (
          <DocNo onClick={() => navigate(`/wms/master/containers/${row.original.containerNo}?wh=${row.original.warehouseCode}`)}>
            {getValue()}
          </DocNo>
        ),
      }),
      col.accessor('containerType', {
        header: t('container.type'),
        cell: ({ getValue }) => <TagLabel meta={containerTypeMeta[getValue()]} />,
      }),
      col.accessor('customerId', {
        header: t('common.customer'),
        cell: ({ getValue }) => <CodeName code={customerCode(getValue())} name={customerName(getValue())} />,
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={containerStatusMeta[getValue()]} />,
      }),
      col.accessor('currentLocationCode', {
        header: t('container.currentLocation'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.display({
        id: 'content',
        header: t('container.content'),
        cell: ({ row }) => {
          const summary = containerSummary(containerContents(row.original, db))
          return summary.qty > 0 ? (
            <span>
              {t('container.contentSummary', { skus: summary.skus, qty: summary.qty })}
            </span>
          ) : (
            <Empty />
          )
        },
      }),
      col.accessor('lastScannedAt', {
        header: t('container.lastScannedAt'),
        cell: ({ getValue }) => (getValue() ? <DateTime value={getValue()} /> : <Empty />),
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const c = row.original
          const disabled = c.status === 'DISABLED'
          return (
            <RowActions
              actions={[
                {
                  key: 'detail',
                  label: t('common.detail'),
                  onClick: () => navigate(`/wms/master/containers/${c.containerNo}?wh=${c.warehouseCode}`),
                },
                {
                  key: 'toggle',
                  label: t(disabled ? 'container.enableAction' : 'container.disableAction'),
                  danger: !disabled,
                  hidden: !disabled && !['IDLE', 'RECEIVING', 'RELEASED'].includes(c.status),
                  onClick: () => {
                    const result = setStatus({
                      warehouseCode: c.warehouseCode,
                      containerNo: c.containerNo,
                      status: disabled ? 'IDLE' : 'DISABLED',
                    })
                    if (!result.ok) toast.error(t(result.errorKey, result.params))
                    else toast.success(t(disabled ? 'container.enabled' : 'container.disabled', { no: c.containerNo }))
                  },
                },
              ]}
            />
          )
        },
      }),
    ])
  }, [customerCode, customerName, db, navigate, setStatus, t])

  const apply = () => setFilters(draft)
  const reset = () => {
    setDraft(emptyFilters)
    setFilters(emptyFilters)
  }

  return (
    <PageContainer
      fill
      title={t('menu.containers')}
      actions={
        <>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            {t('container.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('container.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6} onSearch={apply} onReset={reset}>
          <FilterItem label={t('container.no')}>
            <Input
              value={draft.containerNo}
              placeholder={t('container.noPlaceholder')}
              onChange={(e) => setDraft({ ...draft, containerNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('container.type')}>
            <OptionSelect
              allOption
              value={draft.containerType}
              onValueChange={(v) => setDraft({ ...draft, containerType: v })}
              options={TYPES.map((type) => ({ value: type, label: t(`enum.containerType.${type}`) }))}
            />
          </FilterItem>
          <FilterItem label={t('common.customer')}>
            <OptionSelect
              allOption
              value={draft.customerId}
              onValueChange={(v) => setDraft({ ...draft, customerId: v })}
              options={customers.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }))}
            />
          </FilterItem>
          <FilterItem label={t('common.status')}>
            <OptionSelect
              allOption
              value={draft.status}
              onValueChange={(v) => setDraft({ ...draft, status: v })}
              options={STATUSES.map((status) => ({ value: status, label: t(`status.container.${status}`) }))}
            />
          </FilterItem>
          <FilterItem label={t('container.currentLocation')}>
            <Input
              value={draft.locationCode}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setDraft({ ...draft, locationCode: e.target.value })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="p-4">
        <DataTable data={rows} columns={columns} getRowId={(c) => `${c.warehouseCode}:${c.containerNo}`} />
      </Panel>

      <ContainerFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(no) => navigate(`/wms/master/containers/${no}?wh=${warehouse.code}`)}
      />
    </PageContainer>
  )
}
