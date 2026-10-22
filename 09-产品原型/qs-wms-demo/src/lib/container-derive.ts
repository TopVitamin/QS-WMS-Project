import type { ContainerMaster, QualityType } from '@/types/wms'
import type { SeedData } from '@/mock/seed'

export interface ContainerContentLine {
  skuCode: string
  batchNo?: string
  qualityType: QualityType
  qty: number
  locationCode?: string
  serialNos?: string[]
  source: 'RECEIPT' | 'PUTAWAY' | 'VERIFY'
}

const norm = (value?: string) => value?.trim().toUpperCase() ?? ''

const sameContainer = (container: ContainerMaster, warehouseCode: string, containerNo?: string) =>
  container.warehouseCode === warehouseCode && norm(container.containerNo) === norm(containerNo)

/** 容器内容：在库/已出库取上架或复核实际行，收货中/上架中取收货行；只读汇总，不改库存 */
export function containerContents(container: ContainerMaster, state: SeedData): ContainerContentLine[] {
  const rows: ContainerContentLine[] = []

  if (container.source === 'OUTBOUND_PACK' || container.status === 'SHIPPED' || container.status === 'OUTBOUND') {
    state.outboundVerifications
      .filter((v) => !v.deleted && sameContainer(container, state.outboundOrders.find((o) => o.no === v.orderNo)?.warehouseCode ?? '', v.containerNo))
      .forEach((v) =>
        v.lines.forEach((l) => {
          rows.push({
            skuCode: l.skuCode,
            qualityType: 'GOOD',
            qty: l.effectiveQty,
            serialNos: l.serialNos,
            source: 'VERIFY',
          })
        }),
      )
    return mergeContent(rows)
  }

  if (container.status === 'RECEIVING' || container.status === 'PUTAWAYING') {
    state.receiptRecords
      .filter((r) => r.warehouseCode === container.warehouseCode)
      .forEach((r) =>
        r.lines
          .filter((l) => sameContainer(container, container.warehouseCode, l.containerNo))
          .forEach((l) => {
            if (l.goodQty > 0)
              rows.push({
                skuCode: l.skuCode,
                batchNo: l.batchNo,
                qualityType: 'GOOD',
                qty: l.goodQty,
                locationCode: r.stagingLocationCode,
                serialNos: l.goodSerialNos,
                source: 'RECEIPT',
              })
            if (l.defectQty > 0)
              rows.push({
                skuCode: l.skuCode,
                batchNo: l.batchNo,
                qualityType: 'DEFECTIVE',
                qty: l.defectQty,
                locationCode: r.stagingLocationCode,
                serialNos: l.defectSerialNos,
                source: 'RECEIPT',
              })
          }),
      )
    if (rows.length) return mergeContent(rows)
  }

  state.putawayOrders
    .filter((p) => p.status === 'COMPLETED' && sameContainer(container, p.warehouseCode, p.containerNo))
    .forEach((p) =>
      p.actualLines
        .filter((a) => a.submitted)
        .forEach((a) => {
          const plan = p.planLines.find((l) => l.lineNo === a.planLineNo)
          rows.push({
            skuCode: a.skuCode,
            batchNo: plan?.batchNo,
            qualityType: p.qualityType,
            qty: a.qty,
            locationCode: a.locationCode,
            serialNos: a.serialNos,
            source: 'PUTAWAY',
          })
        }),
    )

  return mergeContent(rows)
}

function mergeContent(rows: ContainerContentLine[]): ContainerContentLine[] {
  const map = new Map<string, ContainerContentLine>()
  rows.forEach((row) => {
    const key = [row.skuCode, row.batchNo ?? '', row.qualityType, row.locationCode ?? '', row.source].join('|')
    const prev = map.get(key)
    if (prev) {
      prev.qty += row.qty
      prev.serialNos = [...(prev.serialNos ?? []), ...(row.serialNos ?? [])]
    } else {
      map.set(key, { ...row, serialNos: row.serialNos?.length ? [...row.serialNos] : undefined })
    }
  })
  return [...map.values()].sort(
    (a, b) =>
      a.skuCode.localeCompare(b.skuCode) ||
      (a.batchNo ?? '').localeCompare(b.batchNo ?? '') ||
      a.qualityType.localeCompare(b.qualityType),
  )
}

export function containerSummary(contents: ContainerContentLine[]) {
  return {
    skus: new Set(contents.map((c) => c.skuCode)).size,
    qty: contents.reduce((n, c) => n + c.qty, 0),
    batches: new Set(contents.map((c) => c.batchNo).filter(Boolean)).size,
    serials: contents.reduce((n, c) => n + (c.serialNos?.length ?? 0), 0),
  }
}

export interface ContainerRelatedDoc {
  type: 'INBOUND' | 'RETURN' | 'PUTAWAY' | 'OUTBOUND'
  no: string
  status: string
  at: string
}

/** 容器关联单据：收货、退货收货、上架、复核；按时间倒序 */
export function containerRelatedDocs(container: ContainerMaster, state: SeedData): ContainerRelatedDoc[] {
  const docs: ContainerRelatedDoc[] = []
  state.receiptRecords.forEach((r) => {
    if (r.lines.some((l) => sameContainer(container, container.warehouseCode, l.containerNo))) {
      docs.push({ type: 'INBOUND', no: r.inboundNo, status: 'RECEIVED', at: r.receivedAt })
    }
  })
  state.returnReceipts.forEach((r) => {
    if (r.lines.some((l) => sameContainer(container, container.warehouseCode, l.containerNo))) {
      docs.push({ type: 'RETURN', no: r.returnNo, status: 'RECEIVED', at: r.receivedAt })
    }
  })
  state.putawayOrders.forEach((p) => {
    if (sameContainer(container, p.warehouseCode, p.containerNo)) {
      docs.push({ type: 'PUTAWAY', no: p.putawayNo, status: p.status, at: p.submittedAt ?? p.createdAt })
    }
  })
  state.outboundVerifications.forEach((v) => {
    const order = state.outboundOrders.find((o) => o.no === v.orderNo)
    if (order && sameContainer(container, order.warehouseCode, v.containerNo)) {
      docs.push({ type: 'OUTBOUND', no: order.no, status: order.status, at: v.at })
    }
  })
  return docs.sort((a, b) => b.at.localeCompare(a.at))
}
