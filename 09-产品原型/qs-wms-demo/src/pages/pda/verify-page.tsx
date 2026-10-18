import { useVerifyFlow } from './verify/use-verify-flow'
import { VerifyListStep } from './verify/list-step'
import { VerifyPackStep } from './verify/pack-step'
import { VerifyScanStep } from './verify/scan-step'

/**
 * PDA 复核（《PDA复核前端Demo版PRD》）：选出库单 → 逐件扫商品或序列号（扫齐自动进入装箱）
 * → 选复核方式与容器、扫容器号 → 提交成一条复核记录。与复核工作台共用行、默认装箱与校验口径。
 */
export function PdaVerifyPage() {
  const flow = useVerifyFlow()
  switch (flow.nav.step) {
    case 'scan':
      return <VerifyScanStep flow={flow} />
    case 'pack':
      return <VerifyPackStep flow={flow} />
    default:
      return <VerifyListStep flow={flow} />
  }
}
