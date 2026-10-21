import { beforeEach, describe, expect, it } from 'vitest'
import { useDb } from './db'
import { useSettings } from '@/stores/settings'
import type { LocationMaster, WarehouseMaster } from '@/types/wms'

function resetDb() {
  localStorage.clear()
  useDb.getState().resetDemo()
  useSettings.setState({ operator: 'tester' })
}

function warehouseInput(code: string): Omit<WarehouseMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> {
  return {
    code,
    name: '测试仓',
    timezone: 'UTC',
    currency: 'USD',
    status: 'ENABLED',
    unitSystem: 'imperial',
    defaultReceiptMethod: 'CONTAINER',
    receivingStagingLocation: 'STAGE-IN-01',
    outboundStagingLocation: 'STAGE-OUT-01',
    countryCode: 'US',
    city: 'Test City',
    address1: '1 Test Way',
  }
}

function locationInput(
  code: string,
  zoneCode: string,
): Omit<LocationMaster, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> {
  return {
    warehouseCode: 'US-LA-01',
    zoneCode,
    zoneType: 'STORAGE',
    code,
    status: 'ENABLED',
    productForms: ['SMALL'],
  }
}

describe('master data actions', () => {
  beforeEach(resetDb)

  it('update stamps the current operator but keeps code and createdAt', () => {
    const before = useDb.getState().warehouseMasters.find((w) => w.code === 'US-LA-01')!
    const { code, createdAt, createdBy, updatedAt, updatedBy: _updatedBy, ...patch } = before
    const result = useDb.getState().updateWarehouseMaster(code, { ...patch, name: '美西仓 A' })

    expect(result).toEqual({ ok: true })
    const after = useDb.getState().warehouseMasters.find((w) => w.code === code)!
    expect(after.name).toBe('美西仓 A')
    expect(after.createdAt).toBe(createdAt)
    expect(after.createdBy).toBe(createdBy)
    expect(after.updatedBy).toBe('tester')
    expect(after.updatedAt >= updatedAt).toBe(true)
  })

  it('rejects creating a fifth warehouse', () => {
    const result = useDb.getState().createWarehouseMaster(warehouseInput('US-LA-01'))
    expect(result).toEqual({ ok: false, errorKey: 'masterWarehouse.error.createDisabled' })
  })

  it('creates a location only under an enabled zone of the same warehouse', () => {
    expect(useDb.getState().createLocationMaster(locationInput('T-01-01', 'Z-OFF'))).toEqual({
      ok: false,
      errorKey: 'masterLocation.error.invalidZone',
    })

    expect(useDb.getState().createLocationMaster(locationInput('T-01-01', 'Z-STORE'))).toEqual({ ok: true })
    const created = useDb
      .getState()
      .locationMasters.find((l) => l.warehouseCode === 'US-LA-01' && l.code === 'T-01-01')!
    expect(created.zoneType).toBe('STORAGE')
    expect(created.createdBy).toBe('tester')
  })

  it('blocks disabling a location that is still occupied', () => {
    expect(useDb.getState().setLocationMasterStatus('US-LA-01', 'P-B-01', 'DISABLED')).toEqual({
      ok: false,
      errorKey: 'masterLocation.error.disableOccupied',
    })
  })

  it('rejects a barcode that another SKU already uses', () => {
    const existing = useDb.getState().skuBarcodes[0]
    const result = useDb.getState().saveSkuBarcode({
      ownerCode: existing.ownerCode,
      skuCode: existing.skuCode,
      barcode: existing.barcode,
      isPrimary: false,
      status: 'ENABLED',
    })
    expect(result).toEqual({ ok: false, errorKey: 'masterSku.error.duplicateBarcode' })
  })
})
