import { Bell, Check, ChevronDown, Clock, Globe, PanelLeftClose, PanelLeftOpen, Search, Smartphone, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { BizCode } from '@/components/biz/display'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { findMenuGroup, findMenuLeaf } from '@/config/menu'
import { formatDateTime, formatTzOffset } from '@/lib/format'
import { useNow } from '@/hooks/use-now'
import { useResetDemo } from '@/hooks/use-reset-demo'
import { useDb } from '@/mock/db'
import { warehouses } from '@/mock/seed'
import {
  useCurrentWarehouse,
  useDisplayTimezone,
  useSettings,
  type Language,
  type TimeMode,
  type UnitMode,
} from '@/stores/settings'
import { WmsCommandPalette } from './wms-command-palette'

/** 语言名称按各自语言原文显示，不翻译 */
const languages: { value: Language; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' }, // design-lint-ignore 语言名称按原文显示
  { value: 'en-US', label: 'English' },
]

export function WmsTopbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const settings = useSettings()
  const warehouse = useCurrentWarehouse()
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const warehouseName = (code: string, fallbackKey: string) =>
    warehouseMasters.find((w) => w.code === code)?.name ?? t(fallbackKey)
  const tz = useDisplayTimezone()
  const now = useNow()
  const resetDemo = useResetDemo()
  const [commandOpen, setCommandOpen] = useState(false)

  const group = findMenuGroup(location.pathname)
  const leaf = findMenuLeaf(location.pathname)

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3">
        {/* 左侧：侧边栏切换与面包屑 */}
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={settings.toggleSidebar}
            aria-label={t('common.toggleSidebar')}
          >
            {settings.sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
          <nav className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            {group && group.children.length > 1 && (
              <>
                <span className="hidden sm:inline">{t(group.titleKey)}</span>
                <span className="hidden sm:inline opacity-40">/</span>
              </>
            )}
            {leaf && <span className="truncate font-medium text-foreground">{t(leaf.titleKey)}</span>}
          </nav>
        </div>

        {/* 右侧：三大归一化实体（业务环境胶囊 + 统一图标工具栏 + 用户中心） */}
        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {/* 实体一：仓库与当地时间业务胶囊 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 border-border/80 bg-background px-2.5 text-xs font-normal hover:bg-muted hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Warehouse data-icon="inline-start" className="size-3.5 text-primary" />
                  <BizCode className="text-xs font-medium text-foreground">{warehouse.code}</BizCode>
                  <span className="hidden whitespace-nowrap text-muted-foreground xl:inline">
                    {warehouseName(warehouse.code, warehouse.nameKey)}
                  </span>
                </div>
                <div className="h-3 w-px bg-border shrink-0" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" />
                  <span className="text-xs tabular-nums">{formatDateTime(now.toISOString(), tz, 'HH:mm')}</span>
                </div>
                <ChevronDown data-icon="inline-end" className="size-3 opacity-40 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs font-semibold text-foreground">
                {t('common.warehouse')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {warehouses.map((w) => (
                <DropdownMenuItem key={w.code} onSelect={() => settings.setWarehouse(w.code)} className="gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BizCode className="text-xs font-semibold">{w.code}</BizCode>
                      <span className="text-sm">{warehouseName(w.code, w.nameKey)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {w.timezone} · {formatTzOffset(w.timezone)} · {w.currency}
                    </div>
                  </div>
                  {w.code === warehouse.code && <Check className="text-primary size-4" />}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('settings.timezone')}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={settings.timeMode} onValueChange={(v) => settings.setTimeMode(v as TimeMode)}>
                <DropdownMenuRadioItem value="warehouse">
                  {t('settings.timeWarehouse')}
                  <span className="ml-auto text-xs text-muted-foreground">{formatTzOffset(warehouse.timezone)}</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="local">
                  {t('settings.timeLocal')}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatTzOffset(Intl.DateTimeFormat().resolvedOptions().timeZone)}
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('settings.unit')}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={settings.unitMode} onValueChange={(v) => settings.setUnitMode(v as UnitMode)}>
                <DropdownMenuRadioItem value="auto">{t('settings.unitAuto')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="metric">{t('settings.unitMetric')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="imperial">{t('settings.unitImperial')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 分割线1 */}
          <div className="h-4 w-px bg-border/80 shrink-0 self-center" />

          {/* 实体二：统一规格的图标工具组（搜索 + PDA + 语言 + 通知） */}
          <div className="flex items-center gap-1">
            {/* 全局搜索菜单与功能 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setCommandOpen(true)}
                  aria-label={t('common.searchMenu')}
                >
                  <Search className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('common.searchMenu')} (⌘K)
              </TooltipContent>
            </Tooltip>

            {/* 打开 PDA 作业端 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  asChild
                >
                  <a href="#/pda" target="_blank" rel="noreferrer" aria-label={t('common.openPda')}>
                    <Smartphone className="size-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('common.openPda')} ({t('common.openNewWindow')})
              </TooltipContent>
            </Tooltip>

            {/* 语言切换 */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      aria-label={t('settings.language')}
                    >
                      <Globe className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('settings.language')} · {languages.find((l) => l.value === settings.language)?.label}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuLabel>{t('settings.language')}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={settings.language} onValueChange={(v) => settings.setLanguage(v as Language)}>
                  {languages.map((l) => (
                    <DropdownMenuRadioItem key={l.value} value={l.value}>
                      {l.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 消息通知 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-8 text-muted-foreground hover:text-foreground"
                  aria-label={t('common.notice')}
                >
                  <Bell className="size-4" />
                  <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('common.notice')}</TooltipContent>
            </Tooltip>
          </div>

          {/* 分割线2 */}
          <div className="h-4 w-px bg-border/80 shrink-0 self-center" />

          {/* 实体三：用户身份与设置 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="size-6 text-xs">
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">LC</AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium text-foreground 2xl:inline">{settings.operator}</span>
                <ChevronDown className="size-3 text-muted-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>{t('common.profile')}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void resetDemo()}>{t('common.resetDemo')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t('common.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </header>

      {/* Cmd+K 全局命令面板 */}
      <WmsCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  )
}
