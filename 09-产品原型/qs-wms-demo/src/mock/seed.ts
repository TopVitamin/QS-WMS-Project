import { createCarrierMasters } from './carrier-masters'
import { createOutboundSeed, playOutboundSeedFlows } from './outbound-seed'
import { playInventorySeedFlows } from './inventory-seed'
import type { InventoryCount, StockMove } from '@/types/inventory'
import type { OutboundData } from '@/types/outbound'
import { createChannelMasters } from './channel-masters'
import { createCustomerMasters, customerMastersToLegacy } from './customer-masters'
import type {
  AuditLog,
  CarrierMaster,
  ChannelMaster,
  Customer,
  CustomerMaster,
  CurrencyCode,
  InboundOrder,
  InventoryLog,
  InventoryRecord,
  Location,
  LocationMaster,
  ZoneMaster,
  Sku,
  SkuBarcode,
  SkuMaster,
  Warehouse,
  WarehouseMaster,
} from '@/types/wms'
import { createInboundDemoBundle } from './inbound-seed'
import { createNewSkuSeed, createUnclaimedSeed } from './inbound-extra-seed'
import { createReturnSeed } from './return-seed'
import { createLocationMasters } from './location-masters'
import { createSkuMasters } from './sku-masters'
import { createWarehouseMasters } from './warehouse-masters'
import { createZoneMasters } from './zone-masters'
import { stagingLocationCode } from '@/lib/inbound-derive'
import { zoneTypeToLocationType } from '@/lib/location-master'
import type { InboundResult, NewSkuRecord, UnclaimedRecord } from '@/types/inbound'
import type { ReturnData } from '@/types/return'

/** 固定种子的伪随机数，保证每次重置后演示数据一致 */
function createRandom(seed: number) {
  let s = seed
  const next = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)],
  }
}

const pad = (n: number, len = 4) => String(n).padStart(len, '0')

export const warehouses: Warehouse[] = [
  {
    code: 'US-LA-01',
    nameKey: 'warehouse.US-LA-01',
    countryCode: 'US',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    unitSystem: 'imperial',
    defaultReceiptMethod: 'CONTAINER',
    receivingStagingLocation: 'STAGE-IN-01',
    outboundStagingLocation: 'STAGE-OUT-01',
  },
  {
    code: 'US-NJ-01',
    nameKey: 'warehouse.US-NJ-01',
    countryCode: 'US',
    timezone: 'America/New_York',
    currency: 'USD',
    unitSystem: 'imperial',
    defaultReceiptMethod: 'CONTAINER',
    receivingStagingLocation: 'STAGE-IN-01',
    outboundStagingLocation: 'STAGE-OUT-01',
  },
  {
    code: 'DE-FRA-01',
    nameKey: 'warehouse.DE-FRA-01',
    countryCode: 'DE',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    unitSystem: 'metric',
    defaultReceiptMethod: 'LTL',
    receivingStagingLocation: 'STAGE-IN-01',
    outboundStagingLocation: 'STAGE-OUT-01',
  },
  {
    code: 'HK-WH-01',
    nameKey: 'warehouse.HK-WH-01',
    countryCode: 'HK',
    timezone: 'Asia/Hong_Kong',
    currency: 'HKD',
    unitSystem: 'metric',
    defaultReceiptMethod: 'EXPRESS',
    receivingStagingLocation: 'STAGE-IN-01',
    outboundStagingLocation: 'STAGE-OUT-01',
  },
]

export const customerMasters = createCustomerMasters()
export const customers: Customer[] = customerMastersToLegacy(customerMasters)

/** 汇率：1 单位外币 = x CNY（演示用固定汇率） */
export const exchangeRatesToCny: Record<CurrencyCode, number> = {
  CNY: 1,
  HKD: 0.91,
  USD: 7.12,
  EUR: 7.78,
  GBP: 9.05,
  JPY: 0.048,
}

