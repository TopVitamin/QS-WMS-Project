import { format, parseISO } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from: string
  to: string
}

interface DateRangePickerFieldProps {
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
export function DateRangePickerField({ value, onChange, placeholder, className }: DateRangePickerFieldProps) {
  const { t } = useTranslation()
  const selected = useMemo(() => toRange(value), [value])
  const text = formatRangeLabel(value) ?? (placeholder ?? t('common.dateRangePlaceholder'))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
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
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selected}
          onSelect={(range) => onChange(fromRange(range))}
        />
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
