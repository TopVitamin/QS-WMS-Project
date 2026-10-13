import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, DocNo, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { MasterDetailActions } from '@/components/biz/master-detail-actions'
import { DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { usageStatusMeta } from '@/config/status'
import { useCarrierMasterStatusToggle } from '@/hooks/use-carrier-master-status'
import { useChannelMasterStatusToggle } from '@/hooks/use-channel-master-status'
import { carrierShortDisplay } from '@/lib/carrier-master'
import { sortByUpdatedAtDesc } from '@/lib/master-data'
import { useDb } from '@/mock/db'
import type { ChannelMaster, UsageStatus } from '@/types/wms'
import { CarrierFormDialog } from './carrier-form-dialog'
import { ChannelFormDialog } from './channel-form-dialog'

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

  const channels = useMemo(() => {
    if (!code) return []
    return sortByUpdatedAtDesc(channelMasters.filter((ch) => ch.carrierCode === code))
  }, [channelMasters, code])

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
            <RowActions
              actions={[
                {
                  key: 'edit',
                  label: t('masterChannel.edit'),
                  onClick: () => setChannelDialog({ mode: 'edit', code: ch.code }),
                },
                {
                  key: 'toggle',
                  label: t(chEnabled ? 'masterChannel.disableAction' : 'masterChannel.enableAction'),
                  danger: chEnabled,
                  onClick: () => toggleChannel(ch.code, chEnabled ? 'DISABLED' : 'ENABLED'),
                },
              ]}
            />
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
        <DetailTitle title={t('masterCarrier.detailTitle')} code={carrier.code} status={usageStatusMeta[carrier.status]} />
      }
      actions={
        <MasterDetailActions
          scope="masterCarrier"
          backTo="/wms/master/carriers"
          enabled={enabled}
          onToggle={(next) => toggleCarrier(carrier.code, next)}
          onEdit={() => setCarrierDialog(true)}
          extra={
            <Button disabled={!enabled} onClick={() => setChannelDialog({ mode: 'create' })}>
              <Plus data-icon="inline-start" />
              {t('masterCarrier.addChannel')}
            </Button>
          }
        />
      }
    >
      <Section title={t('masterCarrier.sectionBasic')}>
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
            {carrier.remark || <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterCarrier.sectionContact')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterCarrier.contactName')}>{carrier.contactName || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterCarrier.contactPhone')}>{carrier.contactPhone || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterCarrier.contactEmail')}>{carrier.contactEmail || <Empty />}</DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterCarrier.sectionIntegration')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterCarrier.externalCarrierCode')}>
            {carrier.externalCarrierCode ? <BizCode>{carrier.externalCarrierCode}</BizCode> : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('masterCarrier.integrationPlaceholder')} className="col-span-3">
            <span className="text-muted-foreground">{t('masterCarrier.integrationPlaceholderDesc')}</span>
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section flush title={t('masterCarrier.sectionChannels')}>
        <DataTable
          data={channels}
          columns={channelColumns}
          getRowId={(ch) => ch.code}
          pageSize={20}
          selectable={false}
        />
      </Section>

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
      />
    </PageContainer>
  )
}
