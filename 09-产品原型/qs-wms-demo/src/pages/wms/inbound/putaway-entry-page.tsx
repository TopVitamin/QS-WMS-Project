import { Box, Check, Package } from 'lucide-react'
import { Fragment, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, CodeName, DocNoTail, Num } from '@/components/biz/display'
import { DetailTitle, PageContainer, Panel } from '@/components/biz/page-container'
import { ActionLink } from '@/components/biz/row-actions'
import { ScanField, type ScanFlash } from '@/components/biz/scan-field'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard } from '@/components/biz/summary-card'
import {
  WorkbenchCurrent,
  WorkbenchProductCode,
  WorkbenchProductName,
  WorkbenchPrompt,
  type WorkbenchPromptState,
} from '@/components/biz/workbench'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { putawayOrderStatusMeta, qualityMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { usePutaway } from '@/hooks/use-putaway'
import {
  findLocation,
  planQty,
  recordedQty,
  remainingQty,
  skuKindCount,
  suggestPutawayLocation,
  validatePutawayLocation,
} from '@/lib/putaway'
import {
  draftQty,
  entryDrafts,
  entryGroups,
  entryPlacements,
  filledQty,
  firstEntryProblem,
  lineProblem,
  type EditedDrafts,
  type EntryDraft,
  type EntryProblem,
} from '@/lib/putaway-entry'
import { findSkuMaster } from '@/lib/sku-master'
import { cn } from '@/lib/utils'
import {
  WORKBENCH_NAME_MIN_WIDTH,
  WORKBENCH_PRODUCT_COL_WIDTH,
  workbenchLayout as wl,
  workbenchTable as wt,
} from '@/lib/workbench-styles'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutawayActualLine, PutawayOrder, PutawayPlanLine } from '@/types/inbound'

/**
 * Web 端上架作业台（上架单前端Demo版PRD 第六节；作业台规范见 docs/04-作业台设计规范.md）：
 * 扫商品条码选中一行，再扫库位条码填进这一行；也可以直接在表里填。推荐库位只当提示，扫码或点「用推荐」才算数。
 * 「确认上架」是一个原子动作：本次落位逐条保存后整单提交，任何一条不过就什么都不写（与 PDA 同一组保存、提交规则）。
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

/** 录入列宽（px）；商品列见 WORKBENCH_PRODUCT_COL_WIDTH，名称列吃剩下的宽度 */
const COL = { remaining: 88, location: 192, qty: 80, actions: 64 } as const
/** 比这还窄就在表格框内横向滚动（商品列吸左），不再压缩各列 */
const TABLE_MIN_WIDTH =
  WORKBENCH_PRODUCT_COL_WIDTH + WORKBENCH_NAME_MIN_WIDTH + COL.remaining + COL.location + COL.qty + COL.actions

