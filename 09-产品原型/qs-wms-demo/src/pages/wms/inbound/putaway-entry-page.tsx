import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, Empty, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { ActionLink, RowActions } from '@/components/biz/row-actions'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { usePutaway } from '@/hooks/use-putaway'
import { findSkuMaster } from '@/lib/sku-master'
import { isFullyRecorded, planQty, recordedQty, remainingQty, suggestPutawayLocation } from '@/lib/putaway'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutawayActualLine, PutawayOrder, PutawayPlanLine } from '@/types/inbound'

/**
 * Web 端上架（上架单主PRD 第二、三节）：现场按纸单或口头完成上架后，由管理端把落位结果录入上架单。
 * 与 PDA 共用保存、撤销、提交动作与校验；保存只记落位、不动库存，整单录满后提交才移库。
 * 版式同入库单详情：上方「上架信息 + 录入进度」双栏，下方页签切换应上架明细与已录落位。
 */
export function PutawayEntryPage() {
  const { putawayNo } = useParams<{ putawayNo: string }>()
  const location = useLocation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const putaway = usePutaway(warehouseCode)
  const order = putaway.putawayOrders.find((p) => p.putawayNo === putawayNo)
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch

  if (!order || order.warehouseCode !== warehouseCode) return <Navigate to="/wms/inbound/putaway" replace />
  /** 已提交（含 PDA 刚提交）就回详情：已完成单不能再录 */
  if (order.status === 'COMPLETED') {
    return <Navigate to={`/wms/inbound/putaway/${order.putawayNo}`} replace state={{ listSearch }} />
  }
  return <EntryWorkspace key={order.putawayNo} order={order} listSearch={listSearch} />
}

type PlanRow = PutawayPlanLine & { recorded: number; remaining: number }

interface EntryDraft {
  planLineNo?: number
  locationCode: string
  qty: string
  serialText: string
}

