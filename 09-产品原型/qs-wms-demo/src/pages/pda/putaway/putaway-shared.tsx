import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { inventoryFeatureMeta, qualityMeta } from '@/config/status'
import { planQty, recordedQty, remainingQty } from '@/lib/putaway'
import { cn } from '@/lib/utils'
import type { PutawayOrder, PutawayPlanLine } from '@/types/inbound'
import type { PutawayFlow } from './use-putaway-flow'

/** 上下文条：上架单号 · 品质 · 容器 · 已录/应上架 */
export function PutawayContext({ flow, order }: { flow: PutawayFlow; order: PutawayOrder }) {
  return (
    <PdaContextBar>
      <DocNoTail value={order.putawayNo} tail={4} className="text-sm" />
      <QualityTag order={order} />
      <PdaContextDot />
      <span className={order.containerNo ? 'font-mono font-semibold' : 'text-muted-foreground'}>
        {flow.containerLabel(order)}
      </span>
      <PdaContextDot />
      <span className="font-semibold tabular-nums">
        {flow.t('pdaPutaway.recorded', { recorded: recordedQty(order), plan: planQty(order) })}
      </span>
    </PdaContextBar>
  )
}

/** 品质标签：颜色与文案来自 config/status.ts 的 qualityMeta，与管理端一致 */
export function QualityTag({ order }: { order: PutawayOrder }) {
  return <TagLabel meta={qualityMeta[order.qualityType]} />
}

/**
 * 本站一行应上架商品：编码、名称两行、批次效期，右侧大号待放数；正在数的一行描边并换成「已数 n/待放」。
 * SN 行列出本次扫到的序列号，下方缩小的红字「清空已扫」远离底部主按钮。
 */
export function PutawayLineCard({
  flow,
  order,
  line,
  active,
  counted,
  serialNos,
  arrived,
  onSelect,
  onClearSerials,
}: {
  flow: PutawayFlow
  order: PutawayOrder
  line: PutawayPlanLine
  active: boolean
  counted: number
  serialNos: string[]
  arrived: boolean
  onSelect: () => void
  onClearSerials: () => void
}) {
  const { t } = flow
  const remaining = remainingQty(order, line.lineNo)
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
            {flow.isSn(order, line) && <TagLabel meta={inventoryFeatureMeta.sn} />}
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm">{flow.skuName(line.skuCode, order.customerId)}</div>
          {(line.batchNo || line.expiryDate) && (
            <div className="mt-0.5 font-mono text-sm text-muted-foreground">
              {[line.batchNo, line.expiryDate].filter(Boolean).join(' · ')}
            </div>
          )}
          {serialNos.length > 0 && (
            <div className="mt-1 font-mono text-sm break-all text-primary">{serialNos.join(', ')}</div>
          )}
          <div className="mt-1 text-sm text-muted-foreground tabular-nums">
            {t('pdaPutaway.lineMeta', { plan: line.planQty, recorded: recordedQty(order, line.lineNo) })}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm text-muted-foreground">
            {counted > 0 ? t('pdaPutaway.counted') : t('pdaPutaway.toPlace')}
          </div>
          <div className="text-2xl leading-tight font-bold tabular-nums text-primary">
            {counted > 0 ? `${counted}/${remaining}` : remaining}
          </div>
        </div>
      </button>
      {serialNos.length > 0 && (
        <div className="flex min-h-10 items-center justify-end border-t px-3">
          <button type="button" onClick={onClearSerials} className="min-h-10 px-1 text-sm font-medium text-destructive">
            {t('pdaPutaway.clearSerials')}
          </button>
        </div>
      )}
    </div>
  )
}

/** 已录落位：目标库位 · 商品（批次）× 数量，SN 列出序列号；每条可「撤销」（需确认，只删进度不动库存） */
export function PutawayPlacements({ flow, order }: { flow: PutawayFlow; order: PutawayOrder }) {
  const { t } = flow
  const lines = order.actualLines.filter((a) => !a.submitted)
  if (lines.length === 0) return null
  return (
    <PdaSection title={t('pdaPutaway.placedTitle', { count: lines.length })}>
      {lines.map((a) => {
        const batch = order.planLines.find((l) => l.lineNo === a.planLineNo)?.batchNo
        return (
          <PdaCard key={a.lineNo} className="flex min-h-12 items-center gap-3 py-2">
            <span className="font-mono text-base font-bold">{a.locationCode}</span>
            <span className="min-w-0 flex-1 font-mono text-sm text-muted-foreground">
              <span className="block truncate">{[a.skuCode, batch].filter(Boolean).join(' · ')}</span>
              {a.serialNos && a.serialNos.length > 0 && <span className="block break-all">{a.serialNos.join(', ')}</span>}
            </span>
            <span className="text-base font-semibold tabular-nums">{a.qty}</span>
            <button
              type="button"
              className="min-h-10 shrink-0 px-1 text-sm font-medium text-destructive"
              onClick={() => void flow.undoPlacement(order, a)}
            >
              {t('pdaPutaway.undo')}
            </button>
          </PdaCard>
        )
      })}
    </PdaSection>
  )
}
