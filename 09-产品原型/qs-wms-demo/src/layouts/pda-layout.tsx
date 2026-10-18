import { Outlet } from 'react-router'

/**
 * PDA 外框：手机/PDA 上全屏显示；在电脑上模拟一台手持设备（深色边框），方便演示。
 * 尺寸按《PDA作业端设计规范》§2 的验收基线 360×560（内容区），边框用 ring 画在内容区之外，
 * 这样机框里的可用区域就是真机浏览器扣掉状态栏与地址栏后的 360×560。
 */
export function PdaLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted sm:py-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas sm:h-[min(560px,calc(100dvh-68px))] sm:w-[360px] sm:rounded-[28px] sm:ring-[10px] sm:ring-foreground sm:shadow-2xl">
        <Outlet />
      </div>
    </div>
  )
}
