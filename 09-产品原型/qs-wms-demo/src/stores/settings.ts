import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { warehouses } from '@/mock/seed'
import type { CurrencyCode, UnitSystem, Warehouse } from '@/types/wms'

export type Language = 'zh-CN' | 'en-US'
export type TimeMode = 'warehouse' | 'local'
export type UnitMode = 'auto' | UnitSystem

const languageDefaultCurrency: Record<Language, CurrencyCode> = {
  'zh-CN': 'CNY',
  'en-US': 'USD',
}

interface SettingsState {
  language: Language
  warehouseCode: string
  displayCurrency: CurrencyCode
  currencyManuallySet: boolean
  timeMode: TimeMode
  unitMode: UnitMode
  sidebarCollapsed: boolean
  operator: string
  setLanguage: (v: Language) => void
  setWarehouse: (code: string) => void
  setDisplayCurrency: (v: CurrencyCode) => void
  setTimeMode: (v: TimeMode) => void
  setUnitMode: (v: UnitMode) => void
  toggleSidebar: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'zh-CN',
      warehouseCode: warehouses[0].code,
      displayCurrency: 'CNY',
      currencyManuallySet: false,
      timeMode: 'warehouse',
      unitMode: 'auto',
      sidebarCollapsed: false,
      operator: 'Lily Chen',
      setLanguage: (language) =>
        set((s) => ({
          language,
          ...(s.currencyManuallySet ? {} : { displayCurrency: languageDefaultCurrency[language] }),
        })),
      setWarehouse: (warehouseCode) => set({ warehouseCode }),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency, currencyManuallySet: true }),
      setTimeMode: (timeMode) => set({ timeMode }),
      setUnitMode: (unitMode) => set({ unitMode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'qs-wms-demo-settings',
      onRehydrateStorage: () => (state) => {
        if (state && !state.currencyManuallySet && state.displayCurrency !== languageDefaultCurrency[state.language]) {
          state.displayCurrency = languageDefaultCurrency[state.language]
        }
      },
    },
  ),
)

export function useCurrentWarehouse(): Warehouse {
  const code = useSettings((s) => s.warehouseCode)
  return warehouses.find((w) => w.code === code) ?? warehouses[0]
}

/** 当前生效的单位制：auto 时跟随仓库 */
export function useUnitSystem(): UnitSystem {
  const mode = useSettings((s) => s.unitMode)
  const warehouse = useCurrentWarehouse()
  return mode === 'auto' ? warehouse.unitSystem : mode
}

/** 当前生效的显示时区 */
export function useDisplayTimezone(): string {
  const mode = useSettings((s) => s.timeMode)
  const warehouse = useCurrentWarehouse()
  return mode === 'warehouse' ? warehouse.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone
}
