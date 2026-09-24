import type {
  AuditLog,
  Customer,
  CurrencyCode,
  InboundBizType,
  InboundOrder,
  InboundStatus,
  InventoryLog,
  InventoryRecord,
  LoadType,
  Location,
  OutboundPackage,
  PackageStatus,
  PutawayTask,
  Sku,
  Warehouse,
} from '@/types/wms'

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

const DAY = 24 * 60 * 60 * 1000
const pad = (n: number, len = 4) => String(n).padStart(len, '0')
const ymd = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1, 2)}${pad(d.getUTCDate(), 2)}`

export const warehouses: Warehouse[] = [
  { code: 'US-LA-01', nameKey: 'warehouse.US-LA-01', countryCode: 'US', timezone: 'America/Los_Angeles', currency: 'USD', unitSystem: 'imperial' },
  { code: 'US-NJ-01', nameKey: 'warehouse.US-NJ-01', countryCode: 'US', timezone: 'America/New_York', currency: 'USD', unitSystem: 'imperial' },
  { code: 'DE-FRA-01', nameKey: 'warehouse.DE-FRA-01', countryCode: 'DE', timezone: 'Europe/Berlin', currency: 'EUR', unitSystem: 'metric' },
  { code: 'UK-LON-01', nameKey: 'warehouse.UK-LON-01', countryCode: 'GB', timezone: 'Europe/London', currency: 'GBP', unitSystem: 'metric' },
  { code: 'JP-TYO-01', nameKey: 'warehouse.JP-TYO-01', countryCode: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY', unitSystem: 'metric' },
]

export const customers: Customer[] = [
  { id: 'C10028', code: 'ANKR', name: 'Shenzhen Anker Trading' },
  { id: 'C10031', code: 'HOMY', name: 'Homy Living Co., Ltd.' },
  { id: 'C10045', code: 'PETX', name: 'PetX Supplies' },
  { id: 'C10052', code: 'GLOW', name: 'Glow Beauty Tech' },
  { id: 'C10067', code: 'TRAK', name: 'TrailPeak Outdoor' },
  { id: 'C10073', code: 'KIDO', name: 'Kido Toys Intl.' },
]

/** 汇率：1 单位外币 = x CNY（演示用固定汇率） */
export const exchangeRatesToCny: Record<CurrencyCode, number> = {
  CNY: 1,
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
    productNames[c.id].forEach((name, i) => {
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

export interface SeedData {
  warehouses: Warehouse[]
  customers: Customer[]
  skus: Sku[]
  locations: Location[]
  inbounds: InboundOrder[]
  putawayTasks: PutawayTask[]
  inventory: InventoryRecord[]
  inventoryLogs: InventoryLog[]
  packages: OutboundPackage[]
  auditLogs: AuditLog[]
}

export function createSeedData(now = Date.now()): SeedData {
  const r = createRandom(20260924)
  const skus = buildSkus()
  const locations = buildLocations()
  const inbounds: InboundOrder[] = []
  const inventory: InventoryRecord[] = []
  const inventoryLogs: InventoryLog[] = []
  const putawayTasks: PutawayTask[] = []
  const packages: OutboundPackage[] = []
  const auditLogs: AuditLog[] = []

  const statusPool: InboundStatus[] = [
    'PENDING', 'PENDING', 'PENDING', 'ARRIVED', 'RECEIVING', 'PARTIAL_PUT',
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'ABNORMAL', 'CANCELLED',
  ]
  const bizTypes: InboundBizType[] = ['STANDARD', 'STANDARD', 'STANDARD', 'FBA_RETURN', 'TRANSFER']
  const loadTypes: LoadType[] = ['CONTAINER', 'PALLET', 'BOX']
  const serialByDay: Record<string, number> = {}

  warehouses.forEach((w, wi) => {
    const storageLocs = locations.filter((l) => l.warehouseCode === w.code && (l.type === 'PICK' || l.type === 'STORAGE'))
    const count = wi === 0 ? 90 : 30

    for (let i = 0; i < count; i++) {
      const customer = r.pick(customers)
      const customerSkus = skus.filter((s) => s.customerId === customer.id)
      const createdAt = new Date(now - r.int(0, 20) * DAY - r.int(0, 86_000) * 1000)
      const day = ymd(createdAt)
      serialByDay[day] = (serialByDay[day] ?? 0) + 1
      const inboundNo = `IN${day}${pad(serialByDay[day])}`
      // 最近 2 天创建的单据不会已经完成
      const status: InboundStatus =
        i < 4 && wi === 0 ? 'PENDING' : now - createdAt.getTime() < 2 * DAY ? r.pick(['PENDING', 'ARRIVED'] as const) : r.pick(statusPool)
      const loadType = r.pick(loadTypes)
      const itemCount = r.int(1, Math.min(4, customerSkus.length))
      const chosen = [...customerSkus].sort(() => r.next() - 0.5).slice(0, itemCount)

      const items = chosen.map((sku) => {
        const plannedQty = r.int(2, 40) * 10
        let receivedGoodQty = 0
        let receivedDefectQty = 0
        let putawayQty = 0
        if (status === 'RECEIVING') {
          receivedGoodQty = Math.floor(plannedQty * r.next() * 0.6)
        } else if (status === 'PARTIAL_PUT') {
          receivedGoodQty = plannedQty
          putawayQty = Math.floor(plannedQty * 0.5)
        } else if (status === 'COMPLETED') {
          receivedDefectQty = r.next() < 0.2 ? r.int(1, 3) : 0
          receivedGoodQty = plannedQty - receivedDefectQty
          putawayQty = receivedGoodQty
        } else if (status === 'ABNORMAL') {
          receivedGoodQty = plannedQty - r.int(5, 20)
          receivedDefectQty = r.int(1, 6)
        }
        return { skuCode: sku.code, plannedQty, receivedGoodQty, receivedDefectQty, putawayQty }
      })

      const order: InboundOrder = {
        inboundNo,
        customerId: customer.id,
        warehouseCode: w.code,
        bizType: r.pick(bizTypes),
        loadType,
        containerNo:
          loadType === 'CONTAINER'
            ? `${r.pick(['MSCU', 'CMAU', 'OOLU', 'TGHU'])}${r.int(1000000, 9999999)}`
            : `1Z${r.int(100000, 999999)}${r.int(10000000, 99999999)}`,
        plannedCartonQty: Math.max(1, Math.round(items.reduce((s, it) => s + it.plannedQty, 0) / 20)),
        etaAt: new Date(createdAt.getTime() + r.int(3, 25) * DAY).toISOString(),
        status,
        items,
        remark: r.next() < 0.2 ? 'Q4 peak season stock' : undefined,
        createdAt: createdAt.toISOString(),
        updatedAt: new Date(Math.min(now, createdAt.getTime() + r.int(1, 72) * 3600_000)).toISOString(),
      }
      inbounds.push(order)

      items.forEach((it, idx) => {
        const suggested = storageLocs[(i * 3 + idx) % storageLocs.length].code
        if (it.putawayQty > 0) {
          inventory.push({
            id: `INV-${w.code}-${inboundNo}-${idx}`,
            warehouseCode: w.code,
            locationCode: suggested,
            customerId: customer.id,
            skuCode: it.skuCode,
            qualityType: 'GOOD',
            onHandQty: it.putawayQty,
            lockedQty: r.next() < 0.3 ? r.int(1, Math.max(1, Math.floor(it.putawayQty / 5))) : 0,
            firstInboundAt: order.updatedAt,
          })
          inventoryLogs.push({
            id: `LOG-${inboundNo}-${idx}`,
            warehouseCode: w.code,
            type: 'PUTAWAY',
            refNo: inboundNo,
            skuCode: it.skuCode,
            customerId: customer.id,
            locationCode: suggested,
            qtyChange: it.putawayQty,
            operator: 'system',
            createdAt: order.updatedAt,
          })
        }
        // 异常单等待货主确认，不生成上架任务
        const pending = it.receivedGoodQty - it.putawayQty
        if (pending > 0 && status !== 'ABNORMAL') {
          putawayTasks.push({
            putawayNo: `PUT${inboundNo.slice(2)}${idx}`,
            inboundNo,
            warehouseCode: w.code,
            customerId: customer.id,
            skuCode: it.skuCode,
            qualityType: 'GOOD',
            planQty: pending,
            actualQty: 0,
            sourceLocationCode: 'STAGE-IN-01',
            suggestedLocationCode: suggested,
            status: 'PENDING',
            createdAt: order.updatedAt,
          })
        }
      })
    }

    const pkgStatus: PackageStatus[] = ['READY_PRINT', 'READY_PRINT', 'PICKING', 'PICKED', 'PACKING', 'SHIPPED', 'SHIPPED', 'SHIPPED', 'HOLD']
    const channels = w.countryCode === 'US' ? ['USPS-GA', 'UPS-GROUND', 'FEDEX-HD'] : w.countryCode === 'JP' ? ['SAGAWA', 'YAMATO'] : ['DHL-PAKET', 'DPD-CLASSIC', 'ROYALMAIL-48']
    const pkgCount = wi === 0 ? 160 : 60
    for (let i = 0; i < pkgCount; i++) {
      const createdAt = new Date(now - r.int(0, 6) * DAY - r.int(0, 86_000) * 1000)
      const day = ymd(createdAt)
      const status = now - createdAt.getTime() < DAY ? r.pick(['READY_PRINT', 'PICKING', 'PACKING'] as const) : r.pick(pkgStatus)
      packages.push({
        packageNo: `PKG${day}${w.code.slice(0, 2)}${pad(i + 1)}`,
        customerOrderNo: `ORD-${day}-${r.int(100, 999)}`,
        customerId: r.pick(customers).id,
        warehouseCode: w.code,
        channelCode: r.pick(channels),
        countryCode: w.countryCode,
        status,
        shippingFee: { amount: w.currency === 'JPY' ? r.int(600, 1800) : r.int(4, 18) + 0.5, currency: w.currency },
        createdAt: createdAt.toISOString(),
      })
    }
  })

  inbounds.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // 少量历史审计记录，便于详情页演示
  inbounds
    .filter((o) => o.status === 'COMPLETED')
    .slice(0, 3)
    .forEach((o) => {
      auditLogs.push(
        {
          id: `AUD-SEED-${o.inboundNo}-SIGN`,
          refType: 'INBOUND',
          refNo: o.inboundNo,
          action: 'INBOUND_SIGN',
          operator: 'system',
          createdAt: o.createdAt,
        },
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

  return { warehouses, customers, skus, locations, inbounds, putawayTasks, inventory, inventoryLogs, packages, auditLogs }
}
