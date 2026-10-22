import { recomputeInboundOrder } from '@/lib/inbound-derive'
import type {
  InboundException,
  InboundOrder,
  InboundOrderLine,
  PutawayOrder,
  ReceiptRecord,
} from '@/types/inbound'

const WH = 'US-LA-01'
const ANKR = 'C10028'
const DAY = '2026-10-02T10:00:00.000Z'

function line(partial: Omit<InboundOrderLine, 'status'>): InboundOrderLine {
  return { ...partial, status: 'PENDING_RECEIVE' }
}

function order(
  suffix: string,
  upstreamNo: string,
  items: InboundOrderLine[],
  extra: Partial<InboundOrder> = {},
): InboundOrder {
  const base: InboundOrder = {
    inboundNo: `IB-20261002-${suffix}`,
    customerId: ANKR,
    warehouseCode: WH,
    bizType: 'NORMAL',
    upstreamNo,
    arrivalMethod: 'CONTAINER',
    containerNo: `MSCU${suffix}`,
    trackingNos: `TIB-${suffix}`,
    etaAt: '2026-10-15T08:00:00.000Z',
    receiptCloseFlag: 'NOT_CONFIRMED',
    status: 'PENDING_RECEIVE',
    items,
    createdAt: DAY,
    updatedAt: DAY,
    ...extra,
  }
  return recomputeInboundOrder(base)
}

export interface InboundDemoBundle {
  inbounds: InboundOrder[]
  receiptRecords: ReceiptRecord[]
  putawayOrders: PutawayOrder[]
  inboundExceptions: InboundException[]
}

