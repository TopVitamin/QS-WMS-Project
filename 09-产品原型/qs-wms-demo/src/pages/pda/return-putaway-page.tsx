import { ReturnDoneStep } from './return-putaway/done-step'
import { ReturnListStep } from './return-putaway/list-step'
import { useReturnFlow } from './return-putaway/use-return-flow'
import { ReturnWorkStep } from './return-putaway/work-step'

/**
 * PDA 返库上架（《PDA返库上架前端Demo版PRD》）：选返库单 → 按建议库位逐站扫目标库位、扫商品计数
 * （数满自动保存、自动跳下一站）→ 全部保存后整单提交移库（返库上架单主PRD §三）。
 */
export function PdaReturnPutawayPage() {
  const flow = useReturnFlow()
  switch (flow.nav.step) {
    case 'work':
      return <ReturnWorkStep flow={flow} />
    case 'done':
      return <ReturnDoneStep flow={flow} />
    default:
      return <ReturnListStep flow={flow} />
  }
}
