import { QueryChooseStep } from './inventory-query/choose-step'
import { QueryResultStep } from './inventory-query/result-step'
import { QueryScanStep } from './inventory-query/scan-step'
import { useQueryFlow } from './inventory-query/use-query-flow'

/**
 * PDA 库存查询（《PDA库存查询前端Demo版PRD》）：扫库位、商品或 SN → （多个对象时整屏选择）→ 结果屏。
 * 数据与管理端库存查询共用同一套派生，不在 PDA 另存余额；页面只查询，不提供改数、移库或品质转换。
 */
export function PdaInventoryQueryPage() {
  const flow = useQueryFlow()
  switch (flow.nav.step) {
    case 'choose':
      return <QueryChooseStep flow={flow} />
    case 'result':
      return <QueryResultStep flow={flow} />
    default:
      return <QueryScanStep flow={flow} />
  }
}
