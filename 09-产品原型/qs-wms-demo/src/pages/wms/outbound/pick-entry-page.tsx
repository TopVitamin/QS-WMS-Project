import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { DetailOverview, DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics, SummaryProgress } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { outboundPickStatusMeta, pickSourceMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { taskOwnerDoc, taskTotals } from '@/lib/outbound-derive'
import { pickLineRemaining, pickLinesInRouteOrder, replacementStops } from '@/lib/outbound-pick-route'
import { useDb, useLookups } from '@/mock/db'
import { openTask } from '@/mock/outbound-actions'
import { useSettings } from '@/stores/settings'
import type { OutboundPickTask, PickAssignment, PickLine } from '@/types/outbound'
import { parseSerials } from './outbound-helpers'
import { useBackTo } from './shared'

/**
 * Web 端拣货（拣货任务主PRD 第二、五节）：不用 PDA 时，按纸质拣货单拣完后在管理端录入实拣与缺货。
 * 与 PDA 共用 PICK、SHORTAGE、FINISH_PICK 动作与校验：保存即下架到出库暂存（不能撤销），缺货换位一次；
 * 每行实拣＋缺货＝应拣后提交任务，提交不再移库。版式同 Web 端上架（管理端补录页，docs/02-设计规范 §5.6）。
 */
export function OutboundPickEntryPage() {
  const { taskNo } = useParams<{ taskNo: string }>()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const task = useDb((s) => s.outboundPickTasks.find((x) => x.no === taskNo && x.warehouseCode === warehouseCode))
  const backTo = useBackTo('/wms/outbound/pick-tasks')

  if (!task) return <Navigate to={backTo} replace />
  /** 已提交或已关闭（含 PDA 刚提交）就回详情：结束的任务不能再录 */
  if (!openTask(task)) return <Navigate to={`/wms/outbound/pick-tasks/${task.no}`} replace />
  return <EntryWorkspace key={task.no} task={task} />
}

type LineRow = PickLine & { lineNo: number; remaining: number }
type RecordRow = PickAssignment & { planLineNo: number; line: PickLine }

interface EntryDraft {
  lineId?: string
  picked: string
  short: string
  reason?: 'MISSING' | 'DAMAGED'
  serialText: string
}

function EntryWorkspace({ task }: { task: OutboundPickTask }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const operator = useSettings((s) => s.operator)
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const skuMasters = useDb((s) => s.skuMasters)
  const { customerCode, customerName } = useLookups()
  const { confirm } = useConfirm()
  const pickedRef = useRef<HTMLInputElement>(null)

  /** 行号按任务内顺序（与详情页一致）；录入顺序按拣货路径 */
  const lineNoOf = useMemo(() => new Map(task.lines.map((l, i) => [l.id, i + 1])), [task.lines])
  const routeLines = pickLinesInRouteOrder(task)
  const openLines = routeLines.filter((l) => pickLineRemaining(l) > 0)
  const draftFor = (line?: PickLine): EntryDraft => ({
    lineId: line?.id,
    picked: line ? String(pickLineRemaining(line)) : '',
    short: '',
    serialText: '',
  })
  const [draft, setDraft] = useState<EntryDraft>(() => draftFor(openLines[0]))
  const [error, setError] = useState<string>()

  const line = task.lines.find((l) => l.id === draft.lineId && pickLineRemaining(l) > 0)
  const remain = line ? pickLineRemaining(line) : 0
  const snEnabled = Boolean(
    line && skuMasters.find((m) => m.customerId === task.customerId && m.code === line.skuCode)?.snEnabled,
  )
  const pickedQty = Number(draft.picked || 0)
  const shortQty = Number(draft.short || 0)
  const qty = taskTotals(task)
  const processed = qty.picked + qty.reported
  const canSubmit = processed === qty.planned
  const owner = taskOwnerDoc(task)

  const lineLabel = (l: PickLine) =>
    [
      `#${lineNoOf.get(l.id)}`,
      l.locationCode,
      l.skuCode,
      l.batchNo,
      t('outbound.entry.remain', { count: pickLineRemaining(l) }),
    ]
      .filter(Boolean)
      .join(' · ')

  const pickLine = (id: string) => {
    setDraft(draftFor(task.lines.find((l) => l.id === id)))
    setError(undefined)
    requestAnimationFrame(() => pickedRef.current?.select())
  }

  const save = () => {
    if (!line) return setError(t('outbound.entry.pickLineFirst'))
    if (!Number.isInteger(pickedQty) || !Number.isInteger(shortQty) || pickedQty < 0 || shortQty < 0)
      return setError(t('outbound.entry.qtyInvalid'))
    if (pickedQty + shortQty <= 0) return setError(t('outbound.entry.qtyRequired'))
    if (pickedQty + shortQty > remain) return setError(t('outbound.entry.overRemain', { count: remain }))
    if (shortQty > 0 && !draft.reason) return setError(t('outbound.entry.reasonRequired'))
    const serialNos = snEnabled ? parseSerials(draft.serialText) : []
    if (snEnabled && serialNos.length !== pickedQty)
      return setError(t('outbound.entry.serialCount', { count: pickedQty }))

    const db = useDb.getState()
    if (pickedQty > 0) {
      const res = db.outboundAction(
        {
          type: 'PICK',
          no: task.no,
          lineId: line.id,
          location: line.locationCode,
          sku: line.skuCode,
          batch: line.batchNo,
          serialNos,
          qty: pickedQty,
          confirmationId: crypto.randomUUID(),
        },
        operator,
      )
      if (!res.ok) return setError(t(res.errorKey, res.params))
      toast.success(t('outbound.entry.savedPick', { location: line.locationCode, sku: line.skuCode, count: pickedQty }))
    }
    if (shortQty > 0) {
      const before = useDb.getState().outboundPickTasks.find((x) => x.no === task.no)?.lines ?? task.lines
      const res = useDb
        .getState()
        .outboundAction({ type: 'SHORTAGE', no: task.no, lineId: line.id, qty: shortQty, reason: draft.reason! }, operator)
      if (!res.ok) {
        // 实拣已生效，只保留缺货部分让文员改
        setDraft({ ...draft, picked: '' })
        return setError(t(res.errorKey, res.params))
      }
      const after = useDb.getState().outboundPickTasks.find((x) => x.no === task.no)?.lines ?? []
      const moved = replacementStops(before, after)
      toast.success(
        moved.length
          ? t('outbound.pdaPick.doneShortReplaced', {
              sku: line.skuCode,
              count: shortQty,
              locations: moved.map((m) => `${m.location} × ${m.qty}`).join(t('common.listSeparator')),
            })
          : t('outbound.pdaPick.doneShortNone', { sku: line.skuCode, count: shortQty }),
      )
    }
    setError(undefined)
    /** 本行处理完跳到路径上下一条还有剩余的应拣行；没处理完就留在本行继续录剩余 */
    const next = useDb.getState().outboundPickTasks.find((x) => x.no === task.no) ?? task
    const stay = next.lines.find((l) => l.id === line.id && pickLineRemaining(l) > 0)
    const target = stay ?? pickLinesInRouteOrder(next).find((l) => pickLineRemaining(l) > 0)
    setDraft(draftFor(target))
    requestAnimationFrame(() => pickedRef.current?.select())
  }

  const submit = async () => {
    const ok = await confirm({
      title: t('outbound.pdaPick.submitTitle', { no: task.no }),
      description: t('outbound.pdaPick.submitDesc', { picked: qty.picked, short: qty.short }),
      confirmText: t('outbound.pdaPick.submit'),
    })
    if (!ok) return
    const res = useDb.getState().outboundAction({ type: 'FINISH_PICK', no: task.no }, operator)
    if (!res.ok) toast.error(t(res.errorKey, res.params))
    else toast.success(t('outbound.pdaPick.submitDone', { no: task.no }))
    // 提交成功后任务已完成，页面自动回到详情
  }

  return (
    <PageContainer
      title={
        <DetailTitle title={t('outbound.entry.pickTitle')} code={task.no} status={outboundPickStatusMeta[task.status]} />
      }
      actions={
        <Button variant="outline" asChild>
          <Link to={`/wms/outbound/pick-tasks/${task.no}`}>{t('outbound.entry.backToDetail')}</Link>
        </Button>
      }
    >
      <DetailOverview
        aside={
          <SummaryCard title={t('outbound.entry.progressTitle')} description={t('outbound.entry.pickProgressHint')}>
            <SummaryProgress
              label={t('outbound.entry.processed')}
              done={processed}
              total={qty.planned}
              pct={qty.planned ? Math.round((processed / qty.planned) * 100) : null}
            />
            <SummaryMetrics
              items={[
                { label: t('outbound.ui.planned'), value: qty.planned },
                { label: t('outbound.ui.pickedQty'), value: qty.picked, tone: 'blue' },
                { label: t('outbound.ui.reported'), value: qty.reported, tone: 'orange', hidden: qty.reported === 0 },
                {
                  label: t('outbound.entry.remaining'),
                  value: qty.planned - processed,
                  tone: qty.planned > processed ? 'orange' : undefined,
                },
              ]}
            />
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <Button disabled={!canSubmit} onClick={submit}>
                {t('outbound.pdaPick.submit')}
              </Button>
              {!canSubmit && (
                <p className="text-xs text-muted-foreground">
                  {t('outbound.entry.submitBlocked', { count: qty.planned - processed })}
                </p>
              )}
            </div>
          </SummaryCard>
        }
      >
        <div className="flex min-w-0 flex-col gap-3">
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
                <CodeName
                  code={task.warehouseCode}
                  name={warehouseMasters.find((w) => w.code === task.warehouseCode)?.name}
                />
              </DescriptionItem>
              <DescriptionItem label={t('outbound.ui.staging')}>
                <BizCode>{task.stagingCode}</BizCode>
              </DescriptionItem>
              <DescriptionItem label={t('outbound.ui.createdAt')}>
                <DateTime value={task.createdAt} />
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={t('outbound.entry.pickFormTitle')}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                save()
              }}
            >
              <FormGrid>
                <FormField label={t('outbound.entry.planLine')} required span={2}>
                  <OptionSelect
                    value={line?.id}
                    onValueChange={pickLine}
                    options={openLines.map((l) => ({ value: l.id, label: lineLabel(l) }))}
                    placeholder={t('common.selectPlaceholder')}
                  />
                </FormField>
                <FormField label={t('outbound.entry.pickedQty')} required hint={line ? t('outbound.entry.remain', { count: remain }) : undefined}>
                  <Input
                    ref={pickedRef}
                    type="number"
                    min={0}
                    step={1}
                    value={draft.picked}
                    placeholder={t('common.inputPlaceholder')}
                    onChange={(e) => setDraft({ ...draft, picked: e.target.value })}
                  />
                </FormField>
                <FormField label={t('outbound.entry.shortQty')} hint={t('outbound.entry.shortHint')}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.short}
                    placeholder={t('common.inputPlaceholder')}
                    onChange={(e) => setDraft({ ...draft, short: e.target.value })}
                  />
                </FormField>
                {shortQty > 0 && (
                  <FormField label={t('outbound.entry.shortReason')} required>
                    <OptionSelect
                      value={draft.reason}
                      onValueChange={(v) => setDraft({ ...draft, reason: v as EntryDraft['reason'] })}
                      options={(['MISSING', 'DAMAGED'] as const).map((value) => ({
                        value,
                        label: t(`outbound.shortageReasons.${value}`),
                      }))}
                      placeholder={t('common.selectPlaceholder')}
                    />
                  </FormField>
                )}
                {snEnabled && (
                  <FormField label={t('outbound.ui.serial')} required span="full" hint={t('outbound.entry.serialHint')}>
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
                  <p className="mr-auto text-xs text-muted-foreground">{t('outbound.entry.pickFormHint')}</p>
                )}
                <Button type="submit" variant="outline" disabled={openLines.length === 0}>
                  {line && (pickedQty > 0 || shortQty > 0)
                    ? t('outbound.entry.save', { picked: pickedQty || 0, short: shortQty || 0 })
                    : t('outbound.entry.saveIdle')}
                </Button>
              </div>
            </form>
          </Section>
        </div>
      </DetailOverview>

      <EntryTabs task={task} routeLines={routeLines} lineNoOf={lineNoOf} onPick={pickLine} />
    </PageContainer>
  )
}

