import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, DateTime, Empty, Num } from '@/components/biz/display'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { containerStatusMeta, containerTypeMeta } from '@/config/status'
import { containerContents, containerRelatedDocs, containerSummary } from '@/lib/container-derive'
import { containerIdOf } from '@/lib/container-id'
import { findContainer } from '@/mock/container-actions'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import type { ContainerContentLine } from '@/lib/container-derive'
import { ContainerFormDialog } from './container-dialogs'

export function ContainerDetailPage() {
  const { t } = useTranslation()
  const { containerNo } = useParams<{ containerNo: string }>()
  const [params] = useSearchParams()
  const current = useCurrentWarehouse()
  const navigate = useNavigate()
  const operator = useSettings((s) => s.operator)
  const warehouseCode = params.get('wh') ?? current.code
  const db = useDb()
  const container = findContainer(db.containers, warehouseCode, containerNo ?? '')
  const setStatus = useDb((s) => s.setContainerStatus)
  const inventoryAction = useDb((s) => s.inventoryAction)
  const { customerCode, customerName } = useLookups()
  const [editOpen, setEditOpen] = useState(false)

  if (!container) {
    return (
      <PageContainer title={t('container.detailTitle')}>
        <Section title={t('container.notFound')}>
          <p className="text-sm text-muted-foreground">{t('container.notFound')}</p>
          <Button variant="outline" asChild>
            <Link to="/wms/master/containers">{t('container.backToList')}</Link>
          </Button>
        </Section>
      </PageContainer>
    )
  }

  const contents = containerContents(container, db)
  const summary = containerSummary(contents)
  const docs = containerRelatedDocs(container, db)
  const logs = db.auditLogs.filter((l) => l.refNo === `${container.warehouseCode}/${container.containerNo}`)

  return (
    <>
      <PageContainer
        title={
          <DetailTitle
            title={t('container.detailTitle')}
            code={container.containerNo}
            status={containerStatusMeta[container.status]}
          />
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/wms/master/containers">{t('container.backToList')}</Link>
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" />
              {t('common.edit')}
            </Button>
            {container.status === 'IN_STOCK' && summary.qty > 0 && (
              <Button variant="outline" asChild>
                <Link to={`/pda/move?containerId=${encodeURIComponent(containerIdOf(container.warehouseCode, container.containerNo) ?? '')}`}>
                  {t('inventory.move.title')}
                </Link>
              </Button>
            )}
            {container.status === 'IN_STOCK' && summary.qty > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  const skus = [
                    ...new Map<string, { customerId: string; skuCode: string }>(
                      contents.map((line) => [line.skuCode, { customerId: container.customerId, skuCode: line.skuCode }]),
                    ).values(),
                  ]
                  const result = inventoryAction(
                    {
                      type: 'CREATE_STOCKTAKE',
                      warehouseCode: container.warehouseCode,
                      containerId: containerIdOf(container.warehouseCode, container.containerNo),
                      skus,
                    },
                    operator,
                  )
                  if (!result.ok) {
                    toast.error(t(result.errorKey, result.params))
                    return
                  }
                  toast.success(t('inventory.stocktake.createSuccess', { no: result.no ?? '' }))
                  if (result.no) navigate(`/wms/inventory/counts/${encodeURIComponent(result.no)}`)
                }}
              >
                {t('inventory.stocktake.create')}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                const disabled = container.status === 'DISABLED'
                const result = setStatus({
                  warehouseCode: container.warehouseCode,
                  containerNo: container.containerNo,
                  status: disabled ? 'IDLE' : 'DISABLED',
                })
                if (!result.ok) toast.error(t(result.errorKey, result.params))
                else toast.success(t(disabled ? 'container.enabled' : 'container.disabled', { no: container.containerNo }))
              }}
            >
              {t(container.status === 'DISABLED' ? 'container.enableAction' : 'container.disableAction')}
            </Button>
          </>
        }
      >
        <DetailOverview
          aside={
            <SummaryCard title={t('container.content')}>
              <SummaryMetrics
                items={[
                  { label: t('container.skuCount'), value: summary.skus },
                  { label: t('container.pieceCount'), value: summary.qty, tone: 'blue' },
                  { label: t('container.batchCount'), value: summary.batches, hidden: summary.batches === 0 },
                  { label: t('container.serialCount'), value: summary.serials, hidden: summary.serials === 0 },
                ]}
              />
              <div className="mt-3 text-xs text-muted-foreground">
                {container.maxPieces
                  ? t('container.capacityUsage', { qty: summary.qty, max: container.maxPieces })
                  : t('container.capacityUnlimited')}
              </div>
            </SummaryCard>
          }
        >
          <div className="flex min-w-0 flex-col gap-3">
          <Section title={t('container.basic')}>
            <Descriptions columns={3}>
              <DescriptionItem label={t('container.no')}>
                <BizCode>{container.containerNo}</BizCode>
              </DescriptionItem>
              <DescriptionItem label={t('container.type')}>
                <TagLabel meta={containerTypeMeta[container.containerType]} />
              </DescriptionItem>
              <DescriptionItem label={t('container.source')}>
                {t(`enum.containerSource.${container.source}`)}
              </DescriptionItem>
              <DescriptionItem label={t('common.customer')}>
                <CodeName code={customerCode(container.customerId)} name={customerName(container.customerId)} />
              </DescriptionItem>
              <DescriptionItem label={t('container.warehouse')}>
                <BizCode>{container.warehouseCode}</BizCode>
              </DescriptionItem>
              <DescriptionItem label={t('container.currentLocation')}>
                {container.currentLocationCode ? <BizCode>{container.currentLocationCode}</BizCode> : <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('container.parent')}>
                {container.parentContainerNo ? <BizCode>{container.parentContainerNo}</BizCode> : <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('container.lastScannedAt')}>
                {container.lastScannedAt ? <DateTime value={container.lastScannedAt} /> : <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('container.lastScannedBy')}>
                {container.lastScannedBy || <Empty />}
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={t('container.capacity')}>
            <Descriptions columns={3}>
              <DescriptionItem label={t('container.maxPieces')}>
                {container.maxPieces ?? <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('container.maxWeightKg')}>
                {container.maxWeightKg ?? <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('container.maxVolumeM3')}>
                {container.maxVolumeM3 ?? <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('container.remark')} multiline>
                {container.remark || <Empty />}
              </DescriptionItem>
            </Descriptions>
          </Section>
          </div>
        </DetailOverview>

        <DetailTabs
          param="tab"
          items={[
            {
              value: 'content',
              label: t('container.content'),
              count: contents.length,
              content: <ContentTable contents={contents} />,
            },
            {
              value: 'docs',
              label: t('container.relatedDocs'),
              count: docs.length,
              content: <DocsTable docs={docs} />,
            },
            {
              value: 'logs',
              label: t('container.logs'),
              count: logs.length,
              content: (
                <DataTable
                  data={logs}
                  columns={createDataColumns<typeof logs[number]>().columns([
                    createDataColumns<typeof logs[number]>().accessor('createdAt', {
                      header: t('common.createdAt'),
                      cell: ({ getValue }) => <DateTime value={getValue()} />,
                    }),
                    createDataColumns<typeof logs[number]>().accessor('action', {
                      header: t('container.logAction'),
                      cell: ({ getValue }) => t(`audit.action.${getValue()}`),
                    }),
                    createDataColumns<typeof logs[number]>().accessor('operator', { header: t('common.operator') }),
                    createDataColumns<typeof logs[number]>().accessor('detail', {
                      header: t('container.logDetail'),
                      cell: ({ getValue }) => getValue() || <Empty />,
                    }),
                  ])}
                  getRowId={(l) => l.id}
                />
              ),
            },
          ]}
        />
      </PageContainer>

      <ContainerFormDialog open={editOpen} container={container} onClose={() => setEditOpen(false)} />
    </>
  )
}

