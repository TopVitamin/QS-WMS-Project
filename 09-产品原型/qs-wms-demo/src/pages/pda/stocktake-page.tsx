import { StocktakeCountStep } from './stocktake/count-step'
import { StocktakeItemStep } from './stocktake/item-step'
import { StocktakeListStep } from './stocktake/list-step'
import { StocktakeLocationStep } from './stocktake/location-step'
import { StocktakeReviewStep } from './stocktake/review-step'
import { useStocktakeFlow } from './stocktake/use-stocktake-flow'

/**
 * PDA 盘点（《PDA盘点前端Demo版PRD》）：选盘点单 → 扫库位 → 扫商品／SN → 录入实盘 → 核对差异保存。
 * 只录实盘、不改库存；主管确认差异与取消只在管理端。发现账实不符发起盘点见 stocktake-start-page。
 */
export function PdaStocktakePage() {
  const flow = useStocktakeFlow()
  switch (flow.nav.step) {
    case 'location':
      return <StocktakeLocationStep flow={flow} />
    case 'item':
      return <StocktakeItemStep flow={flow} />
    case 'count':
      return <StocktakeCountStep flow={flow} />
    case 'review':
      return <StocktakeReviewStep flow={flow} />
    default:
      return <StocktakeListStep flow={flow} />
  }
}
