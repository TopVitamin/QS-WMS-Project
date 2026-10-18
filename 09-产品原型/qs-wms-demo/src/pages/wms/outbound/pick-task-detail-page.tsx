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
import { outboundPickStatusMeta, pickSourceMeta, qualityMeta } from '@/config/status'
import { lineShort, taskOwnerDoc, taskTotals } from '@/lib/outbound-derive'
import { useDb, useLookups } from '@/mock/db'
import { openTask } from '@/mock/outbound-actions'
import { useSettings } from '@/stores/settings'
import type { PickAssignment, PickLine, PickShare } from '@/types/outbound'
import { outboundLogColumns, outboundLogs } from './outbound-log-columns'
import { OutboundNotFound, useBackTo } from './shared'

type LineRow = PickLine & { lineNo: number }
type AssignmentRow = PickAssignment & { planLineNo: number }
type ShareRow = PickShare & { planLineNo: number; line: PickLine }

/** 拣货任务详情（拣货任务前端Demo版PRD 第四节）：只读；拣货与缺货上报在 Web 端拣货录入页或 PDA */
export function OutboundPickTaskDetailPage() {
  const { t } = useTranslation()
  const { taskNo } = useParams<{ taskNo: string }>()
  const navigate = useNavigate()
  const backTo = useBackTo('/wms/outbound/pick-tasks')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const task = useDb((s) => s.outboundPickTasks.find((x) => x.no === taskNo && x.warehouseCode === warehouseCode))
  const auditLogs = useDb((s) => s.auditLogs)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { customerCode, customerName, sku } = useLookups()

  const lines = useMemo<LineRow[]>(() => (task?.lines ?? []).map((l, i) => ({ ...l, lineNo: i + 1 })), [task])
  const lineNoOf = useMemo(() => new Map(lines.map((l) => [l.id, l.lineNo])), [lines])
  const assignments = useMemo<AssignmentRow[]>(
    () => (task?.assignments ?? []).map((a) => ({ ...a, planLineNo: lineNoOf.get(a.lineId) ?? 0 })),
    [task, lineNoOf],
  )
  const shares = useMemo<ShareRow[]>(
    () => lines.flatMap((line) => line.shares.map((p) => ({ ...p, planLineNo: line.lineNo, line }))),
    [lines],
  )

  const skuCell = (code: string) => <CodeName code={code} name={sku(code)?.name} />
  const orderLink = (no: string) => (
    <DocNo onClick={() => navigate(`/wms/outbound/orders/${no}`)}>{no}</DocNo>
  )

  const lineColumns = useMemo(() => {
    const col = createDataColumns<LineRow>()
    const num = (id: string, header: string, value: (l: LineRow) => number) =>
      col.accessor(value, { id, header, meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> })
    return col.columns([
      col.accessor('lineNo', { header: t('outbound.ui.lineNo'), meta: { align: 'right' } }),
      col.accessor('locationCode', { header: t('outbound.ui.location'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('skuCode', { header: t('outbound.ui.sku'), cell: ({ getValue }) => skuCell(getValue()) }),
      col.accessor('batchNo', { header: t('outbound.ui.batch'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('expiryDate', {
        header: t('outbound.ui.expiryDate'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('qualityType', {
        header: t('outbound.ui.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      num('planned', t('outbound.ui.planned'), (l) => l.plannedQty),
      num('picked', t('outbound.ui.pickedQty'), (l) => l.pickedQty),
      num('reported', t('outbound.ui.reported'), (l) => l.shortageQty),
      col.accessor('shortageReason', {
        header: t('outbound.ui.shortReason'),
        cell: ({ getValue }) => (getValue() ? t(`outbound.shortageReasons.${getValue()}`) : <Empty />),
      }),
      num('replaced', t('outbound.ui.replaced'), (l) => l.replacedQty ?? 0),
      num('short', t('outbound.ui.short'), lineShort),
    ])
    // skuCell 只依赖 sku
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, t])

  const assignmentColumns = useMemo(() => {
    const col = createDataColumns<AssignmentRow>()
    return col.columns([
      col.accessor('planLineNo', { header: t('outbound.ui.planLineNo'), meta: { align: 'right' } }),
      col.accessor('orderNo', { header: t('outbound.ui.no'), cell: ({ getValue }) => orderLink(getValue()) }),
      col.accessor('itemNo', { header: t('outbound.ui.orderLineNo'), meta: { align: 'right' } }),
      col.accessor('pickedQty', {
        header: t('outbound.ui.assignedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('activeQty', {
        header: t('outbound.ui.activeQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((a) => a.serialNos.join(t('common.listSeparator')), {
        id: 'serial',
        header: t('outbound.ui.serial'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('operator', { header: t('outbound.ui.operator') }),
      col.accessor('at', { header: t('outbound.ui.time'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, t])

  const shareColumns = useMemo(() => {
    const col = createDataColumns<ShareRow>()
    return col.columns([
      col.accessor('planLineNo', { header: t('outbound.ui.planLineNo'), meta: { align: 'right' } }),
      col.accessor((r) => r.line.locationCode, {
        id: 'location',
        header: t('outbound.ui.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor((r) => r.line.skuCode, { id: 'sku', header: t('outbound.ui.sku'), cell: ({ getValue }) => skuCell(getValue()) }),
      col.accessor('orderNo', { header: t('outbound.ui.no'), cell: ({ getValue }) => orderLink(getValue()) }),
      col.accessor('itemNo', { header: t('outbound.ui.orderLineNo'), meta: { align: 'right' } }),
      col.accessor('qty', {
        header: t('outbound.ui.shareQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, sku, t])

  const logColumns = useMemo(() => outboundLogColumns(t), [t])

  if (!task) return <OutboundNotFound title={t('outbound.ui.taskNotFound')} backTo={backTo} />

  const qty = taskTotals(task)
  const owner = taskOwnerDoc(task)
  const logs = outboundLogs(auditLogs, [task.no])

  return (
    <PageContainer
      title={<DetailTitle title={t('outbound.ui.taskTitle')} code={task.no} status={outboundPickStatusMeta[task.status]} />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('outbound.ui.backToList')}</Link>
          </Button>
          {openTask(task) && (
            <Button variant="outline" asChild>
              <Link to={`/wms/outbound/pick-tasks/${task.no}/entry`}>{t('outbound.entry.pickAction')}</Link>
            </Button>
          )}
          {openTask(task) && (
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
                { label: t('outbound.ui.planned'), value: qty.planned },
                { label: t('outbound.ui.pickedQty'), value: qty.picked, tone: 'blue' },
                { label: t('outbound.ui.reported'), value: qty.reported, hidden: qty.reported === 0 },
                { label: t('outbound.ui.short'), value: qty.short, tone: 'orange', hidden: qty.short === 0 },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('outbound.ui.basic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('outbound.ui.taskSource')}>
              <TagLabel meta={pickSourceMeta[task.source]} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.belongsTo')}>
              {owner ? (
                <DocNo onClick={() => navigate(`/wms/outbound/${owner.kind}/${owner.no}`)}>{owner.no}</DocNo>
              ) : (
                <Empty />
              )}
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.owner')}>
              <CodeName code={customerCode(task.customerId)} name={customerName(task.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.warehouse')}>
              <CodeName code={task.warehouseCode} name={warehouseMasters.find((w) => w.code === task.warehouseCode)?.name} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.staging')}>
              <BizCode>{task.stagingCode}</BizCode>
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.createdAt')}>
              <DateTime value={task.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.submittedBy')}>{task.submittedBy || <Empty />}</DescriptionItem>
            <DescriptionItem label={t('outbound.ui.submittedAt')}>
              <DateTime value={task.completedAt} />
            </DescriptionItem>
            <DescriptionItem label={t('outbound.ui.taskRemark')} className="col-span-3" multiline>
              {task.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <DetailTabs
        param="tab"
        items={[
          {
            value: 'lines',
            label: t('outbound.ui.planLines'),
            count: lines.length,
            content: <DataTable data={lines} columns={lineColumns} getRowId={(l) => l.id} selectable={false} />,
          },
          {
            value: 'assignments',
            label: t('outbound.ui.assignments'),
            count: assignments.length,
            content: <DataTable data={assignments} columns={assignmentColumns} getRowId={(a) => a.id} selectable={false} />,
          },
          {
            value: 'shares',
            label: t('outbound.ui.shares'),
            count: shares.length,
            hidden: task.source !== 'WAVE',
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
