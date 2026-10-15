import { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RotateCcw } from 'lucide-react'
import { BizCode, Num } from '@/components/biz/display'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  emptyReceiveDraft,
  receiveDraftActivity,
  REJECT_REASONS,
  type InboundReceiveDraft,
  type ReceiveQtyField,
} from '@/lib/inbound-receive'
import { EMPTY_TEXT } from '@/lib/typography'
import { cn } from '@/lib/utils'
import type { InboundOrderLine } from '@/types/wms'

interface InboundReceiveLineFormProps {
  /** 仅未收>0 的待收明细 */
  lines: InboundOrderLine[]
  /** 当前容器的录入（按 SKU） */
  edits: Record<string, InboundReceiveDraft>
  /** 本容器可收：未收 − 本次其他容器已录的同 SKU 数量 */
  limits: Record<string, number>
  /** 本次其他容器已录的同 SKU 数量，> 0 时在可收下方提示 */
  otherQty: Record<string, number>
  activeSku?: string
  containerReady: boolean
  onSelectSku: (skuCode: string) => void
  onQtyChange: (skuCode: string, field: ReceiveQtyField, value: number) => void
  onReasonChange: (skuCode: string, reason: string) => void
  onClear: (skuCode: string) => void
  /** 数量框回车确认后调用（作业台用来把焦点拉回扫码框） */
  onEnterDone?: () => void
  skuName: (code: string) => string | undefined
  skuBarcode: (code: string) => string | undefined
}

