import { Download } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { BizCode, CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect, UsageStatusFilter, YesNoFilter } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usageStatusMeta } from '@/config/status'
import { useListFilters } from '@/hooks/use-list-filters'
import { useSkuMasterStatusToggle } from '@/hooks/use-sku-master-status'
import { FILTER_ALL, matchYesNo, skuMasterRowId, sortByUpdatedAtDesc } from '@/lib/master-data'
import {
  matchUpdatedRange,
  PRODUCT_FORM_I18N,
  PRODUCT_FORM_OPTIONS,
  skuDetailPath,
  skuEditPath,
} from '@/lib/sku-master'
import { codeNameText } from '@/lib/typography'
import { useDb } from '@/mock/db'
import type { SkuMaster, UsageStatus } from '@/types/wms'

interface Filters {
  ownerCode: string
  code: string
  name: string
  status: string
  primaryBarcode: string
  productForm: string
  snEnabled: string
  batchEnabled: string
  expiryEnabled: string
  qcRequired: string
  upstreamSkuId: string
  updatedFrom: string
  updatedTo: string
}

const emptyFilters: Filters = {
  ownerCode: FILTER_ALL,
  code: '',
  name: '',
  status: FILTER_ALL,
  primaryBarcode: '',
  productForm: FILTER_ALL,
  snEnabled: FILTER_ALL,
  batchEnabled: FILTER_ALL,
  expiryEnabled: FILTER_ALL,
  qcRequired: FILTER_ALL,
  upstreamSkuId: '',
  updatedFrom: '',
  updatedTo: '',
}

function matchSku(row: SkuMaster, filters: Filters): boolean {
  if (filters.ownerCode !== FILTER_ALL && row.ownerCode !== filters.ownerCode) return false
  if (filters.code && !row.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.name && !row.name.includes(filters.name.trim())) return false
  if (filters.status !== FILTER_ALL && row.status !== filters.status) return false
  if (
    filters.primaryBarcode &&
    !(row.primaryBarcode ?? '').toLowerCase().includes(filters.primaryBarcode.trim().toLowerCase())
  ) {
    return false
  }
  if (filters.productForm !== FILTER_ALL && row.productForm !== filters.productForm) return false
  if (!matchYesNo(row.snEnabled, filters.snEnabled)) return false
  if (!matchYesNo(row.batchEnabled, filters.batchEnabled)) return false
  if (!matchYesNo(row.expiryEnabled, filters.expiryEnabled)) return false
  if (!matchYesNo(row.qcRequired, filters.qcRequired)) return false
  if (
    filters.upstreamSkuId &&
    !row.upstreamSkuId.toLowerCase().includes(filters.upstreamSkuId.trim().toLowerCase())
  ) {
    return false
  }
  if (!matchUpdatedRange(row.updatedAt, filters.updatedFrom, filters.updatedTo)) return false
  return true
}

