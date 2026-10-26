import type { ContainerMaster, QualityType } from '@/types/wms'
import type { SeedData } from '@/mock/seed'
import { containerIdOf } from '@/lib/container-id'

export interface ContainerContentLine {
  skuCode: string
  batchNo?: string
  productionDate?: string
  qualityType: QualityType
  qty: number
  locationCode?: string
  serialNos?: string[]
  source: 'INVENTORY' | 'RECEIPT' | 'PUTAWAY' | 'VERIFY'
}

const norm = (value?: string) => value?.trim().toUpperCase() ?? ''

const sameContainer = (container: ContainerMaster, warehouseCode: string, containerNo?: string) =>
  container.warehouseCode === warehouseCode && norm(container.containerNo) === norm(containerNo)

/** 在库和上架中内容取当前批次库存；出库内容取复核记录，释放后不再显示为当前内容。 */
export function containerContents(container: ContainerMaster, state: SeedData): ContainerContentLine[] {
  const rows: ContainerContentLine[] = []

  if (container.source === 'OUTBOUND_PACK' || container.status === 'SHIPPED' || container.status === 'OUTBOUND') {
    const stockByAssignment = new Map<string, { batchNo?: string; productionDate?: string }>()
    state.outboundPickTasks.forEach((task) =>
      task.assignments.forEach((assignment) =>
        stockByAssignment.set(assignment.id, {
          batchNo: task.lines.find((line) => line.id === assignment.lineId)?.batchNo,
          productionDate: state.inventory.find((record) => record.id === assignment.stagingInventoryId)?.productionDate,
        }),
      ),
    )
    const childNos = new Set(
      state.containers
        .filter(
          (child) =>
            child.warehouseCode === container.warehouseCode &&
            child.containerType === 'CARTON' &&
            sameContainer(container, child.warehouseCode, child.parentContainerNo),
        )
        .map((child) => norm(child.containerNo)),
    )
    const childHasContent =
      container.containerType === 'PALLET' &&
      state.outboundVerifications.some(
        (verification) =>
          !verification.deleted &&
          sameContainer(container, state.outboundOrders.find((o) => o.no === verification.orderNo)?.warehouseCode ?? '', verification.parentContainerNo) &&
          childNos.has(norm(verification.containerNo)) &&
          verification.lines.some((line) => line.effectiveQty > 0),
      )
    state.outboundVerifications
      .filter((verification) => {
        const order = state.outboundOrders.find((o) => o.no === verification.orderNo)
        if (verification.deleted || !order || order.warehouseCode !== container.warehouseCode) return false
        const isDirect = sameContainer(container, order.warehouseCode, verification.containerNo)
        const isChild = sameContainer(container, order.warehouseCode, verification.parentContainerNo) &&
          childNos.has(norm(verification.containerNo))
        if (childHasContent && isDirect) return false
        return (isDirect || isChild) && verification.lines.some((line) => line.effectiveQty > 0)
      })
      .forEach((verification) =>
        verification.lines.forEach((line) => {
          if (line.effectiveQty <= 0) return
          rows.push({
            skuCode: line.skuCode,
            ...stockByAssignment.get(line.assignmentId),
            qualityType: 'GOOD',
            qty: line.effectiveQty,
            serialNos: line.serialNos,
            source: 'VERIFY',
          })
        }),
      )
    return mergeContent(rows)
  }

  if (container.status === 'RELEASED') return []

  if (container.status === 'IN_STOCK' || container.status === 'PUTAWAYING' || container.status === 'RECEIVING') {
    const containerId = containerIdOf(container.warehouseCode, container.containerNo)
    state.inventory
      .filter((r) => r.containerId === containerId && r.onHandQty > 0)
      .forEach((r) =>
        rows.push({
          skuCode: r.skuCode,
          batchNo: r.batchNo,
          productionDate: r.productionDate,
          qualityType: r.qualityType,
          qty: r.onHandQty,
          locationCode: r.locationCode,
          serialNos: r.serialNos,
          source: 'INVENTORY',
        }),
      )
    return mergeContent(rows)
  }

  return []
}

function mergeContent(rows: ContainerContentLine[]): ContainerContentLine[] {
  const map = new Map<string, ContainerContentLine>()
  rows.forEach((row) => {
    const key = [
      row.skuCode,
      row.batchNo ?? '',
      row.productionDate ?? '',
      row.qualityType,
      row.locationCode ?? '',
      row.source,
    ].join('|')
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
      (a.productionDate ?? '').localeCompare(b.productionDate ?? '') ||
      a.qualityType.localeCompare(b.qualityType),
  )
}

export function containerSummary(contents: ContainerContentLine[]) {
  return {
    skus: new Set(contents.map((c) => c.skuCode)).size,
    qty: contents.reduce((n, c) => n + c.qty, 0),
    batches: new Set(contents.map((c) => [c.batchNo ?? '', c.productionDate ?? ''].join('|')).filter((key) => key !== '|')).size,
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
    if (
      order &&
      (sameContainer(container, order.warehouseCode, v.containerNo) ||
        sameContainer(container, order.warehouseCode, v.parentContainerNo))
    ) {
      docs.push({ type: 'OUTBOUND', no: order.no, status: order.status, at: v.at })
    }
  })
  const unique = new Map<string, ContainerRelatedDoc>()
  docs.forEach((doc) => {
    const key = `${doc.type}:${doc.no}`
    if (!unique.has(key) || unique.get(key)!.at < doc.at) unique.set(key, doc)
  })
  return [...unique.values()].sort((a, b) => b.at.localeCompare(a.at))
}
