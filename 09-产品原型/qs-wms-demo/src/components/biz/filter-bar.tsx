import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import { Children, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  /**
   * 栅格固定 6 列，可省略；保留参数是为了与 PRD 的 `FilterBar columns={6}` 写法一致。
   * 只接受 6：写成 4 会类型报错（PRD 禁止列表用 4 列）。
   */
  columns?: 6
  /** 常显筛选项，最多 5 个 */
  children: React.ReactNode
  /** 第 6 个及以后的筛选项，点「展开」才显示 */
  advanced?: React.ReactNode
  onSearch: () => void
  onReset: () => void
}

/** 常显不足 5 项时，查询/重置列紧跟最后一项，不空列 */
const actionColStart: Record<number, string> = {
  1: 'xl:col-start-2',
  2: 'xl:col-start-3',
  3: 'xl:col-start-4',
  4: 'xl:col-start-5',
  5: 'xl:col-start-6',
}

/**
 * 列表筛选区：所有管理端列表统一 6 列栅格（xl），常显最多 5 个筛选项，
 * 第 6 列底对齐放查询 / 重置（有 advanced 时再加展开 / 收起）。
 */
export function FilterBar({ children, advanced, onSearch, onReset }: FilterBarProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const primaryCount = Children.count(children)
  const showExpand = advanced ? Children.count(advanced) > 0 : false
  const actionCol = actionColStart[Math.min(Math.max(primaryCount, 1), 5)]
  return (
    <form
      className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-3 xl:grid-cols-6"
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