/** 固定验收种子（US-LA-01 / ANKR），见入库单 Demo PRD §6.2；单号格式见主 PRD Q04 */
export function createInboundDemoBundle(): InboundDemoBundle {
  const receiptRecords: ReceiptRecord[] = []
  const putawayOrders: PutawayOrder[] = []
  const inboundExceptions: InboundException[] = []

  const o0001 = order(
    '0001',
    'OMS-IN-SEED-0001',
    [line({ lineNo: 1, skuCode: 'CABLE-01', plannedQty: 500, receivedQty: 0, rejectedQty: 0, goodQty: 0, defectQty: 0, putawayQty: 0 })],
    {
      arrivalMethod: 'LTL',
      containerNo: undefined,
      trackingNos: 'SF102610020001\nYT8822334455',
      remark: '演示：整单待收，可从列表 Web 端收货',
    },
  )

  let o0002 = order(
    '0002',
    'OMS-IN-SEED-0002',
    [
      line({
        lineNo: 1,
        skuCode: 'CABLE-01',
        plannedQty: 200,
        receivedQty: 0,
        rejectedQty: 200,
        goodQty: 0,
        defectQty: 0,
        putawayQty: 0,
      }),
    ],
    { firstArrivalAt: '2026-10-03T14:00:00.000Z' },
  )
  o0002 = {
    ...o0002,
    status: 'CANCELLED',
    completedAt: '2026-10-04T09:00:00.000Z',
    updatedAt: '2026-10-04T09:00:00.000Z',
    remark: '演示：全单拒收后上游取消受理（S06）',
  }
  receiptRecords.push({
    receiptNo: 'RC-20261003-0001',
    inboundNo: o0002.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-03T14:05:00.000Z',
    lines: [{ skuCode: 'CABLE-01', receivedQty: 0, rejectedQty: 200, goodQty: 0, defectQty: 0, rejectReason: 'DAMAGED' }],
  })
  inboundExceptions.push({
    exceptionNo: 'EX-20261003-0001',
    inboundNo: o0002.inboundNo,
    type: 'REJECT',
    skuCode: 'CABLE-01',
    qty: 200,
    reason: 'DAMAGED',
    receiptNo: 'RC-20261003-0001',
    createdAt: '2026-10-03T14:05:00.000Z',
  })

  const o0003Lines = [
    line({
      lineNo: 1,
      skuCode: 'CABLE-01',
      plannedQty: 1000,
      receivedQty: 600,
      rejectedQty: 5,
      goodQty: 590,
      defectQty: 10,
      putawayQty: 590,
    }),
    line({
      lineNo: 2,
      skuCode: 'SN-DEMO-01',
      plannedQty: 100,
      receivedQty: 0,
      rejectedQty: 0,
      goodQty: 0,
      defectQty: 0,
      putawayQty: 0,
    }),
  ]
  const o0003 = order('0003', 'OMS-IN-SEED-0003', o0003Lines, {
    firstArrivalAt: '2026-10-04T09:00:00.000Z',
    updatedAt: '2026-10-04T11:00:00.000Z',
  })
  receiptRecords.push({
    receiptNo: 'RC-20261004-0001',
    inboundNo: o0003.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    containerNo: 'C-A01',
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-04T09:30:00.000Z',
    lines: [
      {
        lineNo: 1,
        skuCode: 'CABLE-01',
        containerNo: 'C-A01',
        receivedQty: 600,
        rejectedQty: 5,
        goodQty: 590,
        defectQty: 10,
        rejectReason: 'LABEL_MISMATCH',
      },
    ],
  })
  inboundExceptions.push({
    exceptionNo: 'EX-20261004-0001',
    inboundNo: o0003.inboundNo,
    type: 'REJECT',
    skuCode: 'CABLE-01',
    qty: 5,
    reason: 'LABEL_MISMATCH',
    receiptNo: 'RC-20261004-0001',
    createdAt: '2026-10-04T09:30:00.000Z',
  })
  putawayOrders.push(
    {
      putawayNo: 'PA-20261004-0001',
      sourceType: 'INBOUND',
      sourceNo: o0003.inboundNo,
      stagingLocationCode: 'STAGE-IN-01',
      warehouseCode: WH,
      customerId: ANKR,
      receiptNo: 'RC-20261004-0001',
      containerNo: 'C-A01',
      qualityType: 'GOOD',
      status: 'COMPLETED',
      planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 590 }],
      actualLines: [{ lineNo: 1, planLineNo: 1, locationCode: 'A-01-01', skuCode: 'CABLE-01', qty: 590, submitted: true }],
      createdAt: '2026-10-04T10:00:00.000Z',
      submittedAt: '2026-10-04T10:30:00.000Z',
      submittedBy: 'pda.user',
    },
    {
      putawayNo: 'PA-20261004-0002',
      sourceType: 'INBOUND',
      sourceNo: o0003.inboundNo,
      stagingLocationCode: 'STAGE-IN-01',
      warehouseCode: WH,
      customerId: ANKR,
      receiptNo: 'RC-20261004-0001',
      containerNo: 'C-A01',
      qualityType: 'DEFECTIVE',
      status: 'PENDING',
      planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 10 }],
      actualLines: [],
      createdAt: '2026-10-04T10:00:00.000Z',
    },
  )
  const o0004 = order(
    '0004',
    'OMS-IN-SEED-0004',
    [
      line({
        lineNo: 1,
        skuCode: 'CABLE-01',
        plannedQty: 800,
        receivedQty: 800,
        rejectedQty: 0,
        goodQty: 800,
        defectQty: 0,
        putawayQty: 0,
      }),
    ],
    { firstArrivalAt: '2026-10-05T08:00:00.000Z', receiptCloseFlag: 'CONFIRMED', receiptClosedBy: 'admin', receiptClosedAt: '2026-10-05T12:00:00.000Z' },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261005-0001',
    inboundNo: o0004.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    containerNo: 'C-B02',
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-05T10:00:00.000Z',
    /** 同容器同SKU两个批次，按批次拆行；应上架行不按SKU合并（上架单主PRD 第一节） */
    lines: [
      {
        lineNo: 1,
        skuCode: 'CABLE-01',
        containerNo: 'C-B02',
        receivedQty: 500,
        rejectedQty: 0,
        goodQty: 500,
        defectQty: 0,
        batchNo: 'BATCH-2026-A',
      },
      {
        lineNo: 2,
        skuCode: 'CABLE-01',
        containerNo: 'C-B02',
        receivedQty: 300,
        rejectedQty: 0,
        goodQty: 300,
        defectQty: 0,
        batchNo: 'BATCH-2026-B',
      },
    ],
  })
  putawayOrders.push({
    putawayNo: 'PA-20261005-0001',
    sourceType: 'INBOUND',
    sourceNo: o0004.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261005-0001',
    containerNo: 'C-B02',
    qualityType: 'GOOD',
    status: 'PUTAWAYING',
    planLines: [
      { lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 500, batchNo: 'BATCH-2026-A' },
      { lineNo: 2, receiptLineNo: 2, skuCode: 'CABLE-01', planQty: 300, batchNo: 'BATCH-2026-B' },
    ],
    actualLines: [
      { lineNo: 1, planLineNo: 1, locationCode: 'A-02-01', skuCode: 'CABLE-01', qty: 300, submitted: false },
    ],
    createdAt: '2026-10-05T13:00:00.000Z',
  })

  const o0005 = order(
    '0005',
    'OMS-IN-SEED-0005',
    [
      line({
        lineNo: 1,
        skuCode: 'CABLE-01',
        plannedQty: 100,
        receivedQty: 94,
        rejectedQty: 4,
        goodQty: 92,
        defectQty: 2,
        putawayQty: 94,
      }),
    ],
    {
      receiptCloseFlag: 'CONFIRMED',
      receiptClosedBy: 'admin',
      receiptClosedAt: '2026-10-06T09:00:00.000Z',
      completedAt: '2026-10-06T15:00:00.000Z',
      firstArrivalAt: '2026-10-06T08:00:00.000Z',
      updatedAt: '2026-10-06T15:00:00.000Z',
    },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261006-0001',
    inboundNo: o0005.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    containerNo: 'C-C05',
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-06T08:30:00.000Z',
    lines: [
      {
        lineNo: 1,
        skuCode: 'CABLE-01',
        containerNo: 'C-C05',
        receivedQty: 94,
        rejectedQty: 4,
        goodQty: 92,
        defectQty: 2,
        rejectReason: 'DAMAGED',
      },
    ],
  })
  inboundExceptions.push({
    exceptionNo: 'EX-20261006-0001',
    inboundNo: o0005.inboundNo,
    type: 'REJECT',
    skuCode: 'CABLE-01',
    qty: 4,
    reason: 'DAMAGED',
    receiptNo: 'RC-20261006-0001',
    createdAt: '2026-10-06T08:30:00.000Z',
  })
  putawayOrders.push(
    {
      putawayNo: 'PA-20261006-0001',
      sourceType: 'INBOUND',
      sourceNo: o0005.inboundNo,
      stagingLocationCode: 'STAGE-IN-01',
      warehouseCode: WH,
      customerId: ANKR,
      receiptNo: 'RC-20261006-0001',
      containerNo: 'C-C05',
      qualityType: 'GOOD',
      status: 'COMPLETED',
      planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 92 }],
      actualLines: [{ lineNo: 1, planLineNo: 1, locationCode: 'A-01-01', skuCode: 'CABLE-01', qty: 92, submitted: true }],
      createdAt: '2026-10-06T10:00:00.000Z',
      submittedAt: '2026-10-06T14:00:00.000Z',
      submittedBy: 'pda.user',
    },
    {
      putawayNo: 'PA-20261006-0002',
      sourceType: 'INBOUND',
      sourceNo: o0005.inboundNo,
      stagingLocationCode: 'STAGE-IN-01',
      warehouseCode: WH,
      customerId: ANKR,
      receiptNo: 'RC-20261006-0001',
      containerNo: 'C-C05',
      qualityType: 'DEFECTIVE',
      status: 'COMPLETED',
      planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 2 }],
      actualLines: [{ lineNo: 1, planLineNo: 1, locationCode: 'DEFECT-01', skuCode: 'CABLE-01', qty: 2, submitted: true }],
      createdAt: '2026-10-06T10:00:00.000Z',
      submittedAt: '2026-10-06T14:10:00.000Z',
      submittedBy: 'pda.user',
    },
  )

  const o0006 = order(
    '0006',
    'OMS-IN-SEED-0006',
    [
      line({
        lineNo: 1,
        skuCode: 'CABLE-01',
        plannedQty: 120,
        receivedQty: 120,
        rejectedQty: 0,
        goodQty: 120,
        defectQty: 0,
        putawayQty: 120,
      }),
    ],
    {
      receiptCloseFlag: 'CONFIRMED',
      receiptClosedBy: 'admin',
      receiptClosedAt: '2026-10-07T10:00:00.000Z',
      completedAt: '2026-10-07T16:00:00.000Z',
      updatedAt: '2026-10-07T16:00:00.000Z',
    },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261007-0001',
    inboundNo: o0006.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-07T09:00:00.000Z',
    lines: [
      {
        skuCode: 'CABLE-01',
        receivedQty: 120,
        rejectedQty: 0,
        goodQty: 120,
        defectQty: 0,
        batchNo: 'BATCH-2026-A',
        productionDate: '2026-06-01',
        expiryDate: '2028-06-01',
      },
    ],
  })
  putawayOrders.push({
    putawayNo: 'PA-20261007-0001',
    sourceType: 'INBOUND',
    sourceNo: o0006.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261007-0001',
    qualityType: 'GOOD',
    status: 'COMPLETED',
    planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 120 }],
    actualLines: [{ lineNo: 1, planLineNo: 1, locationCode: 'A-02-01', skuCode: 'CABLE-01', qty: 120, submitted: true }],
    createdAt: '2026-10-07T11:00:00.000Z',
    submittedAt: '2026-10-07T15:00:00.000Z',
    submittedBy: 'pda.user',
  })

  const o0007 = order(
    '0007',
    'OMS-IN-SEED-0007',
    [
      line({
        lineNo: 1,
        skuCode: 'CABLE-01',
        plannedQty: 50,
        receivedQty: 20,
        rejectedQty: 0,
        goodQty: 20,
        defectQty: 0,
        putawayQty: 20,
      }),
      line({
        lineNo: 2,
        skuCode: 'SN-DEMO-01',
        plannedQty: 30,
        receivedQty: 0,
        rejectedQty: 0,
        goodQty: 0,
        defectQty: 0,
        putawayQty: 0,
      }),
    ],
    {
      receiptCloseFlag: 'CONFIRMED',
      receiptClosedBy: 'admin',
      receiptClosedAt: '2026-10-08T11:00:00.000Z',
      completedAt: '2026-10-08T14:00:00.000Z',
      updatedAt: '2026-10-08T14:00:00.000Z',
    },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261008-0001',
    inboundNo: o0007.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    containerNo: 'C-B07',
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-08T10:30:00.000Z',
    lines: [{ lineNo: 1, skuCode: 'CABLE-01', containerNo: 'C-B07', receivedQty: 20, rejectedQty: 0, goodQty: 20, defectQty: 0 }],
  })
  putawayOrders.push({
    putawayNo: 'PA-20261008-0001',
    sourceType: 'INBOUND',
    sourceNo: o0007.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261008-0001',
    containerNo: 'C-B07',
    qualityType: 'GOOD',
    status: 'COMPLETED',
    planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 20 }],
    actualLines: [{ lineNo: 1, planLineNo: 1, locationCode: 'B-01-01', skuCode: 'CABLE-01', qty: 20, submitted: true }],
    createdAt: '2026-10-08T12:00:00.000Z',
    submittedAt: '2026-10-08T13:00:00.000Z',
    submittedBy: 'pda.user',
  })

  const o0008 = order(
    '0008',
    'OMS-IN-SEED-0008',
    [
      line({
        lineNo: 1,
        skuCode: 'CABLE-01',
        plannedQty: 60,
        receivedQty: 60,
        rejectedQty: 0,
        goodQty: 60,
        defectQty: 0,
        putawayQty: 0,
      }),
    ],
    { firstArrivalAt: '2026-10-09T08:00:00.000Z', receiptCloseFlag: 'CONFIRMED', receiptClosedBy: 'admin', receiptClosedAt: '2026-10-09T09:00:00.000Z' },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261009-0001',
    inboundNo: o0008.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'web.user',
    receivedAt: '2026-10-09T09:00:00.000Z',
    lines: [{ lineNo: 1, skuCode: 'CABLE-01', receivedQty: 60, rejectedQty: 0, goodQty: 60, defectQty: 0 }],
  })
  putawayOrders.push({
    putawayNo: 'PA-20261009-0001',
    sourceType: 'INBOUND',
    sourceNo: o0008.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261009-0001',
    qualityType: 'GOOD',
    status: 'PENDING',
    planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 60 }],
    actualLines: [],
    createdAt: '2026-10-09T09:30:00.000Z',
  })

  const o0009Lines = [
    line({
      lineNo: 1,
      skuCode: 'CABLE-01',
      plannedQty: 80,
      receivedQty: 30,
      rejectedQty: 0,
      goodQty: 28,
      defectQty: 2,
      putawayQty: 0,
    }),
    line({
      lineNo: 2,
      skuCode: 'SN-DEMO-01',
      plannedQty: 20,
      receivedQty: 0,
      rejectedQty: 0,
      goodQty: 0,
      defectQty: 0,
      putawayQty: 0,
    }),
  ]
  const o0009 = order('0009', 'OMS-IN-SEED-0009', o0009Lines, {
    bizType: 'TRANSFER',
    arrivalMethod: 'EXPRESS',
    trackingNos: 'JD20261009001',
    firstArrivalAt: '2026-10-09T16:00:00.000Z',
    updatedAt: '2026-10-09T16:30:00.000Z',
    remark: '演示：调拨入库、分批收货中；SN-DEMO-01 未维护，收货提交被阻断并可去量方',
  })
  receiptRecords.push({
    receiptNo: 'RC-20261009-0002',
    inboundNo: o0009.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'web.user',
    receivedAt: '2026-10-09T16:30:00.000Z',
    lines: [{ skuCode: 'CABLE-01', receivedQty: 30, rejectedQty: 0, goodQty: 28, defectQty: 2 }],
  })
  putawayOrders.push({
    putawayNo: 'PA-20261009-0002',
    sourceType: 'INBOUND',
    sourceNo: o0009.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261009-0002',
    qualityType: 'GOOD',
    status: 'PENDING',
    planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 28 }],
    actualLines: [],
    createdAt: '2026-10-09T16:35:00.000Z',
  })
  // 同一次收货的不良品 2 件：按「收货记录 × 品质」另成一张上架单（主 PRD §7.6）
  putawayOrders.push({
    putawayNo: 'PA-20261009-0003',
    sourceType: 'INBOUND',
    sourceNo: o0009.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261009-0002',
    qualityType: 'DEFECTIVE',
    status: 'PENDING',
    planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'CABLE-01', planQty: 2 }],
    actualLines: [],
    createdAt: '2026-10-09T16:35:00.000Z',
  })

  /** SN 商品：逐件采集、逐件落位（上架单 Demo PRD 第七节「SN商品两件分到两个库位」） */
  const o0010 = order(
    '0010',
    'OMS-IN-SEED-0010',
    [
      line({
        lineNo: 1,
        skuCode: 'SN-DEMO-01',
        plannedQty: 2,
        receivedQty: 2,
        rejectedQty: 0,
        goodQty: 2,
        defectQty: 0,
        putawayQty: 2,
      }),
    ],
    {
      receiptCloseFlag: 'CONFIRMED',
      receiptClosedBy: 'admin',
      receiptClosedAt: '2026-10-10T09:00:00.000Z',
      completedAt: '2026-10-10T10:00:00.000Z',
      firstArrivalAt: '2026-10-10T08:30:00.000Z',
      updatedAt: '2026-10-10T10:00:00.000Z',
      remark: '演示：SN商品逐件采集并逐件落位',
    },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261010-0002',
    inboundNo: o0010.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    containerNo: 'C-SN01',
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-10T08:40:00.000Z',
    lines: [
      { lineNo: 1, skuCode: 'SN-DEMO-01', containerNo: 'C-SN01', receivedQty: 2, rejectedQty: 0, goodQty: 2, defectQty: 0 },
    ],
  })
  putawayOrders.push({
    putawayNo: 'PA-20261010-0001',
    sourceType: 'INBOUND',
    sourceNo: o0010.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261010-0002',
    containerNo: 'C-SN01',
    qualityType: 'GOOD',
    status: 'COMPLETED',
    planLines: [{ lineNo: 1, receiptLineNo: 1, skuCode: 'SN-DEMO-01', planQty: 2 }],
    actualLines: [
      {
        lineNo: 1,
        planLineNo: 1,
        locationCode: 'A-01-02',
        skuCode: 'SN-DEMO-01',
        qty: 1,
        serialNos: ['SN00000001'],
        submitted: true,
      },
      {
        lineNo: 2,
        planLineNo: 1,
        locationCode: 'A-01-03',
        skuCode: 'SN-DEMO-01',
        qty: 1,
        serialNos: ['SN00000002'],
        submitted: true,
      },
    ],
    createdAt: '2026-10-10T09:30:00.000Z',
    submittedAt: '2026-10-10T10:00:00.000Z',
    submittedBy: 'pda.user',
  })

  /** 一个容器三种商品：推荐库位分两站（A-01-01 线材；B-01-03 两个新商品），PDA 上架按库位逐站走查 */
  const o0011Lines = [
    { lineNo: 1, skuCode: 'CABLE-01', qty: 2 },
    { lineNo: 2, skuCode: 'ANKR-001', qty: 1 },
    { lineNo: 3, skuCode: 'ANKR-002', qty: 6 },
  ]
  const o0011 = order(
    '0011',
    'OMS-IN-SEED-0011',
    o0011Lines.map((l) =>
      line({
        lineNo: l.lineNo,
        skuCode: l.skuCode,
        plannedQty: l.qty,
        receivedQty: l.qty,
        rejectedQty: 0,
        goodQty: l.qty,
        defectQty: 0,
        putawayQty: 0,
      }),
    ),
    {
      firstArrivalAt: '2026-10-11T08:00:00.000Z',
      receiptCloseFlag: 'CONFIRMED',
      receiptClosedBy: 'admin',
      receiptClosedAt: '2026-10-11T09:00:00.000Z',
      updatedAt: '2026-10-11T09:00:00.000Z',
      remark: '演示：一个容器三种商品，PDA 上架按推荐库位分两站',
    },
  )
  receiptRecords.push({
    receiptNo: 'RC-20261011-0001',
    inboundNo: o0011.inboundNo,
    warehouseCode: WH,
    customerId: ANKR,
    containerNo: 'C-M01',
    stagingLocationCode: 'STAGE-IN-01',
    operator: 'pda.user',
    receivedAt: '2026-10-11T08:30:00.000Z',
    lines: o0011Lines.map((l) => ({
      lineNo: l.lineNo,
      skuCode: l.skuCode,
      containerNo: 'C-M01',
      receivedQty: l.qty,
      rejectedQty: 0,
      goodQty: l.qty,
      defectQty: 0,
    })),
  })
  putawayOrders.push({
    putawayNo: 'PA-20261011-0001',
    sourceType: 'INBOUND',
    sourceNo: o0011.inboundNo,
    stagingLocationCode: 'STAGE-IN-01',
    warehouseCode: WH,
    customerId: ANKR,
    receiptNo: 'RC-20261011-0001',
    containerNo: 'C-M01',
    qualityType: 'GOOD',
    status: 'PENDING',
    planLines: o0011Lines.map((l) => ({ lineNo: l.lineNo, receiptLineNo: l.lineNo, skuCode: l.skuCode, planQty: l.qty })),
    actualLines: [],
    createdAt: '2026-10-11T09:00:00.000Z',
  })


  const oSelf = order(
    '9001',
    'OMS-IN-SELF-001',
    [
      line({
        lineNo: 1,
        skuCode: 'OWNER-SELF-001',
        plannedQty: 20,
        receivedQty: 0,
        rejectedQty: 0,
        goodQty: 0,
        defectQty: 0,
        putawayQty: 0,
      }),
    ],
    { customerId: 'SELF-001', remark: '演示：自营货主入库（与外部货主同框架）' },
  )

  const oSkuForms = order(
    '9002',
    'OMS-IN-SKU-FORMS-001',
    [
      line({ lineNo: 1, skuCode: 'BIG-01', plannedQty: 10, receivedQty: 0, rejectedQty: 0, goodQty: 0, defectQty: 0, putawayQty: 0 }),
      line({ lineNo: 2, skuCode: 'ODD-01', plannedQty: 10, receivedQty: 0, rejectedQty: 0, goodQty: 0, defectQty: 0, putawayQty: 0 }),
      line({ lineNo: 3, skuCode: 'BATT-01', plannedQty: 10, receivedQty: 0, rejectedQty: 0, goodQty: 0, defectQty: 0, putawayQty: 0 }),
    ],
    { remark: '演示：大件、异形、带电商品的资料与收货' },
  )

  const core = [o0001, o0002, o0003, o0004, o0005, o0006, o0007, o0008, o0009, o0010, o0011, oSelf, oSkuForms].map((o) =>
    recomputeInboundOrder(o),
  )
  const filler = createFillerInboundsForOtherWarehouses()
  // 其它仓填充单里唯一一条“分批收货中”的也补收货记录，保证实收有子记录来源
  const njPartial = filler.find(
    (o) => o.warehouseCode === 'US-NJ-01' && o.items.some((i) => i.receivedQty > 0),
  )
  if (njPartial) {
    receiptRecords.push({
      receiptNo: 'RC-20261010-0001',
      inboundNo: njPartial.inboundNo,
      warehouseCode: njPartial.warehouseCode,
      customerId: njPartial.customerId,
      stagingLocationCode: 'STAGE-IN-01',
      operator: 'pda.user',
      receivedAt: '2026-10-10T10:30:00.000Z',
      lines: [{ lineNo: 1, skuCode: 'CABLE-01', receivedQty: 15, rejectedQty: 0, goodQty: 15, defectQty: 0 }],
    })
  }
  const inbounds = [...core, ...filler]

  return { inbounds, receiptRecords, putawayOrders, inboundExceptions }
}

