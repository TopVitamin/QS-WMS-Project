import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  convertMoney,
  formatDateTime,
  formatDimension,
  formatMoney,
  formatNumber,
  formatWeight,
} from '@/lib/format'
import { textCode, textCodeLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDisplayTimezone, useSettings, useUnitSystem } from '@/stores/settings'
import type { Money as MoneyValue } from '@/types/wms'

/** 金额：显示原币，悬停显示折算后的"显示币别"金额 */
export function Money({ value, className }: { value: MoneyValue; className?: string }) {
  const { t, i18n } = useTranslation()
  const displayCurrency = useSettings((s) => s.displayCurrency)
  const text = formatMoney(value, i18n.language)
  if (value.currency === displayCurrency) {
    return <span className={cn('tabular-nums', className)}>{text}</span>
  }
  const converted = convertMoney(value, displayCurrency)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('cursor-help tabular-nums decoration-dotted underline-offset-4 hover:underline', className)}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t('settings.converted')} ≈ {formatMoney(converted, i18n.language)}
      </TooltipContent>
    </Tooltip>
  )
}

/** 时间：按当前显示时区（仓库时区 / 本地时区）格式化 */
export function DateTime({ value, pattern, className }: { value?: string; pattern?: string; className?: string }) {
  const tz = useDisplayTimezone()
  if (!value) return <span className="text-muted-foreground">-</span>
  return <span className={cn('tabular-nums', className)}>{formatDateTime(value, tz, pattern)}</span>
}

export function Weight({ grams }: { grams: number }) {
  const unit = useUnitSystem()
  return <span className="tabular-nums">{formatWeight(grams, unit)}</span>
}

export function Dimension({ l, w, h }: { l: number; w: number; h: number }) {
  const unit = useUnitSystem()
  return <span className="tabular-nums">{formatDimension(l, w, h, unit)}</span>
}

export function Num({ value, className }: { value: number; className?: string }) {
  const { i18n } = useTranslation()
  return <span className={cn('tabular-nums', className)}>{formatNumber(value, i18n.language)}</span>
}

/** 单号末尾若干位加粗，便于作业页快速辨认（默认末 3 位） */
export function DocNoTail({
  value,
  tail = 3,
  className,
}: {
  value: string
  tail?: number
  className?: string
}) {
  const text = value.trim()
  if (!text) return <span className="text-muted-foreground">—</span>
  if (text.length <= tail) {
    return <span className={cn(textCode, 'font-semibold', className)}>{text}</span>
  }
  return (
    <span className={cn(textCode, className)}>
      {text.slice(0, -tail)}
      <span className="font-semibold text-foreground">{text.slice(-tail)}</span>
    </span>
  )
}

/** 单号/业务编码：sans + tabular-nums，与列表操作链同字号；可点击进详情 */
export function DocNo({
  children,
  onClick,
  className,
  emphasizeTail = false,
  tailLength = 3,
}: {
  children: string
  onClick?: () => void
  className?: string
  /** 作业类页面可开启，末位数字加粗 */
  emphasizeTail?: boolean
  tailLength?: number
}) {
  const body = emphasizeTail ? <DocNoTail value={children} tail={tailLength} /> : children
  if (!onClick) return <span className={cn(!emphasizeTail && textCode, className)}>{body}</span>
  return (
    <button type="button" onClick={onClick} className={cn(textCodeLink, className)}>
      {body}
    </button>
  )
}

/** 不可点击的编码展示（与 DocNo 同字形） */
export function BizCode({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(textCode, className)}>{children}</span>
}
