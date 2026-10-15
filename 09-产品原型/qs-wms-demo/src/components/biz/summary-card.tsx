import { Num } from '@/components/biz/display'
import { Panel } from '@/components/biz/page-container'
import { Progress } from '@/components/ui/progress'
import type { StatusTone } from '@/config/status'
import { toneTextClass } from '@/lib/tone-styles'
import { EMPTY_TEXT } from '@/lib/typography'
import { cn } from '@/lib/utils'

/** 进度条填充色：只给完成类、进行中两档，避免一张卡里颜色过多 */
const progressToneClass: Partial<Record<StatusTone, string>> = {
  blue: '[&_[data-slot=progress-indicator]]:bg-primary',
  green: '[&_[data-slot=progress-indicator]]:bg-success',
  orange: '[&_[data-slot=progress-indicator]]:bg-warning',
}

/**
 * 详情页右侧的汇总卡：标题 + 进度条 + 关键数量清单。
 * 和 <DetailOverview> 搭配，放在「基础信息」右边；子元素按顺序排，组之间自动加分割线。
 */
export function SummaryCard({
  title,
  description,
  size = 'default',
  className,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** 作业台用 lg：标题 16px、说明 14px（作业台不出现 12px） */
  size?: 'default' | 'lg'
  className?: string
  children: React.ReactNode
}) {
  return (
    <Panel className={cn('flex min-w-0 flex-col gap-4 p-4', className)}>
      <div>
        <h2 className={cn('font-medium', size === 'lg' ? 'text-base' : 'text-sm')}>{title}</h2>
        {description && (
          <p className={cn('mt-0.5 text-muted-foreground', size === 'lg' ? 'text-sm' : 'text-xs')}>{description}</p>
        )}
      </div>
      {children}
    </Panel>
  )
}

/** 汇总卡里的一条进度：标签 + 百分比 + 细条 + 已完成/总数；pct 为 null 表示不适用 */
export function SummaryProgress({
  label,
  done,
  total,
  pct,
  tone = 'blue',
}: {
  label: string
  done: number
  total: number
  pct: number | null
  tone?: 'blue' | 'green' | 'orange'
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium tabular-nums">{pct === null ? EMPTY_TEXT : `${pct}%`}</span>
      </div>
      <Progress value={pct ?? 0} className={cn('h-1.5', progressToneClass[tone])} />
      <div className="text-right text-xs text-muted-foreground tabular-nums">
        <Num value={done} /> / <Num value={total} />
      </div>
    </div>
  )
}

export interface SummaryMetricItem {
  label: string
  /** 数字自动千分位；其他内容传节点 */
  value: number | React.ReactNode
  /** 需要强调时给状态色调（如待处理 orange、完成 green），默认正文色 */
  tone?: StatusTone
  /** 为 true 时整行不显示（如拒收为 0 时不占位） */
  hidden?: boolean
}

/** 汇总卡里的数量清单：左标签、右数字，上方带分割线；作业台用 size="lg"（标签 16px、数字 20px） */
export function SummaryMetrics({ items, size = 'default' }: { items: SummaryMetricItem[]; size?: 'default' | 'lg' }) {
  return (
    <dl className="flex flex-col gap-2.5 border-t pt-4">
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <div
            key={item.label}
            className={cn('flex items-center justify-between gap-3', size === 'lg' ? 'text-base' : 'text-sm')}
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                'font-medium tabular-nums',
                size === 'lg' && 'text-xl font-semibold',
                item.tone && toneTextClass[item.tone],
              )}
            >
              {typeof item.value === 'number' ? <Num value={item.value} /> : item.value}
            </dd>
          </div>
        ))}
    </dl>
  )
}
