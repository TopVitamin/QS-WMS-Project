import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DocNo, Empty, Num } from '@/components/biz/display'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { ActionLink, RowActions } from '@/components/biz/row-actions'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { outboundPutbackStatusMeta, qualityMeta, unpickReasonMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { putbackExpected, putbackPlacements } from '@/lib/outbound-derive'
import { compareLocation, putbackLineRemaining } from '@/lib/outbound-pick-route'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundPutback, PutbackLine } from '@/types/outbound'
import { parseSerials } from './outbound-helpers'
import { useBackTo } from './shared'

/**
 * Web 端返库（返库上架单主PRD 第二、三节）：不用 PDA 时，现场按建议库位放回后在管理端录入目标库位与数量。
 * 与 PDA 共用 SAVE_PUTBACK、RESET_PUTBACK_LINE、SUBMIT_PUTBACK：保存只记落位、不动库存，可重录；
 * 每行录满后整单提交才从出库暂存移库。版式同 Web 端上架（管理端补录页，docs/02-设计规范 §5.6）。
 */
export function OutboundPutbackEntryPage() {
  const { putbackNo } = useParams<{ putbackNo: string }>()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const putback = useDb((s) => s.outboundPutbacks.find((p) => p.no === putbackNo && p.warehouseCode === warehouseCode))
  const backTo = useBackTo('/wms/outbound/return-putaway')

  if (!putback) return <Navigate to={backTo} replace />
  if (putback.status === 'COMPLETED') return <Navigate to={`/wms/outbound/return-putaway/${putback.no}`} replace />
  return <EntryWorkspace key={putback.no} putback={putback} />
}

type LineRow = PutbackLine & { lineNo: number; remaining: number }
type PlacementRow = ReturnType<typeof putbackPlacements>[number] & { lineId: string }

interface EntryDraft {
  lineId?: string
  location: string
  qty: string
  serialText: string
}

/** 录入顺序：按建议库位的路径顺序 */
const routeOrder = (p: OutboundPutback) =>
  [...p.lines].sort(
    (a, b) =>
      Number(putbackLineRemaining(a) <= 0) - Number(putbackLineRemaining(b) <= 0) ||
      compareLocation(a.suggestedLocation, b.suggestedLocation),
  )

