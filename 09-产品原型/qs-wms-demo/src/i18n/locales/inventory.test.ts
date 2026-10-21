import { describe, expect, it } from 'vitest'
import enUS from './en-US'
import zhCN from './zh-CN'

/** 管理端库存页面、PDA 库内作业、状态元数据里写死的库存文案键，以及库内动作的错误键 */
const sources = import.meta.glob<string>(
  [
    '../../pages/wms/inventory/*.{ts,tsx}',
    '../../pages/pda/inventory-query/*.{ts,tsx}',
    '../../pages/pda/move/*.{ts,tsx}',
    '../../pages/pda/stocktake/*.{ts,tsx}',
    '../../pages/pda/stocktake-start-page.tsx',
    '../../config/status.ts',
    '../../mock/inventory-actions.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
)

const lookup = (dict: unknown, key: string) =>
  key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
      dict,
    )
/** 带 count 的键可以只有复数形式 */
const isText = (dict: unknown, key: string) =>
  typeof lookup(dict, key) === 'string' || typeof lookup(dict, `${key}_other`) === 'string'

const keys = new Set<string>()
Object.entries(sources).forEach(([file, text]) => {
  for (const m of text.matchAll(/'((?:inventory|pdaQuery|pdaMove|pdaStocktake)\.[\w.]*\w)'/g)) keys.add(m[1])
  if (file.endsWith('inventory-actions.ts'))
    for (const m of text.matchAll(/reject\('(\w+)'/g)) keys.add(`inventory.error.${m[1]}`)
})

describe('库存与 PDA 库内文案键', () => {
  it('能扫到页面和动作里的键', () => {
    expect(keys.size).toBeGreaterThan(300)
    ;['inventory.', 'pdaQuery.', 'pdaMove.', 'pdaStocktake.'].forEach((prefix) =>
      expect(
        [...keys].some((k) => k.startsWith(prefix)),
        prefix,
      ).toBe(true),
    )
  })

  it('每个键在中英文里都是一条文案，不是缺失或分组', () => {
    const broken = [...keys].filter((key) => !isText(zhCN, key) || !isText(enUS, key))
    expect(broken).toEqual([])
  })
})
