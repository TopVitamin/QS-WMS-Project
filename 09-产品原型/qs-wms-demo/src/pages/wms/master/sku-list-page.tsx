import { Download } from 'lucide-react'
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
import { useSkuMasterStatusToggle } from '@/hooks/use-sku-master-status'
import { FILTER_ALL, skuMasterRowId, sortByUpdatedAtDesc } from '@/lib/master-data'
import {
  matchUpdatedRange,
  PRODUCT_FORM_I18N,
  skuDetailPath,
  skuEditPath,
} from '@/lib/sku-master'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
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

function matchBoolFilter(value: boolean, filter: string): boolean {
  if (filter === FILTER_ALL) return true
  if (filter === 'yes') return value
  return !value
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
  if (!matchBoolFilter(row.snEnabled, filters.snEnabled)) return false
  if (!matchBoolFilter(row.batchEnabled, filters.batchEnabled)) return false
  if (!matchBoolFilter(row.expiryEnabled, filters.expiryEnabled)) return false
  if (!matchBoolFilter(row.qcRequired, filters.qcRequired)) return false
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
  const { filters, draft, setDraft, applySearch, reset } = useMasterListFilters(emptyFilters)

  const customerName = (ownerCode: string) => customers.find((c) => c.code === ownerCode)?.name ?? ownerCode

  const rows = useMemo(
    () => sortByUpdatedAtDesc(skuMasters.filter((m) => matchSku(m, filters))),
    [skuMasters, filters],
  )

  const boolFilterSelect = (value: string, onChange: (v: string) => void) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('common.selectPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
        <SelectItem value="yes">{t('common.yes')}</SelectItem>
        <SelectItem value="no">{t('common.no')}</SelectItem>
      </SelectContent>
    </Select>
  )

  const columns = useMemo(() => {
    const col = createDataColumns<SkuMaster>()
    return col.columns([
      col.accessor('ownerCode', {
        header: t('masterSku.ownerCode'),
        enableSorting: false,
        meta: { label: t('masterSku.ownerCode') },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.ownerCode}</div>
            <div className="text-xs text-muted-foreground">{customerName(row.original.ownerCode)}</div>
          </div>
        ),
      }),
      col.accessor('code', {
        header: t('masterSku.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterSku.code') },
        cell: ({ row }) => (
          <DocNo
            onClick={() => navigate(skuDetailPath(row.original.ownerCode, row.original.code))}
            className={cn(textLink)}
          >
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
          return v ? <BizCode className="font-mono text-xs">{v}</BizCode> : <span className="text-muted-foreground">—</span>
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
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('batchEnabled', {
        header: t('masterSku.batchEnabled'),
        meta: { label: t('masterSku.batchEnabled') },
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('expiryEnabled', {
        header: t('masterSku.expiryEnabled'),
        meta: { label: t('masterSku.expiryEnabled') },
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('qcRequired', {
        header: t('masterSku.qcRequired'),
        meta: { label: t('masterSku.qcRequired') },
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('isBattery', {
        header: t('masterSku.isBattery'),
        meta: { label: t('masterSku.isBattery') },
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('spec', {
        header: t('masterSku.spec'),
        meta: { label: t('masterSku.spec') },
      }),
      col.accessor('upstreamSkuId', {
        header: t('masterSku.upstreamSkuId'),
        meta: { label: t('masterSku.upstreamSkuId') },
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const { ownerCode, code, status } = row.original
          const enabled = status === 'ENABLED'
          return (
            <div className="flex gap-2">
              <Button variant="link" className="h-auto p-0" onClick={() => navigate(skuEditPath(ownerCode, code))}>
                {t('masterSku.edit')}
              </Button>
              <Button
                variant="link"
                className={cn('h-auto p-0', enabled ? 'text-destructive' : '')}
                onClick={() => toggleStatus(ownerCode, code, enabled ? 'DISABLED' : 'ENABLED')}
              >
                {t(enabled ? 'masterSku.disableAction' : 'masterSku.enableAction')}
              </Button>
            </div>
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
          columns={6}
          onSearch={applySearch}
          onReset={reset}
          advanced={
            <>
              <FilterItem label={t('masterSku.productForm')}>
                <Select value={draft.productForm} onValueChange={(v) => setDraft({ ...draft, productForm: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('common.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                    <SelectItem value="SMALL">{t('masterLocation.productForm.SMALL')}</SelectItem>
                    <SelectItem value="LARGE">{t('masterLocation.productForm.LARGE')}</SelectItem>
                    <SelectItem value="IRREGULAR">{t('masterLocation.productForm.IRREGULAR')}</SelectItem>
                  </SelectContent>
                </Select>
              </FilterItem>
              <FilterItem label={t('masterSku.snEnabled')}>
                {boolFilterSelect(draft.snEnabled, (v) => setDraft({ ...draft, snEnabled: v }))}
              </FilterItem>
              <FilterItem label={t('masterSku.batchEnabled')}>
                {boolFilterSelect(draft.batchEnabled, (v) => setDraft({ ...draft, batchEnabled: v }))}
              </FilterItem>
              <FilterItem label={t('masterSku.expiryEnabled')}>
                {boolFilterSelect(draft.expiryEnabled, (v) => setDraft({ ...draft, expiryEnabled: v }))}
              </FilterItem>
              <FilterItem label={t('masterSku.qcRequired')}>
                {boolFilterSelect(draft.qcRequired, (v) => setDraft({ ...draft, qcRequired: v }))}
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
            <Select value={draft.ownerCode} onValueChange={(v) => setDraft({ ...draft, ownerCode: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('common.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
