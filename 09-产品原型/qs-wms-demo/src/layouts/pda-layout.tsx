import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import { PageLoading } from '@/components/biz/page-loading'
import { PdaToaster } from '@/components/pda/pda-toaster'
import { Button } from '@/components/ui/button'
import { PDA_STATUS_BAR_HEIGHT, pdaDevices } from '@/config/pda-devices'
import { setPortalContainer } from '@/lib/portal-container'
import { useNow } from '@/hooks/use-now'
import { formatDateTime } from '@/lib/format'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'

/** 机框以外占的高度：上下留白 32 + 机型切换条 38 + 间距 16 + 边框 20，再留一点余量；窗口不够高时按它算缩放比 */
const OUTSIDE_FRAME_HEIGHT = 112

function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

/**
 * PDA 外框：手机/PDA 上全屏显示（真机自带状态栏，这里不画）；在电脑上模拟一台手持设备，方便演示。
 * 一期全屏运行、没有地址栏，机框按整块屏幕画：状态栏 + 可用区，屏幕比例与真机一致，可用区是《PDA作业端设计规范》§2 的三档。
 * 默认 18:9 主流机（720×1440，可用区 360×696），可切到 5 寸验收基线（360×616）和 4 寸键盘机（320×509）。
 * 窗口不够高时整台等比缩小，不压扁比例。
 */
export function PdaLayout() {
  const { t } = useTranslation()
  const deviceKey = useSettings((s) => s.pdaDevice)
  const setPdaDevice = useSettings((s) => s.setPdaDevice)
  const device = pdaDevices.find((d) => d.key === deviceKey) ?? pdaDevices[0]
  const viewportHeight = useSyncExternalStore(subscribeResize, () => window.innerHeight)
  const [portal, setPortal] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    setPortalContainer(portal)
    return () => setPortalContainer(null)
  }, [portal])
  const zoom = Math.min(1, Math.max(0.5, (viewportHeight - OUTSIDE_FRAME_HEIGHT) / device.height))
  const frameVars = {
    '--pda-w': `${device.width}px`,
    '--pda-h': `${device.height}px`,
    '--pda-zoom': zoom,
  } as React.CSSProperties

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted sm:py-4">
      <div
        role="group"
        aria-label={t('pda.deviceFrame')}
        className="hidden gap-1 rounded-lg border bg-background p-1 sm:flex"
      >
        {pdaDevices.map((d) => (
          <Button
            key={d.key}
            size="sm"
            variant={d.key === device.key ? 'secondary' : 'ghost'}
            aria-pressed={d.key === device.key}
            className="tabular-nums"
            onClick={() => setPdaDevice(d.key)}
          >
            {d.label}
          </Button>
        ))}
      </div>
      <div
        style={{ ...frameVars, contain: 'paint', transform: 'translateZ(0)' }}
        className="pda-frame relative flex h-dvh w-full flex-col overflow-hidden bg-canvas sm:h-(--pda-h) sm:w-(--pda-w) sm:rounded-[28px] sm:shadow-2xl sm:ring-[10px] sm:ring-foreground sm:[zoom:var(--pda-zoom)]"
      >
        <PdaStatusBar />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </div>
        <PdaToaster />
        <div ref={setPortal} />
      </div>
    </div>
  )
}

/** 模拟状态栏：仓库当地时间 + 信号、电量；全屏应用的状态栏跟随标题栏主色（只在电脑演示时画） */
function PdaStatusBar() {
  const now = useNow()
  const warehouse = useCurrentWarehouse()
  return (
    <div
      aria-hidden="true"
      style={{ height: PDA_STATUS_BAR_HEIGHT }}
      className="hidden shrink-0 items-center justify-between bg-primary px-6 text-xs font-medium text-primary-foreground tabular-nums sm:flex"
    >
      <span>{formatDateTime(now.toISOString(), warehouse.timezone, 'HH:mm')}</span>
      <span className="flex items-center gap-1">
        <Signal className="size-3.5" />
        <Wifi className="size-3.5" />
        <BatteryFull className="size-4" />
      </span>
    </div>
  )
}
