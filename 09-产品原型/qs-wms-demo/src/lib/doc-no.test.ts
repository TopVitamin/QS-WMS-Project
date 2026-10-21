import { describe, expect, it } from 'vitest'
import { nextDocNo } from './doc-no'

describe('nextDocNo', () => {
  it('按前缀与 UTC 日期生成四位流水，四仓共用序列', () => {
    expect(nextDocNo('IB', ['IB-20261021-0009', 'OB-20261021-0099'], '2026-10-21T10:00:00.000Z')).toBe(
      'IB-20261021-0010',
    )
  })

  it('超过 9999 自动扩为五位，不截断已有序号', () => {
    expect(nextDocNo('IB', ['IB-20261021-9999'], '2026-10-21T10:00:00.000Z')).toBe('IB-20261021-10000')
    expect(nextDocNo('IB', ['IB-20261021-9999', 'IB-20261021-10000'], '2026-10-21T10:00:00.000Z')).toBe(
      'IB-20261021-10001',
    )
  })
})
