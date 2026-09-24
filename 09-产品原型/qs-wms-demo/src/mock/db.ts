import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuditLog, InboundOrder, InventoryLogType, PutawayTask } from '@/types/wms'
import { createSeedData, type SeedData } from './seed'

type ActionResult = { ok: true } | { ok: false; errorKey: string }

interface DbActions {
  resetDemo: () => void
  signInbound: (inboundNo: string) => ActionResult
  cancelInbound: (inboundNo: string) => ActionResult
  receiveInboundItem: (input: {
    inboundNo: string
    skuCode: string
    goodQty: number
    defectQty: number
    operator: string
  }) => ActionResult
  putaway: (input: { putawayNo: string; locationCode: string; qty: number; operator: string }) => ActionResult
}

export type DbState = SeedData & DbActions

const nowIso = () => new Date().toISOString()
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

function resolveInboundStatus(order: InboundOrder): InboundOrder['status'] {
  const planned = order.items.reduce((s, i) => s + i.plannedQty, 0)
  const received = order.items.reduce((s, i) => s + i.receivedGoodQty + i.receivedDefectQty, 0)
  const good = order.items.reduce((s, i) => s + i.receivedGoodQty, 0)
  const putaway = order.items.reduce((s, i) => s + i.putawayQty, 0)
  if (received >= planned && putaway >= good) return 'COMPLETED'
  if (putaway > 0) return 'PARTIAL_PUT'
  return 'RECEIVING'
}

