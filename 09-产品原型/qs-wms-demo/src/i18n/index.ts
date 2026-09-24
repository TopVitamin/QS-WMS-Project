import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useSettings, type Language } from '@/stores/settings'
import type { CurrencyCode } from '@/types/wms'
import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'

const languageDefaultCurrency: Record<Language, CurrencyCode> = {
  'zh-CN': 'CNY',
  'en-US': 'USD',
}

function syncCurrencyWithLanguage() {
  const { language, displayCurrency, currencyManuallySet } = useSettings.getState()
  if (!currencyManuallySet && displayCurrency !== languageDefaultCurrency[language]) {
    useSettings.setState({ displayCurrency: languageDefaultCurrency[language] })
  }
}

syncCurrencyWithLanguage()
useSettings.persist.onFinishHydration(syncCurrencyWithLanguage)

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: useSettings.getState().language,
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

useSettings.subscribe((state, prev) => {
  if (state.language !== prev.language) {
    i18n.changeLanguage(state.language)
    document.documentElement.lang = state.language
  }
})
document.documentElement.lang = useSettings.getState().language

export default i18n
