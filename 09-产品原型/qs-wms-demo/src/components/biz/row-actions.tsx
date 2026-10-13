import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'

/** 文字按钮：表格操作列、子表行内操作统一用它；danger 用于停用、删除等 */
export function ActionLink({
  danger,
  className,
  ...props
}: React.ComponentProps<'button'> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn(textLink, 'whitespace-nowrap', danger && 'text-destructive', className)}
      {...props}
    />
  )
}

export interface RowAction {
  key: string
  label: string
  onClick: () => void
  danger?: boolean
  /** 当前行不满足条件时隐藏（不用 disabled） */
  hidden?: boolean
}

/**
 * 行操作：横排，最多露出 max 个（默认 2），其余收进「更多」下拉。
 * 数组顺序即展示顺序，把最常用的放前面。
 */
export function RowActions({ actions, max = 2 }: { actions: RowAction[]; max?: number }) {
  const { t } = useTranslation()
  const visible = actions.filter((a) => !a.hidden)
  if (visible.length === 0) return null
  const inline = visible.slice(0, max)
  const overflow = visible.slice(max)

  return (
    <span className="inline-flex items-center gap-2">
      {inline.map((a) => (
        <ActionLink key={a.key} danger={a.danger} onClick={a.onClick}>
          {a.label}
        </ActionLink>
      ))}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(textLink, 'inline-flex items-center gap-0.5 whitespace-nowrap')}>
              {t('common.more')}
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflow.map((a) => (
              <DropdownMenuItem key={a.key} variant={a.danger ? 'destructive' : 'default'} onSelect={a.onClick}>
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  )
}