const productNames: Record<string, string[]> = {
  C10028: ['USB-C Charger 65W', 'Magnetic Power Bank 10000mAh', 'Braided Lightning Cable 2m', 'Wireless Earbuds Pro', 'Car Phone Mount'],
  C10031: ['Linen Throw Pillow Cover', 'Ceramic Plant Pot Set', 'LED Desk Lamp', 'Bamboo Storage Box', 'Blackout Curtain 52x84'],
  C10045: ['Automatic Pet Feeder 4L', 'Cat Scratching Post', 'Dog Chew Toy Set', 'Pet Grooming Brush', 'Collapsible Dog Bowl'],
  C10052: ['Vitamin C Serum 30ml', 'Hair Straightener Brush', 'Makeup Brush Set 12pcs', 'Facial Cleansing Device', 'LED Makeup Mirror'],
  C10067: ['Hiking Backpack 40L', 'Camping Lantern', 'Trekking Poles Pair', 'Insulated Water Bottle 1L', 'Folding Camp Chair'],
  C10073: ['Magnetic Building Tiles 60pcs', 'RC Stunt Car', 'Kids Drawing Tablet', 'Plush Dinosaur 30cm', 'Wooden Puzzle Set'],
}

function buildSkus(): Sku[] {
  const r = createRandom(7)
  const list: Sku[] = []
  customers.forEach((c) => {
    const names = productNames[c.id]
    if (!names?.length) return
    names.forEach((name, i) => {
      const sku: Sku = {
        code: `${c.code}-${pad(i + 1, 3)}`,
        customerId: c.id,
        name,
        barcode: `69${pad(r.int(10000, 99999), 5)}${pad(r.int(100000, 999999), 6)}`,
        weightG: r.int(80, 2400),
        lengthCm: r.int(8, 60),
        widthCm: r.int(6, 40),
        heightCm: r.int(3, 30),
        declaredValue: { amount: r.int(3, 80) + 0.99, currency: 'USD' },
      }
      // 演示海外仓字段（不影响现有 seed 结构）
      if (c.code === 'ANKR' && i < 2) {
        sku.fnsku = `X00${pad(r.int(100000, 999999), 6)}`
        sku.asin = `B0${pad(r.int(10000000, 99999999), 8)}`
      }
      list.push(sku)
    })
  })
  return list
}

function buildLocations(): Location[] {
  const list: Location[] = []
  warehouses.forEach((w) => {
    list.push({ code: 'STAGE-IN-01', warehouseCode: w.code, zone: 'STAGE', type: 'STAGING' })
    list.push({ code: 'DEFECT-01', warehouseCode: w.code, zone: 'DEFECT', type: 'DEFECT' })
    /** 异常处理库位：无主货、超收等没有入账的实物统一放这里（不参与库存，也不作上架目标） */
    list.push({ code: 'EX-01-01', warehouseCode: w.code, zone: 'EXCEPTION', type: 'EXCEPTION' })
    list.push({ code: 'EX-01-02', warehouseCode: w.code, zone: 'EXCEPTION', type: 'EXCEPTION' })
    ;['A', 'B', 'C'].forEach((zone) => {
      for (let row = 1; row <= 4; row++) {
        for (let level = 1; level <= 3; level++) {
          list.push({
            code: `${zone}-${pad(row, 2)}-${pad(level, 2)}`,
            warehouseCode: w.code,
            zone,
            type: zone === 'A' ? 'PICK' : 'STORAGE',
          })
        }
      }
    })
  })
  return list
}

export interface SeedData extends OutboundData, ReturnData {
  warehouses: Warehouse[]
  warehouseMasters: WarehouseMaster[]
  zoneMasters: ZoneMaster[]
  locationMasters: LocationMaster[]
  carrierMasters: CarrierMaster[]
  channelMasters: ChannelMaster[]
  customerMasters: CustomerMaster[]
  customers: Customer[]
  skus: Sku[]
  skuMasters: SkuMaster[]
  skuBarcodes: SkuBarcode[]
  locations: Location[]
  inbounds: InboundOrder[]
  receiptRecords: import('@/types/inbound').ReceiptRecord[]
  putawayOrders: import('@/types/inbound').PutawayOrder[]
  inboundExceptions: import('@/types/inbound').InboundException[]
  inboundMessages: import('@/types/inbound').InboundMessage[]
  inboundResults: import('@/types/inbound').InboundResult[]
  newSkuRecords: NewSkuRecord[]
  unclaimedRecords: UnclaimedRecord[]
  inventory: InventoryRecord[]
  inventoryLogs: InventoryLog[]
  /** 盘点单 */
  inventoryCounts: InventoryCount[]
  /** 移库作业 */
  stockMoves: StockMove[]
  auditLogs: AuditLog[]
}

