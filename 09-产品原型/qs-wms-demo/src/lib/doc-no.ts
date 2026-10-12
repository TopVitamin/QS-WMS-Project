/**
 * Demo 单号规则（主 PRD Q04 已确认口径）：
 * `RK/RC/PA/EX-yyyyMMdd-四位流水`，按自然日（UTC）流水。
 * 正式全局编码规则另行确认后替换。
 */
export type DocPrefix = 'RK' | 'RC' | 'PA' | 'EX'

export function docNoDate(at: Date | string = new Date()): string {
  const d = typeof at === 'string' ? new Date(at) : at
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

export function nextDocNo(prefix: DocPrefix, existing: string[], at: Date | string = new Date()): string {
  const day = docNoDate(at)
  const head = `${prefix}-${day}-`
  const max = existing
    .filter((no) => no.startsWith(head))
    .map((no) => Number(no.slice(head.length, head.length + 4)))
    .filter((n) => !Number.isNaN(n))
    .reduce((m, n) => Math.max(m, n), 0)
  return `${head}${String(max + 1).padStart(4, '0')}`
}
