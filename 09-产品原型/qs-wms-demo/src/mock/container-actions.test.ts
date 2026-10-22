import { beforeEach, describe, expect, it } from 'vitest'
import { useDb } from './db'
import { findContainer } from './container-actions'

function resetDb() {
  localStorage.clear()
  useDb.getState().resetDemo()
}

describe('容器档案', () => {
  beforeEach(resetDb)

  it('新增、编辑容量和停用容器', () => {
    const created = useDb.getState().createContainer({
      warehouseCode: 'US-LA-01',
      containerNo: 'CT-TEST-001',
      containerType: 'PALLET',
      source: 'INTERNAL',
      customerId: 'C10028',
      maxPieces: 100,
      maxWeightKg: 50,
    })
    expect(created).toEqual({ ok: true })
    let row = findContainer(useDb.getState().containers, 'US-LA-01', 'CT-TEST-001')!
    expect(row).toMatchObject({ status: 'IDLE', maxPieces: 100 })

    expect(useDb.getState().updateContainer({
      warehouseCode: 'US-LA-01',
      containerNo: 'CT-TEST-001',
      containerType: 'PALLET',
      maxPieces: 120,
    })).toEqual({ ok: true })
    row = findContainer(useDb.getState().containers, 'US-LA-01', 'CT-TEST-001')!
    expect(row.maxPieces).toBe(120)

    expect(useDb.getState().setContainerStatus({
      warehouseCode: 'US-LA-01',
      containerNo: 'CT-TEST-001',
      status: 'DISABLED',
    })).toEqual({ ok: true })
    expect(findContainer(useDb.getState().containers, 'US-LA-01', 'CT-TEST-001')!.status).toBe('DISABLED')
    expect(useDb.getState().bindContainer({
      warehouseCode: 'US-LA-01',
      customerId: 'C10028',
      containerNo: 'CT-TEST-001',
      operator: 'tester',
    })).toMatchObject({ ok: false, errorKey: 'container.error.disabled' })
  })

  it('容器货主不符时阻断绑定', () => {
    expect(useDb.getState().createContainer({
      warehouseCode: 'US-LA-01',
      containerNo: 'CT-TEST-003',
      containerType: 'CARTON',
      source: 'EXTERNAL_LABEL',
      customerId: 'C10028',
    })).toEqual({ ok: true })
    expect(useDb.getState().bindContainer({
      warehouseCode: 'US-LA-01',
      customerId: 'C10031',
      containerNo: 'CT-TEST-003',
      operator: 'tester',
    })).toMatchObject({ ok: false, errorKey: 'container.error.ownerMismatch' })
  })

  it('收货自动建档，上架提交后更新为在库并记当前库位', () => {
    const pushed = useDb.getState().mockPushInboundInstruction({
      customerId: 'C10028',
      warehouseCode: 'US-LA-01',
      bizType: 'NORMAL',
      upstreamNo: 'OMS-IN-CONTAINER-TEST',
      containerNo: 'CT-TEST-002',
      items: [{ skuCode: 'CABLE-01', plannedQty: 2 }],
    })
    expect(pushed.ok).toBe(true)
    expect(useDb.getState().submitContainerReceipt({
      inboundNo: pushed.inboundNo!,
      containerNo: 'CT-TEST-002',
      lines: [{ skuCode: 'CABLE-01', goodQty: 2, defectQty: 0 }],
      operator: 'tester',
    })).toEqual({ ok: true })

    const receiving = findContainer(useDb.getState().containers, 'US-LA-01', 'CT-TEST-002')!
    expect(receiving.status).toBe('PUTAWAYING')
    const putaway = useDb.getState().putawayOrders.find(
      (p) => p.sourceNo === pushed.inboundNo && p.containerNo === 'CT-TEST-002' && p.qualityType === 'GOOD',
    )!
    expect(putaway).toBeTruthy()
    expect(useDb.getState().savePutawayLine({
      putawayNo: putaway.putawayNo,
      locationCode: 'A-01-01',
      planLineNo: 1,
      qty: 2,
      operator: 'tester',
    })).toEqual({ ok: true })
    expect(useDb.getState().submitPutawayOrder({ putawayNo: putaway.putawayNo, operator: 'tester' })).toEqual({ ok: true })

    const inStock = findContainer(useDb.getState().containers, 'US-LA-01', 'CT-TEST-002')!
    expect(inStock.status).toBe('IN_STOCK')
    expect(inStock.currentLocationCode).toBe('A-01-01')
  })
})
