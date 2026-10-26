import { Box, Package, Plus, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, CodeName, Empty, Num } from '@/components/biz/display'
import { FormField } from '@/components/biz/form-field'
import { PageContainer, Panel, Section } from '@/components/biz/page-container'
import { ScanField, type ScanFlash } from '@/components/biz/scan-field'
import { SummaryCard, SummaryMetrics } from '@/components/biz/summary-card'
import { WorkbenchCurrent, WorkbenchPrompt, type WorkbenchPromptState } from '@/components/biz/workbench'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OptionSelect } from '@/components/biz/option-select'
import { useConfirm } from '@/hooks/use-confirm'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { updateExpiryDatePair } from '@/lib/expiry-date'
import { isReturnSerialMismatch, isWorkContainerUsedOnReturn } from '@/mock/return-actions'
import {
  emptyReturnReceiveDraft,
  num,
  parseReturnSerialNos,
  returnDraftActivity,
  returnLineLimit,
  type ReturnReceiveDraft,
} from '@/lib/return-receive'
import { cn } from '@/lib/utils'
import { workbenchLayout as wl } from '@/lib/workbench-styles'
import { useDb, useLookups } from '@/mock/db'
import {
  returnBoxKey,
  returnSessionKey,
  EMPTY_RETURN_RECEIVE_SESSION,
  useReturnReceiveSession,
  type ReturnReceiveBox,
  type ReturnReceiveSession,
} from '@/stores/return-receive-session'
import { useSettings } from '@/stores/settings'
import {
  isOperatorSelectableReturnRejectReason,
  RETURN_OPERATOR_REJECT_REASONS,
  RETURN_REJECT_REASON_LABEL_KEYS,
  RETURN_REJECT_REASON,
  type ReturnReceiptContainerInput,
} from '@/types/return'

const activeDrafts = (box: ReturnReceiveBox) =>
  Object.entries(box.drafts).filter(([, d]) => returnDraftActivity(d) > 0)

const boxQty = (box: ReturnReceiveBox) =>
  activeDrafts(box).reduce((sum, [, d]) => sum + returnDraftActivity(d), 0)

const dropIfEmpty = (session: ReturnReceiveSession, key?: string): ReturnReceiveBox[] =>
  session.boxes.filter((box) => box.key !== key || activeDrafts(box).length > 0)