function EntryWorkspace({ order, listSearch }: { order: PutawayOrder; listSearch?: string }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const putaway = usePutaway(warehouseCode)
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const { customerCode, customerName, sku } = useLookups()
  const { confirm } = useConfirm()
  const scanRef = useRef<HTMLInputElement>(null)
  const nextDraftId = useRef(0)

  /** 只存作业员改过的行；没改过的行按单据算默认落位（库位留空、剩余数量） */
  const [edited, setEdited] = useState<EditedDrafts>({})
  const [activeLineNo, setActiveLineNo] = useState<number>()
  const [scanValue, setScanValue] = useState('')
  const [flash, setFlash] = useState<ScanFlash>()
  /** 最近一次操作的结果；为空时显示当前步骤的默认提示 */
  const [feedback, setFeedback] = useState<WorkbenchPromptState>()
  /** 确认被拦下时出错的那条落位：库位框标红，改任何一格就清掉 */
  const [failedDraftId, setFailedDraftId] = useState<string>()
  // 结果文案在发生时已翻译好；切换语言时清掉，回到按当前语言渲染的默认提示
  const [feedbackLang, setFeedbackLang] = useState(i18n.language)
  if (feedbackLang !== i18n.language) {
    setFeedbackLang(i18n.language)
    setFeedback(undefined)
  }

  const ownerCode = customerCode(order.customerId)
  const master = (line: PutawayPlanLine) => findSkuMaster(skuMasters, ownerCode, line.skuCode)
  const nameOf = (line: PutawayPlanLine) => master(line)?.name ?? sku(line.skuCode)?.name ?? line.skuCode
  const barcodeOf = (line: PutawayPlanLine) => master(line)?.primaryBarcode ?? sku(line.skuCode)?.barcode
  /** 提示里指认一行：名称，同商品多批次时带批次 */
  const labelOf = (line: PutawayPlanLine) => (line.batchNo ? `${nameOf(line)} · ${line.batchNo}` : nameOf(line))
  const isSerialLine = (_line: PutawayPlanLine) => false
  const suggestionOf = (line: PutawayPlanLine) => suggestPutawayLocation(order, line.skuCode, putaway.locationContext)
  const lineOf = (lineNo: number) => order.planLines.find((l) => l.lineNo === lineNo)

  const drafts = entryDrafts(order, edited)
  const draftsOf = (lineNo: number) => drafts.get(lineNo) ?? []
  const problem = firstEntryProblem(order, drafts, isSerialLine)
  const total = planQty(order)
  const filled = filledQty(order, drafts)
  const filledLines = order.planLines.filter((l) => !lineProblem(order, l, draftsOf(l.lineNo), isSerialLine)).length
  const { groups, pending } = entryGroups(order, drafts)
  const activeLine = activeLineNo === undefined ? undefined : lineOf(activeLineNo)
  const problemText = (p: EntryProblem) => {
    const line = lineOf(p.planLineNo)
    return t(`putaway.entry.${p.key}`, { ...p.params, sku: line ? labelOf(line) : p.params.sku })
  }

  /** 作业后把焦点拉回扫码框，扫描枪的下一枪不丢 */
  const refocusScan = () => requestAnimationFrame(() => scanRef.current?.focus())
  const scanResult = (ok: boolean, prompt?: WorkbenchPromptState) => {
    setFlash((f) => ({ ok, key: (f?.key ?? 0) + 1 }))
    setFeedback(prompt)
    setScanValue('')
    refocusScan()
  }

  const setLineDrafts = (lineNo: number, rows: EntryDraft[]) => {
    setEdited((prev) => ({ ...prev, [lineNo]: rows }))
    setFailedDraftId(undefined)
    setFeedback(undefined)
  }
  const updateDraft = (lineNo: number, id: string, patch: Partial<EntryDraft>) =>
    setLineDrafts(
      lineNo,
      draftsOf(lineNo).map((d) => (d.id === id ? { ...d, ...patch } : d)),
    )
  const splitLine = (lineNo: number) => {
    setLineDrafts(lineNo, [
      ...draftsOf(lineNo),
      { id: `new-${nextDraftId.current++}`, locationCode: '', qty: '', serialText: '' },
    ])
    setActiveLineNo(lineNo)
  }
  const removeDraft = (lineNo: number, id: string) =>
    setLineDrafts(
      lineNo,
      draftsOf(lineNo).filter((d) => d.id !== id),
    )

  /** 扫到的码对应本单哪一行：SKU 编码、主条码、货主条码表都认；同商品多批次时先给还没填好的那行 */
  const resolveLine = (code: string) => {
    const key = code.toUpperCase()
    const ownerBarcode = skuBarcodes.find(
      (b) => b.barcode.toUpperCase() === key && b.ownerCode === ownerCode && b.status === 'ENABLED',
    )
    const matches = order.planLines.filter(
      (line) =>
        line.skuCode.toUpperCase() === key ||
        barcodeOf(line)?.toUpperCase() === key ||
        ownerBarcode?.skuCode === line.skuCode,
    )
    const open = matches.filter((l) => remainingQty(order, l.lineNo) > 0)
    return {
      matched: matches[0],
      line: open.find((l) => lineProblem(order, l, draftsOf(l.lineNo), isSerialLine)) ?? open[0],
    }
  }

  /** 一个扫码框认两种码：商品条码选中一行；库位条码填进选中行（没选中时填给推荐到这个库位、还没填的第一行） */
  const onScan = () => {
    const code = scanValue.trim()
    if (!code) return
    const { matched, line } = resolveLine(code)
    if (matched) {
      if (!line) {
        scanResult(false, {
          tone: 'warning',
          title: t('putaway.entry.prompt.doneLineTitle', { name: labelOf(matched) }),
          detail: t('putaway.entry.prompt.doneLineDetail', { qty: recordedQty(order, matched.lineNo) }),
        })
        return
      }
      setActiveLineNo(line.lineNo)
      scanResult(true)
      return
    }

    const location = findLocation(putaway.locationContext.locations, order.warehouseCode, code)
    if (!location) {
      scanResult(false, {
        tone: 'error',
        title: t('putaway.entry.prompt.missTitle', { code }),
        detail: t('putaway.entry.prompt.missDetail'),
      })
      return
    }
    const target =
      activeLine && draftsOf(activeLine.lineNo).length > 0
        ? activeLine
        : order.planLines.find(
            (l) =>
              draftsOf(l.lineNo).some((d) => !d.locationCode.trim()) &&
              suggestionOf(l)?.toUpperCase() === location.code.toUpperCase(),
          )
    if (!target) {
      scanResult(false, {
        tone: 'error',
        title: t('putaway.entry.prompt.pickFirstTitle'),
        detail: t('putaway.entry.prompt.pickFirstDetail', { location: location.code }),
      })
      return
    }
    const error = validatePutawayLocation(order, location.code, putaway.locationContext)
    if (error) {
      setActiveLineNo(target.lineNo)
      scanResult(false, {
        tone: 'error',
        title: t('putaway.entry.prompt.badLocationTitle', { location: location.code }),
        detail: t(error),
      })
      return
    }
    const rows = draftsOf(target.lineNo)
    const slot = rows.find((d) => !d.locationCode.trim()) ?? rows[0]
    setEdited((prev) => ({
      ...prev,
      [target.lineNo]: rows.map((d) => (d.id === slot.id ? { ...d, locationCode: location.code } : d)),
    }))
    setFailedDraftId(undefined)
    // 填完这一行就放开选中：下一枪扫商品选下一行，或直接再扫库位填给推荐到那里的下一行
    setActiveLineNo(undefined)
    scanResult(true, {
      tone: 'success',
      title: t('putaway.entry.prompt.filledTitle', { name: labelOf(target), location: location.code }),
      detail: t('putaway.entry.prompt.filledDetail'),
    })
  }

  const defaultPrompt: WorkbenchPromptState = activeLine
    ? {
        tone: 'info',
        title: t('putaway.entry.prompt.scanLocationTitle'),
        detail: suggestionOf(activeLine)
          ? t('putaway.entry.prompt.scanLocationDetail', {
              name: labelOf(activeLine),
              qty: remainingQty(order, activeLine.lineNo),
              location: suggestionOf(activeLine),
            })
          : t('putaway.entry.prompt.scanLocationNoSuggest', {
              name: labelOf(activeLine),
              qty: remainingQty(order, activeLine.lineNo),
            }),
      }
    : problem
      ? { tone: 'info', title: t('putaway.entry.prompt.scanSkuTitle'), detail: t('putaway.entry.prompt.scanSkuDetail') }
      : {
          tone: 'success',
          title: t('putaway.entry.prompt.readyTitle'),
          detail: t('putaway.entry.prompt.readyDetail', { count: total, locations: groups.length }),
        }

  /** 业务阻断：弹窗写清原因，必须点「知道了」；弹窗打开时扫码框让出焦点，避免扫描枪的回车重复触发 */
  const block = async (title: string, description: string) => {
    setFlash((f) => ({ ok: false, key: (f?.key ?? 0) + 1 }))
    scanRef.current?.blur()
    await confirm({ title, description, hideCancel: true, confirmText: t('pda.gotIt') })
    refocusScan()
  }

  const confirmPutaway = async () => {
    if (problem) return
    const placements = entryPlacements(order, drafts, isSerialLine)
    scanRef.current?.blur()
    const ok = await confirm({
      title: t('putaway.entry.confirmTitle', { no: order.putawayNo }),
      description: t('putaway.entry.confirmDesc', { count: total, locations: groups.length }),
      confirmText: t('putaway.entry.confirm', { count: total }),
    })
    if (!ok) {
      refocusScan()
      return
    }
    const res = putaway.confirmPutawayEntry({ putawayNo: order.putawayNo, placements, operator })
    if (!res.ok) {
      const reason = t(res.errorKey, res.params)
      const failed = res.failedIndex === undefined ? undefined : placements[res.failedIndex]
      const line = failed && lineOf(failed.planLineNo)
      const message =
        failed && line
          ? t('putaway.entry.failedAt', { sku: labelOf(line), location: failed.locationCode.toUpperCase(), reason })
          : reason
      // 出错定位：切到出问题的行，库位框标红；已填内容全部保留
      setFailedDraftId(failed?.draftId)
      setActiveLineNo(line ? line.lineNo : undefined)
      setFeedback({ tone: 'error', title: message })
      await block(t('putaway.entry.failTitle'), message)
      return
    }
    toast.success(t('putaway.entry.confirmSuccess', { no: order.putawayNo }))
    navigate(`/wms/inbound/putaway/${order.putawayNo}`, { replace: true, state: { listSearch } })
  }

  const undoSaved = async (actual: PutawayActualLine) => {
    scanRef.current?.blur()
    const ok = await confirm({
      title: t('pdaPutaway.undoTitle'),
      description: t('pdaPutaway.undoDesc', { location: actual.locationCode, sku: actual.skuCode, qty: actual.qty }),
      confirmText: t('pdaPutaway.undo'),
      variant: 'destructive',
    })
    if (ok) {
      const res = putaway.removePutawayLine({ putawayNo: order.putawayNo, actualLineNo: actual.lineNo, operator })
      setFeedback(res.ok ? undefined : { tone: 'error', title: t(res.errorKey) })
    }
    refocusScan()
  }

  /** 表格里的输入框回车：回到扫码框（作业台焦点规则） */
  const enterToScan = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    refocusScan()
  }

  /** 手输的库位：回车或离开输入框时按扫码同一套规则校验，不能放就当场标红、提示条写原因，不用等到确认才发现 */
  const checkTypedLocation = (line: PutawayPlanLine, draft: EntryDraft) => {
    const code = draft.locationCode.trim()
    if (!code) return
    const error = validatePutawayLocation(order, code, putaway.locationContext)
    if (!error) return
    setFailedDraftId(draft.id)
    setActiveLineNo(line.lineNo)
    setFlash((f) => ({ ok: false, key: (f?.key ?? 0) + 1 }))
    setFeedback({
      tone: 'error',
      title: t('putaway.entry.prompt.badLocationTitle', { location: code.toUpperCase() }),
      detail: t(error),
    })
  }

  return (
    <PageContainer
      fill
      title={
        <DetailTitle
          title={t('putaway.entry.title')}
          code={<DocNoTail value={order.putawayNo} className="text-base" />}
          status={putawayOrderStatusMeta[order.status]}
        />
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={`/wms/inbound/putaway/${order.putawayNo}`} state={{ listSearch }}>
              {t('putaway.entry.backToDetail')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => navigate('/pda/putaway', { state: { putawayNo: order.putawayNo } })}>
            {t('putaway.openPda')}
          </Button>
        </>
      }
    >
      <div className={wl.root}>
        <div className={wl.grid}>
          <Panel className={wl.main}>
            <WorkbenchCurrent
              icon={order.containerNo ? Box : Package}
              label={t('inbound.workContainerNo')}
              extra={
                <div className="flex min-w-0 flex-col items-end gap-1 text-sm text-muted-foreground">
                  <CodeName
                    code={ownerCode}
                    name={customerName(order.customerId)}
                    className="max-w-full text-base text-foreground"
                  />
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <TagLabel meta={qualityMeta[order.qualityType]} />
                    {t('putaway.entry.contextSummary', { skus: skuKindCount(order), qty: total })}
                  </span>
                </div>
              }
            >
              {order.containerNo ? (
                <BizCode className="text-2xl">{order.containerNo}</BizCode>
              ) : (
                t('putaway.noContainer')
              )}
            </WorkbenchCurrent>

            <WorkbenchPrompt prompt={feedback ?? defaultPrompt} />

            <ScanField
              inputRef={scanRef}
              flash={flash}
              className="min-w-0 w-full"
              placeholder={t('putaway.entry.scanPlaceholder')}
              value={scanValue}
              onChange={setScanValue}
              onEnter={onScan}
            />

            <div className={wt.scroll}>
              <table className={wt.table} style={{ minWidth: TABLE_MIN_WIDTH }}>
                <colgroup>
                  <col style={{ width: WORKBENCH_PRODUCT_COL_WIDTH }} />
                  <col />
                  <col style={{ width: COL.remaining }} />
                  <col style={{ width: COL.location }} />
                  <col style={{ width: COL.qty }} />
                  <col style={{ width: COL.actions }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className={cn(wt.th, wt.stickyFirstHead)}>{t('workbench.productCode')}</th>
                    <th className={wt.th}>{t('workbench.productName')}</th>
                    <th className={wt.th}>{t('putaway.entry.remaining')}</th>
                    <th className={wt.th}>{t('putaway.entry.location')}</th>
                    <th className={wt.th}>{t('putaway.entry.qty')}</th>
                    <th className={cn(wt.th, 'px-1.5')}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.planLines.map((line) => {
                    const rows = draftsOf(line.lineNo)
                    const serial = isSerialLine(line)
                    const active = activeLineNo === line.lineNo
                    const saved = recordedQty(order, line.lineNo)
                    const suggestion = suggestionOf(line)
                    const label = labelOf(line)
                    const select = () => setActiveLineNo(line.lineNo)
                    const rowClass = cn(active && wt.rowActive)
                    /** 商品、名称、待上架只在本组第一行出现，纵向跨整组（含序列号行） */
                    const span = Math.max(1, rows.length * (serial ? 2 : 1))
                    const groupCells = (
                      <>
                        <td rowSpan={span} className={cn(wt.td, wt.stickyFirst, active && wt.rowActiveBar)}>
                          <WorkbenchProductCode barcode={barcodeOf(line)} sku={line.skuCode}>
                            {line.batchNo && (
                              <span className="text-sm text-muted-foreground">
                                {t('putaway.batchNo')} {line.batchNo}
                              </span>
                            )}
                          </WorkbenchProductCode>
                        </td>
                        <td rowSpan={span} className={wt.td}>
                          <WorkbenchProductName name={nameOf(line)} />
                        </td>
                        <td rowSpan={span} className={wt.td}>
                          <Num value={remainingQty(order, line.lineNo)} className="text-xl font-semibold" />
                          {saved > 0 && (
                            <div className="text-sm text-muted-foreground">
                              {t('putaway.entry.pdaSaved', { count: saved })}
                            </div>
                          )}
                        </td>
                      </>
                    )

                    if (rows.length === 0) {
                      return (
                        <tr key={line.lineNo} className={rowClass} onClick={select}>
                          {groupCells}
                          <td colSpan={3} className={cn(wt.td, 'text-muted-foreground')}>
                            {t('putaway.entry.allSavedByPda')}
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <Fragment key={line.lineNo}>
                        {rows.map((draft, i) => (
                          <Fragment key={draft.id}>
                            <tr className={rowClass} onClick={select}>
                              {i === 0 && groupCells}
                              <td className={cn(wt.td, i > 0 && wt.tdSub)}>
                                <LocationInput
                                  value={draft.locationCode}
                                  suggestion={suggestion}
                                  invalid={failedDraftId === draft.id}
                                  label={`${label} ${t('putaway.entry.location')}`}
                                  onChange={(value) => updateDraft(line.lineNo, draft.id, { locationCode: value })}
                                  onUseSuggestion={() => {
                                    if (suggestion) updateDraft(line.lineNo, draft.id, { locationCode: suggestion })
                                  }}
                                  onFocus={select}
                                  onBlur={() => checkTypedLocation(line, draft)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') checkTypedLocation(line, draft)
                                    enterToScan(e)
                                  }}
                                />
                              </td>
                              <td className={cn(wt.td, i > 0 && wt.tdSub)}>
                                <Input
                                  inputMode="numeric"
                                  aria-label={`${label} ${t('putaway.entry.qty')}`}
                                  value={draft.qty}
                                  autoComplete="off"
                                  className="h-11 text-lg tabular-nums"
                                  onChange={(e) =>
                                    updateDraft(line.lineNo, draft.id, { qty: e.target.value.replace(/[^\d]/g, '') })
                                  }
                                  onFocus={(e) => {
                                    e.currentTarget.select()
                                    select()
                                  }}
                                  onKeyDown={enterToScan}
                                />
                              </td>
                              <td className={cn(wt.td, 'px-1.5', i > 0 && wt.tdSub)}>
                                {i === 0 ? (
                                  <ActionLink onClick={() => splitLine(line.lineNo)}>
                                    {t('putaway.entry.split')}
                                  </ActionLink>
                                ) : (
                                  <ActionLink danger onClick={() => removeDraft(line.lineNo, draft.id)}>
                                    {t('common.remove')}
                                  </ActionLink>
                                )}
                              </td>
                            </tr>
                            {serial && (
                              <tr className={rowClass} onClick={select}>
                                <td colSpan={3} className={cn(wt.td, wt.tdSub)}>
                                  <Textarea
                                    rows={2}
                                    aria-label={`${label} ${t('putaway.serialNos')}`}
                                    value={draft.serialText}
                                    placeholder={t('putaway.entry.serialPlaceholder', { count: draftQty(draft) ?? 0 })}
                                    className="min-h-0 text-base"
                                    onChange={(e) => updateDraft(line.lineNo, draft.id, { serialText: e.target.value })}
                                    onFocus={select}
                                  />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <SummaryCard size="lg" className={wl.aside} title={t('putaway.entry.summaryTitle')}>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm text-muted-foreground">
                <span>{t('putaway.entry.progressLines', { filled: filledLines, total: order.planLines.length })}</span>
                <span className="tabular-nums">{t('putaway.entry.progressQty', { done: filled, total })}</span>
              </div>
              <Progress value={total > 0 ? (filled / total) * 100 : 0} className="h-1.5" />
            </div>

            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-t px-1 pt-4">
              {groups.map((group) => (
                <div key={group.location} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <BizCode className="text-base font-semibold">{group.location}</BizCode>
                    {group.items.every((item) => {
                      const line = lineOf(item.planLineNo)
                      return !line || suggestionOf(line)?.toUpperCase() !== group.location
                    }) && <TagLabel tone="orange">{t('putaway.entry.notSuggested')}</TagLabel>}
                  </div>
                  {group.items.map((item, i) => {
                    const line = lineOf(item.planLineNo)
                    const name = line ? labelOf(line) : ''
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-3 text-base">
                          <span className="min-w-0 truncate" title={name}>
                            {name}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">× {item.qty}</span>
                        </div>
                        {/* PDA 已保存的落位：标记和撤销放第二行，不和名称抢宽度 */}
                        {item.saved && (
                          <div className="flex items-center gap-2">
                            <TagLabel>{t('putaway.entry.pdaSavedTag')}</TagLabel>
                            <ActionLink danger onClick={() => void undoSaved(item.saved!)}>
                              {t('putaway.entry.undo')}
                            </ActionLink>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              {pending.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-base font-medium text-warning-text">{t('putaway.entry.pending')}</div>
                  {pending.map((item) => {
                    const line = lineOf(item.planLineNo)
                    const name = line ? labelOf(line) : ''
                    return (
                      <div key={item.planLineNo} className="flex items-center justify-between gap-3 text-base">
                        <span className="min-w-0 truncate" title={name}>
                          {name}
                        </span>
                        {item.qty > 0 && <span className="shrink-0 font-medium tabular-nums">× {item.qty}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              {problem && <p className="text-sm text-warning-text">{problemText(problem)}</p>}
              <Button
                className="h-12 w-full text-base"
                disabled={Boolean(problem)}
                onClick={() => void confirmPutaway()}
              >
                {t('putaway.entry.confirm', { count: total })}
              </Button>
            </div>
          </SummaryCard>
        </div>
      </div>
    </PageContainer>
  )
}

/**
 * 库位框：没填时灰字显示推荐库位，右侧「用推荐」一点就填；填的和推荐一样打绿勾；
 * 改放别的库位时框变橙、下面写出推荐库位，方便核对。
 */
function LocationInput({
  value,
  suggestion,
  invalid,
  label,
  onChange,
  onUseSuggestion,
  onFocus,
  onBlur,
  onKeyDown,
}: {
  value: string
  suggestion?: string
  invalid: boolean
  label: string
  onChange: (value: string) => void
  onUseSuggestion: () => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const { t } = useTranslation()
  const typed = value.trim().toUpperCase()
  const same = Boolean(suggestion && typed === suggestion.toUpperCase())
  const differs = Boolean(suggestion && typed && !same)
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Input
          value={value}
          aria-label={label}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          placeholder={
            suggestion
              ? t('putaway.entry.suggestedPlaceholder', { location: suggestion })
              : t('putaway.entry.locationPlaceholder')
          }
          className={cn(
            'h-11 text-lg text-ellipsis tabular-nums placeholder:text-base',
            suggestion && !typed && 'pr-13',
            same && 'pr-9',
            differs && 'border-warning',
          )}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.select()
            onFocus()
          }}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        {suggestion && !typed && (
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={onUseSuggestion}
          >
            {t('putaway.entry.useSuggestion')}
          </button>
        )}
        {same && (
          <Check
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-success-text"
          />
        )}
      </div>
      {differs && (
        <span className="text-sm text-warning-text">{t('putaway.entry.suggested', { location: suggestion })}</span>
      )}
    </div>
  )
}
