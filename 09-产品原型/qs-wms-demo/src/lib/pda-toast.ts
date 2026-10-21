import { create } from 'zustand'

export type PdaToastTone = 'success' | 'error' | 'info'

export interface PdaToastItem {
  id: number
  tone: PdaToastTone
  text: string
}

interface PdaToastState {
  items: PdaToastItem[]
  push: (tone: PdaToastTone, text: string) => void
  remove: (id: number) => void
}

let nextId = 1

export const usePdaToastStore = create<PdaToastState>((set, get) => ({
  items: [],
  push: (tone, text) => {
    const id = nextId++
    set({ items: [...get().items, { id, tone, text }] })
    window.setTimeout(() => get().remove(id), 2600)
  },
  remove: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}))

/** PDA 内的轻提示：渲染在模拟机框内，不挂到桌面视口 */
export const pdaToast = {
  success: (text: string) => usePdaToastStore.getState().push('success', text),
  error: (text: string) => usePdaToastStore.getState().push('error', text),
  info: (text: string) => usePdaToastStore.getState().push('info', text),
}
