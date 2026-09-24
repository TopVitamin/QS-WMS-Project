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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider delayDuration={300}>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors closeButton />
      </ConfirmProvider>
    </TooltipProvider>
  </StrictMode>,
)
