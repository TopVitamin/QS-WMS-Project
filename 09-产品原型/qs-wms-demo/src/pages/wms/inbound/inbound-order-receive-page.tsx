import { Box, Package, Plus, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, CodeName, DocNoTail, Num } from '@/components/biz/display'
import { DetailTitle, PageContainer, Panel } from '@/components/biz/page-container'
import { ScanField, type ScanFlash } from '@/components/biz/scan-field'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics } from '@/components/biz/summary-card'
import { WorkbenchCurrent, WorkbenchPrompt, type WorkbenchPromptState } from '@/components/biz/workbench'
import { Button } from '@/components/ui/button'
import { inboundOrderStatusMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useInbound } from '@/hooks/use-inbound'
import { canReceiveInbound, lineUnreceivedQty } from '@/lib/inbound-derive'
import {
  applyReceiveDraftChange,
  defaultReceiveDraft,
  emptyReceiveDraft,
  receiveDraftActivity,
  type InboundReceiveDraft,
  type ReceiveQtyField,
} from '@/lib/inbound-receive'
import { isWorkContainerUsedOnInbound } from '@/lib/inbound-receipt-container'
import { isNewSku } from '@/lib/new-sku'
import { cn } from '@/lib/utils'
import { workbenchLayout as wl } from '@/lib/workbench-styles'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import {
  boxKeyOf,
  EMPTY_WEB_RECEIVE_SESSION,
  useWebReceiveSession,
  type WebReceiveBox,
  type WebReceiveSession,
} from '@/stores/web-receive-session'
import type { ReceiptContainerInput } from '@/types/inbound'
import { InboundReceiveLineForm } from './inbound-receive-line-form'
import { NewSkuMeasureDialog } from './new-sku-measure-dialog'

/** 容器里有录入数量的 SKU */
const activeEdits = (box: WebReceiveBox) =>
  Object.entries(box.edits).filter(([, edit]) => receiveDraftActivity(edit) > 0)

/** 容器已录件数（实收 + 拒收） */
const boxQty = (box: WebReceiveBox) => activeEdits(box).reduce((s, [, e]) => s + receiveDraftActivity(e), 0)

/** 切走时丢掉没录任何数量的容器，避免列表里堆空容器 */
const dropIfEmpty = (session: WebReceiveSession, key?: string): WebReceiveBox[] =>
  session.boxes.filter((b) => b.key !== key || activeEdits(b).length > 0)

/**
 * 管理端收货作业台（作业台规范见 docs/04-作业台设计规范.md）：
 * 提示条告诉作业员现在该做什么、刚才发生了什么；扫码框始终拿着焦点；
 * 扫错红闪 + 低音，业务阻断用「知道了」弹窗，toast 只在离开页面时用。
 */