export const useDb = create<DbState>()(
  persist(
    (set, get) => {
      const log = (entry: {
        warehouseCode: string
        type: InventoryLogType
        refNo: string
        skuCode: string
        customerId: string
        locationCode: string
        qtyChange: number
        operator: string
      }) => ({ id: uid('LOG'), createdAt: nowIso(), ...entry })

      const auditLog = (entry: Omit<AuditLog, 'id' | 'createdAt'>) => ({
        id: uid('AUD'),
        createdAt: nowIso(),
        ...entry,
      })

      const appendAudit = (entry: Omit<AuditLog, 'id' | 'createdAt'>) => [auditLog(entry), ...get().auditLogs]

      return {
        ...createSeedData(),

        resetDemo: () => {
          const seed = createSeedData()
          set({
            ...seed,
            auditLogs: [
              auditLog({
                refType: 'SYSTEM',
                refNo: '-',
                action: 'DEMO_RESET',
                operator: 'admin',
              }),
              ...seed.auditLogs,
            ],
          })
        },

        signInbound: (inboundNo) => {
          const order = get().inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          if (order.status !== 'PENDING') return { ok: false, errorKey: 'error.statusNotAllowed' }
          set({
            inbounds: get().inbounds.map((o) =>
              o.inboundNo === inboundNo ? { ...o, status: 'ARRIVED', updatedAt: nowIso() } : o,
            ),
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_SIGN',
              operator: 'admin',
            }),
          })
          return { ok: true }
        },

        cancelInbound: (inboundNo) => {
          const order = get().inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          if (order.status !== 'PENDING') return { ok: false, errorKey: 'error.statusNotAllowed' }
          set({
            inbounds: get().inbounds.map((o) =>
              o.inboundNo === inboundNo ? { ...o, status: 'CANCELLED', updatedAt: nowIso() } : o,
            ),
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_CANCEL',
              operator: 'admin',
            }),
          })
          return { ok: true }
        },

        receiveInboundItem: ({ inboundNo, skuCode, goodQty, defectQty, operator }) => {
          const state = get()
          const order = state.inbounds.find((o) => o.inboundNo === inboundNo)
          if (!order) return { ok: false, errorKey: 'error.inboundNotFound' }
          if (!['PENDING', 'ARRIVED', 'RECEIVING', 'PARTIAL_PUT'].includes(order.status))
            return { ok: false, errorKey: 'error.statusNotAllowed' }
          const item = order.items.find((i) => i.skuCode === skuCode)
          if (!item) return { ok: false, errorKey: 'error.skuNotInOrder' }
          if (goodQty + defectQty <= 0) return { ok: false, errorKey: 'error.qtyInvalid' }

          const updatedOrder: InboundOrder = {
            ...order,
            updatedAt: nowIso(),
            items: order.items.map((i) =>
              i.skuCode === skuCode
                ? {
                    ...i,
                    receivedGoodQty: i.receivedGoodQty + goodQty,
                    receivedDefectQty: i.receivedDefectQty + defectQty,
                  }
                : i,
            ),
          }
          updatedOrder.status = resolveInboundStatus(updatedOrder)

          // 推荐货位：优先同 SKU 已有库存的货位，其次同仓第一个空货位
          const existing = state.inventory.find(
            (r) => r.warehouseCode === order.warehouseCode && r.skuCode === skuCode && r.qualityType === 'GOOD',
          )
          const occupied = new Set(state.inventory.filter((r) => r.warehouseCode === order.warehouseCode).map((r) => r.locationCode))
          const empty = state.locations.find(
            (l) => l.warehouseCode === order.warehouseCode && l.type !== 'STAGING' && l.type !== 'DEFECT' && !occupied.has(l.code),
          )
          const suggested = existing?.locationCode ?? empty?.code ?? 'B-01-01'

          let tasks: PutawayTask[] = state.putawayTasks
          if (goodQty > 0) {
            const open = tasks.find(
              (t) => t.inboundNo === inboundNo && t.skuCode === skuCode && t.status !== 'COMPLETED',
            )
            if (open) {
              tasks = tasks.map((t) => (t === open ? { ...t, planQty: t.planQty + goodQty } : t))
            } else {
              tasks = [...tasks]
              tasks.unshift({
                putawayNo: `PUT${Date.now().toString().slice(-10)}`,
                inboundNo,
                warehouseCode: order.warehouseCode,
                customerId: order.customerId,
                skuCode,
                qualityType: 'GOOD',
                planQty: goodQty,
                actualQty: 0,
                sourceLocationCode: 'STAGE-IN-01',
                suggestedLocationCode: suggested,
                status: 'PENDING',
                createdAt: nowIso(),
              })
            }
          }

          const inventory = [...state.inventory]
          if (defectQty > 0) {
            inventory.push({
              id: uid('INV'),
              warehouseCode: order.warehouseCode,
              locationCode: 'DEFECT-01',
              customerId: order.customerId,
              skuCode,
              qualityType: 'DEFECTIVE',
              onHandQty: defectQty,
              lockedQty: 0,
              firstInboundAt: nowIso(),
            })
          }

          set({
            inbounds: state.inbounds.map((o) => (o.inboundNo === inboundNo ? updatedOrder : o)),
            putawayTasks: tasks,
            inventory,
            inventoryLogs: [
              log({
                warehouseCode: order.warehouseCode,
                type: 'RECEIVE',
                refNo: inboundNo,
                skuCode,
                customerId: order.customerId,
                locationCode: 'STAGE-IN-01',
                qtyChange: goodQty + defectQty,
                operator,
              }),
              ...state.inventoryLogs,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: inboundNo,
              action: 'INBOUND_RECEIVE',
              operator,
              detail: `${skuCode} +${goodQty}${defectQty > 0 ? ` / defect +${defectQty}` : ''}`,
            }),
          })
          return { ok: true }
        },

        putaway: ({ putawayNo, locationCode, qty, operator }) => {
          const state = get()
          const task = state.putawayTasks.find((t) => t.putawayNo === putawayNo)
          if (!task) return { ok: false, errorKey: 'error.taskNotFound' }
          const location = state.locations.find((l) => l.warehouseCode === task.warehouseCode && l.code === locationCode)
          if (!location) return { ok: false, errorKey: 'error.locationNotFound' }
          const remain = task.planQty - task.actualQty
          if (qty <= 0 || qty > remain) return { ok: false, errorKey: 'error.qtyInvalid' }

          const actualQty = task.actualQty + qty
          const updatedTask: PutawayTask = {
            ...task,
            actualQty,
            actualLocationCode: locationCode,
            status: actualQty >= task.planQty ? 'COMPLETED' : 'DOING',
            completedAt: actualQty >= task.planQty ? nowIso() : undefined,
          }

          const inventory = [...state.inventory]
          const idx = inventory.findIndex(
            (r) =>
              r.warehouseCode === task.warehouseCode &&
              r.locationCode === locationCode &&
              r.skuCode === task.skuCode &&
              r.qualityType === task.qualityType,
          )
          if (idx >= 0) {
            inventory[idx] = { ...inventory[idx], onHandQty: inventory[idx].onHandQty + qty }
          } else {
            inventory.unshift({
              id: uid('INV'),
              warehouseCode: task.warehouseCode,
              locationCode,
              customerId: task.customerId,
              skuCode: task.skuCode,
              qualityType: task.qualityType,
              onHandQty: qty,
              lockedQty: 0,
              firstInboundAt: nowIso(),
            })
          }

          const inbounds = state.inbounds.map((o) => {
            if (o.inboundNo !== task.inboundNo) return o
            const next: InboundOrder = {
              ...o,
              updatedAt: nowIso(),
              items: o.items.map((i) => (i.skuCode === task.skuCode ? { ...i, putawayQty: i.putawayQty + qty } : i)),
            }
            next.status = resolveInboundStatus(next)
            return next
          })

          set({
            putawayTasks: state.putawayTasks.map((t) => (t.putawayNo === putawayNo ? updatedTask : t)),
            inventory,
            inbounds,
            inventoryLogs: [
              log({
                warehouseCode: task.warehouseCode,
                type: 'PUTAWAY',
                refNo: task.inboundNo,
                skuCode: task.skuCode,
                customerId: task.customerId,
                locationCode,
                qtyChange: qty,
                operator,
              }),
              ...state.inventoryLogs,
            ],
            auditLogs: appendAudit({
              refType: 'INBOUND',
              refNo: task.inboundNo,
              action: 'PUTAWAY',
              operator,
              detail: `${task.skuCode} ×${qty} → ${locationCode}`,
            }),
          })
          return { ok: true }
        },
      }
    },
    {
      name: 'qs-wms-demo-db',
      // 修改 seed.ts 或数据结构后把版本号 +1，浏览器里的旧演示数据会被替换为新种子
      version: 4,
      migrate: () => createSeedData(),
      partialize: (s) => ({
        warehouses: s.warehouses,
        customers: s.customers,
        skus: s.skus,
        locations: s.locations,
        inbounds: s.inbounds,
        putawayTasks: s.putawayTasks,
        inventory: s.inventory,
        inventoryLogs: s.inventoryLogs,
        packages: s.packages,
        auditLogs: s.auditLogs,
      }),
    },
  ),
)

/** 常用查找：用于表格渲染时把 ID 转成名称 */
export const useLookups = () => {
  const customers = useDb((s) => s.customers)
  const skus = useDb((s) => s.skus)
  return useMemo(() => {
    const customerMap = new Map(customers.map((c) => [c.id, c]))
    const skuMap = new Map(skus.map((s) => [s.code, s]))
    return {
      customerName: (id: string) => customerMap.get(id)?.name ?? id,
      customerCode: (id: string) => customerMap.get(id)?.code ?? id,
      sku: (code: string) => skuMap.get(code),
    }
  }, [customers, skus])
}
