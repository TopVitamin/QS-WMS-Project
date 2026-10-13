import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Num } from '@/components/biz/display'
import { Panel } from '@/components/biz/page-container'
import type { StatusTone } from '@/config/status'
import { toneSurfaceClass } from '@/lib/tone-styles'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  /** 数字自动千分位；金额等传 <Money /> 节点 */
  value: number | React.ReactNode
  /** 工作台 KPI 带图标；页面顶部的概览数字可不带 */
  icon?: LucideIcon
  tone?: StatusTone
  to?: string
  className?: string
}

/** 统计卡片：标签 12px 灰 + 数字 20px 半粗，可选图标与跳转 */
export function StatCard({ label, value, icon: Icon, tone = 'blue', to, className }: StatCardProps) {
  const content = (
    <Panel
      className={cn('flex items-center gap-3 px-4 py-3.5', to && 'transition-shadow hover:shadow-sm', className)}
    >
      {Icon && (
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', toneSurfaceClass[tone])}>
          <Icon className="size-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">
          {typeof value === 'number' ? <Num value={value} /> : value}
        </div>
      </div>
    </Panel>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return content
}
