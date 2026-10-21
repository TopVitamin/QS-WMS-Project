import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QualityType } from '@/types/wms'

/** 待提交清单的一行：从哪条库存明细搬多少到哪个库位 */
export interface PdaMoveLine {
  id: string
  inventoryId: string
  customerId: string
  skuCode: string
  sourceLocation: string
  targetLocation: string
  batchNo?: string
  qualityType: QualityType
  qty: number
  serialNos: string[]
}

/** 正在录的一行：已选源库存，数量或 SN，扫过的目标库位 */
export interface PdaMoveCurrent {
  inventoryId: string
  qty: number
  serialNos: string[]
  targetLocation?: string
}

export interface PdaMoveDraft {
  /** 整次提交的请求号：重复提交只返回原移库作业号 */
  requestId: string
  lines: PdaMoveLine[]
  current?: PdaMoveCurrent
  /** 上次提交失败的原因；带行号时清单里标出这一行 */
  failure?: { line?: number; errorKey: string; params?: Record<string, string | number> }
  /** 移库时确认的账实不符：清单提交或放弃后去发起盘点 */
  discrepancy?: { customerId: string; skuCode: string; locationCode: string }
}

interface PdaMoveSessionState {
  /** 按仓库记一份草稿 */
  drafts: Record<string, PdaMoveDraft>
  update: (warehouseCode: string, fn: (draft: PdaMoveDraft) => PdaMoveDraft | undefined) => void
  reset: () => void
}

export const newMoveRequestId = () => `MVR-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
export const emptyMoveDraft = (): PdaMoveDraft => ({ requestId: newMoveRequestId(), lines: [] })

/**
 * PDA 移库的本机草稿（《PDA作业端设计规范》§6）：当前行和待提交清单，不是业务记录，不动库存；
 * 刷新、退出后可续；整次提交成功或放弃后清除。
 */
export const usePdaMoveSession = create<PdaMoveSessionState>()(
  persist(
    (set) => ({
      drafts: {},
      update: (warehouseCode, fn) =>
        set((s) => {
          const drafts = { ...s.drafts }
          const next = fn(drafts[warehouseCode] ?? emptyMoveDraft())
          if (next && (next.lines.length || next.current || next.discrepancy)) drafts[warehouseCode] = next
          else delete drafts[warehouseCode]
          return { drafts }
        }),
      reset: () => set({ drafts: {} }),
    }),
    { name: 'qs-wms-demo-pda-move', version: 1 },
  ),
)
