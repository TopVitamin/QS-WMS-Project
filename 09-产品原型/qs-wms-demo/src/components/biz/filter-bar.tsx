import { ChevronDown, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  /** 始终显示的筛选项（建议 3 个以内） */
  children: React.ReactNode
  /** 展开后才显示的筛选项 */
  advanced?: React.ReactNode
  onSearch: () => void
  onReset: () => void
}

/** 列表页筛选区：一行 4 列栅格，超出部分折叠 */
export function FilterBar({ children, advanced, onSearch, onReset }: FilterBarProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  return (
    <form
      className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
    >
      {children}
      {expanded && advanced}
      <div className="flex items-end justify-end gap-2 xl:col-start-4">
        <Button type="submit">
          <Search data-icon="inline-start" />
          {t('common.search')}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          {t('common.reset')}
        </Button>
        {advanced && (
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