function EntryWorkspace({ putback }: { putback: OutboundPutback }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const operator = useSettings((s) => s.operator)
  const { customerCode, customerName } = useLookups()
  const { confirm } = useConfirm()

  const lineNoOf = useMemo(() => new Map(putback.lines.map((l, i) => [l.id, i + 1])), [putback.lines])
  const openLines = routeOrder(putback).filter((l) => putbackLineRemaining(l) > 0)
  const draftFor = (line?: PutbackLine): EntryDraft => ({
    lineId: line?.id,
    location: line?.suggestedLocation ?? '',
    qty: line ? String(putbackLineRemaining(line)) : '',
    serialText: '',
  })
  const [draft, setDraft] = useState<EntryDraft>(() => draftFor(openLines[0]))
  const [error, setError] = useState<string>()

  const line = putback.lines.find((l) => l.id === draft.lineId && putbackLineRemaining(l) > 0)
  const remain = line ? putbackLineRemaining(line) : 0
  const expected = putbackExpected(putback)
  const saved = putback.lines.reduce((n, l) => n + l.savedQty, 0)
  const placements = putbackPlacements(putback)
  const canSubmit = saved === expected

  const lineLabel = (l: PutbackLine) =>
    [
      `#${lineNoOf.get(l.id)}`,
      l.skuCode,
      l.batchNo,
      t(`enum.quality.${l.qualityType}`),
      t('outbound.entry.remain', { count: putbackLineRemaining(l) }),
    ]
      .filter(Boolean)
      .join(' · ')

  const pickLine = (id: string) => {
    setDraft(draftFor(putback.lines.find((l) => l.id === id)))
    setError(undefined)
  }

  const save = () => {
    if (!line) return setError(t('outbound.entry.returnLineFirst'))
    const location = draft.location.trim().toUpperCase()
    if (!location) return setError(t('outbound.entry.targetRequired'))
    const qty = Number(draft.qty)
    if (!Number.isInteger(qty) || qty <= 0) return setError(t('outbound.entry.qtyInvalid'))
    if (qty > remain) return setError(t('outbound.entry.returnOver', { count: remain }))
    const serialNos = line.serialNos.length && draft.serialText.trim() ? parseSerials(draft.serialText) : undefined
    if (serialNos && serialNos.length !== qty) return setError(t('outbound.entry.serialCount', { count: qty }))
    const res = useDb
      .getState()
      .outboundAction({ type: 'SAVE_PUTBACK', no: putback.no, lineId: line.id, location, qty, serialNos }, operator)
    if (!res.ok) return setError(t(res.errorKey, res.params))
    toast.success(t('outbound.pdaReturn.okSaved', { sku: line.skuCode, count: qty, location }))
    setError(undefined)
    /** 本行录满后跳到下一条还没录满的应返库行；没录满就留在本行继续录剩余 */
    const next = useDb.getState().outboundPutbacks.find((p) => p.no === putback.no) ?? putback
    const stay = next.lines.find((l) => l.id === line.id && putbackLineRemaining(l) > 0)
    setDraft(draftFor(stay ?? routeOrder(next).find((l) => putbackLineRemaining(l) > 0)))
  }

  const redo = async (lineId: string) => {
    const target = putback.lines.find((l) => l.id === lineId)
    if (!target) return
    const ok = await confirm({
      title: t('outbound.redoReturn'),
      description: t('outbound.redoReturnConfirm', {
        sku: target.skuCode,
        count: target.savedQty,
        location: (target.placements ?? []).map((pl) => pl.location).join(t('common.listSeparator')),
      }),
      confirmText: t('outbound.redoReturn'),
      variant: 'destructive',
    })
    if (!ok) return
    const res = useDb.getState().outboundAction({ type: 'RESET_PUTBACK_LINE', no: putback.no, lineId }, operator)
    if (!res.ok) toast.error(t(res.errorKey, res.params))
    else {
      toast.success(t('outbound.doneReturnReset', { sku: target.skuCode, count: target.savedQty }))
      pickLine(lineId)
    }
  }

  const submit = async () => {
    const ok = await confirm({
      title: t('outbound.pdaReturn.submitTitle', { no: putback.no }),
      description: t('outbound.pdaReturn.submitDesc', { count: expected, placements: placements.length }),
      confirmText: t('outbound.pdaReturn.submit'),
    })
    if (!ok) return
    const res = useDb.getState().outboundAction({ type: 'SUBMIT_PUTBACK', no: putback.no }, operator)
    if (!res.ok) toast.error(t(res.errorKey, res.params))
    else toast.success(t('outbound.doneReturnSubmitted', { no: putback.no }))
    // 提交成功后单据已完成，页面自动回到详情
  }

  return (
    <PageContainer
      title={
        <DetailTitle
          title={t('outbound.entry.returnTitle')}
          code={putback.no}
          status={outboundPutbackStatusMeta[putback.status]}
        />
      }
      actions={
        <Button variant="outline" asChild>
          <Link to={`/wms/outbound/return-putaway/${putback.no}`}>{t('outbound.entry.backToDetail')}</Link>
        </Button>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('outbound.entry.progressTitle')} description={t('outbound.entry.returnProgressHint')}>
            <SummaryProgress
              label={t('outbound.saved')}
              done={saved}
              total={expected}
              pct={expected ? Math.round((saved / expected) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('outbound.ui.expected'), value: expected },
                { label: t('outbound.saved'), value: saved, tone: 'blue' },
                {
                  label: t('outbound.entry.remaining'),
                  value: expected - saved,
                  tone: expected > saved ? 'orange' : undefined,
                },
                { label: t('outbound.pdaReturn.placementCount'), value: placements.length },
              ]}
            />
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <Button disabled={!canSubmit} onClick={submit}>
                {t('outbound.entry.returnSubmit', { count: placements.length })}
              </Button>
              {!canSubmit && (
                <p className="text-xs text-muted-foreground">
                  {t('outbound.entry.returnSubmitBlocked', { count: expected - saved })}
                </p>
              )}
              {putback.reason === 'MISSING' && (
                <p className="text-xs text-warning-text">{t('outbound.missingNotice')}</p>
              )}
            </div>
          </SummaryCard>
        }
      >
        <div className="flex min-w-0 flex-col gap-3">
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
              <DescriptionItem label={t('outbound.ui.stagingSource')}>
                {putback.lines[0]?.fromLocation ? <BizCode>{putback.lines[0].fromLocation}</BizCode> : <Empty />}
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={t('outbound.entry.returnFormTitle')}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                save()
              }}
            >
              <FormGrid>
                <FormField label={t('outbound.entry.returnLine')} required span={2}>
                  <OptionSelect
                    value={line?.id}
                    onValueChange={pickLine}
                    options={openLines.map((l) => ({ value: l.id, label: lineLabel(l) }))}
                    placeholder={t('common.selectPlaceholder')}
                  />
                </FormField>
                <FormField
                  label={t('outbound.ui.target')}
                  required
                  hint={
                    line && draft.location.trim().toUpperCase() !== line.suggestedLocation ? (
                      <ActionLink onClick={() => setDraft({ ...draft, location: line.suggestedLocation })}>
                        {t('outbound.entry.useSuggestion', { location: line.suggestedLocation })}
                      </ActionLink>
                    ) : undefined
                  }
                >
                  <Input
                    value={draft.location}
                    placeholder={t('outbound.entry.targetPlaceholder')}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  />
                </FormField>
                <FormField
                  label={t('outbound.entry.returnQty')}
                  required
                  hint={line ? t('outbound.entry.remain', { count: remain }) : undefined}
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
                {line && line.serialNos.length > 0 && (
                  <FormField label={t('outbound.ui.serial')} span="full" hint={t('outbound.entry.returnSerialHint')}>
                    <Textarea
                      rows={3}
                      value={draft.serialText}
                      placeholder={t('outbound.entry.serialPlaceholder')}
                      onChange={(e) => setDraft({ ...draft, serialText: e.target.value })}
                    />
                  </FormField>
                )}
              </FormGrid>
              <div className="mt-3 flex items-center justify-end gap-3">
                {error ? (
                  <p className="mr-auto text-xs text-destructive">{error}</p>
                ) : (
                  <p className="mr-auto text-xs text-muted-foreground">{t('outbound.entry.returnFormHint')}</p>
                )}
                <Button type="submit" variant="outline" disabled={openLines.length === 0}>
                  {t('outbound.entry.returnSave')}
                </Button>
              </div>
            </form>
          </Section>
        </div>
      </DetailOverview>

      <EntryTabs putback={putback} lineNoOf={lineNoOf} onPick={pickLine} onRedo={(id) => void redo(id)} />
    </PageContainer>
  )
}

