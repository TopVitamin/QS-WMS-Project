import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { CarrierFormDialog } from '@/components/biz/carrier-form-dialog'
import { ChannelFormDialog } from '@/components/biz/channel-form-dialog'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, DocNo } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { usageStatusMeta } from '@/config/status'
import { useCarrierMasterStatusToggle } from '@/hooks/use-carrier-master-status'
import { useChannelMasterStatusToggle } from '@/hooks/use-channel-master-status'
import { carrierShortDisplay } from '@/lib/carrier-master'
import { sortByUpdatedAtDesc } from '@/lib/master-data'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import type { ChannelMaster, UsageStatus } from '@/types/wms'

type ChannelDialogState =
  | { mode: 'create' }
  | { mode: 'edit' | 'view'; code: string }

export function CarrierDetailPage() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const carrier = useDb((s) => s.carrierMasters.find((c) => c.code === code))
  const channelMasters = useDb((s) => s.channelMasters)
  const toggleCarrier = useCarrierMasterStatusToggle()
  const toggleChannel = useChannelMasterStatusToggle()

  const [carrierDialog, setCarrierDialog] = useState(false)
  const [channelDialog, setChannelDialog] = useState<ChannelDialogState | null>(null)
  const [channelRefresh, setChannelRefresh] = useState(0)

  const channels = useMemo(() => {
    if (!code) return []
    return sortByUpdatedAtDesc(channelMasters.filter((ch) => ch.carrierCode === code))
  }, [channelMasters, code, channelRefresh])

  const channelColumns = useMemo(() => {
    const col = createDataColumns<ChannelMaster>()
    return col.columns([
      col.accessor('code', {
        header: t('masterChannel.code'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'left', label: t('masterChannel.code') },
        cell: ({ getValue }) => (
          <DocNo onClick={() => setChannelDialog({ mode: 'view', code: getValue() })}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('name', {
        header: t('masterChannel.name'),
        enableSorting: false,
        meta: { label: t('masterChannel.name') },
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
      col.display({
        id: 'actions',
        header: t('common.actions'),
        enableSorting: false,
        enableHiding: false,
        meta: { pin: 'right', label: t('common.actions') },
        cell: ({ row }) => {
          const ch = row.original
          const chEnabled = ch.status === 'ENABLED'
          return (
            <span className="inline-flex items-center gap-2">
              <button
                type="button"
                className={textLink}
                onClick={() => setChannelDialog({ mode: 'view', code: ch.code })}
              >
                {t('masterChannel.view')}
              </button>
              <button
                type="button"
                className={textLink}
                onClick={() => setChannelDialog({ mode: 'edit', code: ch.code })}
              >
                {t('masterChannel.edit')}
              </button>
              <button
                type="button"
                className={cn(textLink, chEnabled ? 'text-destructive' : undefined)}
                onClick={() => toggleChannel(ch.code, chEnabled ? 'DISABLED' : 'ENABLED')}
              >
                {t(chEnabled ? 'masterChannel.disableAction' : 'masterChannel.enableAction')}
              </button>
            </span>
          )
        },
      }),
    ])
  }, [t, toggleChannel])

  if (!code) return <Navigate to="/wms/master/carriers" replace />
  if (!carrier) return <Navigate to="/wms/master/carriers" replace />

  const enabled = carrier.status === 'ENABLED'

  return (
    <PageContainer
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{t('masterCarrier.detailTitle', { code: carrier.code })}</span>
          <StatusBadge meta={usageStatusMeta[carrier.status]} />
        </span>
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/wms/master/carriers">{t('masterCarrier.backToList')}</Link>
          </Button>
          {enabled ? (
            <Button variant="destructive" onClick={() => toggleCarrier(carrier.code, 'DISABLED')}>
              {t('masterCarrier.disableAction')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toggleCarrier(carrier.code, 'ENABLED')}>
              {t('masterCarrier.enableAction')}
            </Button>
          )}
          <Button variant="outline" onClick={() => setCarrierDialog(true)}>{t('masterCarrier.edit')}</Button>
          <Button disabled={!enabled} onClick={() => setChannelDialog({ mode: 'create' })}>
            <Plus data-icon="inline-start" />
            {t('masterCarrier.addChannel')}
          </Button>
        </>
      }
    >
      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterCarrier.sectionBasic')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterCarrier.code')}>
            <BizCode>{carrier.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterCarrier.name')}>{carrier.name}</DescriptionItem>
          <DescriptionItem label={t('masterCarrier.shortName')}>{carrierShortDisplay(carrier)}</DescriptionItem>
          <DescriptionItem label={t('common.status')}>
            <StatusBadge meta={usageStatusMeta[carrier.status]} />
          </DescriptionItem>
          <DescriptionItem label={t('masterCarrier.remark')} className="col-span-3">
            {carrier.remark || <span className="text-muted-foreground">-</span>}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterCarrier.sectionContact')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterCarrier.contactName')}>{carrier.contactName || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterCarrier.contactPhone')}>{carrier.contactPhone || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterCarrier.contactEmail')}>{carrier.contactEmail || '-'}</DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterCarrier.sectionIntegration')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterCarrier.externalCarrierCode')}>
            {carrier.externalCarrierCode || '-'}
          </DescriptionItem>
          <DescriptionItem label={t('masterCarrier.integrationPlaceholder')} className="col-span-3">
            <span className="text-muted-foreground">{t('masterCarrier.integrationPlaceholderDesc')}</span>
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="flex min-h-0 flex-col gap-3 p-4">
        <h2 className="text-sm font-medium">{t('masterCarrier.sectionChannels')}</h2>
        <DataTable
          data={channels}
          columns={channelColumns}
          getRowId={(ch) => ch.code}
          pageSize={20}
          selectable={false}
        />
      </Panel>

      <MasterAuditPanel scope="masterCarrier" updatedBy={carrier.updatedBy} updatedAt={carrier.updatedAt} />

      <CarrierFormDialog
        open={carrierDialog}
        mode="edit"
        carrierCode={carrier.code}
        onOpenChange={setCarrierDialog}
      />

      <ChannelFormDialog
        open={channelDialog !== null}
        mode={channelDialog?.mode ?? 'create'}
        channelCode={channelDialog && channelDialog.mode !== 'create' ? channelDialog.code : undefined}
        defaultCarrierCode={carrier.code}
        onOpenChange={(open) => !open && setChannelDialog(null)}
        onSaved={() => setChannelRefresh((n) => n + 1)}
      />
    </PageContainer>
  )
}
