import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { returnOrderStatusMeta, returnSourceMeta } from '@/config/status'
import { canReceiveReturn, returnPutawayProgress, returnReceiptProgress, sumReturnLines } from '@/lib/return-derive'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutawayOrder } from '@/types/inbound'
import type { ReturnException, ReturnOrder, ReturnOrderLine, ReturnReceiptRecord } from '@/types/return'
import type { AuditLog } from '@/types/wms'
import { auditLogColumns } from '../inbound/audit-log-columns'
import { ReturnCancelDialog } from './return-dialogs'

export function ReturnDetailPage() {
  const { t } = useTranslation()
  const { returnNo } = useParams<{ returnNo: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const order = useDb((s) => s.returnOrders.find((o) => o.returnNo === returnNo))
  const receipts = useDb((s) => s.returnReceipts.filter((r) => r.returnNo === returnNo))
  const exceptions = useDb((s) => s.returnExceptions.filter((e) => e.returnNo === returnNo))
  const putaways = useDb((s) => s.putawayOrders.filter((p) => p.sourceType === 'RETURN' && p.sourceNo === returnNo))
  const auditLogs = useDb((s) => s.auditLogs)
  const result = useDb((s) => s.returnResults.find((r) => r.returnNo === returnNo))
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { customerCode, customerName, sku } = useLookups()
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backTo = listSearch ? `/wms/returns/orders?${listSearch}` : '/wms/returns/orders'
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!order || order.warehouseCode !== warehouseCode) {
    return (
      <PageContainer title={t('return.detailTitle')}>
        <Section title={t('return.receive.notFound')}>
          <p className="text-sm text-muted-foreground">{t('return.receive.notFound')}</p>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('return.backToList')}</Link>
          </Button>
        </Section>
      </PageContainer>
    )
  }

  return (
    <>
      <ReturnDetail
        order={order}
        receipts={receipts}
        exceptions={exceptions}
        putaways={putaways}
        auditLogs={auditLogs}
        result={result}
        backTo={backTo}
        onCancel={() => setCancelOpen(true)}
        warehouseName={warehouseMasters.find((w) => w.code === order.warehouseCode)?.name}
        customerCode={customerCode}
        customerName={customerName}
        skuName={(code) => sku(code, order.customerId)?.name}
        navigate={navigate}
        t={t}
      />
      {cancelOpen && <ReturnCancelDialog order={order} onClose={() => setCancelOpen(false)} />}
    </>
  )
}

