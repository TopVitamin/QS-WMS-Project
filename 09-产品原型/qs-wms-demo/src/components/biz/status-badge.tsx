import { useTranslation } from 'react-i18next'
import type { StatusMeta, StatusTone } from '@/config/status'
import { toneDotClass, toneSurfaceClass } from '@/lib/tone-styles'
import { cn } from '@/lib/utils'

/** 单据状态标签：带圆点。颜色只能来自 config/status.ts 的 tone */
export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded px-1.5 text-xs font-medium whitespace-nowrap',
        toneSurfaceClass[meta.tone],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', toneDotClass[meta.tone])} />
      {t(meta.labelKey)}
    </span>
  )
}

/** 无圆点的轻量标签，用于业务类型、品质等枚举 */
export function TagLabel({ children, tone = 'gray' }: { children: React.ReactNode; tone?: StatusTone }) {
  return (
    <span className={cn('inline-flex h-5 items-center rounded px-1.5 text-xs whitespace-nowrap', toneSurfaceClass[tone])}>
      {children}
    </span>
  )
}
