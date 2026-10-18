import { ReceiveBoxStep } from './receive/box-step'
import { ReceiveContainerStep } from './receive/container-step'
import { ReceiveLineStep } from './receive/line-step'
import { ReceiveNewSkuStep } from './receive/new-sku-measure-step'
import { ReceiveOrderStep } from './receive/order-step'
import { ReceiveSubmitStep } from './receive/submit-step'
import { useReceiveFlow } from './receive/use-receive-flow'

/**
 * PDA 收货（《PDA收货前端Demo版PRD》）：选单 → 扫容器 → 容器作业 → 本行录入 → 提交收货。
 * 一次作业可新增多个容器，录入随时暂存在本机；提交时可只勾选部分容器，一次提交生成一条收货记录。
 */
export function PdaReceivePage() {
  const flow = useReceiveFlow()
  switch (flow.nav.step) {
    case 'container':
      return <ReceiveContainerStep flow={flow} />
    case 'box':
      return <ReceiveBoxStep flow={flow} />
    case 'line':
      return <ReceiveLineStep flow={flow} />
    case 'measure':
      return <ReceiveNewSkuStep flow={flow} />
    case 'submit':
      return <ReceiveSubmitStep flow={flow} />
    default:
      return <ReceiveOrderStep flow={flow} />
  }
}
