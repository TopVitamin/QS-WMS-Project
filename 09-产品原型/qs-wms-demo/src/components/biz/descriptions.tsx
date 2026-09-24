import { cn } from '@/lib/utils'

interface DescriptionsProps {
  columns?: 2 | 3 | 4
  className?: string
  children: React.ReactNode
}

/** 详情字段网格容器 */
export function Descriptions({ columns = 3, className, children }: DescriptionsProps) {
  return (
    <div
      className={cn(
        'grid gap-x-6 gap-y-3',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface DescriptionItemProps {
  label: string
  children: React.ReactNode
  className?: string
}

/** 详情字段：标签 + 值 */
export function DescriptionItem({ label, children, className }: DescriptionItemProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm">{children}</span>
    </div>
  )
}