const HOMY = 'C10031'

/** 其它顶栏仓库各补几条待收货单，避免切换仓后列表全空（验收种子仍在 US-LA-01） */
function createFillerInboundsForOtherWarehouses(): InboundOrder[] {
  const warehouses = ['US-NJ-01', 'DE-FRA-01', 'HK-WH-01'] as const
  const methods: InboundOrder['arrivalMethod'][] = ['CONTAINER', 'LTL', 'EXPRESS', 'OTHER']
  const list: InboundOrder[] = []
  warehouses.forEach((wh, wi) => {
    for (let i = 1; i <= 4; i++) {
      const suffix = `${wh.slice(0, 2)}${i}`
      const partialReceiving = wh === 'US-NJ-01' && i === 2
      const planned = 40 + i * 10
      const receivedQty = partialReceiving ? 15 : 0
      list.push(
        recomputeInboundOrder({
          inboundNo: `IB-20261001-${suffix}`,
          customerId: HOMY,
          warehouseCode: wh,
          bizType: i % 3 === 0 ? 'TRANSFER' : 'NORMAL',
          upstreamNo: `OMS-FILL-${wh}-${i}`,
          arrivalMethod: methods[i % methods.length],
          containerNo: i % 2 === 0 ? `CMAU${wh}${i}` : undefined,
          trackingNos: i % 2 === 1 ? `1Z${wh}${i}000` : undefined,
          etaAt: '2026-10-20T08:00:00.000Z',
          receiptCloseFlag: 'NOT_CONFIRMED',
          status: 'PENDING_RECEIVE',
          firstArrivalAt: partialReceiving ? '2026-10-10T10:00:00.000Z' : undefined,
          remark: partialReceiving ? '演示：其它仓分批收货中' : undefined,
          items: [
            line({
              lineNo: 1,
              skuCode: 'CABLE-01',
              plannedQty: planned,
              receivedQty,
              rejectedQty: 0,
              goodQty: receivedQty,
              defectQty: 0,
              putawayQty: 0,
            }),
          ],
          createdAt: `2026-10-0${1 + (wi % 3)}T${String(8 + i).padStart(2, '0')}:00:00.000Z`,
          updatedAt: `2026-10-0${1 + (wi % 3)}T${String(8 + i).padStart(2, '0')}:00:00.000Z`,
        }),
      )
    }
  })
  return list
}
