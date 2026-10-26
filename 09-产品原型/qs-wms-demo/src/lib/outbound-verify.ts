import { orderAssignments, verificationRemaining } from '@/mock/outbound-actions'
import type { SeedData } from '@/mock/seed'
import type { WebVerifyLine, WebVerifySession } from '@/stores/web-verify-session'
import type { OutboundOrder, OutboundVerification } from '@/types/outbound'
import type { ContainerMaster } from '@/types/wms'
import { fbaContainerIssue } from './outbound-container'
import { sum } from './outbound-derive'

/**
 * 按原单复核的共用口径（复核工作台前端Demo版PRD、PDA复核前端Demo版PRD）：
 * 复核工作台与 PDA 复核用同一套行、默认装箱与扫码计数规则，提交都走 outboundAction 的 VERIFY。
 */

/** 本次复核里的一行：一条有效实拣归属 */
export interface VerifyRow {
  id: string
  itemNo: number
  skuCode: string
  batchNo?: string
  sn: boolean
  /** 尚未复核（不扣本次） */
  remaining: number
  serialsLeft: string[]
  qty: number
  serialNos: string[]
}

/** 本单还待复核的件数：已拣 − 有效已复核 */
export const toVerifyQty = (o: OutboundOrder) => sum(o.items, (i) => i.pickedQty - i.verifiedQty)

/** 本单可复核的行（有效实拣归属），叠上本次已扫的数量与序列号；没有待复核也没本次录入的行不列 */
export function verifyRows(
  db: Pick<SeedData, 'outboundPickTasks' | 'outboundVerifications' | 'skuMasters'>,
  order: OutboundOrder,
  lines: Record<string, WebVerifyLine>,
): VerifyRow[] {
  return orderAssignments(db, order.no)
    .map((a) => {
      const rest = verificationRemaining(db, a)
      const draft = lines[a.id]
      return {
        id: a.id,
        itemNo: a.itemNo,
        skuCode: a.line.skuCode,
        batchNo: a.line.batchNo,
        sn: Boolean(db.skuMasters.find((m) => m.customerId === order.customerId && m.code === a.line.skuCode)?.snEnabled),
        remaining: rest.qty,
        serialsLeft: rest.serialNos,
        qty: draft?.qty ?? 0,
        serialNos: draft?.serialNos ?? [],
      }
    })
    .filter((r) => r.remaining > 0 || r.qty > 0)
}

/** B2C 默认包裹；FBA 默认按箱复核；其他类型默认随分拣。 */
export function defaultVerifySession(order: OutboundOrder, records: OutboundVerification[]): WebVerifySession {
  const base = { lines: {}, containerNo: '', parentContainerNo: '', weight: '' }
  if (order.type === 'B2C')
    return { ...base, method: 'PACK', containerType: 'PACKAGE', containerNo: defaultPackageNo(order, records) }
  if (order.type === 'FBA') return { ...base, method: 'PACK', containerType: 'BOX' }
  if (records.some((v) => v.method === 'SORT')) return { ...base, method: 'PACK', containerType: 'BOX' }
  return { ...base, method: 'SORT', containerType: 'NONE' }
}

/** 持久化的旧草稿也按当前业务规则展示。 */
export function normalizeVerifySession(
  order: OutboundOrder,
  records: OutboundVerification[],
  draft?: WebVerifySession,
): WebVerifySession {
  const session = draft ?? defaultVerifySession(order, records)
  if (order.type === 'FBA') {
    return {
      ...session,
      method: 'PACK',
      containerType: session.containerType === 'BOX' || session.containerType === 'PALLET' ? session.containerType : 'BOX',
      weight: '',
      parentContainerNo: session.parentContainerNo ?? '',
    }
  }
  return { ...session, parentContainerNo: session.parentContainerNo ?? '' }
}

export function defaultPackageNo(order: OutboundOrder, records: OutboundVerification[]) {
  const packages = records.filter((v) => v.containerType === 'PACKAGE').length
  return packages ? `PKG-${order.no}-${packages + 1}` : `PKG-${order.no}`
}

/** 提交前的装箱校验（与 VERIFY 动作一致）；返回出错项的文案键与参数，通过返回 undefined */
export function verifyPackProblem(
  order: OutboundOrder,
  session: WebVerifySession,
  records: OutboundVerification[],
  containers: ContainerMaster[] = [],
): { key: string; params?: Record<string, string> } | undefined {
  if (order.type === 'FBA' && (session.method !== 'PACK' || !['BOX', 'PALLET'].includes(session.containerType)))
    return { key: 'stationFbaType' }
  if (session.containerType !== 'NONE' && !session.containerNo.trim())
    return { key: 'stationContainerNo', params: { type: session.containerType } }
  if (order.type === 'FBA') {
    const issue = fbaContainerIssue(containers, {
      warehouseCode: order.warehouseCode,
      customerId: order.customerId,
      orderNo: order.no,
      containerType: session.containerType as 'BOX' | 'PALLET',
      containerNo: session.containerNo,
      parentContainerNo: session.parentContainerNo,
      records,
    })
    if (issue) return { key: `stationFba${issue[0].toUpperCase()}${issue.slice(1)}` }
    if (session.weight.trim()) return { key: 'stationFbaNoWeight' }
  }
  if (session.method === 'SORT' && records.some((v) => v.method === 'SORT')) return { key: 'stationSortUsed' }
  if (order.type === 'B2C' && session.method === 'PACK' && session.containerType !== 'PACKAGE')
    return { key: 'stationB2cPackage' }
  const weight = order.type === 'B2C' && session.method === 'PACK' && session.weight.trim() ? Number(session.weight) : undefined
  if (
    (weight !== undefined && (!Number.isFinite(weight) || weight <= 0)) ||
    (order.type === 'B2C' && session.method === 'PACK' && weight === undefined)
  )
    return { key: 'stationWeight' }
  return undefined
}
