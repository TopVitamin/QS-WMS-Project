import { TagLabel } from '@/components/biz/status-badge'
import { PdaCard } from '@/components/pda/pda-card'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { PdaFigure, PdaSkuBlock } from '@/components/pda/pda-stock'
import { inventoryTagMeta, qualityMeta } from '@/config/status'
import { cn } from '@/lib/utils'
import type { PdaMoveLine } from '@/stores/pda-move-session'
import type { InventoryRecord } from '@/types/wms'
import type { MoveFlow } from './use-move-flow'

/** 上下文条：源库位 · 已加几行 · 合计数量 */
export function MoveContext({ flow, source }: { flow: MoveFlow; source?: string }) {
  const { t, draft } = flow
  const lines = draft?.lines ?? []
  return (
    <PdaContextBar>
      {source && (
        <>
          <span className="text-muted-foreground">{t('pdaMove.sourceShort')}</span>
          <span className="font-mono font-semibold">{source}</span>
          <PdaContextDot />
        </>
      )}
      <span className="font-semibold tabular-nums">
        {t('pdaMove.listSummary', { lines: lines.length, qty: lines.reduce((n, l) => n + l.qty, 0) })}
      </span>
    </PdaContextBar>
  )
}

/** 源库存明细：商品、货主、批次、品质；右侧大号可移，下方实际与已分配；盘点中、待核对就近标出 */
export function MoveRowCard({
  flow,
  row,
  onClick,
  selected,
}: {
  flow: MoveFlow
  row: InventoryRecord
  onClick?: () => void
  selected?: boolean
}) {
  const { t } = flow
  const left = flow.movable(row.id)
  const counting = flow.frozen(row)
  const body = (
    <>
      <div className="flex items-start gap-3">
        <PdaSkuBlock
          className="flex-1"
          skuCode={row.skuCode}
          name={flow.skuName(row.skuCode)}
          owner={flow.ownerText(row.customerId)}
          batch={[row.batchNo, row.expiryDate].filter(Boolean).join(' · ') || undefined}
          tags={
            <>
              <TagLabel meta={qualityMeta[row.qualityType]} />
              {flow.isSn(row) && <TagLabel tone="purple">{t('pdaMove.snTag')}</TagLabel>}
              {counting && <TagLabel meta={inventoryTagMeta.counting} />}
              {flow.pending(row) && <TagLabel meta={inventoryTagMeta.pending} />}
            </>
          }
        />
        <PdaFigure
          label={t('pdaMove.movable')}
          value={
            <span className={cn(left > 0 && !counting ? 'text-primary' : 'text-muted-foreground')}>
              {Math.max(0, left)}
            </span>
          }
          className="shrink-0 text-right"
        />
      </div>
      <div className="mt-2 flex gap-3 border-t pt-2 text-sm text-muted-foreground tabular-nums">
        <span>
          {t('inventory.actual')} {row.onHandQty}
        </span>
        <span>
          {t('inventory.allocated')} {row.allocatedQty ?? 0}
        </span>
      </div>
    </>
  )
  if (!onClick) return <PdaCard>{body}</PdaCard>
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border bg-background p-3 text-left shadow-xs active:bg-accent',
        selected ? 'border-primary' : 'border-transparent',
      )}
    >
      {body}
    </button>
  )
}

/** 清单一行：源 → 目标（等宽粗体），商品与批次，右侧数量；SN 列出序列号；失败行标红 */
export function MoveLineCard({
  flow,
  line,
  index,
  failed,
  action,
}: {
  flow: MoveFlow
  line: PdaMoveLine
  index: number
  failed?: boolean
  action?: React.ReactNode
}) {
  const { t } = flow
  return (
    <PdaCard className={cn(failed && 'ring-2 ring-destructive')}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 font-mono text-lg font-bold">
            <span className="text-sm font-normal text-muted-foreground">#{index + 1}</span>
            <span>{line.sourceLocation}</span>
            <span className="text-muted-foreground">→</span>
            <span>{line.targetLocation}</span>
          </div>
          <PdaSkuBlock
            className="mt-1"
            skuCode={line.skuCode}
            name={flow.skuName(line.skuCode)}
            batch={line.batchNo}
            tags={<TagLabel meta={qualityMeta[line.qualityType]} />}
          />
          {line.serialNos.length > 0 && (
            <div className="mt-1 font-mono text-sm break-all text-primary">{line.serialNos.join(', ')}</div>
          )}
        </div>
        <PdaFigure label={t('inventory.qty')} value={line.qty} className="shrink-0 text-right" />
      </div>
      {action && <div className="mt-2 flex justify-end border-t pt-1">{action}</div>}
    </PdaCard>
  )
}
