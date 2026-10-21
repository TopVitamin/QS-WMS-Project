import { Fragment, createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { Num } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { WorkbenchProductCode, WorkbenchProductName } from '@/components/biz/workbench'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/format'
import {
  emptyReceiveDraft,
  parseSerialNos,
  receiveDraftActivity,
  REJECT_REASONS,
  type InboundReceiveDraft,
  type ReceiveQtyField,
} from '@/lib/inbound-receive'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { WORKBENCH_NAME_MIN_WIDTH, WORKBENCH_PRODUCT_COL_WIDTH, workbenchTable as wt } from '@/lib/workbench-styles'
import type { InboundOrderLine } from '@/types/wms'

/** 录入列宽（px）；商品列见 WORKBENCH_PRODUCT_COL_WIDTH，名称列吃剩下的宽度 */
const COL = { remain: 128, qty: 88, actions: 52 } as const
/** 比这还窄就在表格框内横向滚动（商品列吸左），不再压缩各列 */
const TABLE_MIN_WIDTH = WORKBENCH_PRODUCT_COL_WIDTH + WORKBENCH_NAME_MIN_WIDTH + COL.remain + COL.qty * 3 + COL.actions

interface InboundReceiveLineFormProps {
  /** 仅未收>0 的待收明细 */
  lines: InboundOrderLine[]
  /** 当前容器的录入（按 SKU） */
  edits: Record<string, InboundReceiveDraft>
  /** 本容器可收：未收 − 本次其他容器已录的同 SKU 数量 */
  limits: Record<string, number>
  activeSku?: string
  containerReady: boolean
  onSelectSku: (skuCode: string) => void
  onQtyChange: (skuCode: string, field: ReceiveQtyField, value: number) => void
  onReasonChange: (skuCode: string, reason: string) => void
  onMetaChange: (skuCode: string, patch: Partial<InboundReceiveDraft>) => void
  onClear: (skuCode: string) => void
  /** 数量框回车确认后调用（作业台用来把焦点拉回扫码框） */
  onEnterDone?: () => void
  skuName: (code: string) => string | undefined
  skuBarcode: (code: string) => string | undefined
  /** 新品判断：无 NS 记录的 SKU 行内提示并可就地量方（新品维护 Demo PRD 第三节） */
  isNewSku?: (skuCode: string) => boolean
  onGoMeasure?: (skuCode: string) => void
  /** 商品追溯配置：批次/效期/SN 决定本行是否展开采集区 */
  skuConfig: (skuCode: string) => { batchEnabled?: boolean; expiryEnabled?: boolean; snEnabled?: boolean }
}

type ReceiveEditContextValue = {
  edits: Record<string, InboundReceiveDraft>
  changeQty: (skuCode: string, field: ReceiveQtyField, value: number) => void
  changeReason: (skuCode: string, reason: string) => void
  changeMeta: (skuCode: string, patch: Partial<InboundReceiveDraft>) => void
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
  activeSku,
  containerReady,
  onSelectSku,
  onQtyChange,
  onReasonChange,
  onMetaChange,
  onClear,
  onEnterDone,
  skuName,
  skuBarcode,
  isNewSku,
  onGoMeasure,
  skuConfig,
}: InboundReceiveLineFormProps) {
  const ctx: ReceiveEditContextValue = {
    edits,
    changeQty: onQtyChange,
    changeReason: onReasonChange,
    changeMeta: onMetaChange,
    clear: onClear,
    enterDone: onEnterDone,
    containerReady,
    activeSku,
    focusLine: onSelectSku,
    skuName,
    skuBarcode,
  }
  const { t, i18n } = useTranslation()

  return (
    <ReceiveEditContext.Provider value={ctx}>
      <div className={wt.scroll}>
        {/* 商品列和 Web 端上架共用（条码大字、SKU 小字，名称单列）；拒收原因只在拒收数 > 0 时作为本行下的子行出现 */}
        <table className={wt.table} style={{ minWidth: TABLE_MIN_WIDTH }}>
          <colgroup>
            <col style={{ width: WORKBENCH_PRODUCT_COL_WIDTH }} />
            <col />
            <col style={{ width: COL.remain }} />
            <col style={{ width: COL.qty }} />
            <col style={{ width: COL.qty }} />
            <col style={{ width: COL.qty }} />
            <col style={{ width: COL.actions }} />
          </colgroup>
          <thead>
            <tr>
              <th className={cn(wt.th, wt.stickyFirstHead)}>{t('workbench.productCode')}</th>
              <th className={wt.th}>{t('workbench.productName')}</th>
              <th className={wt.th}>{t('inbound.receive.boxRemain')}</th>
              <th className={wt.th}>{t('inbound.goodQty')}</th>
              <th className={wt.th}>{t('inbound.defectQty')}</th>
              <th className={wt.th}>{t('inbound.receive.rejectShort')}</th>
              <th className={cn(wt.th, 'px-0')}>
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const active = activeSku === line.skuCode
              const limit = limits[line.skuCode] ?? 0
              const rejected = (edits[line.skuCode]?.rejectedQty ?? 0) > 0
              const config = skuConfig(line.skuCode)
              const traceOpen = active && Boolean(config.batchEnabled || config.expiryEnabled || config.snEnabled)
              const subRows = Number(rejected) + Number(traceOpen)
              const select = () => onSelectSku(line.skuCode)
              const rowClass = cn('cursor-pointer', active && wt.rowActive)
              return (
                <Fragment key={line.skuCode}>
                  <tr className={rowClass} onClick={select}>
                    <td rowSpan={Math.max(1, subRows + 1)} className={cn(wt.td, wt.stickyFirst, active && wt.rowActiveBar)}>
                      <WorkbenchProductCode barcode={skuBarcode(line.skuCode)} sku={line.skuCode}>
                        {isNewSku?.(line.skuCode) && (
                          <span className="flex items-center gap-2 text-sm">
                            <TagLabel tone="orange">{t('newSku.pendingTag')}</TagLabel>
                            <button
                              type="button"
                              className={textLink}
                              onClick={(e) => {
                                e.stopPropagation()
                                onGoMeasure?.(line.skuCode)
                              }}
                            >
                              {t('newSku.goMeasure')}
                            </button>
                          </span>
                        )}
                      </WorkbenchProductCode>
                    </td>
                    <td rowSpan={Math.max(1, subRows + 1)} className={wt.td}>
                      <WorkbenchProductName name={skuName(line.skuCode)} />
                    </td>
                    <td className={wt.td}>
                      <Num value={limit} className="text-xl font-semibold" />
                      <div className="text-sm text-muted-foreground tabular-nums">
                        {t('inbound.receive.receivedOf', {
                          received: formatNumber(line.receivedQty, i18n.language),
                          planned: formatNumber(line.plannedQty, i18n.language),
                        })}
                      </div>
                    </td>
                    <td className={cn(wt.td, 'px-2')}>
                      <ReceiveQtyCell line={line} field="goodQty" />
                    </td>
                    <td className={cn(wt.td, 'px-2')}>
                      <ReceiveQtyCell line={line} field="defectQty" />
                    </td>
                    <td className={cn(wt.td, 'px-2')}>
                      <ReceiveQtyCell line={line} field="rejectedQty" />
                    </td>
                    <td className={cn(wt.td, 'px-0 text-center')}>
                      <ReceiveRowResetCell line={line} />
                    </td>
                  </tr>
                  {traceOpen && (
                    <tr className={rowClass} onClick={select}>
                      <td colSpan={5} className={cn(wt.td, wt.tdSub)} onClick={(e) => e.stopPropagation()}>
                        <ReceiveTraceCell line={line} config={config} editable />
                      </td>
                    </tr>
                  )}
                  {rejected && (
                    <tr className={rowClass} onClick={select}>
                      <td colSpan={5} className={cn(wt.td, wt.tdSub)} onClick={(e) => e.stopPropagation()}>
                        <ReceiveRejectReasonCell line={line} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {lines.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{t('common.noData')}</p>}
      </div>
    </ReceiveEditContext.Provider>
  )
}

/** 良品 / 不良 / 拒收输入格：联动与上限由页面按 applyReceiveDraftChange 处理（超限拒绝并提示） */
const QTY_FIELD_LABEL: Record<ReceiveQtyField, string> = {
  goodQty: 'inbound.goodQty',
  defectQty: 'inbound.defectQty',
  rejectedQty: 'inbound.receive.rejectShort',
}

function ReceiveQtyCell({ line, field }: { line: InboundOrderLine; field: ReceiveQtyField }) {
  const { t } = useTranslation()
  const { edits, changeQty, enterDone, containerReady, activeSku, focusLine, skuName } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const editable = containerReady && activeSku === line.skuCode
  return (
    <TableQtyInput
      showZero
      label={`${skuName(line.skuCode) ?? line.skuCode} ${t(QTY_FIELD_LABEL[field])}`}
      disabled={!editable}
      value={edit[field]}
      onActivate={() => focusLine(line.skuCode)}
      onChange={(v) => changeQty(line.skuCode, field, v)}
      onEnterDone={enterDone}
    />
  )
}

/** 批次/效期/SN 采集：选中行且有追溯配置时作为本行下面的子行出现 */
function ReceiveTraceCell({
  line,
  config,
  editable,
}: {
  line: InboundOrderLine
  config: { batchEnabled?: boolean; expiryEnabled?: boolean; snEnabled?: boolean }
  editable: boolean
}) {
  const { t } = useTranslation()
  const { edits, changeMeta } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const fieldClass = 'h-11 w-full text-base'
  const labelClass = 'text-sm text-muted-foreground'
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {config.batchEnabled && (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>{t('inbound.batchNo')}</span>
          <Input
            className={fieldClass}
            value={edit.batchNo ?? ''}
            placeholder={t('common.inputPlaceholder')}
            disabled={!editable}
            onChange={(e) => changeMeta(line.skuCode, { batchNo: e.target.value })}
          />
        </label>
      )}
      {config.expiryEnabled && (
        <>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('inbound.productionDate')}</span>
            <Input
              className={fieldClass}
              type="date"
              value={edit.productionDate ?? ''}
              disabled={!editable}
              onChange={(e) => changeMeta(line.skuCode, { productionDate: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('inbound.expiryDate')}</span>
            <Input
              className={fieldClass}
              type="date"
              value={edit.expiryDate ?? ''}
              disabled={!editable}
              onChange={(e) => changeMeta(line.skuCode, { expiryDate: e.target.value })}
            />
          </label>
        </>
      )}
      {config.snEnabled && edit.goodQty > 0 && (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>{t('inbound.receive.goodSerialNos', { count: edit.goodQty })}</span>
          <Textarea
            rows={2}
            className="text-sm"
            value={(edit.goodSerialNos ?? []).join('\n')}
            placeholder={t('inbound.receive.serialPlaceholder')}
            disabled={!editable}
            onChange={(e) => changeMeta(line.skuCode, { goodSerialNos: parseSerialNos(e.target.value) })}
          />
        </label>
      )}
      {config.snEnabled && edit.defectQty > 0 && (
        <label className="flex flex-col gap-1">
          <span className={labelClass}>{t('inbound.receive.defectSerialNos', { count: edit.defectQty })}</span>
          <Textarea
            rows={2}
            className="text-sm"
            value={(edit.defectSerialNos ?? []).join('\n')}
            placeholder={t('inbound.receive.serialPlaceholder')}
            disabled={!editable}
            onChange={(e) => changeMeta(line.skuCode, { defectSerialNos: parseSerialNos(e.target.value) })}
          />
        </label>
      )}
    </div>
  )
}

/** 拒收原因：拒收数 > 0 时才作为本行下面的子行出现，不单占一列 */
function ReceiveRejectReasonCell({ line }: { line: InboundOrderLine }) {
  const { t } = useTranslation()
  const { edits, changeReason, containerReady, activeSku, focusLine, skuName } = useReceiveEdit()
  const edit = edits[line.skuCode] ?? emptyReceiveDraft()
  const editable = containerReady && activeSku === line.skuCode
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm text-muted-foreground">
        {t('inbound.receive.rejectReasonFor', { count: edit.rejectedQty })}
      </span>
      <Select value={edit.rejectReason ?? ''} onValueChange={(v) => changeReason(line.skuCode, v)} disabled={!editable}>
        <SelectTrigger
          aria-label={`${skuName(line.skuCode) ?? line.skuCode} ${t('inbound.receive.rejectReasonLabel')}`}
          className={cn(
            'h-11 w-56 max-w-full text-base font-normal text-foreground',
            !edit.rejectReason && 'border-warning',
          )}
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
  label,
  value,
  disabled,
  showZero,
  onActivate,
  onChange,
  onEnterDone,
}: {
  /** 读屏名称：商品名称 + 良品 / 不良品 / 拒收 */
  label: string
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
      aria-label={label}
      disabled={disabled}
      className={cn(
        'h-11 w-full min-w-0 px-3 text-left text-lg leading-none tabular-nums',
        disabled && 'cursor-not-allowed bg-muted opacity-60',
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
