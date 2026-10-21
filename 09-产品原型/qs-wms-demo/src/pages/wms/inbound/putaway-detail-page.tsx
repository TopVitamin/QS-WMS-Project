import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { DetailOverview, DetailTitle, PageContainer, Panel, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import { isPutawayOrderOpen, planQty, skuKindCount, submittedQty } from '@/lib/putaway'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutawayActualLine, PutawayOrder } from '@/types/inbound'
import type { AuditLog } from '@/types/wms'
import { auditLogColumns } from './audit-log-columns'
import { usePutawayActualColumns, usePutawayPlanColumns } from './putaway-line-columns'

/**
 * 上架单详情（上架单主PRD 第四节）：版式同入库单详情——基本信息 + 上架进度双栏，明细与日志进页签。
 * 本页只读；录入落位在「Web 端上架」页或 PDA，提交后本页随库自动刷新。
 */
export function PutawayDetailPage() {
  const { t } = useTranslation()
  const { putawayNo } = useParams<{ putawayNo: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const putawayOrders = useDb((s) => s.putawayOrders)
  const auditLogs = useDb((s) => s.auditLogs)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const { customerCode, customerName } = useLookups()
  const [serialLine, setSerialLine] = useState<PutawayActualLine>()

  const order = putawayOrders.find((p) => p.putawayNo === putawayNo)
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch

  if (!order || order.warehouseCode !== warehouseCode) {
    return (
      <PageContainer title={t('putaway.detailTitle')}>
        <Panel className="flex flex-col items-center gap-3 p-10">
          <div className="text-sm text-muted-foreground">{t('putaway.notFound')}</div>
          <Button variant="outline" asChild>
            <Link to="/wms/inbound/putaway">{t('putaway.backToList')}</Link>
          </Button>
        </Panel>
      </PageContainer>
    )
  }

  const open = isPutawayOrderOpen(order)
  const planTotal = planQty(order)
  const submitted = submittedQty(order)
  const warehouseName = warehouseMasters.find((w) => w.code === order.warehouseCode)?.name
  const logs = auditLogs.filter((l) => l.refType === 'PUTAWAY' && l.refNo === order.putawayNo)

  return (
    <PageContainer
      title={<DetailTitle title={t('putaway.detailTitle')} code={order.putawayNo} status={putawayOrderStatusMeta[order.status]} />}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={listSearch ? `/wms/inbound/putaway?${listSearch}` : '/wms/inbound/putaway'}>{t('putaway.backToList')}</Link>
          </Button>
          {open && (
            <Button variant="outline" asChild>
              <Link to={`/wms/inbound/putaway/${order.putawayNo}/entry`} state={{ listSearch }}>
                {t('putaway.entry.action')}
              </Link>
            </Button>
          )}
          {open && (
            <Button variant="outline" onClick={() => navigate('/pda/putaway', { state: { putawayNo: order.putawayNo } })}>
              {t('putaway.openPda')}
            </Button>
          )}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('putaway.progressTitle')} description={t('putaway.progressHint')}>
            <SummaryProgress
              label={t('inbound.putawayProgress')}
              tone="green"
              done={submitted}
              total={planTotal}
              pct={planTotal > 0 ? Math.round((submitted / planTotal) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('inbound.skuCount'), value: skuKindCount(order) },
                { label: t('putaway.planQty'), value: planTotal },
                { label: t('putaway.putawayQty'), value: submitted, tone: 'green' },
                { label: t('putaway.pendingQty'), value: planTotal - submitted, tone: 'orange', hidden: !open },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('putaway.sectionBasic')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('inventory.quality')}>
              <TagLabel meta={qualityMeta[order.qualityType]} />
            </DescriptionItem>
            <DescriptionItem label={t('putaway.sourceType')}>{t(`enum.putawaySource.${order.sourceType}`)}</DescriptionItem>
            <DescriptionItem label={t('putaway.sourceNo')}>
              {order.sourceType === 'INBOUND' ? (
                <DocNo onClick={() => navigate(`/wms/inbound/orders/${order.sourceNo}`)}>{order.sourceNo}</DocNo>
              ) : (
                <BizCode>{order.sourceNo}</BizCode>
              )}
            </DescriptionItem>
            <DescriptionItem label={t('common.customer')}>
              <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('common.warehouse')}>
              <CodeName code={order.warehouseCode} name={warehouseName} />
            </DescriptionItem>
            <DescriptionItem label={t('putaway.receiptNo')}>
              <BizCode>{order.receiptNo}</BizCode>
            </DescriptionItem>
            <DescriptionItem label={t('inbound.workContainerNo')}>
              {order.containerNo ? <BizCode>{order.containerNo}</BizCode> : t('putaway.noContainer')}
            </DescriptionItem>
            <DescriptionItem label={t('putaway.stagingLocation')}>
              <BizCode>{order.stagingLocationCode}</BizCode>
            </DescriptionItem>
            <DescriptionItem label={t('common.createdAt')}>
              <DateTime value={order.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('putaway.submittedBy')}>{order.submittedBy ?? <Empty />}</DescriptionItem>
            <DescriptionItem label={t('putaway.submittedAt')}>
              <DateTime value={order.submittedAt} />
            </DescriptionItem>
            <DescriptionItem label={t('putaway.remark')} className="col-span-full xl:col-span-3" multiline>
              {order.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>

      <PutawayDetailTabs order={order} logs={logs} onViewSerials={setSerialLine} />

      <SerialSheet line={serialLine} onClose={() => setSerialLine(undefined)} />
    </PageContainer>
  )
}

