import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InboundReceiveDraft } from '@/lib/inbound-receive'

/** 无容器收货在作业中的固定键（路由参数 `box=BULK`） */
export const BULK_BOX_KEY = 'BULK'

export interface ReceiveSessionLine extends InboundReceiveDraft {
  skuCode: string
}

export interface ReceiveSessionBox {
  key: string
  containerNo?: string
  bulkPiece: boolean
  /** OPEN 录入中；STASHED 已校验暂存（新增容器或进入提交时） */
  status: 'OPEN' | 'STASHED'
  lines: ReceiveSessionLine[]
}

interface ReceiveSessionState {
  inboundNo?: string
  boxes: ReceiveSessionBox[]
  /** 最后操作的容器，「继续作业」回到这里 */
  activeKey?: string
  updatedAt?: string
  start: (inboundNo: string) => void
  /** 打开容器：已在作业中则直接打开，否则新增 */
  openBox: (input: { containerNo?: string; bulkPiece: boolean }) => string
  upsertLine: (boxKey: string, line: ReceiveSessionLine) => void
  removeLine: (boxKey: string, skuCode: string) => void
  stashBox: (boxKey: string) => void
  /** 丢弃没有明细的容器 */
  dropEmptyBox: (boxKey: string) => void
  /** 提交成功后移出已提交的容器 */
  removeBoxes: (boxKeys: string[]) => void
  reset: () => void
}

export function boxKeyOf(containerNo: string | undefined, bulkPiece: boolean): string {
  return bulkPiece || !containerNo ? BULK_BOX_KEY : containerNo.trim().toUpperCase()
}

const now = () => new Date().toISOString()

/**
 * PDA 收货作业暂存（主 PRD R17）：未提交的容器与明细保存在本机，刷新、退出后可恢复。
 * 暂存不是收货记录：不改库存、不生成上架单与入库异常，管理端看不到。
 */
export const useReceiveSession = create<ReceiveSessionState>()(
  persist(
    (set, get) => ({
      inboundNo: undefined,
      boxes: [],
      activeKey: undefined,
      updatedAt: undefined,

      start: (inboundNo) => set({ inboundNo, boxes: [], activeKey: undefined, updatedAt: now() }),

      openBox: ({ containerNo, bulkPiece }) => {
        const key = boxKeyOf(containerNo, bulkPiece)
        const exists = get().boxes.some((b) => b.key === key)
        set((s) => ({
          activeKey: key,
          updatedAt: now(),
          boxes: exists
            ? s.boxes.map((b) => (b.key === key ? { ...b, status: 'OPEN' } : b))
            : [...s.boxes, { key, containerNo: bulkPiece ? undefined : containerNo?.trim(), bulkPiece, status: 'OPEN', lines: [] }],
        }))
        return key
      },

      upsertLine: (boxKey, line) =>
        set((s) => ({
          activeKey: boxKey,
          updatedAt: now(),
          boxes: s.boxes.map((b) => {
            if (b.key !== boxKey) return b
            const exists = b.lines.some((l) => l.skuCode === line.skuCode)
            return {
              ...b,
              status: 'OPEN',
              lines: exists ? b.lines.map((l) => (l.skuCode === line.skuCode ? line : l)) : [...b.lines, line],
            }
          }),
        })),

      removeLine: (boxKey, skuCode) =>
        set((s) => ({
          updatedAt: now(),
          boxes: s.boxes.map((b) => (b.key === boxKey ? { ...b, lines: b.lines.filter((l) => l.skuCode !== skuCode) } : b)),
        })),

      stashBox: (boxKey) =>
        set((s) => ({
          updatedAt: now(),
          boxes: s.boxes.map((b) => (b.key === boxKey ? { ...b, status: 'STASHED' } : b)),
        })),

      dropEmptyBox: (boxKey) =>
        set((s) => ({
          updatedAt: now(),
          activeKey: s.activeKey === boxKey ? undefined : s.activeKey,
          boxes: s.boxes.filter((b) => b.key !== boxKey || b.lines.length > 0),
        })),

      removeBoxes: (boxKeys) =>
        set((s) => ({
          updatedAt: now(),
          activeKey: s.activeKey && boxKeys.includes(s.activeKey) ? undefined : s.activeKey,
          boxes: s.boxes.filter((b) => !boxKeys.includes(b.key)),
        })),

      reset: () => set({ inboundNo: undefined, boxes: [], activeKey: undefined, updatedAt: undefined }),
    }),
    { name: 'qs-wms-demo-pda-receive', version: 1 },
  ),
)

export function sessionLineCount(boxes: ReceiveSessionBox[]): number {
  return boxes.reduce((s, b) => s + b.lines.length, 0)
}
