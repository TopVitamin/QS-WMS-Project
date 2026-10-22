import type { Customer, Sku, SkuBarcode, SkuMaster } from '@/types/wms'

const DEMO_AUDIT = {
  createdAt: '2026-09-01T08:00:00.000Z',
  createdBy: 'oms-mock',
  updatedAt: '2026-10-08T14:30:00.000Z',
  updatedBy: 'admin',
}

function skuFromLegacy(sku: Sku, customer: Customer, index: number): SkuMaster {
  const ts = new Date(Date.parse(DEMO_AUDIT.updatedAt) - index * 3_600_000).toISOString()
  return {
    ownerCode: customer.code,
    customerId: customer.id,
    code: sku.code,
    name: sku.name,
    unit: 'EA',
    status: 'ENABLED',
    primaryBarcode: sku.barcode,
    upstreamSkuId: `OMS-${customer.code}-${sku.code}`,
    productForm: 'SMALL',
    isBattery: false,
    snEnabled: false,
    batchEnabled: false,
    expiryEnabled: false,
    qcRequired: false,
    grossWeightKg: Math.round((sku.weightG / 1000) * 100) / 100,
    lengthCm: sku.lengthCm,
    widthCm: sku.widthCm,
    heightCm: sku.heightCm,
    createdAt: DEMO_AUDIT.createdAt,
    createdBy: DEMO_AUDIT.createdBy,
    updatedAt: ts,
    updatedBy: 'system',
  }
}

function demoSkuMasters(customers: Customer[]): SkuMaster[] {
  const ankr = customers.find((c) => c.code === 'ANKR')
  const homy = customers.find((c) => c.code === 'HOMY')
  if (!ankr || !homy) return []

  return [
    {
      ownerCode: ankr.code,
      customerId: ankr.id,
      code: 'CABLE-01',
      name: 'USB 数据线',
      nameEn: 'USB Cable',
      unit: 'EA',
      status: 'ENABLED',
      primaryBarcode: '690000000001',
      upstreamSkuId: 'OMS-ANKR-CABLE-01',
      productForm: 'SMALL',
      isBattery: false,
      snEnabled: false,
      batchEnabled: false,
      expiryEnabled: false,
      qcRequired: false,
      grossWeightKg: 0.08,
      lengthCm: 15,
      widthCm: 8,
      heightCm: 2,
      ...DEMO_AUDIT,
    },
    {
      ownerCode: homy.code,
      customerId: homy.id,
      code: 'CABLE-01',
      name: '同名不同货主',
      unit: 'EA',
      status: 'ENABLED',
      primaryBarcode: '690000000002',
      upstreamSkuId: 'OMS-HOMY-CABLE-01',
      productForm: 'SMALL',
      snEnabled: false,
      batchEnabled: false,
      expiryEnabled: false,
      qcRequired: false,
      ...DEMO_AUDIT,
      updatedAt: '2026-10-07T10:00:00.000Z',
    },

    {
      ownerCode: ankr.code,
      customerId: ankr.id,
      code: 'BIG-01',
      name: '大件家具样品',
      nameEn: 'Large furniture sample',
      unit: 'EA',
      status: 'ENABLED',
      primaryBarcode: '690000000004',
      upstreamSkuId: 'OMS-ANKR-BIG-01',
      productForm: 'LARGE',
      isBattery: false,
      snEnabled: false,
      batchEnabled: false,
      expiryEnabled: false,
      qcRequired: false,
      grossWeightKg: 12.5,
      lengthCm: 120,
      widthCm: 60,
      heightCm: 45,
      ...DEMO_AUDIT,
    },
    {
      ownerCode: ankr.code,
      customerId: ankr.id,
      code: 'ODD-01',
      name: '异形配件样品',
      nameEn: 'Irregular accessory sample',
      unit: 'EA',
      status: 'ENABLED',
      primaryBarcode: '690000000005',
      upstreamSkuId: 'OMS-ANKR-ODD-01',
      productForm: 'IRREGULAR',
      isBattery: false,
      snEnabled: false,
      batchEnabled: false,
      expiryEnabled: false,
      qcRequired: false,
      grossWeightKg: 0.6,
      lengthCm: 38,
      widthCm: 22,
      heightCm: 9,
      ...DEMO_AUDIT,
    },
    {
      ownerCode: ankr.code,
      customerId: ankr.id,
      code: 'BATT-01',
      name: '带电小家电样品',
      nameEn: 'Battery-powered gadget sample',
      unit: 'EA',
      status: 'ENABLED',
      primaryBarcode: '690000000006',
      upstreamSkuId: 'OMS-ANKR-BATT-01',
      productForm: 'SMALL',
      isBattery: true,
      snEnabled: false,
      batchEnabled: false,
      expiryEnabled: false,
      qcRequired: false,
      grossWeightKg: 0.35,
      lengthCm: 16,
      widthCm: 10,
      heightCm: 6,
      ...DEMO_AUDIT,
    },
    {
      ownerCode: ankr.code,
      customerId: ankr.id,
      code: 'SN-DEMO-01',
      name: '序列号样例',
      unit: 'EA',
      status: 'ENABLED',
      primaryBarcode: '690000000003',
      upstreamSkuId: 'OMS-ANKR-SN-DEMO-01',
      productForm: 'SMALL',
      snEnabled: true,
      snFormat: '^SN[0-9]{8}$',
      batchEnabled: false,
      expiryEnabled: false,
      qcRequired: false,
      ...DEMO_AUDIT,
      updatedAt: '2026-10-09T16:00:00.000Z',
    },
  ]
}

function barcodesForMasters(masters: SkuMaster[]): SkuBarcode[] {
  const list: SkuBarcode[] = []
  masters.forEach((m) => {
    if (!m.primaryBarcode) return
    list.push({
      id: `BC-${m.ownerCode}-${m.code}-1`,
      ownerCode: m.ownerCode,
      skuCode: m.code,
      barcode: m.primaryBarcode,
      isPrimary: true,
      status: 'ENABLED',
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })
  })
  return list
}

export function createSkuMasters(customers: Customer[], legacySkus: Sku[]): {
  skuMasters: SkuMaster[]
  skuBarcodes: SkuBarcode[]
} {
  const customerById = new Map(customers.map((c) => [c.id, c]))
  const demo = demoSkuMasters(customers)
  const demoKeys = new Set(demo.map((d) => `${d.ownerCode}::${d.code}`))

  const fromLegacy = legacySkus
    .map((sku, i) => {
      const customer = customerById.get(sku.customerId)
      if (!customer) return undefined
      const key = `${customer.code}::${sku.code}`
      if (demoKeys.has(key)) return undefined
      return skuFromLegacy(sku, customer, i)
    })
    .filter((x): x is SkuMaster => !!x)

  const skuMasters = [...demo, ...fromLegacy]
  const skuBarcodes = barcodesForMasters(skuMasters)
  return { skuMasters, skuBarcodes }
}
