import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { qualityMeta } from '@/config/status'
import { pickLineRemaining, pickLocationProgress } from '@/lib/outbound-pick-route'
import { taskTotals } from '@/lib/outbound-derive'
import { cn } from '@/lib/utils'
import type { OutboundPickTask, PickLine } from '@/types/outbound'
import type { PickFlow } from './use-pick-flow'

/** 上下文条：任务号 · 第几个库位 · 已拣/应拣 */
export function PickContext({ flow, task }: { flow: PickFlow; task: OutboundPickTask }) {
  const { done, total } = pickLocationProgress(task)
  const qty = taskTotals(task)
  return (
    <PdaContextBar>
      <DocNoTail value={task.no} tail={4} className="text-sm" />
      <PdaContextDot />
      <span>{flow.t('outbound.pdaPick.ctxStops', { current: Math.min(done + 1, total), total })}</span>
      <PdaContextDot />
      <span className="font-semibold tabular-nums">
        {flow.t('outbound.pdaPick.progress', { picked: qty.picked, planned: qty.planned })}
      </span>
    </PdaContextBar>
  )
}

/**
 * 本库位的一行待拣商品：编码（等宽）、名称两行、批次效期，右侧大号待拣数；
 * 正在数的一行描边并把右侧换成「已数 n/待拣」。底栏写应拣/已拣，到站后才露出缩小的「上报缺货」。
 */
export function PickLineCard({
  flow,
  task,
  line,
  active,
  counted,
  serialNos,
  arrived,
  onSelect,
  onShort,
}: {
  flow: PickFlow
  task: OutboundPickTask
  line: PickLine
  active: boolean
  counted: number
  serialNos: string[]
  arrived: boolean
  onSelect: () => void
  onShort: () => void
}) {
  const { t } = flow
  const remaining = pickLineRemaining(line)
  const sn = flow.isSn(task, line.skuCode)
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-background shadow-xs',
        active ? 'border-primary' : 'border-transparent',
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={active}
        disabled={!arrived}
        onClick={onSelect}
        className="flex w-full items-start gap-3 p-3 text-left enabled:active:bg-accent"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-base font-semibold">{line.skuCode}</span>
            {line.qualityType === 'DEFECTIVE' && <TagLabel meta={qualityMeta.DEFECTIVE} />}
            {sn && <TagLabel tone="purple">{t('outbound.pdaPick.snTag')}</TagLabel>}
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm">{flow.skuName(line.skuCode)}</div>
          {(line.batchNo || line.expiryDate) && (
            <div className="mt-0.5 font-mono text-sm text-muted-foreground">
              {[line.batchNo, line.expiryDate].filter(Boolean).join(' · ')}
            </div>
          )}
          {serialNos.length > 0 && (
            <div className="mt-1 font-mono text-sm break-all text-primary">{serialNos.join(', ')}</div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm text-muted-foreground">
            {counted > 0 ? t('outbound.pdaPick.counted') : t('outbound.pdaPick.toPick')}
          </div>
          <div className="text-2xl leading-tight font-bold tabular-nums text-primary">
            {counted > 0 ? `${counted}/${remaining}` : remaining}
          </div>
        </div>
      </button>
      <div className="flex min-h-10 items-center gap-2 border-t px-3 text-sm text-muted-foreground">
        <span className="min-w-0 flex-1 tabular-nums">
          {t('outbound.pdaPick.lineMeta', { planned: line.plannedQty, picked: line.pickedQty })}
          {line.shortageQty > 0 && ` · ${t('outbound.pdaPick.lineShort', { count: line.shortageQty })}`}
        </span>
        {arrived && (
          <button type="button" onClick={onShort} className="min-h-10 shrink-0 px-1 font-medium text-destructive">
            {t('outbound.pdaPick.short')}
          </button>
        )}
      </div>
    </div>
  )
}