function ReturnDetail({
  order,
  receipts,
  exceptions,
  putaways,
  auditLogs,
  result,
  backTo,
  onCancel,
  warehouseName,
  customerCode,
  customerName,
  skuName,
  navigate,
  t,
}: {
  order: ReturnOrder
  receipts: ReturnReceiptRecord[]
  exceptions: ReturnException[]
  putaways: PutawayOrder[]
  auditLogs: AuditLog[]
  result?: { status: 'SENT' | 'FAILED'; attempts: number }
  backTo: string
  onCancel: () => void
  warehouseName?: string
  customerCode: (id: string) => string
  customerName: (id: string) => string
  skuName: (code: string) => string | undefined
  navigate: ReturnType<typeof useNavigate>
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const logs = auditLogs.filter(
    (l) =>
      (l.refType === 'RETURN' && l.refNo === order.returnNo) ||
      (l.refType === 'PUTAWAY' && putaways.some((p) => p.putawayNo === l.refNo)),
  )
  const lineColumns = useMemo(() => {
    const col = createDataColumns<ReturnOrderLine>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('skuCode', {
        id: 'skuName',
        header: t('masterSku.name'),
        cell: ({ getValue }) => skuName(getValue()) ?? getValue(),
      }),
      col.accessor('plannedQty', { header: t('return.columns.plannedQty'), meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> }),
      col.accessor('receivedQty', { header: t('return.columns.receivedQty'), meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> }),
      col.accessor('rejectedQty', { header: t('return.columns.rejectedQty'), meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> }),
      col.accessor('putawayQty', { header: t('return.columns.putawayQty'), meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> }),
    ])
  }, [skuName, t])

  const receiptColumns = useMemo(() => {
    const col = createDataColumns<ReturnReceiptRecord>()
    return col.columns([
      col.accessor('receiptNo', { header: t('return.columns.receiptNo'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('lines', {
        header: t('common.sku'),
        cell: ({ getValue }) => <Num value={getValue().length} />,
      }),
      col.accessor('receivedAt', { header: t('return.columns.receivedAt'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
      col.accessor('operator', { header: t('common.operator') }),
      col.accessor('stagingLocationCode', { header: t('inventory.location'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
    ])
  }, [t])

  const putawayColumns = useMemo(() => {
    const col = createDataColumns<PutawayOrder>()
    return col.columns([
      col.accessor('putawayNo', {
        header: t('putaway.putawayNo'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/inbound/putaway/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('qualityType', {
        header: t('inventory.quality'),
        cell: ({ row }) => <TagLabel>{t(`enum.quality.${row.original.qualityType}`)}</TagLabel>,
      }),
      col.accessor((p) => p.planLines.reduce((n, l) => n + l.planQty, 0), {
        id: 'qty',
        header: t('putaway.planQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ row }) => <StatusBadge meta={{ tone: row.original.status === 'COMPLETED' ? 'green' : 'orange', labelKey: `status.putawayOrder.${row.original.status}` }} />,
      }),
      col.accessor('createdAt', { header: t('common.createdAt'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
    ])
  }, [navigate, t])

  const exceptionColumns = useMemo(() => {
    const col = createDataColumns<ReturnException>()
    return col.columns([
      col.accessor('exceptionNo', { header: t('return.columns.exceptionNo'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <CodeName code={getValue()} name={skuName(getValue())} /> }),
      col.accessor('qty', { header: t('return.columns.rejectedQty'), meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> }),
      col.accessor('reason', { header: t('return.columns.reason'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('receiptNo', { header: t('return.columns.receiptNo'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
    ])
  }, [skuName, t])

  const totalPlanned = sumReturnLines(order, (l) => l.plannedQty)
  const totalReceived = sumReturnLines(order, (l) => l.receivedQty)
  const totalRejected = sumReturnLines(order, (l) => l.rejectedQty)
  const totalPutaway = sumReturnLines(order, (l) => l.putawayQty)

  return (
    <PageContainer
      title={<DetailTitle title={t('return.detailTitle')} code={order.returnNo} status={returnOrderStatusMeta[order.status]} />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('return.backToList')}</Link>
          </Button>
          {canReceiveReturn(order) && (
            <Button variant="outline" asChild>
              <Link to={`/wms/returns/orders/${order.returnNo}/receive`}>{t('return.receive.action')}</Link>
            </Button>
          )}
          {canReceiveReturn(order) && (
            <Button variant="outline" onClick={() => navigate(`/pda/return-receive?no=${order.returnNo}`)}>
              {t('return.receive.openPda')}
            </Button>
          )}
          {totalReceived === 0 && order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
            <Button variant="outline" onClick={onCancel}>
              {t('return.cancel.action')}
            </Button>
          )}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('return.detail.progress')}>
            <SummaryProgress label={t('return.detail.receiptProgress')} {...returnReceiptProgress(order)} />
            <SummaryProgress label={t('return.detail.putawayProgress')} tone="green" {...returnPutawayProgress(order)} />
            <SummaryMetrics
              items={[
                { label: t('return.columns.plannedQty'), value: totalPlanned },
                { label: t('return.columns.receivedQty'), value: totalReceived, tone: 'blue' },
                { label: t('return.columns.rejectedQty'), value: totalRejected, tone: 'red', hidden: totalRejected === 0 },
                { label: t('return.columns.putawayQty'), value: totalPutaway, tone: 'green' },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('return.detail.basic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('return.sourceType')}>
              <TagLabel meta={returnSourceMeta[order.sourceType]} />
            </DescriptionItem>
            <DescriptionItem label={t('common.customer')}>
              <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('common.warehouse')}>
              <CodeName code={order.warehouseCode} name={warehouseName} />
            </DescriptionItem>
            <DescriptionItem label={t('return.upstreamNo')}>
              <BizCode>{order.upstreamNo}</BizCode>
            </DescriptionItem>
            <DescriptionItem label={t('return.originalOutboundNo')}>
              {order.originalOutboundNo ? <BizCode>{order.originalOutboundNo}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('return.trackingNo')}>
              {order.trackingNo ? <BizCode>{order.trackingNo}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('return.detail.createdAt')}>
              <DateTime value={order.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('return.detail.completedAt')}>
              <DateTime value={order.completedAt} />
            </DescriptionItem>
            <DescriptionItem label={t('return.detail.result')}>
              {result ? (
                <span className="inline-flex items-center gap-2">
                  <StatusBadge
                    meta={{
                      tone: result.status === 'SENT' ? 'green' : 'red',
                      labelKey: `inbound.upstream.resultStatuses.${result.status}`,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {t('inbound.upstream.attempts', { count: result.attempts })}
                  </span>
                </span>
              ) : (
                <Empty />
              )}
            </DescriptionItem>
            <DescriptionItem label={t('return.detail.remark')}>{order.remark || <Empty />}</DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <DetailTabs
        param="tab"
        items={[
          {
            value: 'items',
            label: t('return.tabs.items'),
            count: order.items.length,
            content: <DataTable data={order.items} columns={lineColumns} getRowId={(l) => String(l.lineNo)} selectable={false} />,
          },
          {
            value: 'receipts',
            label: t('return.tabs.receipts'),
            count: receipts.length,
            content: (
              <DataTable
                data={receipts}
                columns={receiptColumns}
                getRowId={(r) => r.receiptNo}
                selectable={false}
                emptyText={t('return.tabs.empty.receipts')}
              />
            ),
          },
          {
            value: 'putaway',
            label: t('return.tabs.putaway'),
            count: putaways.length,
            content: (
              <DataTable
                data={putaways}
                columns={putawayColumns}
                getRowId={(p) => p.putawayNo}
                selectable={false}
                emptyText={t('return.tabs.empty.putaway')}
              />
            ),
          },
          {
            value: 'exceptions',
            label: t('return.tabs.exceptions'),
            count: exceptions.length,
            content: (
              <DataTable
                data={exceptions}
                columns={exceptionColumns}
                getRowId={(e) => e.exceptionNo}
                selectable={false}
                emptyText={t('return.tabs.empty.exceptions')}
              />
            ),
          },
          {
            value: 'logs',
            label: t('return.tabs.logs'),
            count: logs.length,
            content: (
              <DataTable
                data={logs}
                columns={auditLogColumns(t, { withPutawayNo: true })}
                getRowId={(l) => l.id}
                selectable={false}
                emptyText={t('return.tabs.empty.logs')}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  )
}

