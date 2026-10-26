import { Box, Package, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { PdaButton, PdaCard, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaContextBar } from '@/components/pda/pda-context-bar'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { updateExpiryDatePair } from '@/lib/expiry-date'
import { pdaToast as toast } from '@/lib/pda-toast'
import {
  emptyReturnReceiveDraft,
  num,
  parseReturnSerialNos,
  returnDraftActivity,
  returnLineLimit,
  type ReturnReceiveDraft,
} from '@/lib/return-receive'
import { canReceiveReturn } from '@/lib/return-derive'
import { isReturnSerialMismatch, isWorkContainerUsedOnReturn } from '@/mock/return-actions'
import {
  isOperatorSelectableReturnRejectReason,
  RETURN_OPERATOR_REJECT_REASONS,
  RETURN_REJECT_REASON_LABEL_KEYS,
  RETURN_REJECT_REASON,
  type ReturnReceiptContainerInput,
} from '@/types/return'
import { useDb, useLookups } from '@/mock/db'
import {
  returnBoxKey,
  returnSessionKey,
  EMPTY_RETURN_RECEIVE_SESSION,
  useReturnReceiveSession,
  type ReturnReceiveBox,
  type ReturnReceiveSession,
} from '@/stores/return-receive-session'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'

const activeDrafts = (box: ReturnReceiveBox) =>
  Object.entries(box.drafts).filter(([, d]) => returnDraftActivity(d) > 0)

const boxQty = (box: ReturnReceiveBox) =>
  activeDrafts(box).reduce((sum, [, d]) => sum + returnDraftActivity(d), 0)

const dropIfEmpty = (session: ReturnReceiveSession, key?: string): ReturnReceiveBox[] =>
  session.boxes.filter((box) => box.key !== key || activeDrafts(box).length > 0)

/**
 * PDA 退货收货：扫退货单 / 退货运单 / 原出库运单定位；扫不到退货单时可按原 B2C 出库单建派送失败退货。
 * 一次作业可收多个容器，提交生成一条退货收货记录。
 */
export function PdaReturnReceivePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const { confirm } = useConfirm()
  const orders = useDb((s) => s.returnOrders)
  const receiveReturn = useDb((s) => s.receiveReturn)
  const bindContainer = useDb((s) => s.bindContainer)
  const createDeliveryFailedReturn = useDb((s) => s.createDeliveryFailedReturn)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const masters = useDb((s) => s.skuMasters)
  const returnReceipts = useDb((s) => s.returnReceipts)
  const outboundOrders = useDb((s) => s.outboundOrders)
  const outboundVerifications = useDb((s) => s.outboundVerifications)
  const outboundPickTasks = useDb((s) => s.outboundPickTasks)
  const { sku, customerCode, customerName } = useLookups()
  const [params, setParams] = useSearchParams()
  const returnNo = params.get('no') ?? undefined
  const order = orders.find((o) => o.returnNo === returnNo && o.warehouseCode === warehouse.code)
  const pending = useMemo(
    () => orders.filter((o) => o.warehouseCode === warehouse.code && canReceiveReturn(o)),
    [orders, warehouse.code],
  )

  const sessionKey = returnSessionKey('pda', warehouse.code, returnNo ?? '')
  const session = useReturnReceiveSession((s) => s.sessions[sessionKey] ?? EMPTY_RETURN_RECEIVE_SESSION)
  const updateSession = useReturnReceiveSession((s) => s.update)
  const clearSession = useReturnReceiveSession((s) => s.clear)

  const [message, setMessage] = useState<ScanMessage>()
  const [activeLine, setActiveLine] = useState<number>()
  const activeBox = session.boxes.find((b) => b.key === session.activeKey)

  const update = (fn: (s: ReturnReceiveSession) => ReturnReceiveSession) => updateSession(sessionKey, fn)

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

  const total = session.boxes.reduce((sum, box) => sum + boxQty(box), 0)
  const containerCount = session.boxes.filter((b) => activeDrafts(b).length > 0).length

  const masterFor = (skuCode: string) => (order ? masters.find((m) => m.customerId === order.customerId && m.code === skuCode) : undefined)
  const skuLabel = (code: string) => (order ? (sku(code, order.customerId)?.name ?? code) : code)
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

  const openBox = (input: { containerNo?: string; bulkPiece: boolean }) => {
    if (!order) return false
    const containerNo = input.containerNo?.trim()
    if (!input.bulkPiece && !containerNo) {
      setMessage({ tone: 'error', text: t('return.receive.containerRequired') })
      return false
    }
    if (!input.bulkPiece && containerNo && isWorkContainerUsedOnReturn(returnReceipts, order.returnNo, containerNo)) {
      setMessage({ tone: 'error', text: t('return.receive.containerAlreadyUsed', { no: containerNo }) })
      return false
    }
    if (input.bulkPiece && session.boxes.some((b) => b.bulkPiece)) {
      setMessage({ tone: 'error', text: t('return.receive.containerDuplicated') })
      return false
    }
    if (!input.bulkPiece && containerNo) {
      const bound = bindContainer({
        warehouseCode: order.warehouseCode,
        customerId: order.customerId,
        containerNo,
        operator,
      })
      if (!bound.ok) {
        setMessage({ tone: 'error', text: t(bound.errorKey, bound.params) })
        return false
      }
    }
    const key = returnBoxKey(containerNo, input.bulkPiece)
    const existing = session.boxes.find((b) => b.key === key)
    update((s) => {
      const boxes = dropIfEmpty(s, s.activeKey === key ? undefined : s.activeKey)
      return {
        activeKey: key,
        boxes: boxes.some((b) => b.key === key)
          ? boxes
          : [
              ...boxes,
              {
                key,
                containerNo: input.bulkPiece ? undefined : containerNo,
                bulkPiece: input.bulkPiece,
                drafts: {},
              },
            ],
      }
    })
    setMessage({
      tone: 'success',
      text: existing
        ? t('return.receive.containerSwitched', { no: input.bulkPiece ? t('inbound.bulkPiece') : containerNo, qty: boxQty(existing) })
        : t('return.receive.containerBound', { no: input.bulkPiece ? t('inbound.bulkPiece') : containerNo }),
    })
    return true
  }

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

  const setQty = (lineNo: number, field: 'goodQty' | 'defectQty' | 'rejectedQty', value: number) => {
    if (!activeBox) return false
    const draft = activeBox.drafts[lineNo] ?? emptyReturnReceiveDraft()
    const others =
      num(draft.goodQty) + num(draft.defectQty) + num(draft.rejectedQty) - num(draft[field])
    if (others + value > (limits[lineNo] ?? 0)) {
      setMessage({ tone: 'error', text: t('return.receive.overRemain') })
      return false
    }
    setDraft(lineNo, { [field]: String(value) } as Partial<ReturnReceiveDraft>)
    setMessage(undefined)
    return true
  }

  const addNextContainer = () => {
    update((s) => ({ boxes: dropIfEmpty(s, s.activeKey), activeKey: undefined }))
    setMessage({ tone: 'info', text: t('return.receive.scanContainer') })
  }

  const removeBox = async (box: ReturnReceiveBox) => {
    if (activeDrafts(box).length > 0) {
      const ok = await confirm({
        title: t('return.receive.removeContainer'),
        description: t('return.receive.removeContainerConfirm', { no: box.bulkPiece ? t('inbound.bulkPiece') : box.containerNo }),
        variant: 'destructive',
      })
      if (!ok) return
    }
    update((s) => ({
      boxes: s.boxes.filter((b) => b.key !== box.key),
      activeKey: s.activeKey === box.key ? undefined : s.activeKey,
    }))
    setMessage(undefined)
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

  const onScan = (raw: string): boolean => {
    const code = raw.trim()
    if (!code) return false
    if (!returnNo || !order) {
      const exact = pending.find(
        (o) =>
          o.returnNo.toUpperCase() === code.toUpperCase() ||
          o.trackingNo?.toUpperCase() === code.toUpperCase() ||
          o.originalOutboundNo?.toUpperCase() === code.toUpperCase(),
      )
      if (exact) {
        setParams({ no: exact.returnNo })
        setMessage(undefined)
        return true
      }
      const created = createDeliveryFailedReturn({ outboundNo: code, operator })
      if (created.ok && created.returnNo) {
        toast.success(t('return.pda.createSuccess', { no: created.returnNo }))
        setParams({ no: created.returnNo })
        setMessage(undefined)
        return true
      }
      setMessage({
        tone: 'error',
        text: created.ok ? t('return.pda.orderNotFound') : t(created.errorKey, created.params),
      })
      return false
    }
    if (!activeBox) {
      if (resolveSku(code)) {
        setMessage({ tone: 'error', text: t('return.receive.scanContainerFirst') })
        return false
      }
      return openBox({ containerNo: code, bulkPiece: false })
    }
    const hit = resolveSku(code)
    if (!hit) {
      setMessage({ tone: 'error', text: t('return.receive.skuNotInOrder') })
      return false
    }
    const matchingLines = openLines.filter((candidate) => candidate.skuCode === hit)
    const line = activeLine
      ? matchingLines.find((candidate) => candidate.lineNo === activeLine)
      : matchingLines.length === 1
        ? matchingLines[0]
        : undefined
    if (!line) {
      setMessage({ tone: 'error', text: t('return.receive.selectPackageLine') })
      return false
    }
    const limit = limits[line.lineNo] ?? 0
    const draft = activeBox.drafts[line.lineNo] ?? emptyReturnReceiveDraft()
    if (returnDraftActivity(draft) >= limit) {
      setMessage({ tone: 'error', text: t('return.receive.overRemain') })
      return false
    }
    setDraft(line.lineNo, { goodQty: String(num(draft.goodQty) + 1) })
    setMessage({
      tone: 'success',
      text: t('return.receive.scannedSkuDetail', { left: Math.max(0, limit - returnDraftActivity(draft) - 1) }),
    })
    return true
  }

  const submit = async () => {
    if (!order) return
    const containers: ReturnReceiptContainerInput[] = []
    for (const box of session.boxes) {
      const drafts = activeDrafts(box)
      if (!drafts.length) continue
      const missing = drafts.find(
        ([lineNo, d]) =>
          num(d.rejectedQty) > 0 &&
          !isOperatorSelectableReturnRejectReason(d.rejectReason) &&
          !hasSnMismatch(Number(lineNo), d),
      )
      if (missing) {
        update((s) => ({ ...s, activeKey: box.key }))
        setMessage({ tone: 'error', text: t('return.receive.rejectReasonRequired') })
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
      setMessage({ tone: 'error', text: t('return.receive.empty') })
      return
    }
    const ok = await confirm({
      title: t('return.receive.title'),
      description: t('return.receive.hint'),
      confirmText: t('return.receive.submitMany', { count: containers.length }),
    })
    if (!ok) return
    const result = receiveReturn({ returnNo: order.returnNo, containers, operator })
    if (!result.ok) {
      setMessage({ tone: 'error', text: t(result.errorKey, result.params) })
      return
    }
    clearSession(sessionKey)
    toast.success(t('return.receive.success', { no: order.returnNo }))
    setParams({})
  }

  if (!returnNo || !order) {
    return (
      <>
        <PdaHeader title={t('return.pda.title')} onBack={() => navigate('/pda')} />
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          <ScanInput
            label={t('return.pda.scanOrder')}
            onScan={onScan}
            message={message}
            candidates={[
              ...pending.slice(0, 2).map((o) => ({ value: o.returnNo })),
              ...pending
                .filter((o) => o.originalOutboundNo)
                .slice(0, 1)
                .map((o) => ({ value: o.originalOutboundNo!, label: o.returnNo })),
            ]}
          />
          <p className="px-1 text-sm text-muted-foreground">{t('return.pda.scanHint')}</p>
          <PdaSection title={t('return.pda.pendingList')}>
            {pending.length === 0 ? (
              <PdaCard className="text-sm text-muted-foreground">{t('return.pda.noOrders')}</PdaCard>
            ) : (
              pending.map((o) => (
                <PdaListItem
                  key={o.returnNo}
                  chevron
                  onClick={() => {
                    setParams({ no: o.returnNo })
                    setMessage(undefined)
                  }}
                >
                  <div className="font-mono text-base font-semibold">{o.returnNo}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(`return.source.${o.sourceType}`)} · {o.items.length} SKU
                  </div>
                </PdaListItem>
              ))
            )}
          </PdaSection>
        </div>
      </>
    )
  }

  const boxLabel = (box: ReturnReceiveBox) => (box.bulkPiece ? t('inbound.bulkPiece') : (box.containerNo ?? ''))
  const hasBulk = session.boxes.some((b) => b.bulkPiece)

  return (
    <>
      <PdaHeader title={t('return.pda.title')} onBack={() => setParams({})} />
      <PdaContextBar>
        <span className="font-mono">{order.returnNo}</span>
        <span>·</span>
        <span>{customerName(order.customerId)}</span>
        <span>·</span>
        <span>{t('return.pda.pieces', { count: total })}</span>
      </PdaContextBar>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [overflow-anchor:none]">
        <ScanInput
          key={activeBox?.key ?? 'container'}
          label={activeBox ? t('return.receive.scanSku') : t('return.receive.scanContainer')}
          onScan={onScan}
          message={message}
          candidates={
            activeBox
              ? openLines.slice(0, 2).map((l) => ({ value: l.skuCode }))
              : []
          }
        />

        {activeBox ? (
          <PdaCard>
            <div className="flex items-center gap-2">
              {activeBox.bulkPiece ? <Package className="size-5 text-primary" /> : <Box className="size-5 text-primary" />}
              <span className="text-sm text-muted-foreground">{t('return.receive.currentContainer')}</span>
              <span className="ml-auto font-mono text-lg font-semibold">{boxLabel(activeBox)}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('return.receive.boxLine', { lines: activeDrafts(activeBox).length, qty: boxQty(activeBox) })}
            </div>
            <PdaButton variant="outline" className="mt-3 w-full" onClick={addNextContainer}>
              <Plus className="size-4" />
              {t('return.receive.addContainer')}
            </PdaButton>
          </PdaCard>
        ) : (
          <div className="flex gap-2">
            <PdaButton variant="outline" className="flex-1" onClick={() => openBox({ bulkPiece: true })} disabled={hasBulk}>
              <Package className="size-4" />
              {t('inbound.bulkPiece')}
            </PdaButton>
          </div>
        )}

        {openLines.map((line) => {
          const draft = activeBox?.drafts[line.lineNo] ?? emptyReturnReceiveDraft()
          const master = masterFor(line.skuCode)
          const limit = limits[line.lineNo] ?? 0
          const sameSkuLines = openLines.filter((candidate) => candidate.skuCode === line.skuCode)
          const snMismatch = hasSnMismatch(line.lineNo, draft)
          return (
            <PdaCard key={line.lineNo}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-base font-semibold">
                    {line.originalPackageNo && `${t('return.receive.originalPackage')} ${line.originalPackageNo} · `}
                    {line.skuCode}
                  </div>
                  <div className="text-sm text-muted-foreground">{skuLabel(line.skuCode)}</div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {t('return.receive.remaining')}
                  <div className="text-xl font-semibold text-foreground tabular-nums">{limit}</div>
                </div>
              </div>
              {sameSkuLines.length > 1 && (
                <button
                  type="button"
                  aria-pressed={activeLine === line.lineNo}
                  className={`mt-2 min-h-11 rounded-md border px-3 text-sm ${activeLine === line.lineNo ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                  onClick={() => setActiveLine(line.lineNo)}
                >
                  {t(activeLine === line.lineNo ? 'return.receive.packageLineSelected' : 'return.receive.selectPackageLineButton')}
                </button>
              )}
              {!activeBox ? (
                <div className="mt-2 text-sm text-muted-foreground">{t('return.receive.bindHint')}</div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <QtyStepper
                    label={t('return.receive.good')}
                    value={num(draft.goodQty)}
                    max={limit}
                    onChange={(v) => setQty(line.lineNo, 'goodQty', v)}
                  />
                  <QtyStepper
                    label={t('return.receive.defect')}
                    value={num(draft.defectQty)}
                    max={limit}
                    tone="danger"
                    onChange={(v) => setQty(line.lineNo, 'defectQty', v)}
                  />
                  <QtyStepper
                    label={t('return.receive.rejected')}
                    value={num(draft.rejectedQty)}
                    max={limit}
                    onChange={(v) => setQty(line.lineNo, 'rejectedQty', v)}
                  />
                  {num(draft.rejectedQty) > 0 && (
                    <section className="space-y-2" aria-label={t('return.receive.rejectReason')}>
                      <p className="text-sm text-muted-foreground">{t('return.receive.rejectReason')}</p>
                      {snMismatch ? (
                        <PdaCard className="border border-border py-3 text-sm">
                          {t(RETURN_REJECT_REASON_LABEL_KEYS[RETURN_REJECT_REASON.SN_MISMATCH])}
                        </PdaCard>
                      ) : (
                        RETURN_OPERATOR_REJECT_REASONS.map((reason) => (
                          <PdaListItem
                            key={reason}
                            role="radio"
                            selectable
                            selected={draft.rejectReason === reason}
                            onClick={() => setDraft(line.lineNo, { rejectReason: reason })}
                          >
                            <span className="text-base font-medium">
                              {t(RETURN_REJECT_REASON_LABEL_KEYS[reason])}
                            </span>
                          </PdaListItem>
                        ))
                      )}
                    </section>
                  )}
                  {master?.batchEnabled && (
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">{t('inbound.batchNo')}</span>
                      <Input
                        className="h-12 text-base"
                        value={draft.batchNo}
                        placeholder={t('common.inputPlaceholder')}
                        required
                        onChange={(e) => setDraft(line.lineNo, { batchNo: e.target.value })}
                      />
                    </label>
                  )}
                  {master?.expiryEnabled && (
                    <>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('inbound.productionDate')}</span>
                        <Input
                          className="h-12 text-base"
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
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('inbound.expiryDate')}</span>
                        <Input
                          className="h-12 text-base"
                          type="date"
                          required
                          value={draft.expiryDate}
                          onChange={(e) =>
                            setDraft(line.lineNo, updateExpiryDatePair(draft, 'expiryDate', e.target.value, master.shelfLifeDays))
                          }
                        />
                      </label>
                      <p className="col-span-2 text-xs text-muted-foreground">{t('inventory.expiryDateCalculationHint')}</p>
                    </>
                  )}
                  {master?.snEnabled && (
                    <>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('return.receive.goodSerialNos')}</span>
                        <Textarea
                          rows={2}
                          className="text-base"
                          value={draft.goodSerialNos}
                          placeholder={t('return.receive.serialPlaceholder')}
                          onChange={(e) => setDraft(line.lineNo, { goodSerialNos: e.target.value })}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('return.receive.defectSerialNos')}</span>
                        <Textarea
                          rows={2}
                          className="text-base"
                          value={draft.defectSerialNos}
                          placeholder={t('return.receive.serialPlaceholder')}
                          onChange={(e) => setDraft(line.lineNo, { defectSerialNos: e.target.value })}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('return.receive.rejectedSerialNos')}</span>
                        <Textarea
                          rows={2}
                          className="text-base"
                          value={draft.rejectedSerialNos}
                          placeholder={t('return.receive.serialPlaceholder')}
                          onChange={(e) => setDraft(line.lineNo, { rejectedSerialNos: e.target.value })}
                        />
                      </label>
                    </>
                  )}
                  {otherQty[line.lineNo] > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('return.receive.otherContainers', { qty: otherQty[line.lineNo] })}
                    </p>
                  )}
                </div>
              )}
            </PdaCard>
          )
        })}

        {session.boxes.length > 0 && (
          <PdaSection title={t('return.receive.sessionTitle')}>
            {session.boxes.map((box) => (
              <PdaListItem
                key={box.key}
                selectable
                selected={box.key === session.activeKey}
                onClick={() => openBox({ containerNo: box.containerNo, bulkPiece: box.bulkPiece })}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-semibold">{boxLabel(box)}</span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {t('return.receive.boxLine', { lines: activeDrafts(box).length, qty: boxQty(box) })}
                  </span>
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      void removeBox(box)
                    }}
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </PdaListItem>
            ))}
          </PdaSection>
        )}
      </div>
      <PdaFooter hint={total === 0 ? t('return.receive.empty') : undefined}>
        <PdaButton className="flex-1" disabled={total === 0} onClick={() => void submit()}>
          {t('return.pda.submitMany', { count: containerCount })}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
