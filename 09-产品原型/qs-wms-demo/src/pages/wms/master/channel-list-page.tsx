import { Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { CodeName, DateTime, DocNo } from '@/components/biz/display'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect, UsageStatusFilter } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usageStatusMeta } from '@/config/status'
import { useChannelMasterStatusToggle } from '@/hooks/use-channel-master-status'
import { useListFilters } from '@/hooks/use-list-filters'
import { carrierDetailPath } from '@/lib/carrier-master'
import { FILTER_ALL, sortByUpdatedAtDesc } from '@/lib/master-data'
import { codeNameText } from '@/lib/typography'
import { useDb } from '@/mock/db'
import type { ChannelMaster, UsageStatus } from '@/types/wms'
import { ChannelFormDialog } from './channel-form-dialog'

interface Filters {
  code: string
  name: string
  carrierCode: string
  channelType: string
  status: string
  integrationMode: string
}

const emptyFilters: Filters = {
  code: '',
  name: '',
  carrierCode: FILTER_ALL,
  channelType: FILTER_ALL,
  status: FILTER_ALL,
  integrationMode: FILTER_ALL,
}

const CHANNEL_TYPES: ChannelMaster['channelType'][] = ['EXPRESS', 'TRUCK', 'PICKUP', 'OTHER']
const INTEGRATION_MODES: ChannelMaster['integrationMode'][] = ['OFFLINE_HANDOVER', 'API_RESERVED']

function matchChannel(ch: ChannelMaster, filters: Filters): boolean {
  if (filters.code && !ch.code.toLowerCase().includes(filters.code.trim().toLowerCase())) return false
  if (filters.name && !ch.name.includes(filters.name.trim())) return false
  if (filters.carrierCode !== FILTER_ALL && ch.carrierCode !== filters.carrierCode) return false
  if (filters.channelType !== FILTER_ALL && ch.channelType !== filters.channelType) return false
  if (filters.status !== FILTER_ALL && ch.status !== filters.status) return false
  if (filters.integrationMode !== FILTER_ALL && ch.integrationMode !== filters.integrationMode) return false
  return true
}

type DialogState = { mode: 'create' | 'edit' | 'view'; code?: string } | null

export function ChannelListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const channelMasters = useDb((s) => s.channelMasters)
  const carrierMasters = useDb((s) => s.carrierMasters)
  const toggleStatus = useChannelMasterStatusToggle()
  const { filters, draft, setDraft, applySearch, reset } = useListFilters(emptyFilters)

  const [dialog, setDialog] = useState<DialogState>(null)

  const hasEnabledCarrier = carrierMasters.some((c) => c.status === 'ENABLED')

  const carrierOptions = useMemo(() => {
    const codes = new Set(channelMasters.map((ch) => ch.carrierCode))
    return carrierMasters.filter((c) => codes.has(c.code))
  }, [carrierMasters, channelMasters])

  const rows = useMemo(() => {
    const list = channelMasters.filter((ch) => matchChannel(ch, filters))
    return sortByUpdatedAtDesc(list)
  }, [channelMasters, filters])

  const columns = useMemo(() => {
    const carrierName = (carrierCode: string) => carrierMasters.find((c) => c.code === carrierCode)?.name
    const col = createDataColumns<ChannelMaster>()
    return col.columns([
      col.accessor('code', {
        header: t('masterChannel.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterChannel.code') },
        cell: ({ getValue }) => (
          <DocNo onClick={() => setDialog({ mode: 'view', code: getValue() })}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('name', {
        header: t('masterChannel.name'),
        enableSorting: false,
        meta: { label: t('masterChannel.name') },
      }),
      col.accessor('carrierCode', {
        header: t('masterChannel.carrierCode'),
        enableSorting: false,
        meta: { label: t('masterChannel.carrierCode') },
        cell: ({ getValue }) => (
          <CodeName
            code={getValue()}
            name={carrierName(getValue())}
            onClick={() => navigate(carrierDetailPath(getValue()))}
          />
        ),
      }),
      col.accessor('channelType', {
        header: t('masterChannel.channelType'),
        enableSorting: false,
        cell: ({ getValue }) => t(`masterChannel.types.${getValue()}`),
      }),
      col.accessor('status', {
        header: t('common.status'),
        enableSorting: false,
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.accessor('integrationMode', {
        header: t('masterChannel.integrationMode'),
        enableSorting: false,
        cell: ({ getValue }) => t(`masterChannel.integrationModes.${getValue()}`),
      }),
      col.accessor('updatedAt', {
        header: t('masterChannel.updatedAt'),
        enableSorting: true,
        sortFn: 'datetime',
        meta: { label: t('masterChannel.updatedAt') },
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const ch = row.original
          const enabled = ch.status === 'ENABLED'
          return (
            <RowActions
              actions={[
                { key: 'edit', label: t('masterChannel.edit'), onClick: () => setDialog({ mode: 'edit', code: ch.code }) },
                {
                  key: 'toggle',
                  label: t(enabled ? 'masterChannel.disableAction' : 'masterChannel.enableAction'),
                  danger: enabled,
                  onClick: () => toggleStatus(ch.code, enabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
          )
        },
      }),
    ])
  }, [navigate, t, toggleStatus, carrierMasters])

  const onCreate = () => {
    if (!hasEnabledCarrier) {
      toast.warning(t('masterChannel.needEnabledCarrier'))
      return
    }
    setDialog({ mode: 'create' })
  }

  return (
    <PageContainer
      fill
      title={t('menu.channels')}
      actions={
        <>
          <Button onClick={onCreate} disabled={!hasEnabledCarrier}>
            <Plus data-icon="inline-start" />
            {t('masterChannel.create')}
          </Button>
          <Button variant="outline" onClick={() => toast.info(t('masterChannel.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </>
      }
    >
      <Panel className="p-4">
        <FilterBar
          onSearch={applySearch}
          onReset={reset}
          advanced={
            <FilterItem label={t('masterChannel.integrationMode')}>
              <OptionSelect
                allOption
                value={draft.integrationMode}
                onValueChange={(v) => setDraft({ ...draft, integrationMode: v })}
                options={INTEGRATION_MODES.map((m) => ({ value: m, label: t(`masterChannel.integrationModes.${m}`) }))}
              />
            </FilterItem>
          }
        >
          <FilterItem label={t('masterChannel.code')}>
            <Input
              value={draft.code}
              placeholder={t('masterChannel.codePlaceholder')}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterChannel.name')}>
            <Input
              value={draft.name}
              placeholder={t('masterChannel.namePlaceholder')}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('masterChannel.carrierCode')}>
            <OptionSelect
              allOption
              value={draft.carrierCode}
              onValueChange={(v) => setDraft({ ...draft, carrierCode: v })}
              options={carrierOptions.map((c) => ({ value: c.code, label: codeNameText(c.code, c.name) }))}
            />
          </FilterItem>
          <FilterItem label={t('common.status')}>
            <UsageStatusFilter value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })} />
          </FilterItem>
          <FilterItem label={t('masterChannel.channelType')}>
            <OptionSelect
              allOption
              value={draft.channelType}
              onValueChange={(v) => setDraft({ ...draft, channelType: v })}
              options={CHANNEL_TYPES.map((ct) => ({ value: ct, label: t(`masterChannel.types.${ct}`) }))}
            />
          </FilterItem>
        </FilterBar>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(ch) => ch.code}
          pageSize={20}
          selectable={false}
        />
      </Panel>

      <ChannelFormDialog
        open={dialog !== null}
        mode={dialog?.mode ?? 'create'}
        channelCode={dialog?.code}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </PageContainer>
  )
}