function EntryTabs({
  putback,
  lineNoOf,
  onPick,
  onRedo,
}: {
  putback: OutboundPutback
  lineNoOf: Map<string, number>
  onPick: (lineId: string) => void
  onRedo: (lineId: string) => void
}) {
  const { t } = useTranslation()
  const { sku } = useLookups()

  const lineRows = useMemo<LineRow[]>(
    () =>
      routeOrder(putback).map((l) => ({ ...l, lineNo: lineNoOf.get(l.id) ?? 0, remaining: putbackLineRemaining(l) })),
    [lineNoOf, putback],
  )
  const placementRows = useMemo<PlacementRow[]>(
    () =>
      putbackPlacements(putback).map((p) => ({
        ...p,
        lineId: putback.lines[p.planLineNo - 1]?.id ?? '',
      })),
    [putback],
  )

  const lineColumns = useMemo(() => {
    const col = createDataColumns<LineRow>()
    return col.columns([
      col.accessor('lineNo', { header: t('outbound.ui.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor('qualityType', {
        header: t('outbound.ui.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor('batchNo', { header: t('outbound.ui.batch'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('suggestedLocation', {
        header: t('outbound.ui.suggested'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('qty', {
        header: t('outbound.ui.expected'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('savedQty', {
        header: t('outbound.saved'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('remaining', {
        header: t('outbound.entry.remaining'),
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
                key: 'enter',
                label: t('outbound.entry.record'),
                hidden: row.original.remaining === 0,
                onClick: () => onPick(row.original.id),
              },
            ]}
          />
        ),
      }),
    ])
  }, [onPick, sku, t])

  const placementColumns = useMemo(() => {
    const col = createDataColumns<PlacementRow>()
    return col.columns([
      col.accessor('planLineNo', { header: t('outbound.ui.planLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor('location', {
        header: t('outbound.ui.target'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
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
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                key: 'redo',
                label: t('outbound.redoReturn'),
                danger: true,
                onClick: () => onRedo(row.original.lineId),
              },
            ]}
          />
        ),
      }),
    ])
  }, [onRedo, sku, t])

  return (
    <DetailTabs
      param="tab"
      items={[
        {
          value: 'lines',
          label: t('outbound.ui.planReturn'),
          count: lineRows.length,
          content: (
            <DataTable
              data={lineRows}
              columns={lineColumns}
              getRowId={(l) => l.id}
              selectable={false}
              paginate={false}
            />
          ),
        },
        {
          value: 'placements',
          label: t('outbound.entry.placementsTab'),
          count: placementRows.length,
          content: (
            <DataTable
              data={placementRows}
              columns={placementColumns}
              getRowId={(p) => p.id}
              selectable={false}
              paginate={false}
              emptyText={t('outbound.ui.noActual')}
            />
          ),
        },
      ]}
    />
  )
}
