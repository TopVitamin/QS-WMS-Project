import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { outboundTypeMeta } from '@/config/status'
import { sum } from '@/lib/outbound-derive'
import { toVerifyQty, type VerifyRow } from '@/lib/outbound-verify'
import { cn } from '@/lib/utils'
import type { OutboundOrder } from '@/types/outbound'
import type { VerifyFlow } from './use-verify-flow'

/** 上下文条：出库单号 · 业务类型 · 待复核 · 本次已扫 */
export function VerifyContext({ flow, order, rows }: { flow: VerifyFlow; order: OutboundOrder; rows: VerifyRow[] }) {
  return (
    <PdaContextBar>
      <DocNoTail value={order.no} tail={4} className="text-sm" />
      <TagLabel meta={outboundTypeMeta[order.type]} />
      <PdaContextDot />
      <span className="tabular-nums">{flow.t('outbound.pdaVerify.ctxToVerify', { count: toVerifyQty(order) })}</span>
      <PdaContextDot />
      <span className="font-semibold tabular-nums">
        {flow.t('outbound.pdaVerify.ctxThisTime', { count: sum(rows, (r) => r.qty) })}
      </span>
    </PdaContextBar>
  )
}

/** 一行待复核商品：编码、名称、批次；右侧大号「本次 n/待复核」，SN 行列出本次扫到的序列号 */
export function VerifyRowCard({
  flow,
  row,
  active,
  onSelect,
}: {
  flow: VerifyFlow
  row: VerifyRow
  active: boolean
  onSelect: () => void
}) {
  const { t } = flow
  const full = row.qty > 0 && row.qty === row.remaining
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-background p-3 text-left shadow-xs active:bg-accent',
        active ? 'border-primary' : 'border-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-base font-semibold">{row.skuCode}</span>
          {row.sn && <TagLabel tone="purple">{t('outbound.pdaPick.snTag')}</TagLabel>}
        </div>
        <div className="mt-0.5 line-clamp-2 text-sm">{flow.skuName(row.skuCode)}</div>
        {row.batchNo && <div className="mt-0.5 font-mono text-sm text-muted-foreground">{row.batchNo}</div>}
        {row.serialNos.length > 0 && (
          <div className="mt-1 font-mono text-sm break-all text-primary">{row.serialNos.join(', ')}</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm text-muted-foreground">
          {row.qty > 0 ? t('outbound.pdaVerify.thisTime') : t('outbound.ui.stationToVerify')}
        </div>
        <div className={cn('text-2xl leading-tight font-bold tabular-nums', full ? 'text-success-text' : 'text-primary')}>
          {row.qty > 0 ? `${row.qty}/${row.remaining}` : row.remaining}
        </div>
      </div>
    </button>
  )
}
