import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import type { PutawayOrder } from '@/types/inbound'
import type { PutawayFlow } from './use-putaway-flow'

/** 上下文条：上架单号 · 品质 · 容器 */
export function PutawayContext({ flow, order }: { flow: PutawayFlow; order: PutawayOrder }) {
  return (
    <PdaContextBar>
      <DocNoTail value={order.putawayNo} tail={4} className="text-sm" />
      <QualityTag flow={flow} order={order} />
      <PdaContextDot />
      <span className={order.containerNo ? 'font-mono font-semibold' : 'text-muted-foreground'}>
        {flow.containerLabel(order)}
      </span>
    </PdaContextBar>
  )
}

export function QualityTag({ flow, order }: { flow: PutawayFlow; order: PutawayOrder }) {
  return (
    <TagLabel tone={order.qualityType === 'DEFECTIVE' ? 'red' : 'green'}>
      {flow.t(`enum.quality.${order.qualityType}`)}
    </TagLabel>
  )
}
