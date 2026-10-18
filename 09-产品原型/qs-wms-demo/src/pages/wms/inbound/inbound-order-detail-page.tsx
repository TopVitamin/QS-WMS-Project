import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { ActionLink } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { inboundBizTypeMeta, inboundOrderStatusMeta, putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import { useInbound } from '@/hooks/use-inbound'
import {
  canConfirmReceiptClose,
  canReceiveInbound,
  lineUnreceivedQty,
  putawayProgress,
  receiptProgress,
  skuKindCount,
  sumLines,
} from '@/lib/inbound-derive'
import { receiptContainerLabel } from '@/lib/inbound-receipt-container'
import { submittedQty } from '@/lib/putaway'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { InboundException, PutawayOrder, ReceiptRecord } from '@/types/inbound'
import type { InboundOrderLine } from '@/types/wms'
import { InboundPutawaySheet } from './inbound-putaway-sheet'
import { InboundReceiptSheet } from './inbound-receipt-sheet'
import { auditLogColumns } from './audit-log-columns'
import { ReceiptCloseDialog } from './receipt-close-dialog'

type Translate = (k: string, opts?: Record<string, unknown>) => string

export function InboundOrderDetailPage() {
  const { t } = useTranslation()
  const { inboundNo } = useParams<{ inboundNo: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const { getOrder, confirmReceiptClose } = useInbound()
  const receiptRecords = useDb((s) => s.receiptRecords)
  const putawayOrders = useDb((s) => s.putawayOrders)
  const inboundExceptions = useDb((s) => s.inboundExceptions)
  const auditLogs = useDb((s) => s.auditLogs)
  const { customerCode, customerName, sku } = useLookups()
  const warehouseMasters = useDb((s) => s.warehouseMasters)

  const order = inboundNo ? getOrder(inboundNo) : undefined
  const [receipt, setReceipt] = useState<ReceiptRecord>()
  const [putaway, setPutaway] = useState<PutawayOrder>()
  const [closeOpen, setCloseOpen] = useState(false)

  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backTo = listSearch ? `/wms/inbound/orders?${listSearch}` : '/wms/inbound/orders'
  const orderStatus = order?.status

  const lineColumns = useMemo(() => {
    const col = createDataColumns<InboundOrderLine>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('skuCode', {
        id: 'skuBarcode',
        header: t('common.productBarcode'),
        cell: ({ getValue }) => {
          const barcode = sku(getValue())?.barcode
          return barcode ? <BizCode>{barcode}</BizCode> : <Empty />
        },
      }),
      col.accessor('skuCode', {
        id: 'skuName',
        header: t('masterSku.name'),
        cell: ({ getValue }) => sku(getValue())?.name ?? getValue(),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={inboundOrderStatusMeta[getValue() as keyof typeof inboundOrderStatusMeta]} />,
      }),
      col.accessor('plannedQty', {
        header: t('inbound.plannedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('receivedQty', {
        header: t('inbound.receivedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('rejectedQty', {
        header: t('inbound.rejectedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((line) => lineUnreceivedQty(line), {
        id: 'unreceived',
        header: t('inbound.unreceivedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1">
            <Num value={getValue()} />
            {orderStatus === 'COMPLETED' && getValue() > 0 && <TagLabel tone="orange">{t('inbound.shortage')}</TagLabel>}
          </span>
        ),
      }),
      col.accessor('goodQty', {
        header: t('inbound.lineReceivedGoodQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('defectQty', {
        header: t('inbound.lineReceivedDefectQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('putawayQty', {
        header: t('inbound.linePutawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t, sku, orderStatus])

  if (!inboundNo) return <Navigate to="/wms/inbound/orders" replace />
  if (!order) return <Navigate to="/wms/inbound/orders" replace />
  if (order.warehouseCode !== warehouseCode) return <Navigate to="/wms/inbound/orders" replace />

  const warehouseName = warehouseMasters.find((w) => w.code === order.warehouseCode)?.name
  const receipts = receiptRecords.filter((r) => r.inboundNo === inboundNo)
  const putaways = putawayOrders.filter((p) => p.sourceType === 'INBOUND' && p.sourceNo === inboundNo)
  const exceptions = inboundExceptions.filter((e) => e.inboundNo === inboundNo)
  /** 本单日志 + 本单各上架单的保存、撤销与提交 */
  const putawayNos = new Set(putaways.map((p) => p.putawayNo))
  const logs = auditLogs.filter(
    (l) => (l.refType === 'INBOUND' && l.refNo === inboundNo) || (l.refType === 'PUTAWAY' && putawayNos.has(l.refNo)),
  )

  const showReceiptClose = canConfirmReceiptClose(order)
  const showReceive = canReceiveInbound(order)

  const rejectedQty = sumLines(order, (l) => l.rejectedQty)
  const unreceivedQty = sumLines(order, lineUnreceivedQty)

  return (
    <PageContainer
      title={<DetailTitle title={t('inbound.detailTitle')} code={order.inboundNo} status={inboundOrderStatusMeta[order.status]} />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('inbound.backToList')}</Link>
          </Button>
          {showReceive && (
            <Button variant="outline" asChild>
              <Link to={`/wms/inbound/orders/${inboundNo}/receive`} state={{ listSearch }}>
                {t('inbound.receive.action')}
              </Link>
            </Button>
          )}
          {showReceive && (
            <Button variant="outline" onClick={() => navigate('/pda/receive', { state: { inboundNo } })}>
              {t('inbound.openPdaReceive')}
            </Button>
          )}
          {showReceiptClose && <Button onClick={() => setCloseOpen(true)}>{t('inbound.receiptClose')}</Button>}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('inbound.progressTitle')} description={t('inbound.progressHint')}>
            <SummaryProgress label={t('inbound.receiptProgress')} {...receiptProgress(order)} />
            <SummaryProgress label={t('inbound.putawayProgress')} tone="green" {...putawayProgress(order)} />
            <SummaryMetrics
              items={[
                { label: t('inbound.skuCount'), value: skuKindCount(order) },
                { label: t('inbound.plannedQty'), value: sumLines(order, (l) => l.plannedQty) },
                { label: t('inbound.receivedQty'), value: sumLines(order, (l) => l.receivedQty), tone: 'blue' },
                { label: t('inbound.rejectedQty'), value: rejectedQty, tone: 'red', hidden: rejectedQty === 0 },
                { label: t('inbound.unreceivedQty'), value: unreceivedQty, tone: unreceivedQty > 0 ? 'orange' : undefined },
                { label: t('inbound.putawayQty'), value: sumLines(order, (l) => l.putawayQty), tone: 'green' },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('inbound.sectionBasic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('common.customer')}>
              <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('inbound.upstreamNo')}>
              <BizCode>{order.upstreamNo}</BizCode>
            </DescriptionItem>
            <DescriptionItem label={t('inbound.bizType')}>
              <TagLabel meta={inboundBizTypeMeta[order.bizType]} />
            </DescriptionItem>
            <DescriptionItem label={t('common.warehouse')}>
              <CodeName code={order.warehouseCode} name={warehouseName} />
            </DescriptionItem>
            <DescriptionItem label={t('inbound.arrivalMethod')}>
              {order.arrivalMethod ? t(`enum.arrivalMethod.${order.arrivalMethod}`) : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('inbound.containerNo')}>
              {order.containerNo ? <BizCode>{order.containerNo}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('inbound.eta')}>
              <DateTime value={order.etaAt} pattern="YYYY-MM-DD" />
            </DescriptionItem>
            <DescriptionItem label={t('inbound.firstArrival')}>
              <DateTime value={order.firstArrivalAt} />
            </DescriptionItem>
            <DescriptionItem label={t('inbound.trackingNos')} multiline>
              {order.trackingNos ? <BizCode className="whitespace-pre-line">{order.trackingNos}</BizCode> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('common.createdAt')}>
              <DateTime value={order.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('inbound.completedAt')}>
              <DateTime value={order.completedAt} />
            </DescriptionItem>
            <DescriptionItem label={t('inbound.receiptCloseFlag')}>
              {order.receiptCloseFlag === 'CONFIRMED' ? (
                <span>
                  {t('inbound.receiptCloseConfirmed')}
                  <span className="text-muted-foreground">
                    {' · '}
                    {order.receiptClosedBy} <DateTime value={order.receiptClosedAt} />
                  </span>
                </span>
              ) : (
                t('inbound.receiptClosePending')
              )}
            </DescriptionItem>
            <DescriptionItem label={t('common.remark')} className="col-span-3" multiline>
              {order.remark ?? <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <DetailTabs
        param="tab"
        items={[
          {
            value: 'items',
            label: t('inbound.items'),
            count: order.items.length,
            content: (
              <DataTable data={order.items} columns={lineColumns} getRowId={(line) => String(line.lineNo)} selectable={false} />
            ),
          },
          {
            value: 'receipts',
            label: t('inbound.tabs.receipts'),
            count: receipts.length,
            content: (
              <DataTable
                data={[...receipts].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))}
                columns={receiptTabColumns(t, setReceipt)}
                getRowId={(r) => r.receiptNo}
                selectable={false}
                emptyText={t('inbound.tabs.empty.receipts')}
              />
            ),
          },
          {
            value: 'putaway',
            label: t('inbound.tabs.putaway'),
            count: putaways.length,
            content: (
              <DataTable
                data={putaways}
                columns={putawayTabColumns(t, setPutaway, (no) =>
                  navigate(`/wms/inbound/putaway/${no}`, { state: { from: location.pathname } }),
                )}
                getRowId={(p) => p.putawayNo}
                selectable={false}
                emptyText={t('inbound.tabs.empty.putaway')}
              />
            ),
          },
          {
            value: 'exceptions',
            label: t('inbound.tabs.exceptions'),
            count: exceptions.length,
            content: (
              <DataTable
                data={exceptions}
                columns={exceptionTabColumns(t, (code) => sku(code)?.name ?? code)}
                getRowId={(e) => e.exceptionNo}
                selectable={false}
                emptyText={t('inbound.tabs.empty.exceptions')}
              />
            ),
          },
          {
            value: 'logs',
            label: t('inbound.tabs.logs'),
            count: logs.length,
            content: (
              <DataTable
                data={logs}
                columns={auditLogColumns(t, { withPutawayNo: true })}
                getRowId={(l) => l.id}
                selectable={false}
                emptyText={t('inbound.tabs.empty.logs')}
              />
            ),
          },
        ]}
      />

      <InboundReceiptSheet record={receipt} onClose={() => setReceipt(undefined)} />
      <InboundPutawaySheet order={putaway} onClose={() => setPutaway(undefined)} />

      <ReceiptCloseDialog
        order={closeOpen ? order : undefined}
        onClose={() => setCloseOpen(false)}
        onConfirm={() => {
          const res = confirmReceiptClose(order.inboundNo)
          if (!res.ok) toast.error(t(res.errorKey))
          else toast.success(t('inbound.receiptCloseSuccess'))
          setCloseOpen(false)
        }}
      />
    </PageContainer>
  )
}

/** 收货记录：点收货单号打开右侧抽屉（与上架单一致，不另设「查看」列） */
function receiptTabColumns(t: Translate, onView: (r: ReceiptRecord) => void) {
  const col = createDataColumns<ReceiptRecord>()
  return col.columns([
    col.accessor('receiptNo', {
      header: t('inbound.receiptNo'),
      meta: { pin: 'left' },
      cell: ({ row }) => <DocNo onClick={() => onView(row.original)}>{row.original.receiptNo}</DocNo>,
    }),
    col.accessor('receivedAt', {
      header: t('inbound.receiptTime'),
      cell: ({ getValue }) => <DateTime value={getValue()} />,
    }),
    col.accessor('operator', { header: t('inbound.receiptOperator') }),
    col.display({
      id: 'containers',
      header: t('inbound.workContainerNo'),
      cell: ({ row }) =>
        receiptContainerLabel(row.original, {
          bulk: t('inbound.bulkPiece'),
          many: (first, count) => t('inbound.receive.containersMany', { first, count, more: count - 1 }),
        }),
    }),
    col.accessor('stagingLocationCode', {
      header: t('inbound.stagingLocation'),
      cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
    }),
    col.accessor((r) => r.lines.reduce((s, line) => s + line.receivedQty, 0), {
      id: 'receivedTotal',
      header: t('inbound.receive.totalReceived'),
      meta: { align: 'right' },
      cell: ({ getValue }) => <Num value={getValue()} />,
    }),
    col.accessor((r) => r.lines.reduce((s, line) => s + line.rejectedQty, 0), {
      id: 'rejectedTotal',
      header: t('inbound.receive.totalRejected'),
      meta: { align: 'right' },
      cell: ({ getValue }) => <Num value={getValue()} />,
    }),
  ])
}

/** 上架单：单号跳上架单独立详情；行内「查看」开右侧抽屉做快览 */
function putawayTabColumns(t: Translate, onView: (p: PutawayOrder) => void, onOpen: (putawayNo: string) => void) {
  const col = createDataColumns<PutawayOrder>()
  return col.columns([
    col.accessor('putawayNo', {
      header: t('inbound.putawayNo'),
      meta: { pin: 'left' },
      cell: ({ row }) => <DocNo onClick={() => onOpen(row.original.putawayNo)}>{row.original.putawayNo}</DocNo>,
    }),
    col.accessor('containerNo', {
      header: t('inbound.workContainerNo'),
      cell: ({ getValue }) => {
        const v = getValue()
        return v ? <BizCode>{v}</BizCode> : t('inbound.bulkPiece')
      },
    }),
    col.accessor('qualityType', {
      header: t('inventory.quality'),
      cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
    }),
    col.accessor('status', {
      header: t('common.status'),
      cell: ({ getValue }) => <StatusBadge meta={putawayOrderStatusMeta[getValue()]} />,
    }),
    col.accessor((p) => p.planLines.reduce((s, l) => s + l.planQty, 0), {
      id: 'planTotal',
      header: t('inbound.planPutawayQty'),
      meta: { align: 'right' },
      cell: ({ getValue }) => <Num value={getValue()} />,
    }),
    col.accessor((p) => submittedQty(p), {
      id: 'submittedQty',
      header: t('inbound.putawayQty'),
      meta: { align: 'right' },
      cell: ({ getValue }) => <Num value={getValue()} />,
    }),
    col.display({
      id: 'actions',
      header: t('common.actions'),
      meta: { pin: 'right' },
      cell: ({ row }) => <ActionLink onClick={() => onView(row.original)}>{t('common.view')}</ActionLink>,
    }),
  ])
}

function exceptionTabColumns(t: Translate, skuName: (code: string) => string) {
  const col = createDataColumns<InboundException>()
  return col.columns([
    col.accessor('exceptionNo', { header: t('inbound.exceptionNo'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
    col.accessor('type', { header: t('inbound.exceptionType'), cell: () => t('inbound.exceptionReject') }),
    col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
    col.accessor('skuCode', { id: 'skuName', header: t('masterSku.name'), cell: ({ getValue }) => skuName(getValue()) }),
    col.accessor('qty', {
      header: t('inbound.exceptionQty'),
      meta: { align: 'right' },
      cell: ({ getValue }) => <Num value={getValue()} />,
    }),
    col.accessor('reason', { header: t('inbound.exceptionReason') }),
    col.accessor('receiptNo', { header: t('inbound.receiptNo'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
    col.accessor('createdAt', {
      header: t('inbound.exceptionTime'),
      cell: ({ getValue }) => <DateTime value={getValue()} />,
    }),
  ])
}
