import { ChevronDown, House, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { HOME_TAB, useTabs } from '@/stores/tabs'

/** 多页签：中国 SaaS 常见交互，菜单点开的页面依次排在这里 */
export function WmsTabsBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { tabs, close, closeOthers } = useTabs()

  return (
    <div className="flex h-9 shrink-0 items-end gap-1 border-b bg-background px-2">
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          const isHome = tab.path === HOME_TAB.path
          return (
            <div
              key={tab.path}
              className={cn(
                'group flex h-7.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-t-md border border-b-0 px-3 text-xs transition-colors',
                active
                  ? 'border-border bg-canvas font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              onClick={() => navigate(tab.path)}
            >
              {isHome && <House className="size-3.5" />}
              {t(tab.titleKey)}
              {!isHome && (
                <button
                  type="button"
                  aria-label={t('common.close')}
                  className="-mr-1 rounded p-0.5 opacity-60 hover:bg-foreground/10 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = close(tab.path)
                    if (active && next) navigate(next)
                  }}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="mb-1 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="tabs menu">
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => closeOthers(location.pathname)}>{t('common.closeOthers')}</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              closeOthers(HOME_TAB.path)
              navigate(HOME_TAB.path)
            }}
          >
            {t('common.close')} ({t('common.all')})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
