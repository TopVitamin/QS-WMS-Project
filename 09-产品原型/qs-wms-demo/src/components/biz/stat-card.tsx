import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Num } from '@/components/biz/display'
import { Panel } from '@/components/biz/page-container'
import { cn } from '@/lib/utils'

export type StatCardTone = 'warning' | 'primary' | 'accent' | 'success' | 'destructive' | 'muted'

const toneClass: Record<StatCardTone, string> = {
  warning: 'bg-warning/10 text-warning',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  tone?: StatCardTone
  to?: string
  className?: string
}

/** KPI 统计卡片：图标 + 标签 + 数字，可点击跳转 */
export function StatCard({ label, value, icon: Icon, tone = 'primary', to, className }: StatCardProps) {
  const content = (
    <Panel className={cn('flex items-center gap-3 px-4 py-3.5 transition-shadow hover:shadow-sm', className)}>
      <div className={cn('flex size-10 items-center justify-center rounded-lg', toneClass[tone])}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">
          <Num value={value} />
        </div>
      </div>
    </Panel>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return content
}
