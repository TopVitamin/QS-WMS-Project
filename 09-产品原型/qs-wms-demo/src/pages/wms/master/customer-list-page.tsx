import { Download, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateTime, DocNo, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect, UsageStatusFilter } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usageStatusMeta } from '@/config/status'
import { useCustomerMasterStatusToggle } from '@/hooks/use-customer-master-status'
import { useListFilters } from '@/hooks/use-list-filters'
import {
  customerDetailPath,
  formatCustomerFullAddress,
  OWNER_TYPE_I18N,
} from '@/lib/customer-master'
import { FILTER_ALL, sortByUpdatedAtDesc } from '@/lib/master-data'
import { countryLabelKey, WAREHOUSE_COUNTRY_OPTIONS } from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { CustomerMaster, CustomerOwnerType, UsageStatus } from '@/types/wms'
import { MockMasterPushDialog } from './mock-master-push-dialog'

interface Filters {
  code: string
  name: string
  ownerType: string
  status: string
  countryCode: string
  upstreamOwnerId: string
}

const emptyFilters: Filters = {
  code: '',
  name: '',
  ownerType: FILTER_ALL,
  status: FILTER_ALL,
  countryCode: FILTER_ALL,
  upstreamOwnerId: '',
}

const OWNER_TYPES: CustomerOwnerType[] = ['SELF', 'EXTERNAL']

function matchCustomer(row: CustomerMaster, filters: Filters): boolean {
  if (filters.code && !row.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.name && !row.name.toLowerCase().includes(filters.name.trim().toLowerCase())) return false
  if (filters.ownerType !== FILTER_ALL && row.ownerType !== filters.ownerType) return false
  if (filters.status !== FILTER_ALL && row.status !== filters.status) return false
  if (filters.countryCode !== FILTER_ALL && row.countryCode !== filters.countryCode) return false
  if (
    filters.upstreamOwnerId &&
    !row.upstreamOwnerId.toLowerCase().includes(filters.upstreamOwnerId.trim().toLowerCase())
  ) {
    return false
  }
  return true
}

export function CustomerListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const customerMasters = useDb((s) => s.customerMasters)
  const toggleStatus = useCustomerMasterStatusToggle()
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

  const rows = useMemo(
    () => sortByUpdatedAtDesc(customerMasters.filter((c) => matchCustomer(c, filters))),
    [customerMasters, filters],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<CustomerMaster>()
    return col.columns([
      col.accessor('code', {
        header: t('masterCustomer.code'),
        enableHiding: false,
        meta: { pin: 'left', label: t('masterCustomer.code') },
        cell: ({ row }) => (
          <DocNo onClick={() => navigate(customerDetailPath(row.original.code))}>{row.original.code}</DocNo>
        ),
      }),
      col.accessor('name', { header: t('masterCustomer.name'), meta: { label: t('masterCustomer.name') } }),
      col.accessor('ownerType', {
        header: t('masterCustomer.ownerType'),
        cell: ({ getValue }) => t(OWNER_TYPE_I18N[getValue() as CustomerOwnerType]),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.display({
        id: 'fullAddress',
        header: t('masterCustomer.fullAddress'),
        cell: ({ row }) => {
          const v = formatCustomerFullAddress(row.original, t(countryLabelKey(row.original.countryCode)))
          return v ? <span className="block max-w-52 truncate" title={v}>{v}</span> : <Empty />
        },
      }),
      col.accessor('updatedAt', {
        header: t('masterCustomer.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('updatedBy', { header: t('masterCustomer.updatedBy') }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableHiding: false,
        meta: { pin: 'right' },
        cell: ({ row }) => {
          const c = row.original
          const enabled = c.status === 'ENABLED'
          return (
            <RowActions
              actions={[
                {
                  key: 'edit',
                  label: t('masterCustomer.edit'),
                  onClick: () => navigate(customerDetailPath(c.code, true)),
                },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterCustomer.disableAction' : 'masterCustomer.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(c, enabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
          )
        },
      }),
    ])
  }, [navigate, t, toggleStatus])

  const [pushOpen, setPushOpen] = useState(false)

  return (
    <PageContainer
      fill
      title={t('menu.customers')}
      actions={
        <>
          <Button variant="outline" onClick={() => setPushOpen(true)}>
            <Send data-icon="inline-start" />
            {t('masterPush.action')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('masterCustomer.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar columns={6}
          onSearch={applySearch}
          onReset={reset}
          advanced={
            <FilterItem label={t('masterCustomer.upstreamOwnerId')}>
              <Input
                value={draft.upstreamOwnerId}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setDraft({ ...draft, upstreamOwnerId: e.target.value })}
              />
            </FilterItem>
          }
        >
          <FilterItem label={t('masterCustomer.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterCustomer.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterCustomer.name')}>
            <Input
              value={draft.name}
              placeholder={t('masterCustomer.namePlaceholder')}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterCustomer.ownerType')}>
            <OptionSelect
              allOption
              value={draft.ownerType}
              onValueChange={(v) => setDraft({ ...draft, ownerType: v })}
              options={OWNER_TYPES.map((o) => ({ value: o, label: t(OWNER_TYPE_I18N[o]) }))}
            />
          </FilterItem>
          <FilterItem label={t('common.status')}>
            <UsageStatusFilter value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })} />
          </FilterItem>
          <FilterItem label={t('masterCustomer.countryCode')}>
            <OptionSelect
              allOption
              value={draft.countryCode}
              onValueChange={(v) => setDraft({ ...draft, countryCode: v })}
              options={WAREHOUSE_COUNTRY_OPTIONS.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
            />
          </FilterItem>
        </FilterBar>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable className="flex-1" data={rows} columns={columns} getRowId={(r) => r.code} pageSize={20} />
      </Panel>
      {pushOpen && <MockMasterPushDialog masterType="OWNER" onClose={() => setPushOpen(false)} />}
    </PageContainer>
  )
}
