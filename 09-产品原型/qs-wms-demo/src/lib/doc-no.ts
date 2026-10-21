/**
 * Demo 单号规则（《单据术语与生成规则》已确认口径）：
 * `IB/RC/PA/EX/NS/UG/OB/WV/PK/VR/PB/HO/ST/MV/RT/RR-yyyyMMdd-流水`，
 * 按自然日（UTC）流水，四仓共用序列；同一天超过 9999 张时自动扩为 5 位。
 */
export type DocPrefix =
  | 'IB'
  | 'RC'
  | 'PA'
  | 'EX'
  | 'NS'
  | 'UG'
  | 'OB'
  | 'WV'
  | 'PK'
  | 'VR'
  | 'PB'
  | 'HO'
  | 'ST'
  | 'MV'
  | 'RT'
  | 'RR'

export function docNoDate(at: Date | string = new Date()): string {
  const d = typeof at === 'string' ? new Date(at) : at
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

export function nextDocNo(prefix: DocPrefix, existing: string[], at: Date | string = new Date()): string {
  const day = docNoDate(at)
  const head = `${prefix}-${day}-`
  const max = existing
    .filter((no) => no.startsWith(head))
    .map((no) => Number(no.slice(head.length)))
    .filter((n) => Number.isInteger(n) && n > 0)
    .reduce((m, n) => Math.max(m, n), 0)
  /** 四位起，超过 9999 自动扩位；不截断已有序号 */
  return `${head}${String(max + 1).padStart(4, '0')}`
}
