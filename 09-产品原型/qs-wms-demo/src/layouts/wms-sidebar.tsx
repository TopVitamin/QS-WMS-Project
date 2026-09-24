import { ChevronRight, Warehouse as WarehouseIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { findMenuGroup, wmsMenu, type MenuGroup } from '@/config/menu'
import { cn } from '@/lib/utils'
import { useSettings } from '@/stores/settings'

const itemBase =
  'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-muted'

export function WmsSidebar() {
  const { t } = useTranslation()
  const collapsed = useSettings((s) => s.sidebarCollapsed)
  const location = useLocation()
  const navigate = useNavigate()
  const activeGroup = findMenuGroup(location.pathname)
  const [openKeys, setOpenKeys] = useState<string[]>(() => (activeGroup ? [activeGroup.key] : []))
  // 通过页签、工作台等入口跳转时，自动展开当前页面所在的菜单组
  const [prevGroupKey, setPrevGroupKey] = useState(activeGroup?.key)
  if (activeGroup?.key !== prevGroupKey) {
    setPrevGroupKey(activeGroup?.key)
    if (activeGroup && !openKeys.includes(activeGroup.key)) setOpenKeys([...openKeys, activeGroup.key])
  }

  const toggle = (key: string) =>
    setOpenKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]))

  const isLeafActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)

  const renderCollapsed = (group: MenuGroup) => {
    const Icon = group.icon
    const active = activeGroup?.key === group.key
    const trigger = (
      <button
        type="button"
        className={cn(itemBase, 'justify-center px-0', active && 'bg-sidebar-accent text-sidebar-accent-foreground')}
        onClick={group.children.length === 1 ? () => navigate(group.children[0].path) : undefined}
      >
        <Icon className="size-4.5" />
      </button>
    )
    if (group.children.length === 1) {
      return (
        <Tooltip key={group.key}>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">{t(group.titleKey)}</TooltipContent>
        </Tooltip>
      )
    }
    return (
      <DropdownMenu key={group.key}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-44">
          <DropdownMenuLabel>{t(group.titleKey)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {group.children.map((leaf) => (
            <DropdownMenuItem key={leaf.path} onSelect={() => navigate(leaf.path)}>
              {t(leaf.titleKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderExpanded = (group: MenuGroup) => {
    const Icon = group.icon
    if (group.children.length === 1) {
      const leaf = group.children[0]
      return (
        <NavLink
          key={group.key}
          to={leaf.path}
          className={({ isActive }) =>
            cn(itemBase, isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent')
          }
        >
          <Icon className="size-4" />
          {t(group.titleKey)}
        </NavLink>
      )
    }
    const open = openKeys.includes(group.key)
    const active = activeGroup?.key === group.key
    return (
      <div key={group.key}>
        <button
          type="button"
          className={cn(itemBase, active && 'text-sidebar-accent-foreground')}
          onClick={() => toggle(group.key)}
        >
          <Icon className="size-4" />
          <span className="flex-1 text-left">{t(group.titleKey)}</span>
          <ChevronRight className={cn('size-3.5 opacity-60 transition-transform', open && 'rotate-90')} />
        </button>
        {open && (
          <div className="mt-0.5 flex flex-col gap-0.5">
            {group.children.map((leaf) => (
              <NavLink
                key={leaf.path}
                to={leaf.path}
                className={cn(
                  itemBase,
                  'pl-9',
                  isLeafActive(leaf.path) &&
                    'bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent',
                )}
              >
                <span className="flex-1 truncate">{t(leaf.titleKey)}</span>
                {leaf.milestone !== 'M0' && (
                  <span className="text-[10px] text-muted-foreground/70">{leaf.milestone}</span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className={cn('flex h-12 shrink-0 items-center gap-2 border-b px-4', collapsed && 'justify-center px-0')}>
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <WarehouseIcon className="size-4" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-semibold">{t('app.name')}</div>
            <div className="text-[10px] text-muted-foreground">{t('app.fullName')}</div>
          </div>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {wmsMenu.map((g) => (collapsed ? renderCollapsed(g) : renderExpanded(g)))}
      </nav>
    </aside>
  )
}
