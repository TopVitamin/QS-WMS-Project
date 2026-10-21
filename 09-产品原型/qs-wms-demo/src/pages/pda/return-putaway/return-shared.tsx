import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { qualityMeta, unpickReasonMeta } from '@/config/status'
import { putbackExpected, putbackSaved } from '@/lib/outbound-derive'
import { putbackLineRemaining } from '@/lib/outbound-pick-route'
import { cn } from '@/lib/utils'
import type { OutboundPutback, PutbackLine } from '@/types/outbound'
import type { ReturnFlow } from './use-return-flow'


/** 上下文条：返库单号 · 退拣原因 · 已保存/应返库 */
export function ReturnContext({ flow, putback }: { flow: ReturnFlow; putback: OutboundPutback }) {
  return (
    <PdaContextBar>
      <DocNoTail value={putback.no} tail={4} className="text-sm" />
      <TagLabel meta={unpickReasonMeta[putback.reason]} />
      <PdaContextDot />
      <span className="font-semibold tabular-nums">
        {flow.t('outbound.pdaReturn.progress', { saved: putbackSaved(putback), expected: putbackExpected(putback) })}
      </span>
    </PdaContextBar>
  )
}

/** 本站一行应返库商品：编码、名称、品质与批次；右侧大号待放数，正在数时换成「已数 n/待放」；SN 行列出要放的序列号 */
export function ReturnLineCard({
  flow,
  line,
  customerId,
  active,
  counted,
  serialNos,
  arrived,
  onSelect,
}: {
  flow: ReturnFlow
  line: PutbackLine
  customerId: string
  active: boolean
  counted: number
  serialNos: string[]
  arrived: boolean
  onSelect: () => void
}) {
  const { t } = flow
  const remaining = putbackLineRemaining(line)
  const left = flow.serialsLeft(line)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={!arrived}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border bg-background p-3 text-left shadow-xs enabled:active:bg-accent',
        active ? 'border-primary' : 'border-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-base font-semibold">{line.skuCode}</span>
          <TagLabel meta={qualityMeta[line.qualityType]} />
        </div>
        <div className="mt-0.5 line-clamp-2 text-sm">{flow.skuName(line.skuCode, customerId)}</div>
        {line.batchNo && <div className="mt-0.5 font-mono text-sm text-muted-foreground">{line.batchNo}</div>}
        {left.length > 0 && (
          <div className="mt-1 font-mono text-sm break-all">
            {left.map((sn) => (
              <span key={sn} className={cn('mr-2', serialNos.includes(sn) ? 'text-primary line-through' : 'text-muted-foreground')}>
                {sn}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1 text-sm text-muted-foreground tabular-nums">
          {t('outbound.pdaReturn.lineMeta', { expected: line.qty, saved: line.savedQty })}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm text-muted-foreground">
          {counted > 0 ? t('outbound.pdaPick.counted') : t('outbound.pdaReturn.toPlace')}
        </div>
        <div className="text-2xl leading-tight font-bold tabular-nums text-primary">
          {counted > 0 ? `${counted}/${remaining}` : remaining}
        </div>
      </div>
    </button>
  )
}

/** 已保存的落位：目标库位 × 数量，每个应返库行可「重录」（清掉本行已保存的落位，不动库存） */
export function ReturnPlacements({ flow, putback }: { flow: ReturnFlow; putback: OutboundPutback }) {
  const { t } = flow
  const lines = putback.lines.filter((l) => (l.placements?.length ?? 0) > 0)
  if (lines.length === 0) return null
  return (
    <PdaSection title={t('outbound.pdaReturn.savedTitle', { count: lines.length })}>
      {lines.map((l) => (
        <PdaCard key={l.id} className="flex items-start gap-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-base font-semibold">{l.skuCode}</div>
            {(l.placements ?? []).map((pl, i) => (
              <div key={i} className="font-mono text-sm text-muted-foreground">
                {pl.location} × {pl.qty}
                {pl.serialNos.length > 0 && ` · ${pl.serialNos.join(', ')}`}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="min-h-10 shrink-0 px-1 text-sm font-medium text-destructive"
            onClick={() => void flow.redoLine(putback, l)}
          >
            {t('outbound.pdaReturn.redo')}
          </button>
        </PdaCard>
      ))}
    </PdaSection>
  )
}
