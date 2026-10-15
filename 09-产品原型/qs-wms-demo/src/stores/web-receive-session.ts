import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InboundReceiveDraft } from '@/lib/inbound-receive'
import { BULK_BOX_KEY, boxKeyOf } from '@/stores/pda-receive-session'

export { BULK_BOX_KEY, boxKeyOf }

/** Web 收货作业台里的一个容器（或一组无容器收货），edits 按 SKU 记本次录入 */
export interface WebReceiveBox {
  key: string
  containerNo?: string
  bulkPiece: boolean
  edits: Record<string, InboundReceiveDraft>
}

export interface WebReceiveSession {
  boxes: WebReceiveBox[]
  /** 正在录入的容器；为空时扫码框用来扫下一个容器 */
  activeKey?: string
}

interface WebReceiveSessionState {
  sessions: Record<string, WebReceiveSession>
  update: (inboundNo: string, fn: (session: WebReceiveSession) => WebReceiveSession) => void
  clear: (inboundNo: string) => void
  reset: () => void
}

export const EMPTY_WEB_RECEIVE_SESSION: WebReceiveSession = { boxes: [] }

/**
 * Web 收货作业台的本次收货（按入库单分开）：一次可连续收多个容器，最后一起提交成一条收货记录。
 * 和 PDA 暂存一样不是业务记录：不改库存、不生成上架单；切页签、刷新后还在，提交成功或手动清空后移除。
 */
export const useWebReceiveSession = create<WebReceiveSessionState>()(
  persist(
    (set) => ({
      sessions: {},
      update: (inboundNo, fn) =>
        set((s) => ({
          sessions: { ...s.sessions, [inboundNo]: fn(s.sessions[inboundNo] ?? EMPTY_WEB_RECEIVE_SESSION) },
        })),
      clear: (inboundNo) =>
        set((s) => {
          const next = { ...s.sessions }
          delete next[inboundNo]
          return { sessions: next }
        }),
      reset: () => set({ sessions: {} }),
    }),
    { name: 'qs-wms-demo-web-receive', version: 1 },
  ),
)
