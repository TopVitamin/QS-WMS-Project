import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PageTab {
  path: string
  /** i18n key */
  titleKey: string
}

export const HOME_TAB: PageTab = { path: '/wms/dashboard', titleKey: 'menu.dashboard' }

interface TabsState {
  tabs: PageTab[]
  open: (tab: PageTab) => void
  /** 关闭后返回应跳转的路径（关闭当前页时） */
  close: (path: string) => string | undefined
  closeOthers: (path: string) => void
}

export const useTabs = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [HOME_TAB],
      open: (tab) => {
        if (get().tabs.some((t) => t.path === tab.path)) return
        set({ tabs: [...get().tabs, tab] })
      },
      close: (path) => {
        if (path === HOME_TAB.path) return undefined
        const tabs = get().tabs
        const idx = tabs.findIndex((t) => t.path === path)
        const next = tabs.filter((t) => t.path !== path)
        set({ tabs: next })
        return (next[idx - 1] ?? next[0])?.path
      },
      closeOthers: (path) => set({ tabs: get().tabs.filter((t) => t.path === HOME_TAB.path || t.path === path) }),
    }),
    { name: 'qs-wms-demo-tabs' },
  ),
)
