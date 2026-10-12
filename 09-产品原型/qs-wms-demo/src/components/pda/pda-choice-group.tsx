import { cn } from '@/lib/utils'

/** 枚举大按钮组（PDA 规范 §3、§7）：6 个以内的选项不用下拉，每项不小于 48px */
export function PdaChoiceGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 4,
}: {
  options: { value: T; label: string }[]
  value?: T
  onChange: (v: T) => void
  columns?: 2 | 3 | 4
}) {
  return (
    <div
      role="radiogroup"
      className={cn('grid gap-2', columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4')}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-12 rounded-lg border px-1 text-sm leading-tight active:bg-accent',
            value === o.value ? 'border-primary bg-accent font-medium text-accent-foreground' : 'bg-background',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
