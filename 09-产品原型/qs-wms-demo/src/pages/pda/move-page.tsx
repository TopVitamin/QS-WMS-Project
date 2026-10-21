import { MoveConfirmStep } from './move/confirm-step'
import { MoveDoneStep } from './move/done-step'
import { MoveItemStep } from './move/item-step'
import { MoveLinesStep } from './move/lines-step'
import { MoveSourceStep } from './move/source-step'
import { MoveTargetStep } from './move/target-step'
import { useMoveFlow } from './move/use-move-flow'

/**
 * PDA 移库（《PDA移库前端Demo版PRD》）：扫源位 → 扫商品／SN → 数量与目标位 → 待提交清单 → 确认提交。
 * 一次提交可含多行，整次成功才生成一条移库作业，每行源减目标增成对记账；管理端只查询，不下发任务。
 */
export function PdaMovePage() {
  const flow = useMoveFlow()
  switch (flow.nav.step) {
    case 'item':
      return <MoveItemStep flow={flow} />
    case 'target':
      return <MoveTargetStep flow={flow} />
    case 'lines':
      return <MoveLinesStep flow={flow} />
    case 'confirm':
      return <MoveConfirmStep flow={flow} />
    case 'done':
      return <MoveDoneStep flow={flow} />
    default:
      return <MoveSourceStep flow={flow} />
  }
}
