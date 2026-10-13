import { BizCode } from '@/components/biz/display'
import { StatusBadge } from '@/components/biz/status-badge'
import type { StatusMeta } from '@/config/status'
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

/**
 * 详情/作业页标题：固定文案 · 编码 + 状态徽标。
 * 固定文案来自 i18n（如「查看库区详情」），编码和状态单独传，不要拼进文案。
 */
export function DetailTitle({
  title,
  code,
  status,
}: {
  title: string
  /** 字符串按编码样式渲染；需要尾号加粗等特殊样式时直接传节点 */
  code?: React.ReactNode
  status?: StatusMeta
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>{title}</span>
      {code != null && code !== '' && (
        <>
          <span className="font-normal text-muted-foreground">·</span>
          {typeof code === 'string' ? <BizCode className="text-base">{code}</BizCode> : code}
        </>
      )}
      {status && <StatusBadge meta={status} />}
    </span>
  )
}

/** 白底内容块（列表的筛选区、表格区直接用它） */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg border bg-card', className)}>{children}</div>
}

/**
 * 带标题的分区：详情字段组、表单分组、子表都用它。
 * - title：14px 中粗；extra：标题行右侧的操作（如「新增条码」）
 * - flush：内容区不留左右内边距，用于直接放 DataTable（表格自带 px-4 工具栏与分页）
 */
export function Section({
  title,
  extra,
  flush,
  className,
  children,
}: {
  title?: React.ReactNode
  extra?: React.ReactNode
  flush?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Panel className={cn('flex min-w-0 flex-col gap-3', flush ? 'pt-4' : 'p-4', className)}>
      {(title || extra) && (
        <div className={cn('flex min-h-6 items-center justify-between gap-3', flush && 'px-4')}>
          {title ? <h2 className="text-sm font-medium">{title}</h2> : <span />}
          {extra && <div className="flex shrink-0 items-center gap-2">{extra}</div>}
        </div>
      )}
      {children}
    </Panel>
  )
}
