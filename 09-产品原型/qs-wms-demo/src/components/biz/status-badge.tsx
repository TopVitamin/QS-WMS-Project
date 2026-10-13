import { useTranslation } from 'react-i18next'
import type { StatusMeta, StatusTone } from '@/config/status'
import { toneDotClass, toneSurfaceClass } from '@/lib/tone-styles'
import { cn } from '@/lib/utils'

/** 单据生命周期状态标签：带圆点。颜色只能来自 config/status.ts 的 tone */
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

type TagLabelProps =
  | { meta: StatusMeta; children?: never; tone?: never }
  | { meta?: never; children: React.ReactNode; tone?: StatusTone }

/**
 * 无圆点的轻量标签，用于枚举属性（品质、业务类型等）。
 * 有映射的枚举传 `meta`（如 qualityMeta[q]），颜色和文案都来自 config/status.ts；
 * 临时文本标签传 children + tone。
 */
export function TagLabel({ meta, children, tone = 'gray' }: TagLabelProps) {
  const { t } = useTranslation()
  const finalTone = meta ? meta.tone : tone
  return (
    <span className={cn('inline-flex h-5 items-center rounded px-1.5 text-xs whitespace-nowrap', toneSurfaceClass[finalTone])}>
      {meta ? t(meta.labelKey) : children}
    </span>
  )
}
