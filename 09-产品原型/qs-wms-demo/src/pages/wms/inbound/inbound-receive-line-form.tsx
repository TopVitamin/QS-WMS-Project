import { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BizCode, Num } from '@/components/biz/display'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { emptyReceiveDraft, receiveDraftActivity, REJECT_REASONS, type InboundReceiveDraft } from '@/lib/inbound-receive'
import { lineUnreceivedQty } from '@/lib/inbound-derive'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import type { InboundOrderLine } from '@/types/wms'

interface InboundReceiveLineFormProps {
  /** 仅未收>0 的待收明细 */
  lines: InboundOrderLine[]
  edits: Record<string, InboundReceiveDraft>
  activeSku?: string
  containerReady: boolean
  onSelectSku: (skuCode: string) => void
  onPatch: (skuCode: string, line: InboundOrderLine, patch: Partial<InboundReceiveDraft>) => void
  onClear: (skuCode: string, line: InboundOrderLine) => void
  skuName: (code: string) => string | undefined
  skuBarcode: (code: string) => string | undefined
}

type ReceiveEditContextValue = {
  edits: Record<string, InboundReceiveDraft>
  patch: (skuCode: string, line: InboundOrderLine, patch: Partial<InboundReceiveDraft>) => void
  clear: (skuCode: string, line: InboundOrderLine) => void
  containerReady: boolean
  activeSku?: string
  focusLine: (skuCode: string) => void
  skuName: (code: string) => string | undefined
  skuBarcode: (code: string) => string | undefined
}

const ReceiveEditContext = createContext<ReceiveEditContextValue | null>(null)

function useReceiveEdit() {
  const ctx = useContext(ReceiveEditContext)
  if (!ctx) throw new Error('ReceiveEditContext missing')
  return ctx
}

