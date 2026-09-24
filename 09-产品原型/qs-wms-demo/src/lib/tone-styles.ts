import type { StatusTone } from '@/config/status'

/** 状态色浅底 + 文字，用于 Badge、KPI 图标底等 */
export const toneSurfaceClass: Record<StatusTone, string> = {
  gray: 'bg-muted text-muted-foreground',
  blue: 'bg-primary/10 text-primary',
  orange: 'bg-warning/10 text-warning',
  green: 'bg-success/10 text-success',
  red: 'bg-destructive/10 text-destructive',
  purple: 'bg-chart-5/10 text-chart-5',
  cyan: 'bg-chart-2/10 text-chart-2',
}

/** 状态色实心圆点 / 条形图色块 */
export const toneDotClass: Record<StatusTone, string> = {
  gray: 'bg-muted-foreground/40',
  blue: 'bg-primary',
  orange: 'bg-warning',
  green: 'bg-success',
  red: 'bg-destructive',
  purple: 'bg-chart-5',
  cyan: 'bg-chart-2',
}
