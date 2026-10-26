import { useCallback, useMemo, useState } from 'react'
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
import { inventoryFeatureMeta, qualityMeta, stocktakeSourceMeta, stocktakeStatusMeta } from '@/config/status'
import { lineDiff, stocktakeSummary } from '@/lib/inventory-derive'
import { ledgerNumbers } from '@/lib/inventory-ledger'
import { cn } from '@/lib/utils'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { StocktakeDiscovery, StocktakeLine } from '@/types/inventory'
import { useBackTo } from '../outbound/shared'
import { inventoryAuditColumns } from './inventory-columns'
import { inventoryAuditLogs, useLocationUsage } from './inventory-helpers'
import { DocLink, InventoryNotFound, LocationCode, SignedNum } from './inventory-shared'
import { StocktakeCancelDialog, StocktakeConfirmDialog } from './stocktake-dialogs'
import { StocktakeEntrySheet } from './stocktake-entry-sheet'

type LineFilter = 'ALL' | 'UNCOUNTED' | 'DIFF'
type SerialRow = StocktakeLine & { extra: string[]; missing: string[] }

/**
 * 盘点单详情（盘点单前端Demo版PRD 第三节）：基本信息＋实盘进度汇总卡＋盘点明细、SN 明细、发现依据、操作日志。
 * 盘点中可录入实盘、取消、确认差异；按钮不可用时就近写原因。已完成、已取消只读。
 */