function EntryWorkspace({ order, listSearch }: { order: PutawayOrder; listSearch?: string }) {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const putaway = usePutaway(warehouseCode)
  const { customerCode, customerName } = useLookups()
  const { confirm } = useConfirm()

  const openLines = order.planLines.filter((l) => remainingQty(order, l.lineNo) > 0)
  const draftFor = (line?: PutawayPlanLine): EntryDraft => ({
    planLineNo: line?.lineNo,
    locationCode: (line && suggestPutawayLocation(order, line.skuCode, putaway.locationContext)) ?? '',
    qty: line ? String(remainingQty(order, line.lineNo)) : '',
    serialText: '',
  })
  const [draft, setDraft] = useState<EntryDraft>(() => draftFor(openLines.length === 1 ? openLines[0] : undefined))
  const [error, setError] = useState<string>()

  const planLine = order.planLines.find((l) => l.lineNo === draft.planLineNo)
  const skuMasters = useDb((s) => s.skuMasters)
  const snEnabled = Boolean(
    planLine && findSkuMaster(skuMasters, customerCode(order.customerId), planLine.skuCode)?.snEnabled,
  )
  const remain = planLine ? remainingQty(order, planLine.lineNo) : 0
  const suggestion = planLine ? suggestPutawayLocation(order, planLine.skuCode, putaway.locationContext) : undefined

  const planTotal = planQty(order)
  const recorded = recordedQty(order)
  const canSubmit = order.actualLines.length > 0 && isFullyRecorded(order)

  const lineLabel = (line: PutawayPlanLine) =>
    [`#${line.lineNo}`, line.skuCode, line.batchNo, t('putaway.entry.lineRemain', { count: remainingQty(order, line.lineNo) })]
      .filter(Boolean)
      .join(' · ')

  const pickLine = (lineNo: number) => {
    setDraft(draftFor(order.planLines.find((l) => l.lineNo === lineNo)))
    setError(undefined)
  }

  const save = () => {
    if (!planLine) return setError(t('putaway.entry.pickLine'))
    if (!draft.locationCode.trim()) return setError(t('pdaPutaway.scanLocationFirst'))
    const qty = Number(draft.qty)
    if (!Number.isInteger(qty) || qty <= 0) return setError(t('error.qtyInvalid'))
    if (qty > remain) return setError(t('pdaPutaway.error.overRemain'))
    const serialNos = snEnabled
      ? draft.serialText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined
    const res = putaway.savePutawayLine({
      putawayNo: order.putawayNo,
      locationCode: draft.locationCode.trim(),
      planLineNo: planLine.lineNo,
      qty,
      serialNos,
      operator,
    })
    if (!res.ok) return setError(t(res.errorKey))
    toast.success(
      t('pdaPutaway.saved', { sku: planLine.skuCode, qty, location: draft.locationCode.trim().toUpperCase() }),
    )
    setError(undefined)
    /** 本行录满后跳到下一条还没录满的应上架行；没录满就留在本行继续录剩余 */
    const next = useDb.getState().putawayOrders.find((p) => p.putawayNo === order.putawayNo) ?? order
    const stay = remainingQty(next, planLine.lineNo) > 0
    const target = stay ? planLine : next.planLines.find((l) => remainingQty(next, l.lineNo) > 0)
    setDraft(target ? { ...draftFor(target), qty: String(remainingQty(next, target.lineNo)) } : draftFor())
  }

  const remove = async (line: PutawayActualLine) => {
    const ok = await confirm({
      title: t('pdaPutaway.undoTitle'),
      description: t('pdaPutaway.undoDesc', { location: line.locationCode, sku: line.skuCode, qty: line.qty }),
      confirmText: t('pdaPutaway.undo'),
      variant: 'destructive',
    })
    if (!ok) return
    const res = putaway.removePutawayLine({
      putawayNo: order.putawayNo,
      locationCode: line.locationCode,
      planLineNo: line.planLineNo,
      operator,
    })
    if (!res.ok) toast.error(t(res.errorKey))
  }

  const submit = async () => {
    const ok = await confirm({
      title: t('pdaPutaway.submitTitle', { no: order.putawayNo }),
      description: t('pdaPutaway.submitDesc', { lines: order.actualLines.length }),
      confirmText: t('pdaPutaway.submit'),
    })
    if (!ok) return
    const res = putaway.submitPutawayOrder({ putawayNo: order.putawayNo, operator })
    if (!res.ok) toast.error(t(res.errorKey))
    else toast.success(t('pdaPutaway.submitSuccess', { no: order.putawayNo }))
    // 提交成功后单据变为已完成，页面自动回到详情
  }

  return (
    <PageContainer
      title={
        <DetailTitle title={t('putaway.entry.title')} code={order.putawayNo} status={putawayOrderStatusMeta[order.status]} />
      }
      actions={
        <Button variant="outline" asChild>
          <Link to={`/wms/inbound/putaway/${order.putawayNo}`} state={{ listSearch }}>
            {t('putaway.entry.backToDetail')}
          </Link>
        </Button>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('putaway.entry.progressTitle')} description={t('putaway.entry.progressHint')}>
            <SummaryProgress
              label={t('putaway.entry.recorded')}
              done={recorded}
              total={planTotal}
              pct={planTotal > 0 ? Math.round((recorded / planTotal) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('putaway.planQty'), value: planTotal },
                { label: t('putaway.entry.recorded'), value: recorded, tone: 'blue' },
                { label: t('putaway.entry.remaining'), value: planTotal - recorded, tone: planTotal > recorded ? 'orange' : undefined },
                { label: t('putaway.entry.actualLines'), value: order.actualLines.length },
              ]}
            />
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <Button disabled={!canSubmit} onClick={submit}>
                {t('putaway.entry.submit', { count: order.actualLines.length })}
              </Button>
              {!canSubmit && (
                <p className="text-xs text-muted-foreground">
                  {t('pdaPutaway.remainToPlace', { count: planTotal - recorded })}
                </p>
              )}
            </div>
          </SummaryCard>
        }
      >
        <div className="flex min-w-0 flex-col gap-3">
          <Section title={t('putaway.sectionBasic')}>
            <Descriptions columns={3}>
              <DescriptionItem label={t('inventory.quality')}>
                <TagLabel meta={qualityMeta[order.qualityType]} />
              </DescriptionItem>
              <DescriptionItem label={t('putaway.sourceNo')}>
                <BizCode>{order.sourceNo}</BizCode>
              </DescriptionItem>
              <DescriptionItem label={t('common.customer')}>
                <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
              </DescriptionItem>
              <DescriptionItem label={t('inbound.workContainerNo')}>
                {order.containerNo ? <BizCode>{order.containerNo}</BizCode> : t('putaway.noContainer')}
              </DescriptionItem>
              <DescriptionItem label={t('putaway.stagingLocation')}>
                <BizCode>{order.stagingLocationCode}</BizCode>
              </DescriptionItem>
              <DescriptionItem label={t('putaway.receiptNo')}>
                <BizCode>{order.receiptNo}</BizCode>
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={t('putaway.entry.formTitle')}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                save()
              }}
            >
              <FormGrid>
                <FormField label={t('putaway.entry.planLine')} required span={2}>
                  <OptionSelect
                    value={draft.planLineNo ? String(draft.planLineNo) : undefined}
                    onValueChange={(v) => pickLine(Number(v))}
                    options={openLines.map((l) => ({ value: String(l.lineNo), label: lineLabel(l) }))}
                  />
                </FormField>
                <FormField
                  label={t('pdaPutaway.targetLocation')}
                  required
                  hint={
                    suggestion ? (
                      <ActionLink onClick={() => setDraft({ ...draft, locationCode: suggestion })}>
                        {t('putaway.entry.useSuggestion', { location: suggestion })}
                      </ActionLink>
                    ) : planLine ? (
                      t('pdaPutaway.noSuggestion')
                    ) : undefined
                  }
                >
                  <Input
                    value={draft.locationCode}
                    placeholder={t('putaway.entry.locationPlaceholder')}
                    onChange={(e) => setDraft({ ...draft, locationCode: e.target.value })}
                  />
                </FormField>
                <FormField
                  label={t('pdaPutaway.qty')}
                  required
                  hint={planLine ? t('pdaPutaway.lineRemain', { count: remain }) : undefined}
                >
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.qty}
                    placeholder={t('common.inputPlaceholder')}
                    onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
                  />
                </FormField>
                {snEnabled && (
                  <FormField label={t('putaway.serialNos')} required span="full" hint={t('putaway.entry.serialHint')}>
                    <Textarea
                      rows={3}
                      value={draft.serialText}
                      placeholder={t('putaway.entry.serialPlaceholder')}
                      onChange={(e) => setDraft({ ...draft, serialText: e.target.value })}
                    />
                  </FormField>
                )}
              </FormGrid>
              <div className="mt-3 flex items-center justify-end gap-3">
                {error && <p className="mr-auto text-xs text-destructive">{error}</p>}
                <Button type="submit" variant="outline" disabled={openLines.length === 0}>
                  {t('pdaPutaway.save')}
                </Button>
              </div>
            </form>
          </Section>
        </div>
      </DetailOverview>

      <EntryTabs order={order} onPick={pickLine} onRemove={remove} />
    </PageContainer>
  )
}

