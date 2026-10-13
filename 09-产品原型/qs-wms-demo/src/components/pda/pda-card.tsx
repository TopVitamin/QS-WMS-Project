import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * PDA 视觉约定（PDA 作业端设计规范 §7）：白卡片放在浅灰画布上，圆角 12px、极浅阴影，
 * 卡片内边距 12px，卡片间距 8px；可点元素高不小于 48px（列表行 56px）。
 */

/** 信息卡片：当前对象、提示、汇总 */
export function PdaCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl bg-background p-3 shadow-xs', className)}>{children}</div>
}

/**
 * 可点列表行：整行可点、最小高 56px。
 * - chevron：右侧箭头，表示点进下一步
 * - selected：单选/多选列表的选中态（主色描边）；未选中时用 selectable 让描边位保持占位
 */
export function PdaListItem({
  onClick,
  chevron,
  selectable,
  selected,
  role,
  className,
  children,
}: {
  onClick: () => void
  chevron?: boolean
  selectable?: boolean
  selected?: boolean
  role?: 'radio' | 'checkbox'
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? Boolean(selected) : undefined}
      onClick={onClick}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-xl bg-background p-3 text-left active:bg-accent',
        selectable ? cn('border', selected ? 'border-primary' : 'border-transparent shadow-xs') : 'shadow-xs',
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {chevron && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
    </button>
  )
}

/** 列表分组：14px 中粗标题 + 右侧可选操作，下面是 8px 间距的卡片列表 */
export function PdaSection({
  title,
  extra,
  children,
}: {
  title: React.ReactNode
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2 text-sm font-medium">
        <span>{title}</span>
        {extra}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

/** PDA 按钮：高 48px、16px 字，放在 PdaFooter 或卡片里；宽度由调用方给（flex-1 / w-24） */
export function PdaButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button className={cn('h-12 text-base', className)} {...props} />
}
