import { Box, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, DocNoTail, Num } from '@/components/biz/display'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { inboundOrderStatusMeta } from '@/config/status'
import { useInbound } from '@/hooks/use-inbound'
import { canReceiveInbound, lineUnreceivedQty } from '@/lib/inbound-derive'
import {
  defaultReceiveDraft,
  emptyReceiveDraft,
  receiveDraftActivity,
  validateInboundReceiveDraft,
  type InboundReceiveDraft,
} from '@/lib/inbound-receive'
import { isWorkContainerUsedOnInbound } from '@/lib/inbound-receipt-container'
import { cn } from '@/lib/utils'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { ContainerReceiptLineInput } from '@/types/inbound'
import type { InboundOrderLine } from '@/types/wms'
import { InboundReceiveLineForm } from './inbound-receive-line-form'

export function InboundOrderReceivePage() {
  const { t } = useTranslation()
  const { inboundNo } = useParams<{ inboundNo: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const { getOrder, submitContainerReceipt } = useInbound()
  const receiptRecords = useDb((s) => s.receiptRecords ?? [])
  const { customerCode, customerName, sku } = useLookups()
  const skuBarcodes = useDb((s) => s.skuBarcodes)

  const order = inboundNo ? getOrder(inboundNo) : undefined
  const ownerCode = order ? customerCode(order.customerId) : ''
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backToList = listSearch ? `/wms/inbound/orders?${listSearch}` : '/wms/inbound/orders'
  const backToDetail = `/wms/inbound/orders/${inboundNo}`

  const openLines = useMemo(
    () => (order ? order.items.filter((line) => lineUnreceivedQty(line) > 0) : []),
    [order],
  )

  const [containerInput, setContainerInput] = useState('')
  const [boundContainer, setBoundContainer] = useState<string>()
  const [bulkPiece, setBulkPiece] = useState(false)
  const [scanValue, setScanValue] = useState('')
  const [lineEdits, setLineEdits] = useState<Record<string, InboundReceiveDraft>>({})
  const [activeSku, setActiveSku] = useState<string>()

  const containerReady = bulkPiece || Boolean(boundContainer)

  useEffect(() => {
    if (!openLines.length) {
      setActiveSku(undefined)
      return
    }
    if (activeSku && !openLines.some((l) => l.skuCode === activeSku)) {
      setActiveSku(undefined)
    }
  }, [openLines, activeSku])

  const summary = useMemo(() => {
    const plannedTotal = openLines.reduce((s, l) => s + l.plannedQty, 0)
    const remainTotal = openLines.reduce((s, l) => s + lineUnreceivedQty(l), 0)
    return { skuKinds: openLines.length, plannedTotal, remainTotal }
  }, [openLines])

  const getEdit = useCallback(
    (skuCode: string) => lineEdits[skuCode] ?? emptyReceiveDraft(),
    [lineEdits],
  )

  const patchLineEdit = useCallback(
    (skuCode: string, line: InboundOrderLine, patch: Partial<InboundReceiveDraft>) => {
      const remain = lineUnreceivedQty(line)
      setLineEdits((prev) => {
        const base = prev[skuCode] ?? emptyReceiveDraft()
        const cur = { ...emptyReceiveDraft(), ...base, ...patch }
        if (cur.rejectedQty <= 0) {
          cur.rejectedQty = 0
          cur.rejectReason = undefined
        }
        const userSetGood = 'goodQty' in patch
        if (!userSetGood && ('rejectedQty' in patch || 'defectQty' in patch)) {
          cur.goodQty = Math.max(0, remain - cur.defectQty - cur.rejectedQty)
        }
        cur.receivedQty = cur.goodQty + cur.defectQty
        const total = receiveDraftActivity(cur)
        if (total > remain) return prev
        return { ...prev, [skuCode]: cur }
      })
    },
    [],
  )

  const seedLineEditIfNeeded = useCallback((skuCode: string, line: InboundOrderLine) => {
    setLineEdits((prev) => {
      if (prev[skuCode]) return prev
      return { ...prev, [skuCode]: defaultReceiveDraft(lineUnreceivedQty(line)) }
    })
  }, [])

  const clearLineEdit = useCallback((skuCode: string, line: InboundOrderLine) => {
    setLineEdits((prev) => ({ ...prev, [skuCode]: defaultReceiveDraft(lineUnreceivedQty(line)) }))
  }, [])

  const clearAllEdits = useCallback(() => setLineEdits({}), [])

  const resolveSkuFromScan = useCallback(
    (raw: string) => {
      const code = raw.trim()
      if (!code || !order) return undefined
      const bySku = openLines.find((l) => l.skuCode.toLowerCase() === code.toLowerCase())
      if (bySku) return bySku.skuCode
      const barcodeHit = skuBarcodes.find((b) => b.barcode === code && b.ownerCode === ownerCode)
      if (barcodeHit) {
        const line = openLines.find((l) => l.skuCode === barcodeHit.skuCode)
        if (line) return line.skuCode
      }
      const master = openLines.find((l) => sku(l.skuCode)?.barcode === code)
      return master?.skuCode
    },
    [openLines, order, ownerCode, sku, skuBarcodes],
  )

  const onScanSubmit = () => {
    if (!containerReady) {
      toast.error(t('inbound.receive.containerRequired'))
      return
    }
    const hit = resolveSkuFromScan(scanValue)
    if (!hit) {
      toast.error(t('inbound.receive.scanMiss'))
      return
    }
    const line = openLines.find((l) => l.skuCode === hit)
    if (!line) return
    setActiveSku(hit)
    const cur = lineEdits[hit] ?? emptyReceiveDraft()
    const remain = lineUnreceivedQty(line)
    const nextGood = (lineEdits[hit] ? cur.goodQty : 0) + 1
    if (nextGood + cur.defectQty + cur.rejectedQty > remain) {
      toast.error(t('inbound.receive.overRemain'))
      return
    }
    patchLineEdit(hit, line, { goodQty: nextGood })
    setScanValue('')
    toast.success(t('inbound.receive.scanSkuBump', { sku: hit }))
  }

  const bindContainer = () => {
    const v = containerInput.trim()
    if (!v) {
      toast.error(t('inbound.receive.containerRequired'))
      return
    }
    if (inboundNo && isWorkContainerUsedOnInbound(receiptRecords, inboundNo, v)) {
      toast.error(t('inbound.receive.containerAlreadyUsed', { no: v }))
      return
    }
    setBoundContainer(v)
    setBulkPiece(false)
    clearAllEdits()
    toast.success(t('inbound.receive.containerBound', { no: v }))
  }

  const pendingLines = useMemo((): ContainerReceiptLineInput[] => {
    const out: ContainerReceiptLineInput[] = []
    for (const line of openLines) {
      const edit = getEdit(line.skuCode)
      if (receiveDraftActivity(edit) === 0) continue
      out.push({
        skuCode: line.skuCode,
        goodQty: edit.goodQty,
        defectQty: edit.defectQty,
        rejectedQty: edit.rejectedQty,
        rejectReason: edit.rejectReason,
      })
    }
    return out
  }, [openLines, getEdit])

  const submitDraft = () => {
    if (!inboundNo || pendingLines.length === 0) return
    for (const line of pendingLines) {
      const orderLine = openLines.find((l) => l.skuCode === line.skuCode)
      if (!orderLine) continue
      const edit = getEdit(line.skuCode)
      const normalized = { ...edit, receivedQty: edit.goodQty + edit.defectQty }
      const err = validateInboundReceiveDraft(normalized, lineUnreceivedQty(orderLine))
      if (err) {
        toast.error(`${line.skuCode}: ${t(err)}`)
        return
      }
    }
    const res = submitContainerReceipt({
      inboundNo,
      containerNo: boundContainer,
      bulkPiece,
      lines: pendingLines,
      operator,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('inbound.receive.containerSubmitted'))
    const updated = getOrder(inboundNo)
    const hasMoreToReceive = updated?.items.some((line) => lineUnreceivedQty(line) > 0) ?? false
    if (!hasMoreToReceive) {
      toast.success(t('inbound.receive.doneAll'))
      navigate(backToList)
      return
    }
    clearAllEdits()
    setActiveSku(undefined)
    setScanValue('')
    if (!bulkPiece) {
      setBoundContainer(undefined)
      setContainerInput('')
    }
  }

  if (!inboundNo || !order) {
    return <Navigate to="/wms/inbound/orders" replace />
  }

  if (order.warehouseCode !== warehouseCode) {
    return <Navigate to={backToList} replace />
  }

  if (!canReceiveInbound(order)) {
    return <Navigate to={backToDetail} replace />
  }

  return (
    <PageContainer
      fill
      title={
        <span className="flex flex-wrap items-center gap-2 text-base font-medium">
          <span>{t('inbound.receive.workbenchHeading')}</span>
          <span className="text-muted-foreground">·</span>
          <DocNoTail value={order.inboundNo} className="text-base" />
          <StatusBadge meta={inboundOrderStatusMeta[order.status]} />
        </span>
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to={backToDetail} state={location.state}>{t('inbound.backToDetail')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={backToList}>{t('inbound.backToList')}</Link>
          </Button>
        </>
      }
    >
      <Panel className="space-y-4 p-4">
        <div>
          <Label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Box className="size-4" data-icon="inline-start" />
            {t('inbound.receive.bindContainer')}
          </Label>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <WorkbenchScanInput
              className="min-w-0 flex-1 lg:max-w-2xl"
              disabled={bulkPiece || Boolean(boundContainer)}
              placeholder={t('inbound.receive.containerPlaceholder')}
              value={containerInput}
              onChange={setContainerInput}
              onEnter={bindContainer}
            />
            <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
              <Button
                type="button"
                className="h-14 min-w-[5.5rem] px-6 text-base"
                disabled={bulkPiece || Boolean(boundContainer)}
                onClick={bindContainer}
              >
                {t('inbound.receive.bindAction')}
              </Button>
              <label className="flex h-14 items-center gap-2 rounded-lg border bg-muted/30 px-4 text-sm">
                <Checkbox
                  checked={bulkPiece}
                  onCheckedChange={(v) => {
                    const on = v === true
                    setBulkPiece(on)
                    if (on) {
                      setBoundContainer(undefined)
                      setContainerInput('')
                      clearAllEdits()
                    }
                  }}
                />
                {t('inbound.bulkPiece')}
              </label>
              {boundContainer && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 px-4"
                  onClick={() => {
                    setBoundContainer(undefined)
                    setContainerInput('')
                    clearAllEdits()
                  }}
                >
                  {t('inbound.receive.changeContainer')}
                </Button>
              )}
            </div>
          </div>
          {containerReady && (
            <p className="mt-2 text-base font-medium text-foreground">
              {bulkPiece ? (
                t('inbound.receive.activeBulk')
              ) : (
                <>
                  {t('inbound.receive.activeContainerLabel')}
                  <DocNoTail value={boundContainer ?? ''} className="text-base" />
                </>
              )}
            </p>
          )}
          {!containerReady && (
            <p className="mt-2 text-sm text-warning">{t('inbound.receive.bindFirst')}</p>
          )}
        </div>

        <div className="border-t pt-4">
          <div
            className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-md border border-border bg-background sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0"
          >
              <SummaryCell
                align="left"
                label={t('common.customer')}
                value={
                  <div className="space-y-0.5 text-sm leading-snug">
                    <BizCode>{customerCode(order.customerId)}</BizCode>
                    <div className="line-clamp-2 font-medium text-foreground">{customerName(order.customerId)}</div>
                  </div>
                }
              />
              <SummaryCell
                align="left"
                label={t('inbound.containerNo')}
                value={
                  order.containerNo?.trim() ? (
                    <DocNoTail value={order.containerNo.trim()} className="text-sm" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <SummaryCell
                align="left"
                label={t('inbound.trackingNos')}
                value={<TrackingSummaryValue raw={order.trackingNos} />}
              />
              <SummaryCell label={t('inbound.receive.summarySkuKinds')} value={summary.skuKinds} />
              <SummaryCell label={t('inbound.receive.summaryPlannedTotal')} value={summary.plannedTotal} />
              <SummaryCell label={t('inbound.receive.summaryRemainTotal')} value={summary.remainTotal} />
          </div>
        </div>
      </Panel>

      <Panel className="flex min-h-0 flex-1 flex-col p-4">
        <Label className="mb-2 text-sm font-medium">{t('inbound.receive.scanSku')}</Label>
        <WorkbenchScanInput
          className="mb-2"
          disabled={!containerReady}
          placeholder={t('inbound.receive.scanSku')}
          value={scanValue}
          onChange={setScanValue}
          onEnter={onScanSubmit}
        />
        <p className="mb-4 text-xs text-muted-foreground">{t('inbound.receive.scanSkuHint')}</p>

        {containerReady && (
          <p className="mb-3 text-sm text-muted-foreground">{t('inbound.receive.pickRowHint')}</p>
        )}

        <InboundReceiveLineForm
          lines={openLines}
          edits={lineEdits}
          activeSku={activeSku}
          containerReady={containerReady}
          onSelectSku={(code) => {
            if (!containerReady) return
            setActiveSku(code)
            const line = openLines.find((l) => l.skuCode === code)
            if (line) seedLineEditIfNeeded(code, line)
          }}
          onPatch={patchLineEdit}
          onClear={clearLineEdit}
          skuName={(code) => sku(code)?.name}
          skuBarcode={(code) => sku(code)?.barcode}
        />

        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={pendingLines.length === 0}
            onClick={clearAllEdits}
          >
            {t('common.reset')}
          </Button>
          <Button
            className="min-w-[10rem] px-6"
            disabled={!containerReady || pendingLines.length === 0}
            onClick={submitDraft}
          >
            {t('inbound.receive.submitContainer')}
          </Button>
        </div>
      </Panel>
    </PageContainer>
  )
}

function TrackingSummaryValue({ raw }: { raw?: string }) {
  const lines = (raw ?? '')
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!lines.length) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((line) => (
        <DocNoTail key={line} value={line} className="text-sm" />
      ))}
    </div>
  )
}

function SummaryCell({
  label,
  value,
  align = 'center',
  className,
}: {
  label: string
  value: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  const numeric = typeof value === 'number'
  return (
    <div
      className={cn(
        'min-w-0 px-3 py-3',
        align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          'mt-1 text-foreground',
          numeric && 'text-lg font-semibold tabular-nums',
        )}
      >
        {numeric ? <Num value={value} /> : value}
      </div>
    </div>
  )
}

function WorkbenchScanInput({
  value,
  onChange,
  onEnter,
  disabled,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onEnter: () => void
  disabled?: boolean
  placeholder: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-3 rounded-lg border-2 border-primary/35 bg-background px-4 focus-within:border-primary',
        disabled && 'opacity-55',
        className,
      )}
    >
      <ScanLine className="size-6 shrink-0 text-primary" />
      <input
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter()
          }
        }}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-base placeholder:text-muted-foreground"
        autoComplete="off"
        autoCapitalize="characters"
      />
    </div>
  )
}
