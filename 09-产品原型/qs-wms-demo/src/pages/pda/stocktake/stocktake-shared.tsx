import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { PdaSkuBlock } from '@/components/pda/pda-stock'
import { inventoryFeatureMeta, qualityMeta } from '@/config/status'
import { cn } from '@/lib/utils'
import type { InventoryCount, StocktakeLine } from '@/types/inventory'
import type { StocktakeFlow } from './use-stocktake-flow'

/** 上下文条：盘点单号 · 当前库位 · 已盘行数／总行数（盘点页面骨架） */
export function StocktakeContext({
  flow,
  count,
  location,
}: {
  flow: StocktakeFlow
  count: InventoryCount
  location?: string
}) {
  const { t } = flow
  const { counted, total } = flow.progress(count)
  return (
    <PdaContextBar>
      <DocNoTail value={count.no} tail={4} className="text-sm" />
      {location && (
        <>
          <PdaContextDot />
          <span className="font-mono font-semibold">{location}</span>
        </>
      )}
      <PdaContextDot />
      <span className="font-semibold tabular-nums">{t('pdaStocktake.progress', { counted, total })}</span>
    </PdaContextBar>
  )
}

/**
 * 盘点行（盲盘）：商品、货主、批次、品质；只显示「未盘／已盘 n」，不显示账面，避免照账填数。
 * 实盘新增的账面 0 行带「实盘新增」。
 */
export function CountLineCard({
  flow,
  line,
  onClick,
  selected,
}: {
  flow: StocktakeFlow
  line: StocktakeLine
  onClick?: () => void
  selected?: boolean
}) {
  const { t } = flow
  const counted = line.countedQty !== undefined
  const body = (
    <div className="flex items-start gap-3">
      <PdaSkuBlock
        className="flex-1"
        skuCode={line.skuCode}
        name={flow.skuName(line.skuCode, line.customerId)}
        owner={flow.ownerCode(line.customerId)}
        batch={flow.lineBatch(line)}
        tags={
          <>
            <TagLabel meta={qualityMeta[line.qualityType]} />
            {flow.isSn(line) && <TagLabel meta={inventoryFeatureMeta.sn} />}
            {line.added && <TagLabel meta={inventoryFeatureMeta.added} />}
          </>
        }
      />
      <div className="shrink-0 text-right">
        {counted ? (
          <>
            <div className="text-sm text-muted-foreground">{t('pdaStocktake.countedLabel')}</div>
            <div className="text-2xl leading-tight font-bold tabular-nums text-success-text">{line.countedQty}</div>
          </>
        ) : (
          <TagLabel tone="gray">{t('pdaStocktake.uncounted')}</TagLabel>
        )}
      </div>
    </div>
  )
  if (!onClick) return <div className="rounded-xl bg-background p-3 shadow-xs">{body}</div>
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
