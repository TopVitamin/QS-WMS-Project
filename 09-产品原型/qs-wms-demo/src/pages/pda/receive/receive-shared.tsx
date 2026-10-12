import { useTranslation } from 'react-i18next'
import { DocNoTail } from '@/components/biz/display'
import { PdaContextBar, PdaContextDot } from '@/components/pda/pda-context-bar'
import { sessionLineCount, type ReceiveSessionBox, type ReceiveSessionLine } from '@/stores/pda-receive-session'
import { lineTotals, type ReceiveFlow } from './use-receive-flow'

/** 上下文条：入库单号 · 当前容器 · 本次作业容器数与行数（PDA 收货骨架） */
export function ReceiveContext({ flow, box }: { flow: ReceiveFlow; box?: ReceiveSessionBox }) {
  const { t } = useTranslation()
  if (!flow.order) return null
  const boxes = flow.session.boxes.filter((b) => b.lines.length > 0)
  return (
    <PdaContextBar>
      <DocNoTail value={flow.order.inboundNo} tail={4} className="text-sm" />
      <PdaContextDot />
      {box ? (
        <>
          <span className="font-mono font-semibold">{flow.boxLabel(box)}</span>
          <PdaContextDot />
          <span className="text-muted-foreground">{t('pdaReceive.ctxBox', { lines: box.lines.length })}</span>
        </>
      ) : (
        <span className="text-muted-foreground">
          {t('pdaReceive.ctxSession', { boxes: boxes.length, lines: sessionLineCount(boxes) })}
        </span>
      )}
    </PdaContextBar>
  )
}

export function QtyTriple({ lines }: { lines: ReceiveSessionLine[] }) {
  const { t } = useTranslation()
  return <span className="text-sm text-muted-foreground">{t('pdaReceive.qtyTriple', lineTotals(lines))}</span>
}
