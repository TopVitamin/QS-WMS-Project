import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import { Children, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  /** 栅格列数：业务列表默认 4；基础资料等紧凑筛选可用 6 */
  columns?: 4 | 6
  children: React.ReactNode
  /** 展开后才显示的筛选项（4 列、6 列均可用） */
  advanced?: React.ReactNode
  onSearch: () => void
  onReset: () => void
}

const gridClass: Record<4 | 6, string> = {
  4: 'md:grid-cols-2 xl:grid-cols-4',
  6: 'md:grid-cols-3 xl:grid-cols-6',
}

/** 6 列模式：常显最多 5 个筛选项，第 6 列放操作；不足 5 个时操作列紧跟最后一项 */
const actionColStart6: Record<number, string> = {
  1: 'xl:col-start-2',
  2: 'xl:col-start-3',
  3: 'xl:col-start-4',
  4: 'xl:col-start-5',
  5: 'xl:col-start-6',
  6: 'xl:col-start-6',
}

const actionColStart4: Record<number, string> = {
  1: 'xl:col-start-2',
  2: 'xl:col-start-3',
  3: 'xl:col-start-4',
  4: 'xl:col-start-4',
}

/** 列表页筛选区：4 列或 6 列栅格；6 列时为 5 个筛选项 + 第 6 列底对齐放查询/重置 */
export function FilterBar({ columns = 4, children, advanced, onSearch, onReset }: FilterBarProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const primaryCount = Children.count(children)
  const advancedCount = advanced ? Children.count(advanced) : 0
  const showExpand = advancedCount > 0
  const actionCol =
    columns === 6
      ? actionColStart6[Math.min(Math.max(primaryCount, 1), 6)]
      : actionColStart4[Math.min(Math.max(primaryCount, 1), 4)]
  return (
    <form
      className={cn('grid grid-cols-1 gap-x-4 gap-y-3', gridClass[columns])}
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
    >
      {children}
      {showExpand && expanded && advanced}
      <div className={cn('flex items-end justify-end gap-2', actionCol)}>
        <Button type="submit">
          <Search data-icon="inline-start" />
          {t('common.search')}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          {t('common.reset')}
        </Button>
        {showExpand && (
          <Button type="button" variant="ghost" className="text-primary" onClick={() => setExpanded((v) => !v)}>
            {expanded ? t('common.collapse') : t('common.expand')}
            <ChevronDown data-icon="inline-end" className={cn('transition-transform', expanded && 'rotate-180')} />
          </Button>
        )}
      </div>
    </form>
  )
}

export function FilterItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label className="text-xs font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