function EntryTabs({
  task,
  routeLines,
  lineNoOf,
  onPick,
}: {
  task: OutboundPickTask
  routeLines: PickLine[]
  lineNoOf: Map<string, number>
  onPick: (lineId: string) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku } = useLookups()

  /** 剩余随录入变化：先算进行数据再交给表格（表格按行对象缓存单元格） */
  const lineRows = useMemo<LineRow[]>(
    () => routeLines.map((l) => ({ ...l, lineNo: lineNoOf.get(l.id) ?? 0, remaining: pickLineRemaining(l) })),
    [lineNoOf, routeLines],
  )
  const recordRows = useMemo<RecordRow[]>(
    () =>
      [...task.assignments].reverse().map((a) => ({
        ...a,
        planLineNo: lineNoOf.get(a.lineId) ?? 0,
        line: task.lines.find((l) => l.id === a.lineId)!,
      })),
    [lineNoOf, task.assignments, task.lines],
  )

  const lineColumns = useMemo(() => {
    const col = createDataColumns<LineRow>()
    const num = (id: 'plannedQty' | 'pickedQty' | 'shortageQty' | 'remaining', header: string) =>
      col.accessor(id, { header, meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> })
    return col.columns([
      col.accessor('lineNo', { header: t('outbound.ui.lineNo'), meta: { align: 'right' } }),
      col.accessor('locationCode', {
        header: t('outbound.ui.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor('batchNo', { header: t('outbound.ui.batch'), cell: ({ getValue }) => getValue() || <Empty /> }),
      num('plannedQty', t('outbound.ui.planned')),
      num('pickedQty', t('outbound.ui.pickedQty')),
      num('shortageQty', t('outbound.ui.reported')),
      num('remaining', t('outbound.entry.remaining')),
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

  const recordColumns = useMemo(() => {
    const col = createDataColumns<RecordRow>()
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
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-64" />,
      }),
      col.accessor('orderNo', {
        header: t('outbound.ui.no'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/outbound/orders/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('pickedQty', {
        header: t('outbound.ui.assignedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor((r) => r.serialNos.join(t('common.listSeparator')), {
        id: 'serial',
        header: t('outbound.ui.serial'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('operator', { header: t('outbound.ui.operator') }),
      col.accessor('at', { header: t('outbound.ui.time'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
    ])
  }, [navigate, sku, t])

  return (
    <DetailTabs
      param="tab"
      items={[
        {
          value: 'lines',
          label: t('outbound.entry.linesTab'),
          count: lineRows.length,
          content: (
            <DataTable data={lineRows} columns={lineColumns} getRowId={(l) => l.id} selectable={false} paginate={false} />
          ),
        },
        {
          value: 'records',
          label: t('outbound.entry.recordsTab'),
          count: recordRows.length,
          content: (
            <DataTable
              data={recordRows}
              columns={recordColumns}
              getRowId={(r) => r.id}
              selectable={false}
              paginate={false}
              emptyText={t('outbound.entry.noRecords')}
            />
          ),
        },
      ]}
    />
  )
}
