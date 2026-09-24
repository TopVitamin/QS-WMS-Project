import { cn } from '@/lib/utils'

/** PDA 流程步骤条 */
export function StepBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b bg-background px-3 py-2">
      {labels.map((label, i) => (
        <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              i + 1 < step && 'bg-emerald-500 text-white',
              i + 1 === step && 'bg-primary text-primary-foreground',
              i + 1 > step && 'bg-muted text-muted-foreground',
            )}
          >
            {i + 1}
          </span>
          <span className={cn('truncate text-xs', i + 1 === step ? 'font-medium' : 'text-muted-foreground')}>{label}</span>
        </div>
      ))}
    </div>
  )
}