export function InboundOrderReceivePage() {
  const { t, i18n } = useTranslation()
  const { inboundNo = '' } = useParams<{ inboundNo: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const { getOrder, submitReceipt } = useInbound()
  const receiptRecords = useDb((s) => s.receiptRecords)
  const bindContainer = useDb((s) => s.bindContainer)
  const { customerCode, customerName, sku } = useLookups()
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const skuMasters = useDb((s) => s.skuMasters)
  const newSkuRecords = useDb((s) => s.newSkuRecords)
  const session = useWebReceiveSession((s) => s.sessions[inboundNo] ?? EMPTY_WEB_RECEIVE_SESSION)
  const updateSession = useWebReceiveSession((s) => s.update)
  const clearSession = useWebReceiveSession((s) => s.clear)

  const order = inboundNo ? getOrder(inboundNo) : undefined
  const ownerCode = order ? customerCode(order.customerId) : ''
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backToList = listSearch ? `/wms/inbound/orders?${listSearch}` : '/wms/inbound/orders'

  const scanRef = useRef<HTMLInputElement>(null)
  const [scanValue, setScanValue] = useState('')
  const [activeSku, setActiveSku] = useState<string>()
  const [measureSku, setMeasureSku] = useState<string>()
  const [flash, setFlash] = useState<ScanFlash>()
  /** 最近一次操作的结果；为空时显示当前步骤的默认提示 */
  const [feedback, setFeedback] = useState<WorkbenchPromptState>()
  // 结果文案在发生时已翻译好；切换语言时清掉，回到按当前语言渲染的默认提示
  const [feedbackLang, setFeedbackLang] = useState(i18n.language)
  if (feedbackLang !== i18n.language) {
    setFeedbackLang(i18n.language)
    setFeedback(undefined)
  }

  const openLines = useMemo(() => (order ? order.items.filter((line) => lineUnreceivedQty(line) > 0) : []), [order])
  const activeBox = session.boxes.find((b) => b.key === session.activeKey)
  const containerReady = Boolean(activeBox)
  const update = (fn: (s: WebReceiveSession) => WebReceiveSession) => updateSession(inboundNo, fn)

  /** 其他容器已录的同 SKU 数量与本容器可收（R04：本次各容器合计不得超过未收） */
  const { otherQty, limits } = useMemo(() => {
    const other: Record<string, number> = {}
    const limit: Record<string, number> = {}
    for (const line of openLines) {
      other[line.skuCode] = session.boxes
        .filter((b) => b.key !== session.activeKey)
        .reduce((s, b) => s + receiveDraftActivity(b.edits[line.skuCode] ?? emptyReceiveDraft()), 0)
      limit[line.skuCode] = Math.max(0, lineUnreceivedQty(line) - other[line.skuCode])
    }
    return { otherQty: other, limits: limit }
  }, [openLines, session])

  const totals = useMemo(() => {
    const edits = session.boxes.flatMap((b) => activeEdits(b).map(([, e]) => e))
    return {
      containers: session.boxes.filter((b) => activeEdits(b).length > 0).length,
      good: edits.reduce((s, e) => s + e.goodQty, 0),
      defect: edits.reduce((s, e) => s + e.defectQty, 0),
      rejected: edits.reduce((s, e) => s + e.rejectedQty, 0),
    }
  }, [session])

  const boxLabel = (box: WebReceiveBox) => (box.bulkPiece ? t('inbound.bulkPiece') : (box.containerNo ?? ''))
  /** 提示里用商品名称指认商品（作业员认名称和条码，SKU 编码是辅助） */
  const skuLabel = (code: string) => sku(code)?.name ?? code

  /** 作业后把焦点拉回扫码框，扫描枪的下一枪不丢 */
  const refocusScan = () => requestAnimationFrame(() => scanRef.current?.focus())

  const scanResult = (ok: boolean, prompt: WorkbenchPromptState) => {
    setFlash((f) => ({ ok, key: (f?.key ?? 0) + 1 }))
    setFeedback(prompt)
    setScanValue('')
    refocusScan()
  }

  /** 业务阻断：弹窗写清原因和下一步，必须点「知道了」 */
  const block = async (title: string, description: string) => {
    setFlash((f) => ({ ok: false, key: (f?.key ?? 0) + 1 }))
    // 弹窗不抢焦点（防止扫描枪的回车误点「知道了」），扫码框也要让出焦点，避免回车重复触发
    scanRef.current?.blur()
    await confirm({ title, description, hideCancel: true, confirmText: t('pda.gotIt') })
    setScanValue('')
    refocusScan()
  }

  const defaultPrompt: WorkbenchPromptState = activeBox
    ? { tone: 'info', title: t('inbound.receive.prompt.scanTitle'), detail: t('inbound.receive.prompt.scanDetail') }
    : session.boxes.length
      ? {
          tone: 'warning',
          title: t('inbound.receive.prompt.nextTitle'),
          detail: t('inbound.receive.prompt.nextDetail', { count: session.boxes.length }),
        }
      : {
          tone: 'warning',
          title: t('inbound.receive.prompt.bindTitle'),
          detail: t('inbound.receive.prompt.bindDetail'),
        }

  const overPrompt = (skuCode: string, max: number): WorkbenchPromptState => ({
    tone: 'error',
    title: t('inbound.receive.prompt.overTitle', { sku: skuLabel(skuCode) }),
    detail: t('inbound.receive.prompt.overDetail', {
      max,
      remain: lineUnreceivedQty(openLines.find((l) => l.skuCode === skuCode)!),
      other: otherQty[skuCode] ?? 0,
    }),
  })

  const setActiveEdit = (skuCode: string, edit: InboundReceiveDraft | undefined) =>
    update((s) => ({
      ...s,
      boxes: s.boxes.map((b) => {
        if (b.key !== s.activeKey) return b
        const edits = { ...b.edits }
        if (edit) edits[skuCode] = edit
        else delete edits[skuCode]
        return { ...b, edits }
      }),
    }))

  /** 扫箱号 / 选无容器收货：本次已有就切过去，没有就新增，并设为当前容器 */
  const openBox = (input: { containerNo?: string; bulkPiece: boolean }) => {
    if (!order) return
    const containerNo = input.containerNo?.trim()
    if (!input.bulkPiece && !containerNo) {
      scanResult(false, { tone: 'error', title: t('inbound.receive.prompt.containerEmptyTitle') })
      return
    }
    if (!input.bulkPiece && containerNo && isWorkContainerUsedOnInbound(receiptRecords, inboundNo, containerNo)) {
      void block(t('inbound.receive.prompt.usedTitle', { no: containerNo }), t('inbound.receive.prompt.usedDetail'))
      return
    }
    if (!input.bulkPiece && containerNo) {
      const bound = bindContainer({
        warehouseCode: order.warehouseCode,
        customerId: order.customerId,
        containerNo,
        operator,
      })
      if (!bound.ok) {
        void block(t('inbound.receive.prompt.containerBlockedTitle'), t(bound.errorKey, bound.params))
        return
      }
    }
    const key = boxKeyOf(containerNo, input.bulkPiece)
    const existing = session.boxes.find((b) => b.key === key)
    update((s) => {
      const boxes = dropIfEmpty(s, s.activeKey === key ? undefined : s.activeKey)
      return {
        activeKey: key,
        boxes: boxes.some((b) => b.key === key)
          ? boxes
          : [
              ...boxes,
              { key, containerNo: input.bulkPiece ? undefined : containerNo, bulkPiece: input.bulkPiece, edits: {} },
            ],
      }
    })
    setActiveSku(undefined)
    const label = input.bulkPiece ? t('inbound.bulkPiece') : (containerNo ?? '')
    scanResult(
      true,
      existing
        ? {
            tone: 'success',
            title: t('inbound.receive.prompt.switchedTitle', { no: label }),
            detail: t('inbound.receive.prompt.switchedDetail', { qty: boxQty(existing) }),
          }
        : {
            tone: 'success',
            title: t('inbound.receive.prompt.boundTitle', { no: label }),
            detail: t('inbound.receive.prompt.scanDetail'),
          },
    )
  }

  /** 新增容器：当前容器留在本次收货里，扫码框回到扫箱号 */
  const startNextContainer = () => {
    update((s) => ({ boxes: dropIfEmpty(s, s.activeKey), activeKey: undefined }))
    setActiveSku(undefined)
    setScanValue('')
    setFeedback(undefined)
    refocusScan()
  }

  const removeBox = async (box: WebReceiveBox) => {
    if (activeEdits(box).length > 0) {
      const ok = await confirm({
        title: t('inbound.receive.removeContainer'),
        description: t('inbound.receive.removeContainerConfirm', { no: boxLabel(box) }),
        variant: 'destructive',
      })
      if (!ok) return
    }
    update((s) => ({
      boxes: s.boxes.filter((b) => b.key !== box.key),
      activeKey: s.activeKey === box.key ? undefined : s.activeKey,
    }))
    if (session.activeKey === box.key) setActiveSku(undefined)
    setFeedback(undefined)
    refocusScan()
  }

  const changeQty = (skuCode: string, field: ReceiveQtyField, value: number) => {
    if (!activeBox) return
    const limit = limits[skuCode] ?? 0
    const res = applyReceiveDraftChange(activeBox.edits[skuCode] ?? emptyReceiveDraft(), field, value, limit)
    if (!res.ok) {
      scanResult(false, overPrompt(skuCode, limit))
      return
    }
    setFeedback(undefined)
    setActiveEdit(skuCode, res.draft)
  }

  const selectSku = (skuCode: string) => {
    if (!activeBox) return
    setActiveSku(skuCode)
    const limit = limits[skuCode] ?? 0
    // 首次选中按本容器可收预填良品（相当于「全部记为良品」）
    if (!activeBox.edits[skuCode] && limit > 0) setActiveEdit(skuCode, defaultReceiveDraft(limit))
  }

  const resolveSkuFromScan = (raw: string) => {
    const code = raw.trim()
    if (!code) return undefined
    const bySku = openLines.find((l) => l.skuCode.toLowerCase() === code.toLowerCase())
    if (bySku) return bySku.skuCode
    const barcodeHit = skuBarcodes.find((b) => b.barcode === code && b.ownerCode === ownerCode)
    if (barcodeHit && openLines.some((l) => l.skuCode === barcodeHit.skuCode)) return barcodeHit.skuCode
    return openLines.find((l) => sku(l.skuCode)?.barcode === code)?.skuCode
  }

  /** 一个扫码框：没有当前容器时扫箱号，有当前容器时扫商品（良品 +1） */
  const onScan = () => {
    if (!activeBox) {
      openBox({ containerNo: scanValue, bulkPiece: false })
      return
    }
    const code = scanValue.trim()
    if (!code) return
    const hit = resolveSkuFromScan(code)
    if (!hit) {
      scanResult(false, {
        tone: 'error',
        title: t('inbound.receive.prompt.missTitle', { code }),
        detail: t('inbound.receive.prompt.missDetail'),
      })
      return
    }
    const limit = limits[hit] ?? 0
    const cur = activeBox.edits[hit] ?? emptyReceiveDraft()
    const res = applyReceiveDraftChange(cur, 'goodQty', cur.goodQty + 1, limit)
    if (!res.ok) {
      scanResult(false, overPrompt(hit, limit))
      return
    }
    setActiveSku(hit)
    setActiveEdit(hit, res.draft)
    scanResult(true, {
      tone: 'success',
      title: t('inbound.receive.prompt.bumpTitle', { sku: skuLabel(hit) }),
      detail: t('inbound.receive.prompt.bumpDetail', {
        qty: boxQty(activeBox) + 1,
        left: limit - receiveDraftActivity(res.draft),
      }),
    })
  }

  const onClearSession = async () => {
    const ok = await confirm({
      title: t('inbound.receive.clearSession'),
      description: t('inbound.receive.clearSessionConfirm'),
      variant: 'destructive',
    })
    if (!ok) return
    clearSession(inboundNo)
    setActiveSku(undefined)
    setFeedback(undefined)
    refocusScan()
  }

  const submit = () => {
    const openSkus = new Set(openLines.map((l) => l.skuCode))
    const containers: ReceiptContainerInput[] = []
    for (const box of session.boxes) {
      const lines = activeEdits(box).filter(([code]) => openSkus.has(code))
      if (!lines.length) continue
      const missingReason = lines.find(([, e]) => e.rejectedQty > 0 && !e.rejectReason)
      if (missingReason) {
        // 切到出问题的容器和行，作业员直接就能补
        const [code, edit] = missingReason
        update((s) => ({ ...s, activeKey: box.key }))
        setActiveSku(code)
        scanResult(false, {
          tone: 'error',
          title: t('inbound.receive.prompt.reasonTitle', {
            box: boxLabel(box),
            sku: skuLabel(code),
            qty: edit.rejectedQty,
          }),
          detail: t('inbound.receive.prompt.reasonDetail'),
        })
        return
      }
      containers.push({
        containerNo: box.containerNo,
        bulkPiece: box.bulkPiece,
        lines: lines.map(([code, e]) => ({
          skuCode: code,
          goodQty: e.goodQty,
          defectQty: e.defectQty,
          rejectedQty: e.rejectedQty,
          rejectReason: e.rejectReason,
          batchNo: e.batchNo?.trim() || undefined,
          productionDate: e.productionDate || undefined,
          expiryDate: e.expiryDate || undefined,
          goodSerialNos: e.goodSerialNos,
          defectSerialNos: e.defectSerialNos,
        })),
      })
    }
    if (!containers.length) {
      scanResult(false, {
        tone: 'error',
        title: t('inbound.receive.prompt.emptyTitle'),
        detail: t('inbound.receive.prompt.emptyDetail'),
      })
      return
    }
    const res = submitReceipt({ inboundNo, containers, operator })
    if (!res.ok) {
      void block(
        t('inbound.receive.prompt.submitFailTitle'),
        t('inbound.receive.prompt.submitFailDetail', { reason: t(res.errorKey, res.params) }),
      )
      return
    }
    const qty = containers.reduce((s, c) => s + c.lines.reduce((n, l) => n + l.goodQty + l.defectQty, 0), 0)
    clearSession(inboundNo)
    setActiveSku(undefined)
    scanResult(true, {
      tone: 'success',
      title: t('inbound.receive.prompt.submittedTitle', { count: containers.length, qty }),
      detail: t('inbound.receive.prompt.submittedDetail'),
    })
    const updated = getOrder(inboundNo)
    if (!updated?.items.some((line) => lineUnreceivedQty(line) > 0)) {
      // 整单收完要离开作业台，结果只能用 toast 带到列表页
      toast.success(t('inbound.receive.submittedMany', { count: containers.length }))
      toast.success(t('inbound.receive.doneAll'))
      navigate(backToList)
    }
  }

  if (!inboundNo || !order) return <Navigate to="/wms/inbound/orders" replace />
  if (order.warehouseCode !== warehouseCode) return <Navigate to={backToList} replace />
  if (!canReceiveInbound(order)) return <Navigate to={backToList} replace />

  const hasBulkBox = session.boxes.some((b) => b.bulkPiece)
  const remainTotal = openLines.reduce((s, l) => s + lineUnreceivedQty(l), 0)

  return (
    <PageContainer
      fill
      title={
        <DetailTitle
          title={t('inbound.receive.workbenchHeading')}
          code={<DocNoTail value={order.inboundNo} className="text-base" />}
          status={inboundOrderStatusMeta[order.status]}
        />
      }
      actions={
        <Button variant="outline" asChild>
          <Link to={backToList}>{t('inbound.backToList')}</Link>
        </Button>
      }
    >
      <div className={wl.root}>
        <div className={wl.grid}>
          <Panel className={wl.main}>
            {/* 单头上下文：作业只需要知道货主和还剩多少，柜号、运单号等去详情看 */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-base">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.customer')}</span>
                <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{t('inbound.receive.summarySkuKinds')}</span>
                <Num value={openLines.length} className="text-xl font-semibold" />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{t('inbound.receive.summaryRemainTotal')}</span>
                <Num value={remainTotal} className="text-xl font-semibold" />
              </span>
            </div>

            <WorkbenchPrompt prompt={feedback ?? defaultPrompt} />

            {activeBox && (
              <WorkbenchCurrent
                icon={activeBox.bulkPiece ? Package : Box}
                label={t('inbound.receive.currentContainer')}
                extra={
                  <Button variant="outline" className="h-10 px-4 text-base" onClick={startNextContainer}>
                    <Plus data-icon="inline-start" />
                    {t('inbound.receive.addContainer')}
                  </Button>
                }
              >
                {activeBox.bulkPiece ? (
                  t('inbound.bulkPiece')
                ) : (
                  <BizCode className="text-2xl">{activeBox.containerNo}</BizCode>
                )}
                <span className="ml-3 text-base font-normal text-muted-foreground">
                  {t('inbound.receive.boxSummary', { skus: activeEdits(activeBox).length, qty: boxQty(activeBox) })}
                </span>
              </WorkbenchCurrent>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <ScanField
                inputRef={scanRef}
                flash={flash}
                className="min-w-64 flex-1"
                placeholder={activeBox ? t('inbound.receive.scanSku') : t('inbound.receive.containerPlaceholder')}
                value={scanValue}
                onChange={setScanValue}
                onEnter={onScan}
              />
              {!activeBox && (
                <>
                  <Button className="h-14 px-6 text-base" onClick={onScan}>
                    {t('inbound.receive.bindAction')}
                  </Button>
                  {!hasBulkBox && (
                    <Button
                      variant="outline"
                      className="h-14 px-4 text-base"
                      onClick={() => openBox({ bulkPiece: true })}
                    >
                      <Package data-icon="inline-start" />
                      {t('inbound.bulkPiece')}
                    </Button>
                  )}
                </>
              )}
            </div>

            <InboundReceiveLineForm
              lines={openLines}
              edits={activeBox?.edits ?? {}}
              limits={limits}
              activeSku={activeSku}
              containerReady={containerReady}
              onSelectSku={selectSku}
              onQtyChange={changeQty}
              onReasonChange={(code, reason) => {
                if (!activeBox) return
                setActiveEdit(code, { ...(activeBox.edits[code] ?? emptyReceiveDraft()), rejectReason: reason })
                setFeedback(undefined)
              }}
              onMetaChange={(code, patch) => {
                if (!activeBox) return
                setActiveEdit(code, { ...(activeBox.edits[code] ?? emptyReceiveDraft()), ...patch })
                setFeedback(undefined)
              }}
              onClear={(code) => setActiveEdit(code, undefined)}
              onEnterDone={refocusScan}
              skuName={(code) => sku(code, order?.customerId)?.name}
              skuBarcode={(code) => sku(code, order?.customerId)?.barcode}
              skuConfig={(code) => {
                const master = skuMasters.find((m) => m.customerId === order?.customerId && m.code === code)
                return {
                  batchEnabled: master?.batchEnabled,
                  expiryEnabled: master?.expiryEnabled,
                  snEnabled: master?.snEnabled,
                  shelfLifeDays: master?.shelfLifeDays,
                }
              }}
              isNewSku={(code) => isNewSku(newSkuRecords, order?.customerId ?? '', code)}
              onGoMeasure={(code) => setMeasureSku(code)}
            />

            <NewSkuMeasureDialog
              open={!!measureSku}
              mode="receive"
              customerId={order?.customerId}
              skuCode={measureSku}
              sourceInboundNo={inboundNo}
              onClose={() => setMeasureSku(undefined)}
            />
          </Panel>

          {/* 本次收货：已录的容器一目了然，最后一起提交成一条收货记录 */}
          <SummaryCard
            size="lg"
            className={wl.aside}
            title={
              <span className="flex items-center gap-2">
                {t('inbound.receive.sessionTitle')}
                <TagLabel tone={session.boxes.length ? 'blue' : 'gray'}>{session.boxes.length}</TagLabel>
              </span>
            }
            description={t('inbound.receive.sessionHint')}
          >
            <div className="-mx-1 flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-1">
              {session.boxes.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <Box className="size-8 opacity-40" />
                  <p className="text-sm">{t('inbound.receive.sessionEmpty')}</p>
                </div>
              )}
              {session.boxes.map((box) => (
                <ContainerItem
                  key={box.key}
                  box={box}
                  label={boxLabel(box)}
                  active={box.key === session.activeKey}
                  onOpen={() => openBox({ containerNo: box.containerNo, bulkPiece: box.bulkPiece })}
                  onRemove={() => void removeBox(box)}
                />
              ))}
            </div>

            <SummaryMetrics
              size="lg"
              items={[
                { label: t('inbound.receive.sessionContainers'), value: totals.containers },
                { label: t('inbound.receive.sessionGoodQty'), value: totals.good, tone: 'green' },
                {
                  label: t('inbound.receive.sessionDefectQty'),
                  value: totals.defect,
                  tone: 'orange',
                  hidden: totals.defect === 0,
                },
                {
                  label: t('inbound.receive.totalRejected'),
                  value: totals.rejected,
                  tone: 'red',
                  hidden: totals.rejected === 0,
                },
              ]}
            />

            <div className="flex flex-col gap-2">
              <Button className="h-12 w-full text-base" disabled={totals.containers === 0} onClick={submit}>
                {t('inbound.receive.submitMany', { count: totals.containers })}
              </Button>
              {session.boxes.length > 0 && (
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => void onClearSession()}>
                  {t('inbound.receive.clearSession')}
                </Button>
              )}
            </div>
          </SummaryCard>
        </div>
      </div>
    </PageContainer>
  )
}

function ContainerItem({
  box,
  label,
  active,
  onOpen,
  onRemove,
}: {
  box: WebReceiveBox
  label: string
  active: boolean
  onOpen: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const lines = activeEdits(box)
  const qty = lines.reduce((s, [, e]) => s + e.goodQty + e.defectQty, 0)
  const rejected = lines.reduce((s, [, e]) => s + e.rejectedQty, 0)
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border pr-1 transition-colors',
        active ? 'border-primary bg-primary/5' : 'hover:bg-row-hover',
      )}
    >
      <button type="button" className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left" onClick={onOpen}>
        <Box className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold">
            {box.bulkPiece ? label : <BizCode className="text-base">{label}</BizCode>}
          </div>
          <div className="truncate text-sm text-muted-foreground">
            {lines.length
              ? t('inbound.receive.boxSummary', { skus: lines.length, qty })
              : t('inbound.receive.boxEmpty')}
            {rejected > 0 && (
              <span className="text-destructive"> · {t('inbound.receive.boxRejected', { count: rejected })}</span>
            )}
          </div>
        </div>
        {active && <TagLabel tone="blue">{t('inbound.receive.boxActive')}</TagLabel>}
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('inbound.receive.removeContainer')}
        className="text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X />
      </Button>
    </div>
  )
}
