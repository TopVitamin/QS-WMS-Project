import { cn } from '@/lib/utils'

/** 页签栏外观：列表状态页签（StatusTabs）与详情页签（DetailTabs）共用，保证两处长得一样 */
export const tabBarClass = 'flex items-center gap-1 overflow-x-auto border-b px-4'

export function tabItemClass(active: boolean) {
  return cn(
    'relative -mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm transition-colors focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none',
    active
      ? 'border-primary font-medium text-primary'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )
}

export function tabCountClass(active: boolean) {
  return cn(
    'rounded-full px-1.5 text-xs tabular-nums',
    active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
  )
}
