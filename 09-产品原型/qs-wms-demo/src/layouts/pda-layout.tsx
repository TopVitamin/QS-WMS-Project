import { Outlet } from 'react-router'

/**
 * PDA 外框：手机/PDA 上全屏显示；在电脑上模拟一台 400×820 的手持设备（深色边框），方便演示。
 */
export function PdaLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted sm:py-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas sm:h-[min(820px,calc(100dvh-48px))] sm:w-[400px] sm:rounded-[28px] sm:border-[10px] sm:border-foreground sm:shadow-2xl">
        <Outlet />
      </div>
    </div>
  )
}
