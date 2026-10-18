import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WebVerifySession } from './web-verify-session'

/** PDA 按库位作业时正在数的一行：拣货扫一件 +1、数满自动下架；返库扫一件 +1、数满自动保存落位 */
export interface PdaPickCount {
  lineId: string
  qty: number
  serialNos: string[]
}

interface PdaOutboundSessionState {
  /** 按「仓库:拣货任务号」记未确认的计数 */
  pick: Record<string, PdaPickCount>
  /** 按「仓库:返库上架单号」记未保存的计数 */
  putback: Record<string, PdaPickCount>
  /** 按「仓库:出库单号」记本次复核（结构与复核工作台相同，两端各存各的） */
  verify: Record<string, WebVerifySession>
  setPick: (key: string, count?: PdaPickCount) => void
  setPutback: (key: string, count?: PdaPickCount) => void
  setVerify: (key: string, session?: WebVerifySession) => void
  reset: () => void
}

export const pdaSessionKey = (warehouseCode: string, no: string) => `${warehouseCode}:${no}`

const put = <T>(map: Record<string, T>, key: string, value?: T) => {
  const next = { ...map }
  if (value) next[key] = value
  else delete next[key]
  return next
}
const live = (count?: PdaPickCount) => (count && count.qty > 0 ? count : undefined)

/**
 * PDA 出库作业的本机草稿（《PDA作业端设计规范》§6）：还没确认下架的计数、还没保存的返库计数、还没提交的复核。
 * 不是业务记录，不动库存；刷新、退出后可续，确认、保存或提交成功后移除。已确认下架、已保存的返库落位在业务单据里，不进草稿。
 */
export const usePdaOutboundSession = create<PdaOutboundSessionState>()(
  persist(
    (set) => ({
      pick: {},
      putback: {},
      verify: {},
      setPick: (key, count) => set((s) => ({ pick: put(s.pick, key, live(count)) })),
      setPutback: (key, count) => set((s) => ({ putback: put(s.putback, key, live(count)) })),
      setVerify: (key, session) => set((s) => ({ verify: put(s.verify, key, session) })),
      reset: () => set({ pick: {}, putback: {}, verify: {} }),
    }),
    { name: 'qs-wms-demo-pda-outbound', version: 1 },
  ),
)
