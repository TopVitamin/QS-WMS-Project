import { PickDoneStep } from './pick/done-step'
import { PickListStep } from './pick/list-step'
import { PickShortStep } from './pick/short-step'
import { usePickFlow } from './pick/use-pick-flow'
import { PickWorkStep } from './pick/work-step'

/**
 * PDA 拣货（《PDA拣货前端Demo版PRD》）：选任务 → 按库位逐站扫库位、扫商品计数（数满自动下架、自动跳下一站）
 * → 缺货上报 → 全部拣完后提交任务。确认即下架，提交只结束进度（拣货任务主PRD §三）。
 */
export function PdaPickPage() {
  const flow = usePickFlow()
  switch (flow.nav.step) {
    case 'work':
      return <PickWorkStep flow={flow} />
    case 'short':
      return <PickShortStep flow={flow} />
    case 'done':
      return <PickDoneStep flow={flow} />
    default:
      return <PickListStep flow={flow} />
  }
}