function EntryTabs({
  order,
  onPick,
  onRemove,
}: {
  order: PutawayOrder
  onPick: (lineNo: number) => void
  onRemove: (line: PutawayActualLine) => void
}) {
  const { t } = useTranslation()
  const { sku } = useLookups()

  /**
   * 录入页的应上架明细多两列「已录」「剩余」，供录入时对数；详情页不展示。
   * 表格按行对象缓存单元格，所以先把两个数算进行里：保存后行对象变化，表格才会刷新。
   */
  const planRows = useMemo<PlanRow[]>(
    () =>
      order.planLines.map((l) => ({
        ...l,
        recorded: recordedQty(order, l.lineNo),
        remaining: remainingQty(order, l.lineNo),
      })),
    [order],
  )
  const planColumns = useMemo(() => {
    const col = createDataColumns<PlanRow>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('common.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor('batchNo', { header: t('putaway.batchNo'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('expiryDate', { header: t('putaway.expiryDate'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('planQty', {
        header: t('putaway.planQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('recorded', {
        header: t('putaway.entry.recorded'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('remaining', {
        header: t('putaway.entry.remaining'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                key: 'pick',
                label: t('putaway.entry.pick'),
                hidden: row.original.remaining === 0,
                onClick: () => onPick(row.original.lineNo),
              },
            ]}
          />
        ),
      }),
    ])
  }, [onPick, sku, t])

  const actualColumns = useMemo(() => {
    const col = createDataColumns<PutawayActualLine>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('planLineNo', { header: t('putaway.planLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('common.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor('locationCode', {
        header: t('inbound.targetLocation'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('qty', {
        header: t('putaway.putawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((l) => (l.serialNos ?? []).join(t('common.listSeparator')), {
        id: 'serialNos',
        header: t('putaway.serialNos'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                key: 'remove',
                label: t('pdaPutaway.undo'),
                danger: true,
                hidden: row.original.submitted,
                onClick: () => onRemove(row.original),
              },
            ]}
          />
        ),
      }),
    ])
  }, [onRemove, sku, t])

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
              data={planRows}
              columns={planColumns}
              getRowId={(line) => String(line.lineNo)}
              selectable={false}
              paginate={false}
            />
          ),
        },
        {
          value: 'actual',
          label: t('putaway.entry.actualTab'),
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
      ]}
    />
  )
}