export function createSeedData(): SeedData {
  const customerMasters = createCustomerMasters()
  const customersList = customerMastersToLegacy(customerMasters)
  const skus = buildSkus()
  const { skuMasters, skuBarcodes } = createSkuMasters(customers, skus)
  const zoneMasters = createZoneMasters()
  const locationMasters = createLocationMasters()
  const locations = buildLocations()
  /** 主数据样例货位同步投影到作业库位，保证“资料里能看到的货位”也能被上架/盘点引用 */
  locationMasters.forEach((m) => {
    if (!locations.some((l) => l.warehouseCode === m.warehouseCode && l.code === m.code)) {
      locations.push({
        code: m.code,
        warehouseCode: m.warehouseCode,
        zone: m.zoneCode,
        type: zoneTypeToLocationType(m.zoneType),
        status: m.status,
      })
    }
  })
  const inventory: InventoryRecord[] = []
  const inventoryLogs: InventoryLog[] = []
  const inboundBundle = createInboundDemoBundle()
  const inbounds: InboundOrder[] = [...inboundBundle.inbounds]
  const receiptRecords = [...inboundBundle.receiptRecords]
  const putawayOrders = [...inboundBundle.putawayOrders]
  const inboundExceptions = [...inboundBundle.inboundExceptions]
  const inboundMessages: import('@/types/inbound').InboundMessage[] = []
  const inboundResults: InboundResult[] = inbounds
    .filter((o) => o.status === 'COMPLETED')
    .map((o) => ({
      inboundNo: o.inboundNo,
      upstreamNo: o.upstreamNo,
      status: 'SENT' as const,
      attempts: 1,
      items: o.items.map((l) => ({
        skuCode: l.skuCode,
        receivedQty: l.receivedQty,
        rejectedQty: l.rejectedQty,
        putawayQty: l.putawayQty,
      })),
      at: o.completedAt ?? o.updatedAt,
    }))
  const returnOrders = createReturnSeed()
  const newSkuRecords = createNewSkuSeed()
  const unclaimedRecords = createUnclaimedSeed()
  const auditLogs: AuditLog[] = []

  // 库存按子记录推导：已提交上架单 → 目标库位；已收未上架余量 → 收货暂存库位（不良品品质锁定）
  const inventoryIndex = new Map<string, number>()
  const addInventory = (row: {
    warehouseCode: string
    locationCode: string
    customerId: string
    skuCode: string
    qualityType: InventoryRecord['qualityType']
    qty: number
    lockedQty: number
    at: string
    /** SN 商品随落位带上序列号，出库按件拣货时才对得上实物 */
    serialNos?: string[]
  }) => {
    if (row.qty <= 0) return
    const key = `${row.warehouseCode}::${row.locationCode}::${row.customerId}::${row.skuCode}::${row.qualityType}`
    const idx = inventoryIndex.get(key)
    if (idx !== undefined) {
      const prev = inventory[idx]
      inventory[idx] = {
        ...prev,
        onHandQty: prev.onHandQty + row.qty,
        lockedQty: prev.lockedQty + row.lockedQty,
        ...(row.serialNos?.length ? { serialNos: [...(prev.serialNos ?? []), ...row.serialNos] } : {}),
      }
      return
    }
    inventoryIndex.set(key, inventory.length)
    inventory.push({
      id: `INV-SEED-${inventory.length + 1}`,
      warehouseCode: row.warehouseCode,
      locationCode: row.locationCode,
      customerId: row.customerId,
      skuCode: row.skuCode,
      qualityType: row.qualityType,
      onHandQty: row.qty,
      lockedQty: row.lockedQty,
      firstInboundAt: row.at,
      ...(row.serialNos?.length ? { serialNos: [...row.serialNos] } : {}),
    })
  }

  putawayOrders
    .filter((p) => p.status === 'COMPLETED')
    .forEach((p) => {
      p.actualLines
        .filter((a) => a.submitted)
        .forEach((a) => {
          addInventory({
            warehouseCode: p.warehouseCode,
            locationCode: a.locationCode,
            customerId: p.customerId,
            skuCode: a.skuCode,
            qualityType: p.qualityType,
            qty: a.qty,
            lockedQty: p.qualityType === 'DEFECTIVE' ? a.qty : 0,
            at: p.submittedAt ?? p.createdAt,
            serialNos: a.serialNos,
          })
        })
    })

  inbounds
    .filter((o) => o.status !== 'CANCELLED')
    .forEach((o) => {
      const submittedByQuality = new Map<string, number>()
      putawayOrders
        .filter((p) => p.sourceType === 'INBOUND' && p.sourceNo === o.inboundNo && p.status === 'COMPLETED')
        .forEach((p) => {
          p.actualLines
            .filter((a) => a.submitted)
            .forEach((a) => {
              const key = `${a.skuCode}::${p.qualityType}`
              submittedByQuality.set(key, (submittedByQuality.get(key) ?? 0) + a.qty)
            })
        })
      const stagingCode = stagingLocationCode(locations, o.warehouseCode)
      const at = o.firstArrivalAt ?? o.updatedAt
      o.items.forEach((item) => {
        const goodLeft = item.goodQty - (submittedByQuality.get(`${item.skuCode}::GOOD`) ?? 0)
        const defectLeft = item.defectQty - (submittedByQuality.get(`${item.skuCode}::DEFECTIVE`) ?? 0)
        addInventory({
          warehouseCode: o.warehouseCode,
          locationCode: stagingCode,
          customerId: o.customerId,
          skuCode: item.skuCode,
          qualityType: 'GOOD',
          qty: goodLeft,
          lockedQty: 0,
          at,
        })
        addInventory({
          warehouseCode: o.warehouseCode,
          locationCode: stagingCode,
          customerId: o.customerId,
          skuCode: item.skuCode,
          qualityType: 'DEFECTIVE',
          qty: defectLeft,
          lockedQty: defectLeft,
          at,
        })
      })
    })

  inbounds.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // 少量历史审计记录，便于详情页演示
  inbounds
    .filter((o) => o.status === 'COMPLETED')
    .slice(0, 3)
    .forEach((o) => {
      auditLogs.push(
        {
          id: `AUD-SEED-${o.inboundNo}-PUT`,
          refType: 'INBOUND',
          refNo: o.inboundNo,
          action: 'PUTAWAY',
          operator: 'system',
          detail: o.items.map((i) => `${i.skuCode}×${i.putawayQty}`).join(', '),
          createdAt: o.updatedAt,
        },
      )
    })

  const withOutbound = playOutboundSeedFlows({
    ...createOutboundSeed(inventory, locations, skuMasters, warehouses.map(w => w.code)),
    warehouses,
    warehouseMasters: createWarehouseMasters(),
    zoneMasters,
    locationMasters,
    carrierMasters: createCarrierMasters(),
    channelMasters: createChannelMasters(),
    customerMasters,
    customers: customersList,
    skus,
    skuMasters,
    skuBarcodes,
    locations,
    inbounds,
    receiptRecords,
    putawayOrders,
    inboundExceptions,
    inboundMessages,
    inboundResults,
    returnOrders,
    returnReceipts: [],
    returnExceptions: [],
    returnResults: [],
    newSkuRecords,
    unclaimedRecords,
    inventory,
    inventoryLogs,
    inventoryCounts: [],
    stockMoves: [],
    auditLogs,
  })
  return playInventorySeedFlows(withOutbound)
}
