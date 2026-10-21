import { describe, expect, it } from 'vitest'
import { createSeedData } from '@/mock/seed'
import { deriveSerials, moveTargetIssue } from './inventory-derive'
import { compareLocation, resolveInventoryScan } from './pda-inventory-scan'
import { discoveryOf, discoveryStartParams } from './pda-stocktake'

const LA = 'US-LA-01'
const NJ = 'US-NJ-01'
const seed = createSeedData()

describe('PDA 库内扫码识别（PDA库存查询 PRD）', () => {
  it('库位编码不区分大小写', () => {
    expect(resolveInventoryScan(seed, LA, ' a-01-01 ')).toEqual([
      { kind: 'location', code: 'A-01-01', usage: 'PICK', enabled: true },
    ])
  })

  it('SKU 编码命中几个货主时全部返回，由页面让人选；货主条码只命中那个货主', () => {
    const byCode = resolveInventoryScan(seed, LA, 'cable-01')
    expect(byCode.map((h) => h.kind === 'sku' && h.customerId).sort()).toEqual(['C10028', 'C10031'])
    expect(resolveInventoryScan(seed, LA, '690000000002')).toEqual([
      { kind: 'sku', customerId: 'C10031', skuCode: 'CABLE-01' },
    ])
  })

  it('SN：在库的带所在仓；已盘亏的取最后一条流水的仓（别的仓查到时由页面提示不在当前仓）', () => {
    const inStock = deriveSerials(seed, LA).find((r) => r.status === 'IN_STOCK')!
    expect(resolveInventoryScan(seed, LA, inStock.serialNo)).toEqual([
      {
        kind: 'serial',
        customerId: inStock.customerId,
        skuCode: inStock.skuCode,
        serialNo: inStock.serialNo,
        warehouseCode: LA,
      },
    ])
    const lost = deriveSerials(seed, NJ).find((r) => r.status === 'LOST')!
    expect(resolveInventoryScan(seed, LA, lost.serialNo)).toMatchObject([{ kind: 'serial', warehouseCode: NJ }])
    expect(resolveInventoryScan(seed, LA, 'NOT-A-CODE')).toEqual([])
  })

  it('库位按编号自然顺序排', () => {
    expect(['A-01-10', 'A-01-02', 'B-01-01'].sort(compareLocation)).toEqual(['A-01-02', 'A-01-10', 'B-01-01'])
  })
})

describe('移库目标库位校验（PDA 扫目标位与提交共用）', () => {
  const row = seed.inventory.find(
    (r) => r.warehouseCode === LA && r.customerId === 'C10031' && r.skuCode === 'CABLE-01',
  )!

  it('源位、暂存、不良隔离（正常品）、他货主占用分别给出原因；空存储位可放', () => {
    expect(moveTargetIssue(seed, row, row.locationCode)).toBe('SAME')
    expect(moveTargetIssue(seed, row, 'STAGE-IN-01')).toBe('TARGET')
    expect(moveTargetIssue(seed, row, 'DEFECT-01')).toBe('QUALITY')
    expect(moveTargetIssue(seed, row, 'A-01-01')).toBe('OCCUPIED')
    expect(moveTargetIssue(seed, row, 'b-02-03')).toBeUndefined()
  })
})

describe('待核对来源 → 发现环节', () => {
  it('拣货任务号、返库上架单号、上架单号和「环节@库位」各自对应', () => {
    expect(discoveryOf('PK-20261015-0003')).toEqual({ stage: 'PICK_SHORTAGE', sourceNo: 'PK-20261015-0003' })
    expect(discoveryOf('PB-20261015-0002')).toEqual({ stage: 'VERIFY_SHORT', sourceNo: 'PB-20261015-0002' })
    expect(discoveryOf('PA-20261005-0001')).toEqual({ stage: 'PUTAWAY_MISSING', sourceNo: 'PA-20261005-0001' })
    expect(discoveryOf('MOVE_MISMATCH@B-04-01')).toEqual({ stage: 'MOVE_MISMATCH', locationCode: 'B-04-01' })
  })

  it('从待核对商品发起盘点时带最近一次发现', () => {
    const control = seed.skuAllocationControls.find((c) => c.warehouseCode === LA)!
    expect(discoveryStartParams(control)).toEqual({
      owner: 'C10031',
      sku: 'HOMY-003',
      stage: 'MOVE_MISMATCH',
      loc: 'B-04-01',
    })
  })
})
