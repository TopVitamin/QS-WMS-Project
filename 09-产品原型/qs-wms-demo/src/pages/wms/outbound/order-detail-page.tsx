import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailOverview, DetailTitle, PageContainer, Panel, Section } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  outboundPickStatusMeta,
  outboundPutbackStatusMeta,
  outboundResultStatusMeta,
  outboundStatusMeta,
  outboundTypeMeta,
  pickSourceMeta,
  qualityMeta,
  unpickReasonMeta,
} from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import {
  lineQty,
  orderActions,
  orderTasks,
  orderTotals,
  putbackExpected,
  putbackReturned,
  taskQtyForOrder,
} from '@/lib/outbound-derive'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type {
  OutboundHandover,
  OutboundItem,
  OutboundOrder,
  OutboundPickTask,
  OutboundPutback,
  OutboundVerification,
  SpecifiedStock,
} from '@/types/outbound'
import { OutboundMockDialog } from './mock-dialog'
import { HandoverDialog, PackInfoDialog, ShipDialog, UnpickDialog } from './order-dialogs'
import { outboundLogColumns, outboundLogs } from './outbound-log-columns'
import { useOutboundRun } from './use-outbound-action'
import { VerificationSheet } from './verification-sheet'

type Translate = (k: string, o?: Record<string, unknown>) => string
type Modal = 'SHIP' | 'HANDOVER' | 'UNPICK' | 'CHANGE' | 'CANCEL'

/** 出库单详情（出库单前端Demo版PRD·详情页）：页头按钮全部来自 orderActions */
export function OutboundOrderDetailPage() {
  const { t } = useTranslation()
  const { outboundNo } = useParams<{ outboundNo: string }>()
  const location = useLocation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const order = useDb((s) => s.outboundOrders.find((o) => o.no === outboundNo && o.warehouseCode === warehouseCode))
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backTo = listSearch ? `/wms/outbound/orders?${listSearch}` : '/wms/outbound/orders'

  if (!order)
    return (
      <PageContainer title={t('outbound.ui.orderNotFound')}>
        <Panel className="flex flex-col items-center gap-4 p-10 text-sm text-muted-foreground">
          {t('outbound.ui.orderNotFound')}
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('outbound.ui.backToList')}</Link>
          </Button>
        </Panel>
      </PageContainer>
    )
  return <OrderDetail order={order} backTo={backTo} />
}