/** 收货作业台：本次收货录入表（按容器多行；仅选中行可录入） */
export function InboundReceiveLineForm({
  lines,
  edits,
  activeSku,
  containerReady,
  onSelectSku,
  onPatch,
  onClear,
  skuName,
  skuBarcode,
}: InboundReceiveLineFormProps) {
  const ctx: ReceiveEditContextValue = {
    edits,
    patch: onPatch,
    clear: onClear,
    containerReady,
    activeSku,
    focusLine: onSelectSku,
    skuName,
    skuBarcode,
  }
  const { t } = useTranslation()

  const th =
    'h-10 border-b border-r border-border bg-muted px-3 align-middle text-sm font-medium text-muted-foreground last:border-r-0'
  const thCenter = cn(th, 'text-center')
  const thRight = cn(th, 'text-right')
  const td =
    'h-12 border-b border-r border-border bg-card px-3 py-0 align-middle text-base leading-snug text-foreground'
  const tdQty = cn(td, 'px-2')
  const tdRejectQty = cn(tdQty, 'border-l border-border')

  return (
    <ReceiveEditContext.Provider value={ctx}>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[78rem] table-fixed border-collapse [&_tbody_tr:hover]:bg-transparent">
          <colgroup>
            <col className="w-[9rem]" />
            <col className="w-[10rem]" />
            <col className="w-[13rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[7rem]" />
            <col className="w-[5.75rem]" />
            <col className="w-[5.75rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[10.5rem]" />
            <col className="w-[5rem]" />
          </colgroup>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead rowSpan={2} className={cn(th, 'sticky left-0 z-10')}>
                {t('masterSku.code')}
              </TableHead>
              <TableHead rowSpan={2} className={th}>
                {t('common.productBarcode')}
              </TableHead>
              <TableHead rowSpan={2} className={th}>
                {t('common.skuName')}
              </TableHead>
              <TableHead rowSpan={2} className={thRight}>
                {t('inbound.plannedQty')}
              </TableHead>
              <TableHead rowSpan={2} className={thRight}>
                {t('inbound.alreadyReceivedQty')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(thRight, 'whitespace-normal leading-snug')}>
                {t('inbound.remainToReceiveQty')}
              </TableHead>
              <TableHead colSpan={2} className={cn(thCenter, 'border-b border-border')}>
                {t('inbound.receive.thisReceiveGroup')}
              </TableHead>
              <TableHead
                rowSpan={2}
                className={cn(thCenter, 'border-l border-border whitespace-normal leading-snug')}
              >
                {t('inbound.receive.thisRejected')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(thCenter, 'whitespace-normal leading-snug')}>
                {t('inbound.receive.rejectReasonLabel')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(th, 'sticky right-0 z-10 border-r-0')}>
                {t('common.actions')}
              </TableHead>
            </TableRow>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className={thCenter}>{t('inbound.receive.sessionGoodQty')}</TableHead>
              <TableHead className={cn(thCenter, 'border-r border-border')}>
                {t('inbound.receive.sessionDefectQty')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const active = activeSku === line.skuCode
              const remainQty = lineUnreceivedQty(line)
              return (
                <TableRow
                  key={line.skuCode}
                  className="cursor-pointer border-0 hover:!bg-transparent"
                  onClick={() => onSelectSku(line.skuCode)}
                >
                  <TableCell
                    className={cn(
                      td,
                      'sticky left-0 z-[1]',
                      active && 'border-l-2 border-l-primary',
                    )}
                  >
                    <div className="flex h-12 w-full items-center justify-start text-base tabular-nums text-foreground">
                      <BizCode className="text-base font-medium">{line.skuCode}</BizCode>
                    </div>
                  </TableCell>
                  <TableCell className={td}>
                    <div className="flex h-12 w-full items-center justify-start text-base tabular-nums text-foreground">
                      <span className="truncate text-base tabular-nums">{skuBarcode(line.skuCode) ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(td, 'whitespace-normal')}>
                    <div className="flex h-12 w-full items-center justify-start whitespace-normal text-base tabular-nums text-foreground">
                      <span className="line-clamp-2">{skuName(line.skuCode) ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className={td}>
                    <div className="flex h-12 w-full items-center justify-end text-base tabular-nums text-foreground">
                      <Num value={line.plannedQty} />
                    </div>
                  </TableCell>
                  <TableCell className={td}>
                    <div className="flex h-12 w-full items-center justify-end text-base tabular-nums text-foreground">
                      <Num value={line.receivedQty} />
                    </div>
                  </TableCell>
                  <TableCell className={td}>
                    <div className="flex h-12 w-full items-center justify-end text-base tabular-nums text-foreground">
                      <Num value={remainQty} />
                    </div>
                  </TableCell>
                  <TableCell className={tdQty}>
                    <div className="flex h-12 w-full items-center justify-center text-base tabular-nums text-foreground">
                      <ReceiveGoodQtyCell line={line} />
                    </div>
                  </TableCell>
                  <TableCell className={cn(tdQty, 'border-r border-border')}>
                    <div className="flex h-12 w-full items-center justify-center text-base tabular-nums text-foreground">
                      <ReceiveDefectQtyCell line={line} />
                    </div>
                  </TableCell>
                  <TableCell className={tdRejectQty}>
                    <div className="flex h-12 w-full items-center justify-center text-base tabular-nums text-foreground">
                      <ReceiveRejectedQtyCell line={line} />
                    </div>
                  </TableCell>
                  <TableCell className={td} onClick={(e) => e.stopPropagation()}>
                    <ReceiveRejectReasonCell line={line} />
                  </TableCell>
                  <TableCell className={cn(td, 'sticky right-0 z-[1] border-r-0')}>
                    <div className="flex h-12 w-full items-center justify-center text-base tabular-nums text-foreground">
                      <ReceiveRowResetCell line={line} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </table>
        {lines.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">{t('common.noData')}</p>
        )}
      </div>
    </ReceiveEditContext.Provider>
  )
}

function ReceiveGoodQtyCell({ line }: { line: InboundOrderLine }) {
  const { edits, patch, containerReady, activeSku, focusLine } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const remain = lineUnreceivedQty(line)
  const maxGood = remain - edit.defectQty - edit.rejectedQty
  const editable = containerReady && activeSku === line.skuCode
  return (
    <TableQtyInput
      showZero
      disabled={!editable}
      value={edit.goodQty}
      max={maxGood}
      onActivate={() => focusLine(line.skuCode)}
      onChange={(v) => patch(line.skuCode, line, { goodQty: v })}
    />
  )
}

function ReceiveDefectQtyCell({ line }: { line: InboundOrderLine }) {
  const { edits, patch, containerReady, activeSku, focusLine } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const remain = lineUnreceivedQty(line)
  const maxDefect = remain - edit.goodQty - edit.rejectedQty
  const editable = containerReady && activeSku === line.skuCode
  return (
    <TableQtyInput
      showZero
      disabled={!editable}
      value={edit.defectQty}
      max={maxDefect}
      onActivate={() => focusLine(line.skuCode)}
      onChange={(v) => patch(line.skuCode, line, { defectQty: v })}
    />
  )
}

function ReceiveRejectedQtyCell({ line }: { line: InboundOrderLine }) {
  const { edits, patch, containerReady, activeSku, focusLine } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const remain = lineUnreceivedQty(line)
  const maxReject = remain - edit.goodQty - edit.defectQty
  const editable = containerReady && activeSku === line.skuCode
  return (
    <TableQtyInput
      showZero
      disabled={!editable}
      value={edit.rejectedQty}
      max={maxReject}
      onActivate={() => focusLine(line.skuCode)}
      onChange={(v) => patch(line.skuCode, line, { rejectedQty: v })}
    />
  )
}

function ReceiveRejectReasonCell({ line }: { line: InboundOrderLine }) {
  const { t } = useTranslation()
  const { edits, patch, containerReady, activeSku, focusLine } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const editable = containerReady && activeSku === line.skuCode
  if (edit.rejectedQty <= 0) {
    return (
      <div className={cn('flex h-12 items-center justify-center text-base text-muted-foreground')}>
        {t('inbound.receive.rejectReasonPlaceholder')}
      </div>
    )
  }
  return (
    <div className="flex h-12 w-full items-center">
      <Select
        value={edit.rejectReason ?? ''}
        onValueChange={(v) => patch(line.skuCode, line, { rejectReason: v })}
        disabled={!editable}
      >
        <SelectTrigger
          className="h-9 w-full text-base font-normal text-foreground"
          onClick={(e) => e.stopPropagation()}
          onFocus={() => focusLine(line.skuCode)}
        >
          <SelectValue placeholder={t('inbound.receive.rejectReasonPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {REJECT_REASONS.map((r) => (
            <SelectItem key={r} value={r}>{t(`inbound.receive.rejectReason.${r}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ReceiveRowResetCell({ line }: { line: InboundOrderLine }) {
  const { t } = useTranslation()
  const { edits, clear } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  if (receiveDraftActivity(edit) === 0) return null
  return (
    <button
      type="button"
      className={cn(textLink, 'text-base text-destructive hover:text-destructive')}
      onClick={(e) => {
        e.stopPropagation()
        clear(line.skuCode, line)
      }}
    >
      {t('inbound.receive.resetLine')}
    </button>
  )
}

function TableQtyInput({
  value,
  max,
  disabled,
  showZero,
  onActivate,
  onChange,
}: {
  value: number
  max: number
  disabled?: boolean
  /** 拒收数量等默认展示 0 */
  showZero?: boolean
  onActivate?: () => void
  onChange: (v: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (value === 0 && !showZero ? '' : String(value))

  const commit = (raw: string) => {
    const n = Math.min(max, Math.max(0, Number(raw) || 0))
    onChange(n)
    setDraft(null)
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      className={cn(
        'h-9 w-full min-w-0 px-1 text-center text-base leading-none tabular-nums',
        disabled && 'cursor-not-allowed opacity-60',
      )}
      value={display}
      onClick={(e) => e.stopPropagation()}
      onFocus={() => {
        onActivate?.()
        setDraft(value === 0 && !showZero ? '' : String(value))
      }}
      onBlur={() => {
        if (draft !== null) commit(draft)
        else setDraft(null)
      }}
      onChange={(e) => {
        const next = e.target.value.replace(/[^\d]/g, '')
        setDraft(next)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit(draft ?? display)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
}
