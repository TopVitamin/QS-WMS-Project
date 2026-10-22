import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReturnReceiveDraft } from '@/lib/return-receive'

export const RETURN_BULK_KEY = 'BULK'

export function returnBoxKey(containerNo?: string, bulkPiece = false) {
  return bulkPiece || !containerNo?.trim() ? RETURN_BULK_KEY : containerNo.trim().toUpperCase()
}

/** 一个退货收货容器：drafts 按退货单明细行号存放 */
export interface ReturnReceiveBox {
  key: string
  containerNo?: string
  bulkPiece: boolean
  drafts: Record<number, ReturnReceiveDraft>
}

export interface ReturnReceiveSession {
  boxes: ReturnReceiveBox[]
  activeKey?: string
}

export const EMPTY_RETURN_RECEIVE_SESSION: ReturnReceiveSession = { boxes: [] }

interface ReturnReceiveSessionState {
  sessions: Record<string, ReturnReceiveSession>
  update: (key: string, fn: (session: ReturnReceiveSession) => ReturnReceiveSession) => void
  clear: (key: string) => void
  reset: () => void
}

/** 退货收货本次作业（Web/PDA 共用结构，按端+仓+退货单分开），刷新可续，提交成功或清空后移除 */
export const useReturnReceiveSession = create<ReturnReceiveSessionState>()(
  persist(
    (set) => ({
      sessions: {},
      update: (key, fn) =>
        set((s) => ({ sessions: { ...s.sessions, [key]: fn(s.sessions[key] ?? EMPTY_RETURN_RECEIVE_SESSION) } })),
      clear: (key) =>
        set((s) => {
          const next = { ...s.sessions }
          delete next[key]
          return { sessions: next }
        }),
      reset: () => set({ sessions: {} }),
    }),
    { name: 'qs-wms-demo-return-receive', version: 1 },
  ),
)

export const returnSessionKey = (terminal: 'web' | 'pda', warehouseCode: string, returnNo: string) =>
  `${terminal}:${warehouseCode}:${returnNo}`
