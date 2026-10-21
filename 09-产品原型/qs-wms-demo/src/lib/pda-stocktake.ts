import type { DiscoveryStage } from '@/types/inventory'
import type { SkuAllocationControl } from '@/types/outbound'

const STAGES: DiscoveryStage[] = [
  'PICK_SHORTAGE',
  'VERIFY_SHORT',
  'PUTAWAY_MISSING',
  'PUTBACK_MISSING',
  'MOVE_MISMATCH',
]

/**
 * 待核对来源 → 发现环节（盘点单主PRD 第一节）：拣货缺货记拣货任务号，复核少件记退拣生成的返库上架单号，
 * 上架找不到记上架单号；PDA 现场上报（如移库）记「环节@库位」。
 */
export function discoveryOf(source: string): { stage: DiscoveryStage; sourceNo?: string; locationCode?: string } {
  const [head, location] = source.split('@')
  if (location && STAGES.includes(head as DiscoveryStage))
    return { stage: head as DiscoveryStage, locationCode: location }
  const prefix = source.split('-')[0]
  const stage: DiscoveryStage = prefix === 'PB' ? 'VERIFY_SHORT' : prefix === 'PA' ? 'PUTAWAY_MISSING' : 'PICK_SHORTAGE'
  return { stage, sourceNo: source }
}

/** 从待核对商品去发起盘点的路由参数：带最近一次发现的环节、原单号或库位 */
export function discoveryStartParams(c: SkuAllocationControl): Record<string, string> {
  const last = discoveryOf(c.sources[c.sources.length - 1] ?? '')
  return {
    owner: c.customerId,
    sku: c.skuCode,
    stage: last.stage,
    ...(last.sourceNo ? { source: last.sourceNo } : {}),
    ...(last.locationCode ? { loc: last.locationCode } : {}),
  }
}