function ContentTable({ contents }: { contents: ContainerContentLine[] }) {
  const { t } = useTranslation()
  const col = createDataColumns<ContainerContentLine>()
  return (
    <DataTable
      data={contents}
      columns={col.columns([
        col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
        col.accessor('batchNo', {
          header: t('inbound.batchNo'),
          cell: ({ getValue }) => (getValue ? <BizCode>{getValue()}</BizCode> : <Empty />),
        }),
        col.accessor('productionDate', {
          header: t('inventory.productionDate'),
          cell: ({ getValue }) => getValue ?? <Empty />,
        }),
        col.accessor('qualityType', {
          header: t('container.quality'),
          cell: ({ getValue }) => <TagLabel>{t(`enum.quality.${getValue()}`)}</TagLabel>,
        }),
        col.accessor('locationCode', {
          header: t('container.currentLocation'),
          cell: ({ getValue }) => (getValue ? <BizCode>{getValue()}</BizCode> : <Empty />),
        }),
        col.accessor('qty', {
          header: t('container.pieceCount'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <Num value={getValue()} />,
        }),
        col.accessor('serialNos', {
          header: t('container.serialCount'),
          meta: { align: 'right' },
          cell: ({ getValue }) => <Num value={getValue()?.length ?? 0} />,
        }),
        col.accessor('source', {
          header: t('container.source'),
          cell: ({ getValue }) => t(`container.contentSource.${getValue()}`),
        }),
      ])}
      getRowId={(l) => `${l.skuCode}:${l.batchNo ?? ''}:${l.productionDate ?? ''}:${l.qualityType}:${l.locationCode ?? ''}:${l.source}`}
    />
  )
}

function DocsTable({ docs }: { docs: ReturnType<typeof containerRelatedDocs> }) {
  const { t } = useTranslation()
  const col = createDataColumns<(typeof docs)[number]>()
  return (
    <DataTable
      data={docs}
      columns={col.columns([
        col.accessor('type', {
          header: t('container.docType'),
          cell: ({ getValue }) => t(`container.docTypes.${getValue()}`),
        }),
        col.accessor('no', {
          header: t('container.docNo'),
          cell: ({ getValue, row }) => {
            const type = row.original.type
            const to =
              type === 'INBOUND'
                ? `/wms/inbound/orders/${getValue()}`
                : type === 'PUTAWAY'
                  ? `/wms/inbound/putaway/${getValue()}`
                  : type === 'RETURN'
                    ? `/wms/returns/orders/${getValue()}`
                    : `/wms/outbound/orders/${getValue()}`
            return <Link className="text-primary hover:underline" to={to}>{getValue()}</Link>
          },
        }),
        col.accessor('status', { header: t('common.status'), cell: ({ getValue }) => <span>{getValue()}</span> }),
        col.accessor('at', { header: t('common.createdAt'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
      ])}
      getRowId={(d) => `${d.type}:${d.no}:${d.at}`}
    />
  )
}
