import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { PageLoading } from '@/components/biz/page-loading'
import { resolvePageTab } from '@/config/page-tabs'
import { useTabs } from '@/stores/tabs'
import { WmsSidebar } from './wms-sidebar'
import { WmsTabsBar } from './wms-tabs-bar'
import { WmsTopbar } from './wms-topbar'

export function WmsLayout() {
  const location = useLocation()
  const openTab = useTabs((s) => s.open)

  useEffect(() => {
    const tab = resolvePageTab(location.pathname)
    if (tab) openTab(tab)
  }, [location.pathname, openTab])

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <WmsSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <WmsTopbar />
        <WmsTabsBar />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
