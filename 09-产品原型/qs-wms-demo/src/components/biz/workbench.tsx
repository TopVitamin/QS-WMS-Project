import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Empty } from '@/components/biz/display'
import { cn } from '@/lib/utils'

/**
 * 作业台组件（管理端扫码作业页，规范见 docs/04-作业台设计规范.md）。
 * 字号比普通后台大一档：提示语 20px、当前对象 24px，站在一米外也能看清。
 */

export type PromptTone = 'info' | 'success' | 'warning' | 'error'

export interface WorkbenchPromptState {
  tone: PromptTone
  /** 一句话：现在该做什么 / 刚才发生了什么（含对象与数字） */
  title: string
  /** 第二句：原因或下一步 */
  detail?: string
}

const promptStyle: Record<PromptTone, { icon: LucideIcon; box: string; iconClass: string }> = {
  info: { icon: Info, box: 'border-primary/30 bg-primary/5', iconClass: 'text-primary' },
  success: { icon: CheckCircle2, box: 'border-success/40 bg-success/10', iconClass: 'text-success-text' },
  warning: { icon: TriangleAlert, box: 'border-warning/50 bg-warning/10', iconClass: 'text-warning-text' },
  error: { icon: AlertCircle, box: 'border-destructive/40 bg-destructive/10', iconClass: 'text-destructive' },
}

/**
 * 步骤提示条：放在扫码框上方，始终告诉作业员「现在该做什么」；
 * 扫码与录入的结果（成功、扫错、超量）也写在这里，直到下一次操作才换掉，不会像 toast 一样一闪而过。
 */
export function WorkbenchPrompt({ prompt, className }: { prompt: WorkbenchPromptState; className?: string }) {
  const style = promptStyle[prompt.tone]
  const Icon = style.icon
  return (
    <div
      role={prompt.tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', style.box, className)}
    >
      <Icon className={cn('mt-0.5 size-6 shrink-0', style.iconClass)} />
      <div className="min-w-0">
        <p className="text-xl leading-snug font-semibold text-foreground">{prompt.title}</p>
        {prompt.detail && <p className="mt-0.5 text-base text-muted-foreground">{prompt.detail}</p>}
      </div>
    </div>
  )
}

/** 当前作业对象（容器、库位、包裹…）：24px 粗体，左侧主色条，和普通文字一眼区分 */
export function WorkbenchCurrent({
  icon: Icon,
  label,
  children,
  extra,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  /** 右侧操作，如「新增容器」 */
  extra?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-l-4 border-l-primary bg-card px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-6 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="truncate text-2xl leading-tight font-bold">{children}</div>
        </div>
      </div>
      {extra && <div className="flex min-w-0 items-center gap-2">{extra}</div>}
    </div>
  )
}

/**
 * 作业台商品列（上架、收货共用；列宽、表格样式见 lib/workbench-styles.ts）：
 * 条码大字在上（扫码对实物看它），SKU 小字在下；批次、新品标记等放 children。
 * 编码类不截断、不缩小：放得下就一行，特别长的按字符折行。没有条码时 SKU 当大字显示。名称单独一列，见 WorkbenchProductName。
 */
export function WorkbenchProductCode({
  barcode,
  sku,
  children,
}: {
  barcode?: string
  sku: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xl leading-tight font-semibold tabular-nums [overflow-wrap:anywhere]">
        {barcode || sku}
      </span>
      {barcode && (
        <span className="text-base leading-snug text-muted-foreground tabular-nums [overflow-wrap:anywhere]">
          {sku}
        </span>
      )}
      {children}
    </div>
  )
}

/** 作业台名称列：18px 正文色；最多两行，再长省略，悬停看全称 */
export function WorkbenchProductName({ name }: { name?: string }) {
  if (!name) return <Empty className="text-lg" />
  return (
    <span className="line-clamp-2 text-lg leading-snug [overflow-wrap:anywhere]" title={name}>
      {name}
    </span>
  )
}
