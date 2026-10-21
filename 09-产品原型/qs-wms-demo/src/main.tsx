import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { ConfirmProvider } from '@/components/biz/confirm-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './i18n'
import './index.css'
import { router } from './app/router'
import { useDb } from './mock/db'
import { useSettings } from './stores/settings'

// WMS 和 PDA 常在两个浏览器标签页里同时演示，这里让两边的数据实时同步
window.addEventListener('storage', (e) => {
  if (e.key === 'qs-wms-demo-db') useDb.persist.rehydrate()
  if (e.key === 'qs-wms-demo-settings') useSettings.persist.rehydrate()
})

// 重新构建静态文件后，已打开的旧页面可能取不到旧 hash 的 chunk；自动整页刷新一次
const CHUNK_RELOAD_KEY = 'qs-wms-demo-chunk-reload-at'
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
  if (Date.now() - last < 10_000) return
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider delayDuration={300}>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors closeButton />
      </ConfirmProvider>
    </TooltipProvider>
  </StrictMode>,
)
