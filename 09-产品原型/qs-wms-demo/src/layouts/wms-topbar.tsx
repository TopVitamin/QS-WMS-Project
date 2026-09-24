import { Bell, Check, ChevronDown, Clock, Globe, PanelLeftClose, PanelLeftOpen, Ruler, Smartphone, Warehouse } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator'
import { findMenuGroup, findMenuLeaf } from '@/config/menu'
import { formatDateTime, formatTzOffset } from '@/lib/format'
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
import type { CurrencyCode } from '@/types/wms'

const languages: { value: Language; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
]
const currencies: CurrencyCode[] = ['CNY', 'USD', 'EUR', 'GBP', 'JPY']

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function WmsTopbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const settings = useSettings()
  const warehouse = useCurrentWarehouse()
  const tz = useDisplayTimezone()
  const now = useNow()
  const resetDemo = useDb((s) => s.resetDemo)
  const [confirmReset, setConfirmReset] = useState(false)

  const group = findMenuGroup(location.pathname)
  const leaf = findMenuLeaf(location.pathname)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-2">
      <Button variant="ghost" size="icon" onClick={settings.toggleSidebar} aria-label="toggle sidebar">
        {settings.sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        {group && group.children.length > 1 && (
          <>
            <span className="text-muted-foreground">{t(group.titleKey)}</span>
            <span className="text-muted-foreground/50">/</span>
          </>
        )}
        {leaf && <span className="font-medium whitespace-nowrap">{t(leaf.titleKey)}</span>}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        {/* 仓库切换 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Warehouse data-icon="inline-start" className="text-primary" />
              <span className="font-mono text-xs">{warehouse.code}</span>
              <span className="hidden whitespace-nowrap text-muted-foreground xl:inline">{t(warehouse.nameKey)}</span>
              <ChevronDown data-icon="inline-end" className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{t('settings.switchWarehouse')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {warehouses.map((w) => (
              <DropdownMenuItem key={w.code} onSelect={() => settings.setWarehouse(w.code)} className="gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{w.code}</span>
                    <span>{t(w.nameKey)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {w.timezone} · {formatTzOffset(w.timezone)} · {w.currency}
                  </div>
                </div>
                {w.code === warehouse.code && <Check className="text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 时间与时区 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1.5 text-muted-foreground">
              <Clock data-icon="inline-start" />
              <span className="tabular-nums">{formatDateTime(now.toISOString(), tz, 'MM-DD HH:mm')}</span>
              <span className="hidden text-xs 2xl:inline">{formatTzOffset(tz)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('settings.timezone')}</DropdownMenuLabel>
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
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 显示币别 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-muted-foreground">
              <span className="font-mono text-xs">{settings.displayCurrency}</span>
              <ChevronDown data-icon="inline-end" className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>{t('settings.displayCurrency')}</DropdownMenuLabel>
            <p className="px-2 pb-1.5 text-xs text-muted-foreground">{t('settings.displayCurrencyHint')}</p>
            <DropdownMenuRadioGroup
              value={settings.displayCurrency}
              onValueChange={(v) => settings.setDisplayCurrency(v as CurrencyCode)}
            >
              {currencies.map((c) => (
                <DropdownMenuRadioItem key={c} value={c}>
                  <span className="font-mono">{c}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 单位制 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t('settings.unit')}>
              <Ruler />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('settings.unit')}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={settings.unitMode} onValueChange={(v) => settings.setUnitMode(v as UnitMode)}>
              <DropdownMenuRadioItem value="auto">{t('settings.unitAuto')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="metric">{t('settings.unitMetric')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="imperial">{t('settings.unitImperial')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 语言 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t('settings.language')}>
              <Globe />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
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

        <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t('common.notice')}>
          <Bell />
        </Button>

        <Button variant="outline" size="icon" className="lg:size-auto lg:px-3" asChild>
          <a href="#/pda" target="_blank" rel="noreferrer" aria-label={t('common.openPda')}>
            <Smartphone className="lg:mr-2" />
            <span className="hidden lg:inline">{t('common.openPda')}</span>
          </a>
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5!" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">LC</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm whitespace-nowrap 2xl:inline">{settings.operator}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>{t('common.profile')}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setConfirmReset(true)}>{t('common.resetDemo')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t('common.logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.resetDemo')}</DialogTitle>
            <DialogDescription>{t('common.resetDemoConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
                toast.success(t('common.resetDemoDone'))
              }}
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