function PutawayDetailTabs({
  order,
  logs,
  onViewSerials,
}: {
  order: PutawayOrder
  logs: AuditLog[]
  onViewSerials: (line: PutawayActualLine) => void
}) {
  const { t } = useTranslation()
  const planColumns = usePutawayPlanColumns()
  const actualColumns = usePutawayActualColumns(order, onViewSerials)
  const logColumns = useMemo(() => auditLogColumns(t), [t])

  return (
    <DetailTabs
      param="tab"
      items={[
        {
          value: 'plan',
          label: t('inbound.putawayPlanTab'),
          count: order.planLines.length,
          content: (
            <DataTable
              data={order.planLines}
              columns={planColumns}
              getRowId={(line) => String(line.lineNo)}
              selectable={false}
              paginate={false}
            />
          ),
        },
        {
          value: 'actual',
          label: t('inbound.putawayActualTab'),
          count: order.actualLines.length,
          content: (
            <DataTable
              data={order.actualLines}
              columns={actualColumns}
              getRowId={(line) => String(line.lineNo)}
              selectable={false}
              paginate={false}
              emptyText={t('putaway.noActualLines')}
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
              columns={logColumns}
              getRowId={(l) => l.id}
              selectable={false}
              emptyText={t('inbound.tabs.empty.logs')}
            />
          ),
        },
      ]}
    />
  )
}

/** 序列号 Sheet：只读查看某条实际落位行关联的 SN */
function SerialSheet({ line, onClose }: { line?: PutawayActualLine; onClose: () => void }) {
  const { t } = useTranslation()
  const rows = useMemo(() => (line?.serialNos ?? []).map((serialNo) => ({ serialNo })), [line])
  const columns = useMemo(() => {
    const col = createDataColumns<{ serialNo: string }>()
    return col.columns([
      col.accessor('serialNo', {
        header: t('putaway.serialNo'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
    ])
  }, [t])

  return (
    <DetailSheet
      open={!!line}
      onClose={onClose}
      title={line ? t('putaway.serialTitle', { line: line.lineNo }) : ''}
      description={line ? `${t('inbound.targetLocation')} ${line.locationCode} · ${line.skuCode} · ${line.qty}` : undefined}
    >
      {line && (
        <DataTable
          data={rows}
          columns={columns}
          getRowId={(row) => row.serialNo}
          selectable={false}
          showColumnSettings={false}
          paginate={false}
          emptyText={t('putaway.noSerials')}
        />
      )}
    </DetailSheet>
  )
}
