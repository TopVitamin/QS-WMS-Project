import type { OutboundPickTask, OutboundPutback, PickLine, PutbackLine } from '@/types/outbound'

/**
 * 按库位作业的路径（拣货任务主PRD §三、返库上架单主PRD §三）：
 * PDA 拣货与返库上架都按「一个库位一站」推进，本站做完自动跳到下一站；
 * 管理端录入页按同一顺序排待录行。页面只调这里的函数，不自己分组排序。
 */

/** 库位按路径顺序排：同一巷道按编号自然顺序（A-01-02 排在 A-01-10 前） */
export const compareLocation = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

/** 应拣行剩余：应拣 − 实拣 − 上报缺货 */
export const pickLineRemaining = (l: PickLine) => l.plannedQty - l.pickedQty - l.shortageQty

export interface PickStop {
  location: string
  lines: PickLine[]
}

/** 拣货路径：还有剩余的应拣行按来源库位分组，按库位顺序排 */
export function pickStops(task: Pick<OutboundPickTask, 'lines'>): PickStop[] {
  return groupStops(
    task.lines.filter((l) => pickLineRemaining(l) > 0),
    (l) => l.locationCode,
  )
}

/** 任务涉及几个库位、已拣完几个（上下文条「库位 2/3」；换位新增的库位计入总数） */
export function pickLocationProgress(task: Pick<OutboundPickTask, 'lines'>) {
  const all = new Set(task.lines.map((l) => l.locationCode))
  const open = new Set(task.lines.filter((l) => pickLineRemaining(l) > 0).map((l) => l.locationCode))
  return { done: all.size - open.size, total: all.size }
}

/** 应拣行在管理端录入页的顺序：未完成的按路径在前，已完成的排后，各自保持库位顺序 */
export function pickLinesInRouteOrder(task: Pick<OutboundPickTask, 'lines'>): PickLine[] {
  return [...task.lines].sort(
    (a, b) =>
      Number(pickLineRemaining(a) <= 0) - Number(pickLineRemaining(b) <= 0) ||
      compareLocation(a.locationCode, b.locationCode),
  )
}

/**
 * 上报缺货后的换位结果：比较动作前后的应拣行，返回新增或加量的库位与数量。
 * 用于提示「已换位到 B-01-01 补 2 件」；为空表示没有可换位库存，差额按短拣处理。
 */
export function replacementStops(before: PickLine[], after: PickLine[]): { location: string; qty: number }[] {
  const added = new Map<string, number>()
  for (const l of after) {
    const qty = l.plannedQty - (before.find((b) => b.id === l.id)?.plannedQty ?? 0)
    if (qty > 0) added.set(l.locationCode, (added.get(l.locationCode) ?? 0) + qty)
  }
  return [...added.entries()].sort(([a], [b]) => compareLocation(a, b)).map(([location, qty]) => ({ location, qty }))
}

/** 应返库行剩余：应返库 − 已保存 */
export const putbackLineRemaining = (l: PutbackLine) => l.qty - l.savedQty

export interface PutbackStop {
  location: string
  lines: PutbackLine[]
}

/** 返库路径：还有剩余的应返库行按建议库位（原拣货库位）分组，按库位顺序排；实际可放到其他合法库位 */
export function putbackStops(putback: Pick<OutboundPutback, 'lines'>): PutbackStop[] {
  return groupStops(
    putback.lines.filter((l) => putbackLineRemaining(l) > 0),
    (l) => l.suggestedLocation,
  )
}

function groupStops<T>(lines: T[], locationOf: (line: T) => string): { location: string; lines: T[] }[] {
  const map = new Map<string, T[]>()
  for (const l of lines) map.set(locationOf(l), [...(map.get(locationOf(l)) ?? []), l])
  return [...map.entries()].sort(([a], [b]) => compareLocation(a, b)).map(([location, items]) => ({ location, lines: items }))
}

/** 当前站：已到达且还有活的那一站优先，否则路径上的第一站；下一站为当前站之后的第一站（没有则取之前的） */
export function currentAndNextStop<S extends { location: string }>(stops: S[], arrived?: string) {
  const index = Math.max(
    0,
    stops.findIndex((s) => s.location === arrived),
  )
  const current = stops[index]
  const next = stops.length > 1 ? stops[(index + 1) % stops.length] : undefined
  return { current, next, arrived: Boolean(current && current.location === arrived) }
}
