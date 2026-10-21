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
        'grid grid-cols-1 gap-x-6 gap-y-3',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 xl:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 xl:grid-cols-4',
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
  /** 长文本、自定义展示块时不截断 */
  multiline?: boolean
}

/** 详情字段：标签 + 值 */
export function DescriptionItem({ label, children, className, multiline }: DescriptionItemProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={cn('text-sm', !multiline && 'truncate')}>{children}</div>
    </div>
  )
}
