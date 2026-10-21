import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { qualityMeta } from '@/config/status'
import { moveSummary } from '@/lib/inventory-derive'
import { ledgerNumbers } from '@/lib/inventory-ledger'
import { sortLedger } from '@/lib/inventory-list-match'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { StockMoveLine } from '@/types/inventory'
import { useBackTo } from '../outbound/shared'
import { inventoryAuditColumns, useLedgerColumns, type LedgerRow } from './inventory-columns'
import { inventoryAuditLogs } from './inventory-helpers'
import { InventoryNotFound } from './inventory-shared'

/** 移库作业详情（移库作业前端Demo版PRD 第三节）：基本信息＋汇总卡＋移库明细、库存流水、操作日志；只读 */
export function MoveDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { moveNo } = useParams<{ moveNo: string }>()
  const backTo = useBackTo('/wms/inventory/moves')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const move = useDb((s) => s.stockMoves.find((m) => m.no === moveNo && m.warehouseCode === warehouseCode))
  const logs = useDb((s) => s.inventoryLogs)
  const auditLogs = useDb((s) => s.auditLogs)
  const warehouses = useDb((s) => s.warehouseMasters)
  const { sku, customerCode, customerName } = useLookups()
  const numbers = useMemo(() => ledgerNumbers(logs), [logs])
  const openLog = useCallback((id: string) => navigate(`/wms/inventory/logs?log=${id}`), [navigate])
  const onOpen = useCallback((r: LedgerRow) => openLog(r.log.id), [openLog])
  const ledgerColumns = useLedgerColumns({ compact: true, onOpen })
  const logRows = useMemo<LedgerRow[]>(
    () =>
      move
        ? sortLedger(logs.filter((l) => l.type === 'MOVE' && l.refNo === move.no)).map((log) => ({
            log,
            no: numbers.get(log.id) ?? '',
          }))
        : [],
    [logs, move, numbers],
  )

  const lineColumns = useMemo(() => {
    const col = createDataColumns<StockMoveLine>()
    const logLink = (id: string) => <DocNo onClick={() => openLog(id)}>{numbers.get(id) ?? ''}</DocNo>
    return col.columns([
      col.accessor('lineNo', { header: t('inventory.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('inventory.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-56" />,
      }),
      col.accessor('sourceLocation', {
        header: t('inventory.move.sourceLocation'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('targetLocation', {
        header: t('inventory.move.targetLocation'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor((l) => l.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((l) => l.serialNos.join(t('common.listSeparator')), {
        id: 'serials',
        header: t('inventory.logs.serials'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('qualityType', {
        header: t('inventory.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor('qty', {
        header: t('inventory.qty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('sourceLogId', {
        header: t('inventory.move.sourceLog'),
        cell: ({ getValue }) => logLink(getValue()),
      }),
      col.accessor('targetLogId', {
        header: t('inventory.move.targetLog'),
        cell: ({ getValue }) => logLink(getValue()),
      }),
    ])
  }, [numbers, openLog, sku, t])
  const auditColumns = useMemo(() => inventoryAuditColumns(t), [t])

  if (!move) return <InventoryNotFound title={t('inventory.move.notFound')} backTo={backTo} />

  const summary = moveSummary(move)
  const audits = inventoryAuditLogs(auditLogs, 'STOCK_MOVE', move.no)

  return (
    <PageContainer
      title={<DetailTitle title={t('inventory.move.title')} code={move.no} />}
      actions={
        <Button variant="outline" asChild>
          <Link to={backTo}>{t('inventory.backToList')}</Link>
        </Button>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('inventory.move.summary')} description={t('inventory.move.summaryHint')}>
            <SummaryMetrics
              items={[
                { label: t('inventory.move.lineCount'), value: summary.lineCount },
                { label: t('inventory.move.totalQty'), value: summary.totalQty, tone: 'green' },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('inventory.basicInfo')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('inventory.warehouse')}>
              <CodeName code={move.warehouseCode} name={warehouses.find((w) => w.code === move.warehouseCode)?.name} />
            </DescriptionItem>
            <DescriptionItem label={t('inventory.owner')}>
              <CodeName code={customerCode(move.customerId)} name={customerName(move.customerId)} />
            </DescriptionItem>
            <DescriptionItem label={t('inventory.operator')}>{move.operator}</DescriptionItem>
            <DescriptionItem label={t('inventory.move.submittedAt')}>
              <DateTime value={move.submittedAt} />
            </DescriptionItem>
            <DescriptionItem label={t('inventory.logs.terminal')}>
              {t(`inventory.terminal.${move.terminal}`)}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>
      <DetailTabs
        param="tab"
        items={[
          {
            value: 'lines',
            label: t('inventory.move.tabLines'),
            count: move.lines.length,
            content: (
              <DataTable data={move.lines} columns={lineColumns} getRowId={(l) => String(l.lineNo)} paginate={false} />
            ),
          },
          {
            value: 'logs',
            label: t('inventory.move.tabLogs'),
            count: logRows.length,
            content: <DataTable data={logRows} columns={ledgerColumns} getRowId={(r) => r.log.id} paginate={false} />,
          },
          {
            value: 'audit',
            label: t('inventory.tabAudit'),
            count: audits.length,
            content: (
              <DataTable
                data={audits}
                columns={auditColumns}
                getRowId={(l) => l.id}
                paginate={false}
                emptyText={t('audit.empty')}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  )
}
