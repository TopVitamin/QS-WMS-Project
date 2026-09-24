import { cn } from '@/lib/utils'

export interface StatusTabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** 列表页顶部状态页签，带数量，例如：全部(120) 待入库(20) … */
export function StatusTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: StatusTabItem<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b px-4">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative -mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm transition-colors',
              active
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
