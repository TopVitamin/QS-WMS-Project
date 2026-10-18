import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { outboundStatusMeta, outboundWaveStatusMeta, waveMemberStatusMeta } from '@/config/status'
import { orderTotals, sum, taskTotals, waveStatus } from '@/lib/outbound-derive'
import { openTask } from '@/mock/outbound-actions'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundOrder, PickLine, PickShare } from '@/types/outbound'
import { outboundLogColumns, outboundLogs } from './outbound-log-columns'
import { OutboundNotFound, useBackTo } from './shared'

type MemberRow = { seq: number; no: string; order?: OutboundOrder; share: number }
type ShareRow = PickShare & { planLineNo: number; line: PickLine }

/** 波次详情（波次前端Demo版PRD 第四节）：只读，状态随波次任务派生 */
export function OutboundWaveDetailPage() {
  const { t } = useTranslation()
  const { waveNo } = useParams<{ waveNo: string }>()
  const navigate = useNavigate()
  const backTo = useBackTo('/wms/outbound/waves')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const wave = useDb((s) => s.outboundWaves.find((w) => w.no === waveNo && w.warehouseCode === warehouseCode))
  const tasks = useDb((s) => s.outboundPickTasks)
  const orders = useDb((s) => s.outboundOrders)
  const auditLogs = useDb((s) => s.auditLogs)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { customerCode, customerName, sku } = useLookups()
  const task = tasks.find((x) => x.no === wave?.taskNo)

  const members = useMemo<MemberRow[]>(
    () =>
      (wave?.members ?? []).map((no, i) => ({
        seq: i + 1,
        no,
        order: orders.find((o) => o.no === no),
        share: sum(task?.lines ?? [], (l) => sum(l.shares.filter((p) => p.orderNo === no), (p) => p.qty)),
      })),
    [wave, orders, task],
  )
  const shares = useMemo<ShareRow[]>(
    () => (task?.lines ?? []).flatMap((line, i) => line.shares.map((p) => ({ ...p, planLineNo: i + 1, line }))),
    [task],
  )

  const memberColumns = useMemo(() => {
    const col = createDataColumns<MemberRow>()
    const qty = (id: 'demand' | 'picked' | 'verified') =>
      col.accessor((m) => (m.order ? orderTotals(m.order)[id] : 0), {
        id,
        header: t(`outbound.ui.${id}`),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      })
    return col.columns([
      col.accessor('seq', { header: t('outbound.ui.memberSeq'), meta: { align: 'right' } }),
      col.accessor('no', {
        header: t('outbound.ui.no'),
        cell: ({ getValue }) => <DocNo onClick={() => navigate(`/wms/outbound/orders/${getValue()}`)}>{getValue()}</DocNo>,
      }),
      col.accessor((m) => (m.order?.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE'), {
        id: 'memberStatus',
        header: t('outbound.ui.waveRowStatus'),
        cell: ({ getValue }) => <TagLabel meta={waveMemberStatusMeta[getValue()]} />,
      }),
      col.accessor((m) => m.order?.status, {
        id: 'orderStatus',
        header: t('outbound.ui.orderStatus'),
        cell: ({ getValue }) => {
          const s = getValue()
          return s ? <StatusBadge meta={outboundStatusMeta[s]} /> : <Empty />
        },
      }),
      qty('demand'),
      col.accessor('share', {
        header: t('outbound.ui.shareQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      qty('picked'),
      qty('verified'),
      col.accessor(() => wave?.createdAt, {
        id: 'joinedAt',
        header: t('outbound.ui.joinedAt'),
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [navigate, t, wave?.createdAt])

  const shareColumns = useMemo(() => {
    const col = createDataColumns<ShareRow>()
    return col.columns([
      col.accessor('planLineNo', { header: t('outbound.ui.planLineNo'), meta: { align: 'right' } }),
      col.accessor((r) => r.line.locationCode, {
        id: 'location',
        header: t('outbound.ui.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor((r) => r.line.skuCode, {
        id: 'sku',
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} />,
      }),
      col.accessor((r) => r.line.batchNo ?? '', {
        id: 'batch',
        header: t('outbound.ui.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((r) => r.line.expiryDate ?? '', {
        id: 'expiryDate',
        header: t('outbound.ui.expiryDate'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('orderNo', {
        header: t('outbound.ui.no'),
        cell: ({ getValue }) => <DocNo onClick={() => navigate(`/wms/outbound/orders/${getValue()}`)}>{getValue()}</DocNo>,
      }),
      col.accessor('itemNo', { header: t('outbound.ui.orderLineNo'), meta: { align: 'right' } }),
      col.accessor('qty', {
        header: t('outbound.ui.shareQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [navigate, sku, t])

  const logColumns = useMemo(() => outboundLogColumns(t), [t])

  if (!wave) return <OutboundNotFound title={t('outbound.ui.waveNotFound')} backTo={backTo} />

  const status = waveStatus(wave, tasks)
  const qty = task ? taskTotals(task) : { planned: 0, picked: 0 }
  const cancelled = members.filter((m) => m.order?.status === 'CANCELLED').length
  const logs = outboundLogs(auditLogs, [wave.no])

  return (
    <PageContainer
      title={<DetailTitle title={t('outbound.ui.waveTitle')} code={wave.no} status={outboundWaveStatusMeta[status]} />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('outbound.ui.backToList')}</Link>
          </Button>
          {status === 'RELEASED' && task && openTask(task) && (
            <Button variant="outline" asChild>
              <Link to={`/wms/outbound/pick-tasks/${task.no}/entry`}>{t('outbound.entry.pickAction')}</Link>
            </Button>
          )}
          {status === 'RELEASED' && task && openTask(task) && (
            <Button variant="outline" asChild>
              <Link to={`/pda/pick?step=work&no=${task.no}`}>{t('outbound.ui.goPick')}</Link>
            </Button>
          )}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('outbound.ui.pickProgress')}>
            <SummaryProgress
              label={t('outbound.ui.pickedQty')}
              done={qty.picked}
              total={qty.planned}
              pct={qty.planned ? Math.round((qty.picked / qty.planned) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('outbound.ui.waveOrderCount'), value: wave.members.length },
                { label: t('outbound.ui.planned'), value: qty.planned },
                { label: t('outbound.ui.pickedQty'), value: qty.picked, tone: 'blue' },
                { label: t('outbound.ui.cancelledOrders'), value: cancelled, tone: 'gray', hidden: cancelled === 0 },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('outbound.ui.basic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('outbound.ui.owner')}>
              <CodeName code={customerCode(wave.customerId)} name={customerName(wave.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.warehouse')}>
              <CodeName code={wave.warehouseCode} name={warehouseMasters.find((w) => w.code === wave.warehouseCode)?.name} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.waveTask')}>
              <DocNo onClick={() => navigate(`/wms/outbound/pick-tasks/${wave.taskNo}`)}>{wave.taskNo}</DocNo>
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.waveOrderCount')}>
              <Num value={wave.members.length} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.createdAt')}>
              <DateTime value={wave.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.waveRemark')} className="col-span-3" multiline>
              {wave.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <DetailTabs
        param="tab"
        items={[
          {
            value: 'members',
            label: t('outbound.ui.waveOrders'),
            count: members.length,
            content: (
              <DataTable
                data={members}
                columns={memberColumns}
                getRowId={(m) => m.no}
                selectable={false}
                getRowClassName={(m: MemberRow) => (m.order?.status === 'CANCELLED' ? 'text-muted-foreground' : undefined)}
              />
            ),
          },
          {
            value: 'shares',
            label: t('outbound.ui.items'),
            count: shares.length,
            content: (
              <DataTable
                data={shares}
                columns={shareColumns}
                getRowId={(r) => `${r.line.id}-${r.orderNo}-${r.itemNo}`}
                selectable={false}
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
