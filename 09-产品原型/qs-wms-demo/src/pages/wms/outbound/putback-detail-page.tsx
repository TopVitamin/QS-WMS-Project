import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { outboundPutbackStatusMeta, qualityMeta, unpickReasonMeta } from '@/config/status'
import { putbackExpected, putbackPlacements, putbackReturned } from '@/lib/outbound-derive'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutbackLine } from '@/types/outbound'
import { outboundLogColumns, outboundLogs } from './outbound-log-columns'
import { OutboundNotFound, useBackTo } from './shared'

type LineRow = PutbackLine & { lineNo: number }
type PlacementRow = ReturnType<typeof putbackPlacements>[number]

/** 返库上架单详情（返库上架单前端Demo版PRD 第四节）：只读本单数据，不读拣货任务；落位在 Web 端返库录入页或 PDA */
export function OutboundPutbackDetailPage() {
  const { t } = useTranslation()
  const { putbackNo } = useParams<{ putbackNo: string }>()
  const navigate = useNavigate()
  const backTo = useBackTo('/wms/outbound/return-putaway')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const putback = useDb((s) => s.outboundPutbacks.find((p) => p.no === putbackNo && p.warehouseCode === warehouseCode))
  const auditLogs = useDb((s) => s.auditLogs)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { customerCode, customerName, sku } = useLookups()

  const lines = useMemo<LineRow[]>(() => (putback?.lines ?? []).map((l, i) => ({ ...l, lineNo: i + 1 })), [putback])
  const placements = useMemo(() => (putback ? putbackPlacements(putback) : []), [putback])

  const lineColumns = useMemo(() => {
    const col = createDataColumns<LineRow>()
    return col.columns([
      col.accessor('lineNo', { header: t('outbound.ui.lineNo'), meta: { align: 'right' } }),
      col.accessor('itemNo', { header: t('outbound.ui.orderLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} />,
      }),
      col.accessor('qualityType', {
        header: t('outbound.ui.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor('batchNo', { header: t('outbound.ui.batch'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor((l) => l.serialNos.join(t('common.listSeparator')), {
        id: 'serial',
        header: t('outbound.ui.serial'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('suggestedLocation', {
        header: t('outbound.ui.suggested'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor('qty', {
        header: t('outbound.ui.expected'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [sku, t])

  const placementColumns = useMemo(() => {
    const col = createDataColumns<PlacementRow>()
    return col.columns([
      col.accessor('planLineNo', { header: t('outbound.ui.planLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} />,
      }),
      col.accessor('location', { header: t('outbound.ui.target'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('qty', {
        header: t('outbound.ui.returnQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((p) => p.serialNos.join(t('common.listSeparator')), {
        id: 'serial',
        header: t('outbound.ui.serial'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
    ])
  }, [sku, t])

  const logColumns = useMemo(() => outboundLogColumns(t), [t])

  if (!putback) return <OutboundNotFound title={t('outbound.ui.putbackNotFound')} backTo={backTo} />

  const expected = putbackExpected(putback)
  const returned = putbackReturned(putback)
  const done = putback.status === 'COMPLETED'
  const logs = outboundLogs(auditLogs, [putback.no])

  return (
    <PageContainer
      title={
        <DetailTitle title={t('outbound.ui.putbackTitle')} code={putback.no} status={outboundPutbackStatusMeta[putback.status]} />
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('outbound.ui.backToList')}</Link>
          </Button>
          {!done && (
            <Button variant="outline" asChild>
              <Link to={`/wms/outbound/return-putaway/${putback.no}/entry`}>{t('outbound.entry.returnAction')}</Link>
            </Button>
          )}
          {!done && (
            <Button variant="outline" asChild>
              <Link to={`/pda/return-putaway?step=work&no=${putback.no}`}>{t('outbound.ui.goPutback')}</Link>
            </Button>
          )}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('outbound.ui.putbackProgress')} description={t('outbound.ui.putbackProgressHint')}>
            <SummaryProgress
              label={t('outbound.ui.returned')}
              done={returned}
              total={expected}
              tone="green"
              pct={expected ? Math.round((returned / expected) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('outbound.ui.expected'), value: expected },
                { label: t('outbound.ui.returned'), value: returned, tone: 'green' },
                { label: t('outbound.ui.pendingReturn'), value: expected - returned, tone: 'orange', hidden: done },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('outbound.ui.basic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('outbound.ui.reason')}>
              <TagLabel meta={unpickReasonMeta[putback.reason]} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.sourceOrder')}>
              <DocNo onClick={() => navigate(`/wms/outbound/orders/${putback.orderNo}`)}>{putback.orderNo}</DocNo>
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.owner')}>
              <CodeName code={customerCode(putback.customerId)} name={customerName(putback.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.warehouse')}>
              <CodeName
                code={putback.warehouseCode}
                name={warehouseMasters.find((w) => w.code === putback.warehouseCode)?.name}
              />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.stagingSource')}>
              {putback.lines[0]?.fromLocation ? <BizCode>{putback.lines[0].fromLocation}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.createdAt')}>
              <DateTime value={putback.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.submittedBy')}>{putback.submittedBy || <Empty />}</DescriptionItem>
            <DescriptionItem label={t('outbound.ui.submittedAt')}>
              <DateTime value={putback.completedAt} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.remark')} className="col-span-3" multiline>
              {putback.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <DetailTabs
        param="tab"
        items={[
          {
            value: 'lines',
            label: t('outbound.ui.planReturn'),
            count: lines.length,
            content: <DataTable data={lines} columns={lineColumns} getRowId={(l) => l.id} selectable={false} />,
          },
          {
            value: 'placements',
            label: t('outbound.ui.actualReturn'),
            count: placements.length,
            content: (
              <DataTable
                data={placements}
                columns={placementColumns}
                getRowId={(p) => p.id}
                selectable={false}
                emptyText={t('outbound.ui.noActual')}
              />
            ),
          },
          {
            value: 'logs',
            label: t('outbound.ui.tabLogs'),
            count: logs.length,
            content: <DataTable data={logs} columns={logColumns} getRowId={(l) => l.id} selectable={false} />,
          },
        ]}
      />
    </PageContainer>
  )
}
