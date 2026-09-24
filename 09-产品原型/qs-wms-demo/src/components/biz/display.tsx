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

/** 单号：等宽字体 + 可点击 */
export function DocNo({ children, onClick }: { children: string; onClick?: () => void }) {
  if (!onClick) return <span className="font-mono text-[13px]">{children}</span>
  return (
    <button type="button" onClick={onClick} className="font-mono text-[13px] text-primary hover:underline">
      {children}
    </button>
  )
}
