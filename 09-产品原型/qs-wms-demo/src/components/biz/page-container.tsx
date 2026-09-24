import { cn } from '@/lib/utils'

interface PageContainerProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  /** 列表页铺满视口高度，表格区域内部滚动 */
  fill?: boolean
  className?: string
}

export function PageContainer({ title, description, actions, children, fill, className }: PageContainerProps) {
  return (
    <div className={cn('flex flex-col gap-3 p-4', fill && 'h-full min-h-0', className)}>
      <div className="flex min-h-8 items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

/** 白底内容块 */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg border bg-card', className)}>{children}</div>
}
