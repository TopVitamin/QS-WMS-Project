import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OutboundVerification } from '@/types/outbound'

/** 本次复核里一条实拣归属的录入 */
export interface WebVerifyLine {
  qty: number
  serialNos: string[]
}

export interface WebVerifySession {
  /** 按实拣归属 id 记本次数量与序列号 */
  lines: Record<string, WebVerifyLine>
  /** 当前行：扫商品时优先记到这一行（同一商品多批次时由作业员点选） */
  activeId?: string
  method: OutboundVerification['method']
  containerType: OutboundVerification['containerType']
  containerNo: string
  parentContainerNo?: string
  weight: string
  /** 复核备注（PDA 装箱页可填） */
  remark?: string
}

interface WebVerifySessionState {
  sessions: Record<string, WebVerifySession>
  set: (key: string, session: WebVerifySession) => void
  clear: (key: string) => void
  /** 重置演示数据时清空：种子重建后旧草稿里的实拣归属已不存在 */
  reset: () => void
}

export const webVerifyKey = (warehouseCode: string, orderNo: string) => `${warehouseCode}:${orderNo}`

/**
 * 复核工作台的本次复核（按仓库＋出库单分开，复核工作台前端Demo版PRD 第五节）：
 * 不是业务记录，不计入有效复核量；切页签、刷新后还在，提交成功、清空本次或换一单后移除。
 */
export const useWebVerifySession = create<WebVerifySessionState>()(
  persist(
    (set) => ({
      sessions: {},
      set: (key, session) => set((s) => ({ sessions: { ...s.sessions, [key]: session } })),
      clear: (key) =>
        set((s) => {
          const next = { ...s.sessions }
          delete next[key]
          return { sessions: next }
        }),
      reset: () => set({ sessions: {} }),
    }),
    { name: 'qs-wms-demo-web-verify', version: 1 },
  ),
)
