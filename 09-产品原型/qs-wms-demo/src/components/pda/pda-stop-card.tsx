import { CircleCheck, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 按库位作业的当前站（拣货、返库上架共用）：左侧色条 + 24px 库位号，和普通卡片一眼区分。
 * 没扫库位前是主色「前往」，扫到后变绿「已到达」；右侧写下一站，作业员边走边看。
 */
export function PdaStopCard({
  label,
  location,
  arrived,
  arrivedLabel,
  nextLabel,
  next,
}: {
  /** 「前往库位」「建议库位」等 */
  label: string
  location: string
  arrived: boolean
  /** 已到达时显示在右上角的短标签，如「已扫描」 */
  arrivedLabel: string
  nextLabel: string
  next?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border-l-4 bg-background px-3 py-2.5 shadow-xs',
        arrived ? 'border-l-success' : 'border-l-primary',
      )}
    >
      {arrived ? (
        <CircleCheck className="size-6 shrink-0 text-success-text" />
      ) : (
        <MapPin className="size-6 shrink-0 text-primary" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted-foreground">{arrived ? arrivedLabel : label}</div>
        <div className={cn('truncate font-mono text-2xl font-bold', arrived ? 'text-foreground' : 'text-primary')}>
          {location}
        </div>
      </div>
      {next && (
        <div className="shrink-0 text-right">
          <div className="text-sm text-muted-foreground">{nextLabel}</div>
          <div className="font-mono text-base font-semibold">{next}</div>
        </div>
      )}
    </div>
  )
}
