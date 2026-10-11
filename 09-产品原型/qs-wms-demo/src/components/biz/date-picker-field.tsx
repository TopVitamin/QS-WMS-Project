import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** 日期筛选：Popover + Calendar，值为 `YYYY-MM-DD` */
export function DatePickerField({ value, onChange, placeholder, className }: DatePickerFieldProps) {
  const { t } = useTranslation()
  const selected = value ? parseISO(value) : undefined
  const label = selected ? format(selected, 'yyyy-MM-dd') : (placeholder ?? t('common.selectPlaceholder'))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('h-8 w-full justify-start px-2.5 font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon data-icon="inline-start" className="size-3.5 shrink-0 opacity-70" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => onChange(day ? format(day, 'yyyy-MM-dd') : '')}
        />
      </PopoverContent>
    </Popover>
  )
}
