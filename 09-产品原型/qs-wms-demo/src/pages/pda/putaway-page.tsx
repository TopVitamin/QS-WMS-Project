import { PutawayListStep } from './putaway/list-step'
import { PutawayPlaceStep } from './putaway/place-step'
import { usePutawayFlow } from './putaway/use-putaway-flow'
import { PutawayWorkStep } from './putaway/work-step'

/**
 * PDA 上架（《PDA上架前端Demo版PRD》）：选上架单 → 扫目标货位 → 选商品与数量保存落位 → 全部落完后提交。
 * 保存只记进度不动库存；提交时库存从收货暂存库位移到目标货位（主 PRD R10）。
 */
export function PdaPutawayPage() {
  const flow = usePutawayFlow()
  switch (flow.nav.step) {
    case 'work':
      return <PutawayWorkStep flow={flow} />
    case 'place':
      return <PutawayPlaceStep flow={flow} />
    default:
      return <PutawayListStep flow={flow} />
  }
}