function OrderDetail({ order: o, backTo }: { order: OutboundOrder; backTo: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const run = useOutboundRun()
  const { customerCode, customerName, sku } = useLookups()
  const allTasks = useDb((s) => s.outboundPickTasks)
  const allVerifications = useDb((s) => s.outboundVerifications)
  const allResults = useDb((s) => s.outboundResults)
  const allPutbacks = useDb((s) => s.outboundPutbacks)
  const allHandovers = useDb((s) => s.outboundHandovers)
  const auditLogs = useDb((s) => s.auditLogs)
  const inventory = useDb((s) => s.inventory)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const channelMasters = useDb((s) => s.channelMasters)
  const carrierMasters = useDb((s) => s.carrierMasters)
  const [modal, setModal] = useState<Modal>()
  const [packNo, setPackNo] = useState<string>()
  const [sheet, setSheet] = useState<OutboundVerification>()

  const db = { outboundPickTasks: allTasks, outboundVerifications: allVerifications, outboundResults: allResults }
  const acts = orderActions(o, db)
  const totals = orderTotals(o)
  const tasks = orderTasks(db, o.no)
  const verifications = allVerifications.filter((v) => v.orderNo === o.no)
  const putbacks = allPutbacks.filter((p) => p.orderNo === o.no)
  const handovers = allHandovers.filter((h) => h.orderNo === o.no)
  const result = allResults.find((r) => r.orderNo === o.no)
  const logs = outboundLogs(auditLogs, [o.no, ...tasks.map((x) => x.no), ...putbacks.map((p) => p.no)])
  const channel = channelMasters.find((ch) => ch.code === o.channelCode)
  const carrier = carrierMasters.find((c) => c.code === channel?.carrierCode)
  const shipped = o.status === 'SHIPPED'
  const live = !shipped && o.status !== 'CANCELLED'
  const isOther = o.type === 'OTHER'

  const manualCancel = async () => {
    const ok = await confirm({
      title: t('outbound.ui.cancelConfirmTitle', { no: o.no }),
      description: t('outbound.ui.cancelConfirmDesc'),
      variant: 'destructive',
    })
    if (ok) run({ type: 'CANCEL', no: o.no }, () => t('outbound.ui.toastCancelled', { no: o.no }))
  }
  const deleteVerify = async (v: OutboundVerification) => {
    const ok = await confirm({ title: t('outbound.ui.deleteVerifyTitle', { no: v.no }), variant: 'destructive' })
    if (ok) run({ type: 'DELETE_VERIFY', no: v.no }, () => t('outbound.ui.toastDeleted', { no: v.no }))
  }
  const allocate = () => run({ type: 'ALLOCATE', no: o.no }, (no) => t('outbound.ui.toastAllocated', { no }))

  const moreItems = [
    acts.unpick && { key: 'unpick', label: t('outbound.ui.unpick'), onSelect: () => setModal('UNPICK') },
    acts.mockChange && { key: 'change', label: t('outbound.ui.mockChange'), onSelect: () => setModal('CHANGE') },
    acts.mockCancel && {
      key: 'mockCancel',
      label: t('outbound.ui.mockCancel'),
      danger: true,
      onSelect: () => setModal('CANCEL'),
    },
    acts.manualCancel && {
      key: 'manualCancel',
      label: t('outbound.ui.manualCancel'),
      danger: true,
      onSelect: () => void manualCancel(),
    },
    acts.simulateResultFailure && {
      key: 'fail',
      label: t('outbound.ui.simulateFailure'),
      onSelect: () =>
        run({ type: 'RETRY_RESULT', no: o.no, simulateFailure: true }, () => t('outbound.ui.toastResultFailed')),
    },
    acts.retryResult && {
      key: 'retry',
      label: t('outbound.ui.retryResult'),
      onSelect: () => run({ type: 'RETRY_RESULT', no: o.no }, () => t('outbound.ui.toastResultRetried')),
    },
  ].filter(Boolean) as { key: string; label: string; danger?: boolean; onSelect: () => void }[]

  const itemColumns = useItemColumns(o, t, sku)
  const specifiedColumns = useSpecifiedColumns(o, t, sku, inventory)
  const taskColumns = useMemo(() => {
    const col = createDataColumns<OutboundPickTask>()
    const qty = (id: 'planned' | 'picked' | 'short', header: string) =>
      col.accessor((x) => taskQtyForOrder(x, o.no)[id], {
        id,
        header,
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.taskNo'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/pick-tasks/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('source', {
        header: t('outbound.ui.taskSource'),
        cell: ({ getValue }) => <TagLabel meta={pickSourceMeta[getValue()]} />,
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={outboundPickStatusMeta[getValue()]} />,
      }),
      qty('planned', t('outbound.ui.planned')),
      qty('picked', t('outbound.ui.pickedQty')),
      qty('short', t('outbound.ui.short')),
      col.accessor('createdAt', { header: t('outbound.ui.createdAt'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
    ])
  }, [navigate, o.no, t])

  const verifyColumns = useMemo(() => {
    const col = createDataColumns<OutboundVerification>()
    const sumBy = (v: OutboundVerification, f: (l: OutboundVerification['lines'][number]) => number) =>
      v.lines.reduce((n, l) => n + f(l), 0)
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.verifyNo'),
        cell: ({ row }) => <DocNo onClick={() => setSheet(row.original)}>{row.original.no}</DocNo>,
      }),
      col.accessor('method', {
        header: t('outbound.ui.method'),
        cell: ({ getValue }) => t(`outbound.verifyMethods.${getValue()}`),
      }),
      col.accessor('containerType', {
        header: t('outbound.ui.containerType'),
        cell: ({ getValue }) => t(`outbound.containers.${getValue()}`),
      }),
      col.accessor('containerNo', {
        header: t('outbound.ui.containerNo'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor('trackingNo', {
        header: t('outbound.ui.tracking'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor((v) => sumBy(v, (l) => l.qty), {
        id: 'qty',
        header: t('outbound.ui.verifyQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((v) => sumBy(v, (l) => l.effectiveQty), {
        id: 'effective',
        header: t('outbound.ui.activeQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('operator', { header: t('outbound.ui.verifier') }),
      col.accessor('at', { header: t('outbound.ui.verifiedAt'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) =>
          row.original.deleted ? (
            <TagLabel>{t('outbound.ui.deleted')}</TagLabel>
          ) : (
            <RowActions
              actions={[
                {
                  key: 'pack',
                  label: t('outbound.ui.packInfo'),
                  hidden: !live || o.type !== 'B2C',
                  onClick: () => setPackNo(row.original.no),
                },
                {
                  key: 'delete',
                  label: t('outbound.ui.deleteVerify'),
                  hidden: !live,
                  danger: true,
                  onClick: () => void deleteVerify(row.original),
                },
              ]}
            />
          ),
      }),
    ])
    // deleteVerify 每次渲染重建，但只依赖 confirm/run/t，故不列入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, o.type, t])

  const handoverColumns = useMemo(() => {
    const col = createDataColumns<OutboundHandover>()
    return col.columns([
      col.accessor('no', { header: t('outbound.ui.handoverNo'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('method', {
        header: t('outbound.ui.handoverMethod'),
        cell: ({ getValue }) => t(`outbound.handoverMethods.${getValue()}`),
      }),
      col.accessor('party', { header: t('outbound.ui.party') }),
      col.accessor('channelCode', {
        header: t('outbound.ui.channel'),
        cell: ({ getValue }) => {
          const ch = channelMasters.find((c) => c.code === getValue())
          return getValue() ? <CodeName code={getValue()!} name={ch?.name} /> : <Empty />
        },
      }),
      col.accessor('credential', {
        header: t('outbound.ui.credential'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor('containerQty', {
        header: t('outbound.ui.containerQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('at', { header: t('outbound.ui.handoverTime'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
      col.accessor('operator', { header: t('outbound.ui.registrant') }),
      col.accessor((h) => (h.attachments ?? []).join(t('common.listSeparator')), {
        id: 'attachments',
        header: t('outbound.ui.attachments'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('remark', { header: t('outbound.ui.handoverRemark'), cell: ({ getValue }) => getValue() || <Empty /> }),
    ])
  }, [channelMasters, t])

  const putbackColumns = useMemo(() => {
    const col = createDataColumns<OutboundPutback>()
    return col.columns([
      col.accessor('no', {
        header: t('outbound.ui.putbackNo'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/return-putaway/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('reason', { header: t('outbound.ui.reason'), cell: ({ getValue }) => <TagLabel meta={unpickReasonMeta[getValue()]} /> }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => <StatusBadge meta={outboundPutbackStatusMeta[getValue()]} />,
      }),
      col.accessor(putbackExpected, {
        id: 'expected',
        header: t('outbound.ui.expected'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor(putbackReturned, {
        id: 'returned',
        header: t('outbound.ui.returned'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('createdAt', { header: t('outbound.ui.createdAt'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
    ])
  }, [navigate, t])

  const resultColumns = useMemo(() => {
    const col = createDataColumns<NonNullable<typeof result>['items'][number]>()
    return col.columns([
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} />,
      }),
      col.accessor('shippedQty', {
        header: t('outbound.ui.shipped'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('unshippedQty', {
        header: t('outbound.ui.unshipped'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [sku, t])

  const logColumns = useMemo(() => outboundLogColumns(t, o.no), [o.no, t])
  const demand = totals.demand
  const progress = shipped
    ? { label: t('outbound.ui.shipped'), done: totals.shipped ?? 0, tone: 'green' as const }
    : { label: t('outbound.ui.pickProgress'), done: totals.picked, tone: 'blue' as const }

  return (
    <PageContainer
      title={<DetailTitle title={t('outbound.ui.orderTitle')} code={o.no} status={outboundStatusMeta[o.status]} />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('outbound.ui.backToList')}</Link>
          </Button>
          {acts.verify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {t('outbound.ui.goVerify')}
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/wms/outbound/verify-station?no=${encodeURIComponent(o.no)}`}>
                    {t('outbound.ui.goVerifyStation')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/pda/verify?step=scan&no=${encodeURIComponent(o.no)}`}>{t('outbound.ui.goVerifyPda')}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {acts.reallocate && (
            <Button variant="outline" onClick={allocate}>
              {t('outbound.ui.reallocate')}
            </Button>
          )}
          {acts.handover && (
            <Button variant="outline" onClick={() => setModal('HANDOVER')}>
              {t('outbound.ui.handoverAdd')}
            </Button>
          )}
          {moreItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{t('outbound.ui.more')}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {moreItems.map((m) => (
                  <DropdownMenuItem key={m.key} variant={m.danger ? 'destructive' : 'default'} onSelect={m.onSelect}>
                    {m.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {acts.allocate && <Button onClick={allocate}>{t('outbound.ui.allocateByOrder')}</Button>}
          {acts.ship && <Button onClick={() => setModal('SHIP')}>{t('outbound.ui.ship')}</Button>}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('outbound.ui.progress')}>
            <SummaryProgress
              label={progress.label}
              done={progress.done}
              total={demand}
              tone={progress.tone}
              pct={demand ? Math.round((progress.done / demand) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('outbound.ui.demand'), value: demand },
                { label: t('outbound.ui.reserved'), value: totals.reserved ?? 0, hidden: isOther },
                {
                  label: t('outbound.ui.shortage'),
                  value: totals.shortage ?? 0,
                  tone: 'orange',
                  hidden: isOther || !totals.shortage,
                },
                { label: t('outbound.ui.picked'), value: totals.picked, tone: 'blue' },
                { label: t('outbound.ui.verified'), value: totals.verified },
                { label: t('outbound.ui.shipped'), value: totals.shipped ?? <Empty />, tone: shipped ? 'green' : undefined },
                { label: t('outbound.ui.unshipped'), value: totals.unshipped ?? 0, tone: 'orange', hidden: !shipped },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('outbound.ui.basic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('outbound.ui.type')}>
              <TagLabel meta={outboundTypeMeta[o.type]} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.owner')}>
              <CodeName code={customerCode(o.customerId)} name={customerName(o.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.warehouse')}>
              <CodeName code={o.warehouseCode} name={warehouseMasters.find((w) => w.code === o.warehouseCode)?.name} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.source')}>{t(`outbound.sources.${o.source}`)}</DescriptionItem>
            {o.source === 'OMS' && (
              <>
                <DescriptionItem label={t('outbound.ui.upstream')}>
                  {o.upstreamNo ? <BizCode>{o.upstreamNo}</BizCode> : <Empty />}
                </DescriptionItem>
                <DescriptionItem label={t('outbound.ui.messageId')}>
                  {o.messageId ? <BizCode>{o.messageId}</BizCode> : <Empty />}
                </DescriptionItem>
              </>
            )}
            {o.type === 'PURCHASE_RETURN' && (
              <DescriptionItem label={t('outbound.ui.originalInbound')}>
                {o.originalInboundNo ? <BizCode>{o.originalInboundNo}</BizCode> : <Empty />}
              </DescriptionItem>
            )}
            <DescriptionItem label={t('outbound.ui.channel')}>
              {o.channelCode ? <CodeName code={o.channelCode} name={channel?.name} /> : <Empty />}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.carrier')}>{carrier?.name ?? <Empty />}</DescriptionItem>
            <DescriptionItem label={t('outbound.ui.createdAt')}>
              <DateTime value={o.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.recipient')}>{o.recipient || <Empty />}</DescriptionItem>
            <DescriptionItem label={t('outbound.ui.phone')}>{o.phone || <Empty />}</DescriptionItem>
            {shipped && (
              <>
                <DescriptionItem label={t('outbound.ui.shippedAt')}>
                  <DateTime value={o.shippedAt} />
                </DescriptionItem>
                <DescriptionItem label={t('outbound.ui.shippedBy')}>{o.shippedBy || <Empty />}</DescriptionItem>
              </>
            )}
            <DescriptionItem label={t('outbound.ui.address')} className="col-span-3" multiline>
              {o.address || <Empty />}
            </DescriptionItem>
            {o.source === 'MANUAL' && (
              <DescriptionItem label={t('outbound.ui.emailBasis')} className="col-span-3" multiline>
                {o.emailBasis || <Empty />}
              </DescriptionItem>
            )}
            {o.status === 'CANCELLED' && (
              <DescriptionItem label={t('outbound.ui.cancelReason')} className="col-span-3" multiline>
                {o.cancelReason || <Empty />}
              </DescriptionItem>
            )}
            <DescriptionItem label={t('outbound.ui.orderRemark')} className="col-span-3" multiline>
              {o.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <DetailTabs
        param="tab"
        items={[
          {
            value: 'items',
            label: t('outbound.ui.tabItems'),
            count: o.items.length,
            content: <DataTable data={o.items} columns={itemColumns} getRowId={(i) => String(i.lineNo)} selectable={false} />,
          },
          {
            value: 'specified',
            label: t('outbound.ui.tabSpecified'),
            count: o.specified.length,
            hidden: !isOther,
            content: (
              <DataTable
                data={o.specified}
                columns={specifiedColumns}
                getRowId={(p) => `${p.itemNo}-${p.inventoryId}`}
                selectable={false}
              />
            ),
          },
          {
            value: 'tasks',
            label: t('outbound.ui.tabTasks'),
            count: tasks.length,
            content: <DataTable data={tasks} columns={taskColumns} getRowId={(x) => x.no} selectable={false} />,
          },
          {
            value: 'reviews',
            label: t('outbound.ui.tabReviews'),
            count: verifications.length,
            content: (
              <DataTable
                data={verifications}
                columns={verifyColumns}
                getRowId={(v) => v.no}
                selectable={false}
                getRowClassName={(v: OutboundVerification) => (v.deleted ? 'text-muted-foreground' : undefined)}
              />
            ),
          },
          {
            value: 'handovers',
            label: t('outbound.ui.tabHandovers'),
            count: handovers.length,
            content: (
              <DataTable
                data={handovers}
                columns={handoverColumns}
                getRowId={(h) => h.no}
                selectable={false}
                initialColumnVisibility={{ remark: false }}
              />
            ),
          },
          {
            value: 'putbacks',
            label: t('outbound.ui.tabPutbacks'),
            count: putbacks.length,
            content: <DataTable data={putbacks} columns={putbackColumns} getRowId={(p) => p.no} selectable={false} />,
          },
          {
            value: 'results',
            label: t('outbound.ui.tabResults'),
            count: result ? 1 : 0,
            hidden: o.source !== 'OMS',
            content: (
              <>
                {result && (
                  <div className="px-4 pt-4">
                    <Descriptions columns={4}>
                      <DescriptionItem label={t('outbound.ui.resultStatus')}>
                        <StatusBadge meta={outboundResultStatusMeta[result.status]} />
                      </DescriptionItem>
                      <DescriptionItem label={t('outbound.ui.resultSeq')}>
                        <Num value={result.sequence} />
                      </DescriptionItem>
                      <DescriptionItem label={t('outbound.ui.attempts')}>
                        <Num value={result.attempts} />
                      </DescriptionItem>
                      <DescriptionItem label={t('outbound.ui.generatedAt')}>
                        <DateTime value={result.at} />
                      </DescriptionItem>
                    </Descriptions>
                  </div>
                )}
                <DataTable
                  data={result?.items ?? []}
                  columns={resultColumns}
                  getRowId={(i) => i.skuCode}
                  selectable={false}
                />
              </>
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

      <VerificationSheet record={sheet} onClose={() => setSheet(undefined)} />
      {packNo && <PackInfoDialog verificationNo={packNo} onClose={() => setPackNo(undefined)} />}
      {modal === 'SHIP' && <ShipDialog order={o} onClose={() => setModal(undefined)} />}
      {modal === 'HANDOVER' && <HandoverDialog order={o} onClose={() => setModal(undefined)} />}
      {modal === 'UNPICK' && <UnpickDialog order={o} onClose={() => setModal(undefined)} />}
      {modal === 'CHANGE' && <OutboundMockDialog mode="CHANGE" order={o} onClose={() => setModal(undefined)} />}
      {modal === 'CANCEL' && <OutboundMockDialog mode="CANCEL" order={o} onClose={() => setModal(undefined)} />}
    </PageContainer>
  )
}

type SkuLookup = (code: string) => { name?: string } | undefined

function useItemColumns(o: OutboundOrder, t: Translate, sku: SkuLookup) {
  return useMemo(() => {
    const col = createDataColumns<OutboundItem>()
    const qty = (id: 'demand' | 'reserved' | 'shortage' | 'picked' | 'waiting' | 'verified' | 'shipped' | 'unshipped') =>
      col.accessor((i) => lineQty(o, i)[id] ?? -1, {
        id,
        header: t(`outbound.ui.${id}`),
        meta: { align: 'right' },
        cell: ({ getValue }) => (getValue() < 0 ? <Empty /> : <Num value={getValue()} />),
      })
    return col.columns([
      col.accessor('lineNo', { header: t('outbound.ui.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-60" />,
      }),
      qty('demand'),
      qty('reserved'),
      qty('shortage'),
      qty('picked'),
      qty('waiting'),
      qty('verified'),
      qty('shipped'),
      qty('unshipped'),
    ])
  }, [o, t, sku])
}

function useSpecifiedColumns(
  o: OutboundOrder,
  t: Translate,
  sku: SkuLookup,
  inventory: { id: string; skuCode: string; locationCode: string; batchNo?: string; qualityType: keyof typeof qualityMeta }[],
) {
  return useMemo(() => {
    const col = createDataColumns<SpecifiedStock>()
    const inv = (p: SpecifiedStock) => inventory.find((r) => r.id === p.inventoryId)
    return col.columns([
      col.accessor('itemNo', { header: t('outbound.ui.orderLineNo'), meta: { align: 'right' } }),
      col.accessor((p) => inv(p)?.skuCode ?? o.items.find((i) => i.lineNo === p.itemNo)?.skuCode ?? '', {
        id: 'sku',
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} />,
      }),
      col.accessor((p) => inv(p)?.locationCode ?? '', {
        id: 'location',
        header: t('outbound.ui.location'),
        cell: ({ getValue }) => (getValue() ? <BizCode>{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor((p) => inv(p)?.batchNo ?? '', {
        id: 'batch',
        header: t('outbound.ui.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((p) => inv(p)?.qualityType ?? '', {
        id: 'quality',
        header: t('outbound.ui.quality'),
        cell: ({ getValue }) => (getValue() ? <TagLabel meta={qualityMeta[getValue() as keyof typeof qualityMeta]} /> : <Empty />),
      }),
      col.accessor('qty', {
        header: t('outbound.ui.specifiedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((p) => p.serialNos.join(t('common.listSeparator')), {
        id: 'serial',
        header: t('outbound.ui.serial'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
    ])
  }, [o, t, sku, inventory])
}