type ReceiveEditContextValue = {
  edits: Record<string, InboundReceiveDraft>
  changeQty: (skuCode: string, field: ReceiveQtyField, value: number) => void
  changeReason: (skuCode: string, reason: string) => void
  clear: (skuCode: string) => void
  enterDone?: () => void
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
  limits,
  otherQty,
  activeSku,
  containerReady,
  onSelectSku,
  onQtyChange,
  onReasonChange,
  onClear,
  onEnterDone,
  skuName,
  skuBarcode,
}: InboundReceiveLineFormProps) {
  const ctx: ReceiveEditContextValue = {
    edits,
    changeQty: onQtyChange,
    changeReason: onReasonChange,
    clear: onClear,
    enterDone: onEnterDone,
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

  return (
    <ReceiveEditContext.Provider value={ctx}>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
        {/* 作业台在右侧「本次收货」旁边，宽度有限：商品编码/名称/条码合成一列，录入列始终在视口内 */}
        <table className="w-full min-w-[50rem] table-fixed border-collapse [&_tbody_tr:hover]:bg-transparent">
          <colgroup>
            <col />
            <col className="w-[7rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[8rem]" />
            <col className="w-[3rem]" />
          </colgroup>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead rowSpan={2} className={cn(th, 'sticky left-0 z-10 min-w-48')}>
                {t('common.sku')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(thRight, 'whitespace-normal leading-snug')}>
                {t('inbound.receive.receivedOfPlanned')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(thRight, 'whitespace-normal leading-snug')}>
                {t('inbound.receive.boxRemain')}
              </TableHead>
              <TableHead colSpan={3} className={cn(thCenter, 'border-b border-border')}>
                {t('inbound.receive.thisReceiveGroup')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(thCenter, 'whitespace-normal leading-snug')}>
                {t('inbound.receive.rejectReasonLabel')}
              </TableHead>
              <TableHead rowSpan={2} className={cn(th, 'sticky right-0 z-10 border-r-0 px-0')}>
                <span className="sr-only">{t('common.actions')}</span>
              </TableHead>
            </TableRow>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className={thCenter}>{t('inbound.goodQty')}</TableHead>
              <TableHead className={thCenter}>{t('inbound.defectQty')}</TableHead>
              <TableHead className={cn(thCenter, 'border-r border-border')}>
                {t('inbound.receive.rejectShort')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const active = activeSku === line.skuCode
              const limit = limits[line.skuCode] ?? 0
              const other = otherQty[line.skuCode] ?? 0
              const barcode = skuBarcode(line.skuCode)
              return (
                <TableRow
                  key={line.skuCode}
                  className="cursor-pointer border-0 hover:!bg-transparent"
                  onClick={() => onSelectSku(line.skuCode)}
                >
                  <TableCell
                    className={cn(
                      td,
                      'sticky left-0 z-[1] min-w-48',
                      active && 'shadow-[inset_3px_0_0_var(--primary)]',
                    )}
                  >
                    <div className="flex min-w-0 flex-col justify-center">
                      <BizCode className={cn('truncate text-base font-semibold', active && 'text-primary')}>
                        {line.skuCode}
                      </BizCode>
                      <span className="truncate text-sm text-muted-foreground">
                        {skuName(line.skuCode) ?? EMPTY_TEXT}
                        {barcode && ` · ${barcode}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={cn(td, 'text-right tabular-nums')}>
                    <Num value={line.receivedQty} />
                    <span className="text-sm text-muted-foreground">
                      {' / '}
                      <Num value={line.plannedQty} />
                    </span>
                  </TableCell>
                  <TableCell className={td}>
                    <div className="flex flex-col items-end justify-center tabular-nums">
                      <Num value={limit} className="text-lg font-semibold" />
                      {other > 0 && (
                        <span className="text-sm whitespace-nowrap text-muted-foreground">
                          {t('inbound.receive.otherBoxQty', { count: other })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={tdQty}>
                    <ReceiveQtyCell line={line} field="goodQty" />
                  </TableCell>
                  <TableCell className={tdQty}>
                    <ReceiveQtyCell line={line} field="defectQty" />
                  </TableCell>
                  <TableCell className={tdQty}>
                    <ReceiveQtyCell line={line} field="rejectedQty" />
                  </TableCell>
                  <TableCell className={tdQty} onClick={(e) => e.stopPropagation()}>
                    <ReceiveRejectReasonCell line={line} />
                  </TableCell>
                  <TableCell className={cn(td, 'sticky right-0 z-[1] border-r-0 px-0 text-center')}>
                    <ReceiveRowResetCell line={line} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </table>
        {lines.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{t('common.noData')}</p>}
      </div>
    </ReceiveEditContext.Provider>
  )
}

/** 良品 / 不良 / 拒收输入格：联动与上限由页面按 applyReceiveDraftChange 处理（超限拒绝并提示） */
function ReceiveQtyCell({ line, field }: { line: InboundOrderLine; field: ReceiveQtyField }) {
  const { edits, changeQty, enterDone, containerReady, activeSku, focusLine } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const editable = containerReady && activeSku === line.skuCode
  return (
    <TableQtyInput
      showZero
      disabled={!editable}
      value={edit[field]}
      onActivate={() => focusLine(line.skuCode)}
      onChange={(v) => changeQty(line.skuCode, field, v)}
      onEnterDone={enterDone}
    />
  )
}

function ReceiveRejectReasonCell({ line }: { line: InboundOrderLine }) {
  const { t } = useTranslation()
  const { edits, changeReason, containerReady, activeSku, focusLine } = useReceiveEdit()
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
      <Select value={edit.rejectReason ?? ''} onValueChange={(v) => changeReason(line.skuCode, v)} disabled={!editable}>
        <SelectTrigger
          className="h-9 w-full text-base font-normal text-foreground"
          onClick={(e) => e.stopPropagation()}
          onFocus={() => focusLine(line.skuCode)}
        >
          <SelectValue placeholder={t('inbound.receive.rejectReasonPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {REJECT_REASONS.map((r) => (
            <SelectItem key={r} value={r}>
              {t(`inbound.receive.rejectReason.${r}`)}
            </SelectItem>
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
    <Button
      variant="ghost"
      size="icon-sm"
      title={t('inbound.receive.resetLine')}
      aria-label={t('inbound.receive.resetLine')}
      className="text-muted-foreground hover:text-destructive"
      onClick={(e) => {
        e.stopPropagation()
        clear(line.skuCode)
      }}
    >
      <RotateCcw />
    </Button>
  )
}

function TableQtyInput({
  value,
  disabled,
  showZero,
  onActivate,
  onChange,
  onEnterDone,
}: {
  value: number
  disabled?: boolean
  /** 拒收数量等默认展示 0 */
  showZero?: boolean
  onActivate?: () => void
  onChange: (v: number) => void
  onEnterDone?: () => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  // 不可录入的行不显示 0，避免看起来像能填
  const display = draft ?? (value === 0 && (!showZero || disabled) ? '' : String(value))

  /** 超限由页面拒绝并提示、保留原值（与 PDA 数量框一致，不静默截断） */
  const commit = (raw: string) => {
    const n = Math.max(0, Number(raw) || 0)
    setDraft(null)
    if (n !== value) onChange(n)
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
          onEnterDone?.()
        }
      }}
    />
  )
}
