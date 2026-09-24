import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 大号数量步进器，适合手持设备 */
export function QtyStepper({
  label,
  value,
  onChange,
  max,
  tone = 'default',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
  tone?: 'default' | 'danger'
}) {
  const clamp = (v: number) => Math.max(0, max === undefined ? v : Math.min(max, v))
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn('text-base', tone === 'danger' && 'text-destructive')}>{label}</span>
      <div className="flex items-center overflow-hidden rounded-xl border bg-background">
        <button
          type="button"
          className="flex size-12 items-center justify-center active:bg-muted"
          onClick={() => onChange(clamp(value - 1))}
          aria-label="minus"
        >
          <Minus className="size-5" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="h-12 w-20 border-x text-center text-xl font-semibold tabular-nums outline-none"
        />
        <button
          type="button"
          className="flex size-12 items-center justify-center active:bg-muted"
          onClick={() => onChange(clamp(value + 1))}
          aria-label="plus"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  )
}
