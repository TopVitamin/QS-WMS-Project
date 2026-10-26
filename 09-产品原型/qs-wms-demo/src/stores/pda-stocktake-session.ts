import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QualityType } from '@/types/wms'

/** 快照外新发现的实物：按账面 0 新增一行 */
export interface PdaCountNewLine {
  customerId: string
  skuCode: string
  locationCode: string
  qualityType: QualityType
  batchNo?: string
  productionDate?: string
  expiryDate?: string
}

/** 正在盘的一行：快照行号或新增行，已数的数量与 SN、差异说明 */
export interface PdaCountDraft {
  lineNo?: number
  add?: PdaCountNewLine
  qty: number
  serialNos: string[]
  note: string
}

interface PdaStocktakeSessionState {
  /** 按「仓库:盘点单号」记一行未保存的实盘 */
  drafts: Record<string, PdaCountDraft>
  setDraft: (key: string, draft?: PdaCountDraft) => void
  reset: () => void
}

export const stocktakeSessionKey = (warehouseCode: string, no: string) => `${warehouseCode}:${no}`

/**
 * PDA 实盘的本机草稿（PDA盘点 PRD 第一节）：当前未保存的一行；保存后属于盘点单的业务记录，从草稿移除。
 */
export const usePdaStocktakeSession = create<PdaStocktakeSessionState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, draft) =>
        set((s) => {
          const drafts = { ...s.drafts }
          if (draft) drafts[key] = draft
          else delete drafts[key]
          return { drafts }
        }),
      reset: () => set({ drafts: {} }),
    }),
    { name: 'qs-wms-demo-pda-stocktake', version: 1 },
  ),
)
