import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** PDA 上架时正在数的一行：扫一件 +1（SN 商品每扫一个 SN），数满自动保存落位 */
export interface PdaPutawayCount {
  /** 应上架行号 */
  lineNo: number
  qty: number
  serialNos: string[]
}

interface PdaPutawaySessionState {
  /** 按「仓库:上架单号」记未保存的计数 */
  counts: Record<string, PdaPutawayCount>
  setCount: (key: string, count?: PdaPutawayCount) => void
  reset: () => void
}

export const putawaySessionKey = (warehouseCode: string, putawayNo: string) => `${warehouseCode}:${putawayNo}`

/**
 * PDA 上架的本机草稿（《PDA作业端设计规范》§6）：还没保存的计数。不是业务记录，不动上架单；
 * 刷新、退出后可续，保存成功后移除。已保存的落位在上架单里，不进草稿。
 */
export const usePdaPutawaySession = create<PdaPutawaySessionState>()(
  persist(
    (set) => ({
      counts: {},
      setCount: (key, count) =>
        set((s) => {
          const counts = { ...s.counts }
          if (count && count.qty > 0) counts[key] = count
          else delete counts[key]
          return { counts }
        }),
      reset: () => set({ counts: {} }),
    }),
    { name: 'qs-wms-demo-pda-putaway', version: 1 },
  ),
)
