import { PutawayDoneStep } from './putaway/done-step'
import { PutawayListStep } from './putaway/list-step'
import { usePutawayFlow } from './putaway/use-putaway-flow'
import { PutawayWorkStep } from './putaway/work-step'

/**
 * PDA 上架（《PDA上架前端Demo版PRD》）：选上架单 → 按推荐库位逐站扫目标库位、扫商品计数
 * （数满自动保存落位、本站放完自动跳下一站）→ 全部落完后整单提交。
 * 保存只记进度不动库存；提交时库存从收货暂存库位移到目标库位（上架单主PRD 第三节）。
 */
export function PdaPutawayPage() {
  const flow = usePutawayFlow()
  switch (flow.nav.step) {
    case 'work':
      return <PutawayWorkStep flow={flow} />
    case 'done':
      return <PutawayDoneStep flow={flow} />
    default:
      return <PutawayListStep flow={flow} />
  }
}