/** 管理端退货收货作业台：一次可收多个容器，最后提交成一条退货收货记录 */
export function ReturnReceivePage() {
  const { t } = useTranslation()
  const { returnNo } = useParams<{ returnNo: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const order = useDb((s) => s.returnOrders.find((o) => o.returnNo === returnNo))
  const masters = useDb((s) => s.skuMasters)
  const receiveReturn = useDb((s) => s.receiveReturn)
  const bindContainer = useDb((s) => s.bindContainer)
  const returnReceipts = useDb((s) => s.returnReceipts)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const outboundOrders = useDb((s) => s.outboundOrders)
  const outboundVerifications = useDb((s) => s.outboundVerifications)
  const outboundPickTasks = useDb((s) => s.outboundPickTasks)
  const { sku, customerCode, customerName } = useLookups()

  const hasSnMismatch = (lineNo: number, draft: ReturnReceiveDraft) => {
    const line = order?.items.find((item) => item.lineNo === lineNo)
    return Boolean(
      line &&
        order &&
        isReturnSerialMismatch(
          { outboundOrders, outboundVerifications, outboundPickTasks },
          order,
          line.skuCode,
          parseReturnSerialNos(draft.rejectedSerialNos),
        ),
    )
  }

  const sessionKey = returnSessionKey('web', warehouseCode, returnNo ?? '')
  const session = useReturnReceiveSession((s) => s.sessions[sessionKey] ?? EMPTY_RETURN_RECEIVE_SESSION)
  const updateSession = useReturnReceiveSession((s) => s.update)
  const clearSession = useReturnReceiveSession((s) => s.clear)

  const scanRef = useRef<HTMLInputElement>(null)
  const [scanValue, setScanValue] = useState('')
  const [activeLine, setActiveLine] = useState<number>()
  const [flash, setFlash] = useState<ScanFlash>()
  const [feedback, setFeedback] = useState<WorkbenchPromptState>()

  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backTo = listSearch ? `/wms/returns/orders?${listSearch}` : '/wms/returns/orders'
  const activeBox = session.boxes.find((b) => b.key === session.activeKey)

  const openLines = useMemo(
    () => (order ? order.items.filter((line) => line.plannedQty - line.receivedQty - line.rejectedQty > 0) : []),
    [order],
  )

  const { otherQty, limits } = useMemo(() => {
    const other: Record<number, number> = {}
    const limit: Record<number, number> = {}
    for (const line of openLines) {
      other[line.lineNo] = session.boxes
        .filter((b) => b.key !== session.activeKey)
        .reduce((sum, b) => sum + returnDraftActivity(b.drafts[line.lineNo] ?? emptyReturnReceiveDraft()), 0)
      limit[line.lineNo] = returnLineLimit(line, other[line.lineNo])
    }
    return { otherQty: other, limits: limit }
  }, [openLines, session])

  const totals = useMemo(() => {
    const drafts = session.boxes.flatMap((b) => activeDrafts(b).map(([, d]) => d))
    return {
      containers: session.boxes.filter((b) => activeDrafts(b).length > 0).length,
      good: drafts.reduce((sum, d) => sum + num(d.goodQty), 0),
      defect: drafts.reduce((sum, d) => sum + num(d.defectQty), 0),
      rejected: drafts.reduce((sum, d) => sum + num(d.rejectedQty), 0),
    }
  }, [session])

  if (!returnNo || !order) return <Navigate to={backTo} replace />
  if (order.warehouseCode !== warehouseCode) return <Navigate to={backTo} replace />
  if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
    return (
      <PageContainer title={t('return.receive.title')}>
        <Panel className="p-6 text-sm text-muted-foreground">
          {t(order.status === 'CANCELLED' ? 'return.receive.cancelled' : 'return.receive.completed')}
        </Panel>
      </PageContainer>
    )
  }

  const update = (fn: (s: ReturnReceiveSession) => ReturnReceiveSession) => updateSession(sessionKey, fn)
  const masterFor = (skuCode: string) => masters.find((m) => m.customerId === order.customerId && m.code === skuCode)
  const skuLabel = (code: string) => sku(code, order.customerId)?.name ?? code
  const refocusScan = () => requestAnimationFrame(() => scanRef.current?.focus())
  const scanResult = (ok: boolean, prompt: WorkbenchPromptState) => {
    setFlash((f) => ({ ok, key: (f?.key ?? 0) + 1 }))
    setFeedback(prompt)
    setScanValue('')
    refocusScan()
  }

  const boxLabel = (box: ReturnReceiveBox) => (box.bulkPiece ? t('inbound.bulkPiece') : (box.containerNo ?? ''))

  const setDraft = (lineNo: number, patch: Partial<ReturnReceiveDraft>) =>
    update((s) => ({
      ...s,
      boxes: s.boxes.map((box) =>
        box.key !== s.activeKey
          ? box
          : {
              ...box,
              drafts: {
                ...box.drafts,
                [lineNo]: { ...(box.drafts[lineNo] ?? emptyReturnReceiveDraft()), ...patch },
              },
            },
      ),
    }))

  const openBox = (input: { containerNo?: string; bulkPiece: boolean }) => {
    const containerNo = input.containerNo?.trim()
    if (!input.bulkPiece && !containerNo) {
      scanResult(false, { tone: 'error', title: t('return.receive.containerRequired') })
      return
    }
    if (
      !input.bulkPiece &&
      containerNo &&
      isWorkContainerUsedOnReturn(returnReceipts, order.returnNo, containerNo)
    ) {
      scanResult(false, {
        tone: 'error',
        title: t('return.receive.containerAlreadyUsed', { no: containerNo }),
      })
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
        scanResult(false, { tone: 'error', title: t(bound.errorKey, bound.params) })
        return
      }
    }
    const key = returnBoxKey(containerNo, input.bulkPiece)
    const existing = session.boxes.find((b) => b.key === key)
    update((s) => ({
      activeKey: key,
      boxes: dropIfEmpty(s, s.activeKey === key ? undefined : s.activeKey).some((b) => b.key === key)
        ? dropIfEmpty(s, s.activeKey === key ? undefined : s.activeKey)
        : [
            ...dropIfEmpty(s, s.activeKey === key ? undefined : s.activeKey),
            {
              key,
              containerNo: input.bulkPiece ? undefined : containerNo,
              bulkPiece: input.bulkPiece,
              drafts: {},
            },
          ],
    }))
    setActiveLine(undefined)
    scanResult(true, {
      tone: 'success',
      title: t('return.receive.containerBound', { no: input.bulkPiece ? t('inbound.bulkPiece') : containerNo }),
      detail: existing
        ? t('return.receive.containerSwitched', { qty: boxQty(existing) })
        : t('return.receive.scanSku'),
    })
  }

  const startNextContainer = () => {
    update((s) => ({ boxes: dropIfEmpty(s, s.activeKey), activeKey: undefined }))
    setActiveLine(undefined)
    setScanValue('')
    setFeedback(undefined)
    refocusScan()
  }

  const removeBox = async (box: ReturnReceiveBox) => {
    if (activeDrafts(box).length > 0) {
      const ok = await confirm({
        title: t('return.receive.removeContainer'),
        description: t('return.receive.removeContainerConfirm', { no: boxLabel(box) }),
        variant: 'destructive',
      })
      if (!ok) return
    }
    update((s) => ({
      boxes: s.boxes.filter((b) => b.key !== box.key),
      activeKey: s.activeKey === box.key ? undefined : s.activeKey,
    }))
    if (session.activeKey === box.key) setActiveLine(undefined)
    setFeedback(undefined)
    refocusScan()
  }

  const resolveSku = (raw: string) =>
    order
      ? resolveInboundSkuScan(
          raw,
          openLines.map((l) => l.skuCode),
          {
            ownerCode: customerCode(order.customerId),
            skuBarcodes,
            primaryBarcode: (code) => sku(code, order.customerId)?.barcode,
          },
        )
      : undefined

  const onScan = () => {
    if (!activeBox) {
      if (resolveSku(scanValue)) {
        scanResult(false, { tone: 'error', title: t('return.receive.scanContainerFirst') })
        return
      }
      openBox({ containerNo: scanValue, bulkPiece: false })
      return
    }
    const hit = resolveSku(scanValue)
    if (!hit) {
      scanResult(false, { tone: 'error', title: t('return.receive.skuNotInOrder') })
      return
    }
    const matchingLines = openLines.filter((candidate) => candidate.skuCode === hit)
    const line = activeLine
      ? matchingLines.find((candidate) => candidate.lineNo === activeLine)
      : matchingLines.length === 1
        ? matchingLines[0]
        : undefined
    if (!line) {
      scanResult(false, { tone: 'error', title: t('return.receive.selectPackageLine') })
      return
    }
    const limit = limits[line.lineNo] ?? 0
    if (limit <= 0) {
      scanResult(false, { tone: 'error', title: t('return.receive.overRemain') })
      return
    }
    const current = activeBox.drafts[line.lineNo] ?? emptyReturnReceiveDraft()
    setActiveLine(line.lineNo)
    setDraft(line.lineNo, { goodQty: String(num(current.goodQty) + 1) })
    scanResult(true, {
      tone: 'success',
      title: t('return.receive.scannedSku', { sku: skuLabel(hit) }),
      detail: t('return.receive.scannedSkuDetail', { left: Math.max(0, limit - returnDraftActivity(current) - 1) }),
    })
  }

  const submit = () => {
    const containers: ReturnReceiptContainerInput[] = []
    for (const box of session.boxes) {
      const drafts = activeDrafts(box)
      if (!drafts.length) continue
      const missingReason = drafts.find(
        ([lineNo, d]) =>
          num(d.rejectedQty) > 0 &&
          !isOperatorSelectableReturnRejectReason(d.rejectReason) &&
          !hasSnMismatch(Number(lineNo), d),
      )
      if (missingReason) {
        update((s) => ({ ...s, activeKey: box.key }))
        setActiveLine(missingReason[0] ? Number(missingReason[0]) : undefined)
        setFeedback({ tone: 'error', title: t('return.receive.rejectReasonRequired') })
        return
      }
      containers.push({
        containerNo: box.containerNo,
        bulkPiece: box.bulkPiece,
        lines: drafts.map(([lineNo, d]) => {
          const line = order.items.find((item) => item.lineNo === Number(lineNo))!
          return {
            returnLineNo: line.lineNo,
            skuCode: line.skuCode,
            goodQty: num(d.goodQty),
            defectQty: num(d.defectQty),
            rejectedQty: num(d.rejectedQty),
            rejectReason: hasSnMismatch(line.lineNo, d)
              ? RETURN_REJECT_REASON.SN_MISMATCH
              : isOperatorSelectableReturnRejectReason(d.rejectReason)
                ? d.rejectReason
                : undefined,
            batchNo: d.batchNo.trim() || undefined,
            productionDate: d.productionDate || undefined,
            expiryDate: d.expiryDate || undefined,
            goodSerialNos: parseReturnSerialNos(d.goodSerialNos),
            defectSerialNos: parseReturnSerialNos(d.defectSerialNos),
            rejectedSerialNos: parseReturnSerialNos(d.rejectedSerialNos),
          }
        }),
      })
    }
    if (!containers.length) {
      setFeedback({ tone: 'error', title: t('return.receive.empty') })
      return
    }
    const result = receiveReturn({ returnNo: order.returnNo, containers, operator })
    if (!result.ok) {
      setFeedback({ tone: 'error', title: t(result.errorKey, result.params) })
      return
    }
    toast.success(t('return.receive.success', { no: order.returnNo }))
    clearSession(sessionKey)
    navigate(`/wms/returns/orders/${order.returnNo}`, { replace: true })
  }

  const cleanDraft = (lineNo: number) => {
    if (!activeBox) return
    update((s) => ({
      ...s,
      boxes: s.boxes.map((box) => {
        if (box.key !== s.activeKey) return box
        const drafts = { ...box.drafts }
        delete drafts[lineNo]
        return { ...box, drafts }
      }),
    }))
  }

  const defaultPrompt: WorkbenchPromptState = activeBox
    ? { tone: 'info', title: t('return.receive.scanSku'), detail: t('return.receive.scanSkuHint') }
    : session.boxes.length
      ? { tone: 'warning', title: t('return.receive.nextContainer'), detail: t('return.receive.nextContainerHint') }
      : { tone: 'warning', title: t('return.receive.bindTitle'), detail: t('return.receive.bindHint') }

  const hasBulk = session.boxes.some((b) => b.bulkPiece)

  return (
    <PageContainer
      fill
      title={`${t('return.receive.title')} · ${order.returnNo}`}
      description={`${customerName(order.customerId)}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('return.backToList')}</Link>
          </Button>
          <Button onClick={submit} disabled={totals.containers === 0}>
            {t('return.receive.submitMany', { count: totals.containers })}
          </Button>
        </div>
      }
    >
      <div className={wl.root}>
        <div className={wl.grid}>
          <Panel className={wl.main}>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-base">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.customer')}</span>
                <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{t('return.originalOutboundNo')}</span>
                {order.originalOutboundNo ? <BizCode>{order.originalOutboundNo}</BizCode> : <Empty />}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{t('return.trackingNo')}</span>
                {order.trackingNo ? <BizCode>{order.trackingNo}</BizCode> : <Empty />}
              </span>
            </div>

            <WorkbenchPrompt prompt={feedback ?? defaultPrompt} />

            {activeBox && (
              <WorkbenchCurrent
                icon={activeBox.bulkPiece ? Package : Box}
                label={t('return.receive.currentContainer')}
                extra={
                  <Button variant="outline" className="h-10 px-4 text-base" onClick={startNextContainer}>
                    <Plus data-icon="inline-start" />
                    {t('return.receive.addContainer')}
                  </Button>
                }
              >
                {activeBox.bulkPiece ? t('inbound.bulkPiece') : <BizCode className="text-2xl">{activeBox.containerNo}</BizCode>}
                <span className="ml-3 text-base font-normal text-muted-foreground">
                  {t('return.receive.boxSummary', { skus: activeDrafts(activeBox).length, qty: boxQty(activeBox) })}
                </span>
              </WorkbenchCurrent>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <ScanField
                inputRef={scanRef}
                flash={flash}
                className="min-w-64 flex-1"
                placeholder={activeBox ? t('return.receive.scanSku') : t('return.receive.scanContainer')}
                value={scanValue}
                onChange={setScanValue}
                onEnter={onScan}
              />
              {!activeBox && (
                <>
                  <Button className="h-14 px-6 text-base" onClick={onScan}>
                    {t('return.receive.bindAction')}
                  </Button>
                  {!hasBulk && (
                    <Button variant="outline" className="h-14 px-4 text-base" onClick={() => openBox({ bulkPiece: true })}>
                      <Package data-icon="inline-start" />
                      {t('inbound.bulkPiece')}
                    </Button>
                  )}
                </>
              )}
            </div>

            {openLines.map((line) => {
              const draft = activeBox?.drafts[line.lineNo] ?? emptyReturnReceiveDraft()
              const master = masterFor(line.skuCode)
              const limit = limits[line.lineNo] ?? 0
              const dirty = returnDraftActivity(draft) > 0
              return (
                <Section
                  key={line.lineNo}
                  title={`${line.originalPackageNo ? `${t('return.receive.originalPackage')} ${line.originalPackageNo} · ` : ''}${line.skuCode} · ${skuLabel(line.skuCode)}`}
                  extra={
                    dirty ? (
                      <Button variant="ghost" size="sm" onClick={() => cleanDraft(line.lineNo)}>
                        {t('return.receive.clearLine')}
                      </Button>
                    ) : undefined
                  }
                >
                  <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {t('return.columns.plannedQty')} <Num value={line.plannedQty} />
                    </span>
                    <span>
                      {t('return.columns.receivedQty')} <Num value={line.receivedQty} />
                    </span>
                    <span>
                      {t('return.columns.rejectedQty')} <Num value={line.rejectedQty} />
                    </span>
                    <span className={cn(limit === 0 && 'text-destructive')}>
                      {t('return.receive.remaining')} <Num value={limit} />
                    </span>
                  </div>
                  <fieldset disabled={!activeBox} className="grid gap-3 md:grid-cols-4 disabled:opacity-60">
                    <FormField label={t('return.receive.good')}>
                      <Input
                        type="number"
                        min={0}
                        value={draft.goodQty}
                        placeholder={t('common.inputPlaceholder')}
                        onFocus={() => setActiveLine(line.lineNo)}
                        onChange={(e) => setDraft(line.lineNo, { goodQty: e.target.value })}
                      />
                    </FormField>
                    <FormField label={t('return.receive.defect')}>
                      <Input
                        type="number"
                        min={0}
                        value={draft.defectQty}
                        placeholder={t('common.inputPlaceholder')}
                        onFocus={() => setActiveLine(line.lineNo)}
                        onChange={(e) => setDraft(line.lineNo, { defectQty: e.target.value })}
                      />
                    </FormField>
                    <FormField label={t('return.receive.rejected')}>
                      <Input
                        type="number"
                        min={0}
                        value={draft.rejectedQty}
                        placeholder={t('common.inputPlaceholder')}
                        onFocus={() => setActiveLine(line.lineNo)}
                        onChange={(e) => setDraft(line.lineNo, { rejectedQty: e.target.value })}
                      />
                    </FormField>
                    {num(draft.rejectedQty) > 0 && (
                      <FormField label={t('return.receive.rejectReason')} required>
                        {hasSnMismatch(line.lineNo, draft) ? (
                          <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                            {t(RETURN_REJECT_REASON_LABEL_KEYS[RETURN_REJECT_REASON.SN_MISMATCH])}
                          </div>
                        ) : (
                          <OptionSelect
                            value={
                              isOperatorSelectableReturnRejectReason(draft.rejectReason)
                                ? draft.rejectReason
                                : undefined
                            }
                            onValueChange={(value) => setDraft(line.lineNo, { rejectReason: value })}
                            options={RETURN_OPERATOR_REJECT_REASONS.map((reason) => ({
                              value: reason,
                              label: t(RETURN_REJECT_REASON_LABEL_KEYS[reason]),
                            }))}
                            invalid={!isOperatorSelectableReturnRejectReason(draft.rejectReason)}
                          />
                        )}
                      </FormField>
                    )}
                    {master?.batchEnabled && (
                      <FormField label={t('inbound.batchNo')} required>
                        <Input
                          value={draft.batchNo}
                          placeholder={t('common.inputPlaceholder')}
                          required
                          onChange={(e) => setDraft(line.lineNo, { batchNo: e.target.value })}
                        />
                      </FormField>
                    )}
                    {master?.expiryEnabled && (
                      <>
                        <FormField label={t('inbound.productionDate')} required>
                          <Input
                            type="date"
                            required
                            value={draft.productionDate}
                            onChange={(e) =>
                              setDraft(
                                line.lineNo,
                                updateExpiryDatePair(draft, 'productionDate', e.target.value, master.shelfLifeDays),
                              )
                            }
                          />
                        </FormField>
                        <FormField label={t('inbound.expiryDate')} required>
                          <Input
                            type="date"
                            required
                            value={draft.expiryDate}
                            onChange={(e) =>
                              setDraft(line.lineNo, updateExpiryDatePair(draft, 'expiryDate', e.target.value, master.shelfLifeDays))
                            }
                          />
                        </FormField>
                        <p className="col-span-2 text-xs text-muted-foreground">{t('inventory.expiryDateCalculationHint')}</p>
                      </>
                    )}
                    {master?.snEnabled && (
                      <>
                        <FormField label={t('return.receive.goodSerialNos')}>
                          <Textarea
                            rows={2}
                            value={draft.goodSerialNos}
                            placeholder={t('return.receive.serialPlaceholder')}
                            onChange={(e) => setDraft(line.lineNo, { goodSerialNos: e.target.value })}
                          />
                        </FormField>
                        <FormField label={t('return.receive.defectSerialNos')}>
                          <Textarea
                            rows={2}
                            value={draft.defectSerialNos}
                            placeholder={t('return.receive.serialPlaceholder')}
                            onChange={(e) => setDraft(line.lineNo, { defectSerialNos: e.target.value })}
                          />
                        </FormField>
                        <FormField label={t('return.receive.rejectedSerialNos')} span="full">
                          <Textarea
                            rows={2}
                            value={draft.rejectedSerialNos}
                            placeholder={t('return.receive.serialPlaceholder')}
                            onChange={(e) => setDraft(line.lineNo, { rejectedSerialNos: e.target.value })}
                          />
                        </FormField>
                      </>
                    )}
                  </fieldset>
                  {!activeBox && (
                    <p className="mt-2 text-sm text-muted-foreground">{t('return.receive.bindHint')}</p>
                  )}
                  {activeLine === line.lineNo && otherQty[line.lineNo] > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('return.receive.otherContainers', { qty: otherQty[line.lineNo] })}
                    </p>
                  )}
                </Section>
              )
            })}
          </Panel>

          <SummaryCard
            size="lg"
            className={wl.aside}
            title={t('return.receive.sessionTitle')}
            description={t('return.receive.sessionHint')}
          >
            <div className="-mx-1 flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-1">
              {session.boxes.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <Box className="size-8 opacity-40" />
                  <p className="text-sm">{t('return.receive.sessionEmpty')}</p>
                </div>
              )}
              {session.boxes.map((box) => (
                <div
                  key={box.key}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2',
                    box.key === session.activeKey && 'border-primary bg-primary/5',
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openBox({ containerNo: box.containerNo, bulkPiece: box.bulkPiece })}
                  >
                    <div className="truncate text-sm font-semibold">{boxLabel(box)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('return.receive.boxLine', { lines: activeDrafts(box).length, qty: boxQty(box) })}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground"
                    onClick={() => void removeBox(box)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <SummaryMetrics
              size="lg"
              items={[
                { label: t('return.receive.sessionContainers'), value: totals.containers },
                { label: t('return.receive.good'), value: totals.good, tone: 'green', hidden: totals.good === 0 },
                { label: t('return.receive.defect'), value: totals.defect, tone: 'orange', hidden: totals.defect === 0 },
                { label: t('return.receive.rejected'), value: totals.rejected, tone: 'red', hidden: totals.rejected === 0 },
              ]}
            />

            <div className="flex flex-col gap-2">
              <Button className="h-12 w-full text-base" disabled={totals.containers === 0} onClick={submit}>
                {t('return.receive.submitMany', { count: totals.containers })}
              </Button>
              {session.boxes.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    clearSession(sessionKey)
                    setActiveLine(undefined)
                    setFeedback(undefined)
                  }}
                >
                  {t('return.receive.clearSession')}
                </Button>
              )}
            </div>
          </SummaryCard>
        </div>
      </div>
    </PageContainer>
  )
}
