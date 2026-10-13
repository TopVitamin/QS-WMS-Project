import type { StatusTone } from '@/config/status'

/** 状态色浅底 + 文字，用于 StatusBadge、TagLabel、统计卡片图标底等；文字一律用 -text 档，保证对比度 */
export const toneSurfaceClass: Record<StatusTone, string> = {
  gray: 'bg-muted text-muted-foreground',
  blue: 'bg-primary/10 text-primary',
  orange: 'bg-warning/10 text-warning-text',
  green: 'bg-success/10 text-success-text',
  red: 'bg-destructive/10 text-destructive',
  purple: 'bg-tone-purple/10 text-tone-purple-text',
  cyan: 'bg-tone-cyan/10 text-tone-cyan-text',
}

/** 状态色实心圆点 / 条形图色块 */
export const toneDotClass: Record<StatusTone, string> = {
  gray: 'bg-muted-foreground/40',
  blue: 'bg-primary',
  orange: 'bg-warning',
  green: 'bg-success',
  red: 'bg-destructive',
  purple: 'bg-tone-purple',
  cyan: 'bg-tone-cyan',
}

/** 只给文字上色（如表格里需要强调的数量），白底上同样满足对比度 */
export const toneTextClass: Record<StatusTone, string> = {
  gray: 'text-muted-foreground',
  blue: 'text-primary',
  orange: 'text-warning-text',
  green: 'text-success-text',
  red: 'text-destructive',
  purple: 'text-tone-purple-text',
  cyan: 'text-tone-cyan-text',
}