export function SkuListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const skuMasters = useDb((s) => s.skuMasters)
  const customers = useDb((s) => s.customers)
  const toggleStatus = useSkuMasterStatusToggle()
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

  const rows = useMemo(
    () => sortByUpdatedAtDesc(skuMasters.filter((m) => matchSku(m, filters))),
    [skuMasters, filters],
  )

  const columns = useMemo(() => {
    const customerName = (ownerCode: string) => customers.find((c) => c.code === ownerCode)?.name
    const yesNo = (v: boolean) => (v ? t('common.yes') : t('common.no'))
    const col = createDataColumns<SkuMaster>()
    return col.columns([
      col.accessor('ownerCode', {
        header: t('masterSku.ownerCode'),
        meta: { label: t('masterSku.ownerCode') },
        cell: ({ getValue }) => <CodeName code={getValue()} name={customerName(getValue())} />,
      }),
      col.accessor('code', {
        header: t('masterSku.code'),
        enableHiding: false,
        meta: { pin: 'left', label: t('masterSku.code') },
        cell: ({ row }) => (
          <DocNo onClick={() => navigate(skuDetailPath(row.original.ownerCode, row.original.code))}>
            {row.original.code}
          </DocNo>
        ),
      }),
      col.accessor('name', {
        header: t('masterSku.name'),
        meta: { label: t('masterSku.name') },
      }),
      col.accessor('primaryBarcode', {
        header: t('masterSku.primaryBarcode'),
        meta: { label: t('masterSku.primaryBarcode') },
        cell: ({ getValue }) => {
          const v = getValue()
          return v ? <BizCode>{v}</BizCode> : <Empty />
        },
      }),
      col.accessor('unit', {
        header: t('masterSku.unit'),
        meta: { label: t('masterSku.unit') },
      }),
      col.accessor('productForm', {
        header: t('masterSku.productForm'),
        meta: { label: t('masterSku.productForm') },
        cell: ({ getValue }) => t(PRODUCT_FORM_I18N[getValue()]),
      }),
      col.accessor('status', {
        header: t('common.status'),
        meta: { label: t('common.status') },
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.accessor('updatedAt', {
        header: t('masterSku.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        meta: { label: t('masterSku.updatedAt') },
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('updatedBy', {
        header: t('masterSku.updatedBy'),
        meta: { label: t('masterSku.updatedBy') },
      }),
      col.accessor('snEnabled', {
        header: t('masterSku.snEnabled'),
        meta: { label: t('masterSku.snEnabled') },
        cell: ({ getValue }) => yesNo(getValue()),
      }),
      col.accessor('batchEnabled', {
        header: t('masterSku.batchEnabled'),
        meta: { label: t('masterSku.batchEnabled') },
        cell: ({ getValue }) => yesNo(getValue()),
      }),
      col.accessor('expiryEnabled', {
        header: t('masterSku.expiryEnabled'),
        meta: { label: t('masterSku.expiryEnabled') },
        cell: ({ getValue }) => yesNo(getValue()),
      }),
      col.accessor('qcRequired', {
        header: t('masterSku.qcRequired'),
        meta: { label: t('masterSku.qcRequired') },
        cell: ({ getValue }) => yesNo(getValue()),
      }),
      col.accessor('isBattery', {
        header: t('masterSku.isBattery'),
        meta: { label: t('masterSku.isBattery') },
        cell: ({ getValue }) => yesNo(Boolean(getValue())),
      }),
      col.accessor('spec', {
        header: t('masterSku.spec'),
        meta: { label: t('masterSku.spec') },
      }),
      col.accessor('upstreamSkuId', {
        header: t('masterSku.upstreamSkuId'),
        meta: { label: t('masterSku.upstreamSkuId') },
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const { ownerCode, code, status } = row.original
          const enabled = status === 'ENABLED'
          return (
            <RowActions
              actions={[
                { key: 'edit', label: t('masterSku.edit'), onClick: () => navigate(skuEditPath(ownerCode, code)) },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterSku.disableAction' : 'masterSku.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(ownerCode, code, enabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
          )
        },
      }),
    ])
  }, [navigate, t, toggleStatus, customers])

  return (
    <PageContainer
      fill
      title={t('menu.skus')}
      actions={
        <Button variant="outline" onClick={() => toast.info(t('masterSku.exportMock'))}>
          <Download data-icon="inline-start" />
          {t('common.export')}
        </Button>
      }
    >
      <Panel className="p-4">
        <FilterBar
          onSearch={applySearch}
          onReset={reset}
          advanced={
            <>
              <FilterItem label={t('masterSku.productForm')}>
                <OptionSelect
                  allOption
                  value={draft.productForm}
                  onValueChange={(v) => setDraft({ ...draft, productForm: v })}
                  options={PRODUCT_FORM_OPTIONS.map((pf) => ({ value: pf, label: t(PRODUCT_FORM_I18N[pf]) }))}
                />
              </FilterItem>
              <FilterItem label={t('masterSku.snEnabled')}>
                <YesNoFilter value={draft.snEnabled} onValueChange={(v) => setDraft({ ...draft, snEnabled: v })} />
              </FilterItem>
              <FilterItem label={t('masterSku.batchEnabled')}>
                <YesNoFilter value={draft.batchEnabled} onValueChange={(v) => setDraft({ ...draft, batchEnabled: v })} />
              </FilterItem>
              <FilterItem label={t('masterSku.expiryEnabled')}>
                <YesNoFilter
                  value={draft.expiryEnabled}
                  onValueChange={(v) => setDraft({ ...draft, expiryEnabled: v })}
                />
              </FilterItem>
              <FilterItem label={t('masterSku.qcRequired')}>
                <YesNoFilter value={draft.qcRequired} onValueChange={(v) => setDraft({ ...draft, qcRequired: v })} />
              </FilterItem>
              <FilterItem label={t('masterSku.upstreamSkuId')}>
                <Input
                  value={draft.upstreamSkuId}
                  placeholder={t('common.inputPlaceholder')}
                  onChange={(e) => setDraft({ ...draft, upstreamSkuId: e.target.value })}
                />
              </FilterItem>
              <FilterItem label={t('masterSku.updatedRange')}>
                <DateRangePickerField
                  value={{ from: draft.updatedFrom, to: draft.updatedTo }}
                  onChange={(range) => setDraft({ ...draft, updatedFrom: range.from, updatedTo: range.to })}
                />
              </FilterItem>
            </>
          }
        >
          <FilterItem label={t('masterSku.ownerCode')}>
            <OptionSelect
              allOption
              value={draft.ownerCode}
              onValueChange={(v) => setDraft({ ...draft, ownerCode: v })}
              options={customers.map((c) => ({ value: c.code, label: codeNameText(c.code, c.name) }))}
            />
          </FilterItem>
          <FilterItem label={t('masterSku.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterSku.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterSku.name')}>
            <Input
              value={draft.name}
              placeholder={t('masterSku.namePlaceholder')}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('common.status')}>
            <UsageStatusFilter value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })} />
          </FilterItem>
          <FilterItem label={t('masterSku.primaryBarcode')}>
            <Input
              value={draft.primaryBarcode}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setDraft({ ...draft, primaryBarcode: e.target.value })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(r) => skuMasterRowId(r.ownerCode, r.code)}
          pageSize={20}
          initialColumnVisibility={{
            snEnabled: false,
            batchEnabled: false,
            expiryEnabled: false,
            qcRequired: false,
            isBattery: false,
            spec: false,
            upstreamSkuId: false,
          }}
        />
      </Panel>
    </PageContainer>
  )
}
