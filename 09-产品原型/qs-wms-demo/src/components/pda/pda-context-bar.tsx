import { cn } from '@/lib/utils'

/** 上下文条（PDA 规范 §3）：标题栏下常驻本次作业的单据、容器与进度 */
export function PdaContextBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-10 shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 border-b bg-background px-3 py-1.5 text-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** 上下文条里的分隔点 */
export function PdaContextDot() {
  return <span className="text-muted-foreground">·</span>
}