export function StocktakeDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { stocktakeNo } = useParams<{ stocktakeNo: string }>()
  const backTo = useBackTo('/wms/inventory/counts')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const count = useDb((s) => s.inventoryCounts.find((c) => c.no === stocktakeNo && c.warehouseCode === warehouseCode))
  const logs = useDb((s) => s.inventoryLogs)
  const auditLogs = useDb((s) => s.auditLogs)
  const warehouses = useDb((s) => s.warehouseMasters)
  const masters = useDb((s) => s.skuMasters)
  const { sku, customerCode, customerName } = useLookups()
  const usageOf = useLocationUsage()
  const [lineFilter, setLineFilter] = useState<LineFilter>('ALL')
  const [dialog, setDialog] = useState<'entry' | 'confirm' | 'cancel'>()
  const numbers = useMemo(() => ledgerNumbers(logs), [logs])
  const openLog = useCallback((id: string) => navigate(`/wms/inventory/logs?log=${id}`), [navigate])

  const lineRows = useMemo(
    () =>
      (count?.lines ?? []).filter((l) =>
        lineFilter === 'UNCOUNTED'
          ? l.countedQty === undefined
          : lineFilter === 'DIFF'
            ? (lineDiff(l) ?? 0) !== 0
            : true,
      ),
    [count, lineFilter],
  )
  const serialRows = useMemo<SerialRow[]>(
    () =>
      (count?.lines ?? [])
        .filter((l) => masters.find((m) => m.customerId === l.customerId && m.code === l.skuCode)?.snEnabled)
        .map((l) => ({
          ...l,
          extra: (l.countedSerialNos ?? []).filter((sn) => !l.bookSerialNos.includes(sn)),
          missing:
            l.countedQty === undefined ? [] : l.bookSerialNos.filter((sn) => !(l.countedSerialNos ?? []).includes(sn)),
        })),
    [count, masters],
  )

  const lineColumns = useMemo(() => {
    const col = createDataColumns<StocktakeLine>()
    return col.columns([
      col.accessor('locationCode', {
        header: t('inventory.location'),
        meta: { pin: 'left' },
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            <LocationCode code={row.original.locationCode} usage={usageOf(row.original.locationCode)} />
            {row.original.added && <TagLabel meta={inventoryFeatureMeta.added} />}
          </span>
        ),
      }),
      col.accessor((line) => line.containerId ?? count?.containerId ?? '', {
        id: 'container',
        header: t('inventory.containerNo'),
        cell: ({ row }) => {
          const containerId = row.original.containerId ?? count?.containerId
          const containerNo = containerId?.split('::').at(-1)
          return containerNo && count ? (
            <Link
              className="text-primary underline-offset-4 hover:underline"
              to={`/wms/master/containers/${encodeURIComponent(containerNo)}?wh=${encodeURIComponent(count.warehouseCode)}`}
            >
              <BizCode>{containerNo}</BizCode>
            </Link>
          ) : (
            <Empty />
          )
        },
      }),
      col.accessor('customerId', {
        header: t('inventory.owner'),
        cell: ({ getValue }) => <BizCode>{customerCode(getValue())}</BizCode>,
      }),
      col.accessor('skuCode', {
        header: t('inventory.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-56" />,
      }),
      col.accessor((l) => l.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((l) => l.productionDate ?? '', {
        id: 'productionDate',
        header: t('inbound.productionDate'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((l) => l.expiryDate ?? '', {
        id: 'expiryDate',
        header: t('inbound.expiryDate'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('qualityType', {
        header: t('inventory.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor('bookQty', {
        header: t('inventory.stocktake.bookQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((l) => l.countedQty ?? -1, {
        id: 'counted',
        header: t('inventory.stocktake.countedQty'),
        meta: { align: 'right' },
        cell: ({ row }) =>
          row.original.countedQty === undefined ? (
            <span className="text-muted-foreground">{t('inventory.stocktake.uncounted')}</span>
          ) : (
            <Num value={row.original.countedQty} />
          ),
      }),
      col.accessor((l) => lineDiff(l) ?? 0, {
        id: 'diff',
        header: t('inventory.stocktake.diffQty'),
        enableSorting: true,
        meta: { align: 'right' },
        cell: ({ row }) => {
          const diff = lineDiff(row.original)
          return diff === undefined ? <Empty /> : <SignedNum value={diff} />
        },
      }),
      col.accessor((l) => l.countedBy ?? '', {
        id: 'countedBy',
        header: t('inventory.stocktake.countedBy'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('countedAt', {
        header: t('inventory.stocktake.countedAt'),
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor((l) => l.diffNote ?? '', {
        id: 'note',
        header: t('inventory.stocktake.diffNote'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((l) => l.adjustLogId ?? '', {
        id: 'adjust',
        header: t('inventory.stocktake.adjustLog'),
        cell: ({ getValue }) =>
          getValue() ? <DocNo onClick={() => openLog(getValue())}>{numbers.get(getValue()) ?? ''}</DocNo> : <Empty />,
      }),
    ])
  }, [count, customerCode, numbers, openLog, sku, t, usageOf])

  const serialColumns = useMemo(() => {
    const col = createDataColumns<SerialRow>()
    const list = (values: string[]) => (values.length ? values.join(t('common.listSeparator')) : <Empty />)
    return col.columns([
      col.accessor('locationCode', {
        header: t('inventory.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('skuCode', { header: t('inventory.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor((r) => r.bookSerialNos.join(','), {
        id: 'book',
        header: t('inventory.stocktake.bookSerials'),
        cell: ({ row }) => list(row.original.bookSerialNos),
      }),
      col.accessor((r) => (r.countedSerialNos ?? []).join(','), {
        id: 'counted',
        header: t('inventory.stocktake.countedSerials'),
        cell: ({ row }) =>
          row.original.countedQty === undefined ? (
            <span className="text-muted-foreground">{t('inventory.stocktake.uncounted')}</span>
          ) : (
            list(row.original.countedSerialNos ?? [])
          ),
      }),
      col.accessor((r) => r.extra.join(','), {
        id: 'extra',
        header: t('inventory.stocktake.extraSerials'),
        cell: ({ row }) => (
          <span className={cn(row.original.extra.length > 0 && 'text-success-text')}>{list(row.original.extra)}</span>
        ),
      }),
      col.accessor((r) => r.missing.join(','), {
        id: 'missing',
        header: t('inventory.stocktake.missingSerials'),
        cell: ({ row }) => (
          <span className={cn(row.original.missing.length > 0 && 'text-destructive')}>
            {list(row.original.missing)}
          </span>
        ),
      }),
    ])
  }, [t])

  const evidenceColumns = useMemo(() => {
    const col = createDataColumns<StocktakeDiscovery & { id: string }>()
    return col.columns([
      col.accessor('stage', {
        header: t('inventory.stocktake.stage'),
        cell: ({ getValue }) => t(`inventory.stage.${getValue()}`),
      }),
      col.accessor('skuCode', { header: t('inventory.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('locationCode', {
        header: t('inventory.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('diffQty', {
        header: t('inventory.stocktake.diffQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('note', { header: t('inventory.stocktake.evidence') }),
      col.accessor((d) => d.sourceNo ?? '', {
        id: 'source',
        header: t('inventory.stocktake.relatedRecord'),
        cell: ({ getValue }) => <DocLink no={getValue()} />,
      }),
      col.accessor('reportedBy', { header: t('inventory.stocktake.reportedBy') }),
      col.accessor('reportedAt', {
        header: t('inventory.stocktake.reportedAt'),
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
    ])
  }, [t])
  const auditColumns = useMemo(() => inventoryAuditColumns(t), [t])

  if (!count) return <InventoryNotFound title={t('inventory.stocktake.notFound')} backTo={backTo} />

  const summary = stocktakeSummary(count)
  const counting = count.status === 'COUNTING'
  const uncounted = summary.lineCount - summary.countedCount
  const first = count.discoveries[0]
  const audits = inventoryAuditLogs(auditLogs, 'STOCKTAKE', count.no)
  const filterButtons = (
    <span className="inline-flex items-center gap-1">
      {(['ALL', 'UNCOUNTED', 'DIFF'] as const).map((f) => (
        <Button key={f} size="sm" variant={lineFilter === f ? 'secondary' : 'ghost'} onClick={() => setLineFilter(f)}>
          {t(`inventory.stocktake.filter${f === 'ALL' ? 'All' : f === 'UNCOUNTED' ? 'Uncounted' : 'Diff'}`)}
        </Button>
      ))}
    </span>
  )

  return (
    <PageContainer
      title={
        <DetailTitle
          title={t('inventory.stocktake.title')}
          code={count.no}
          status={stocktakeStatusMeta[count.status]}
        />
      }
      actions={
        <>
          {counting && uncounted > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('inventory.stocktake.uncountedBlock', { count: uncounted })}
            </span>
          )}
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('inventory.backToList')}</Link>
          </Button>
          {counting && (
            <>
              <Button variant="outline" onClick={() => setDialog('entry')}>
                {t('inventory.stocktake.enterCounts')}
              </Button>
              <Button variant="outline" onClick={() => setDialog('cancel')}>
                {t('inventory.stocktake.cancel')}
              </Button>
              <Button disabled={uncounted > 0} onClick={() => setDialog('confirm')}>
                {t('inventory.stocktake.confirm')}
              </Button>
            </>
          )}
        </>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard
            title={t('inventory.stocktake.progress')}
            description={counting ? t('inventory.stocktake.progressHint') : t('inventory.stocktake.closedHint')}
          >
            <SummaryProgress
              label={t('inventory.stocktake.countedCount')}
              done={summary.countedCount}
              total={summary.lineCount}
              tone={summary.countedCount === summary.lineCount ? 'green' : 'blue'}
              pct={summary.lineCount ? Math.round((summary.countedCount / summary.lineCount) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('inventory.stocktake.skuCount'), value: summary.skuCount },
                { label: t('inventory.stocktake.lineCount'), value: summary.lineCount },
                { label: t('inventory.stocktake.countedCount'), value: summary.countedCount, tone: 'green' },
                {
                  label: t('inventory.stocktake.diffCount'),
                  value: summary.diffCount,
                  tone: summary.diffCount ? 'orange' : undefined,
                },
              ]}
            />
          </SummaryCard>
        }
      >
        <Section title={t('inventory.basicInfo')}>
          <Descriptions columns={3}>
            <DescriptionItem label={t('inventory.warehouse')}>
              <CodeName
                code={count.warehouseCode}
                name={warehouses.find((w) => w.code === count.warehouseCode)?.name}
              />
            </DescriptionItem>
            <DescriptionItem label={t('inventory.stocktake.source')}>
              <TagLabel meta={stocktakeSourceMeta[count.source]} />
            </DescriptionItem>
            <DescriptionItem label={t('inventory.stocktake.createdBy')}>{count.createdBy}</DescriptionItem>
            <DescriptionItem label={t('inventory.stocktake.createdAt')}>
              <DateTime value={count.createdAt} />
            </DescriptionItem>
            <DescriptionItem label={t('inventory.stocktake.skus')} multiline>
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {count.skus.map((k) => (
                  <CodeName key={`${k.customerId}::${k.skuCode}`} code={k.skuCode} name={customerName(k.customerId)} />
                ))}
              </span>
            </DescriptionItem>
            {first && (
              <>
                <DescriptionItem label={t('inventory.stocktake.stage')}>
                  {t(`inventory.stage.${first.stage}`)}
                </DescriptionItem>
                <DescriptionItem label={t('inventory.stocktake.relatedRecord')}>
                  {first.sourceNo ? <DocLink no={first.sourceNo} /> : <Empty />}
                </DescriptionItem>
              </>
            )}
            {count.status === 'COMPLETED' && (
              <>
                <DescriptionItem label={t('inventory.stocktake.confirmedBy')}>
                  {count.confirmedBy || <Empty />}
                </DescriptionItem>
                <DescriptionItem label={t('inventory.stocktake.confirmedAt')}>
                  <DateTime value={count.confirmedAt} />
                </DescriptionItem>
              </>
            )}
            {count.status === 'CANCELLED' && (
              <>
                <DescriptionItem label={t('inventory.stocktake.cancelledBy')}>
                  {count.cancelledBy || <Empty />}
                </DescriptionItem>
                <DescriptionItem label={t('inventory.stocktake.cancelledAt')}>
                  <DateTime value={count.cancelledAt} />
                </DescriptionItem>
                <DescriptionItem
                  label={t('inventory.stocktake.cancelReason')}
                  className="col-span-full xl:col-span-3"
                  multiline
                >
                  {count.cancelReason || <Empty />}
                </DescriptionItem>
              </>
            )}
            <DescriptionItem label={t('inventory.stocktake.remark')} className="col-span-full xl:col-span-3" multiline>
              {count.remark || <Empty />}
            </DescriptionItem>
          </Descriptions>
        </Section>
      </DetailOverview>
      <DetailTabs
        param="tab"
        items={[
          {
            value: 'lines',
            label: t('inventory.stocktake.tabLines'),
            count: count.lines.length,
            content: (
              <DataTable
                data={lineRows}
                columns={lineColumns}
                getRowId={(l) => String(l.lineNo)}
                toolbar={filterButtons}
                emptyText={t('inventory.stocktake.emptyLines')}
              />
            ),
          },
          {
            value: 'serials',
            label: t('inventory.stocktake.tabSerials'),
            count: serialRows.length,
            hidden: serialRows.length === 0,
            content: (
              <DataTable
                data={serialRows}
                columns={serialColumns}
                getRowId={(r) => String(r.lineNo)}
                paginate={false}
              />
            ),
          },
          {
            value: 'evidence',
            label: t('inventory.stocktake.tabEvidence'),
            hidden: count.discoveries.length === 0,
            content: (
              <DataTable
                data={count.discoveries.map((d, i) => ({ ...d, id: String(i) }))}
                columns={evidenceColumns}
                getRowId={(d) => d.id}
                paginate={false}
                emptyText={t('inventory.stocktake.emptyEvidence')}
              />
            ),
          },
          {
            value: 'logs',
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
      {dialog === 'entry' && <StocktakeEntrySheet count={count} onClose={() => setDialog(undefined)} />}
      {dialog === 'confirm' && <StocktakeConfirmDialog count={count} onClose={() => setDialog(undefined)} />}
      {dialog === 'cancel' && <StocktakeCancelDialog count={count} onClose={() => setDialog(undefined)} />}
    </PageContainer>
  )
}
