import { format, parseISO } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldControlA11yProps } from '@/components/biz/field-a11y'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from: string
  to: string
}

interface DateRangePickerFieldProps extends FieldControlA11yProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
}

function toRange(value: DateRangeValue): DateRange | undefined {
  const from = value.from ? parseISO(value.from) : undefined
  const to = value.to ? parseISO(value.to) : undefined
  if (!from && !to) return undefined
  return { from, to }
}

function fromRange(range: DateRange | undefined): DateRangeValue {
  return {
    from: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
    to: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
  }
}

function formatRangeLabel(value: DateRangeValue): string | null {
  if (value.from && value.to) return `${value.from} ~ ${value.to}`
  if (value.from) return value.from
  if (value.to) return value.to
  return null
}

/** 日期范围筛选：一个控件，Popover 内 range 日历；值为 `YYYY-MM-DD` 起止 */
export function DateRangePickerField({
  value,
  onChange,
  placeholder,
  className,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'aria-required': required,
}: DateRangePickerFieldProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => toRange(value), [value])
  const text = formatRangeLabel(value) ?? placeholder ?? t('common.dateRangePlaceholder')
  const locale = i18n.language.startsWith('zh') ? zhCN : enUS

  const selectRange = (range: DateRange | undefined) => {
    const next = fromRange(range)
    onChange(next)
    // 选满起止日期后自动收起；只选了一天时保持打开，方便继续选结束日
    if (next.from && next.to) setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-describedby={describedBy}
          aria-invalid={invalid}
          aria-required={required}
          className={cn(
            'h-8 w-full justify-start px-2.5 font-normal',
            !formatRangeLabel(value) && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon data-icon="inline-start" className="size-3.5 shrink-0 opacity-70" />
          <span className="truncate">{text}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="range" numberOfMonths={2} locale={locale} selected={selected} onSelect={selectRange} />
        {(value.from || value.to) && (
          <div className="flex justify-end border-t p-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ from: '', to: '' })}>
              {t('common.reset')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
