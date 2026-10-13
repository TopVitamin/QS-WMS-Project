import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { qualityMeta } from '@/config/status'
import type { PutawayOrder } from '@/types/inbound'
import type { PutawayFlow } from './use-putaway-flow'

/** 上下文条：上架单号 · 品质 · 容器 */
export function PutawayContext({ flow, order }: { flow: PutawayFlow; order: PutawayOrder }) {
  return (
    <PdaContextBar>
      <DocNoTail value={order.putawayNo} tail={4} className="text-sm" />
      <QualityTag order={order} />
      <PdaContextDot />
      <span className={order.containerNo ? 'font-mono font-semibold' : 'text-muted-foreground'}>
        {flow.containerLabel(order)}
      </span>
    </PdaContextBar>
  )
}

/** 品质标签：颜色与文案来自 config/status.ts 的 qualityMeta，与管理端一致 */
export function QualityTag({ order }: { order: PutawayOrder }) {
  return <TagLabel meta={qualityMeta[order.qualityType]} />
}
