import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { RotateCcw, Smartphone, Warehouse as WarehouseIcon } from 'lucide-react'
import { toast } from 'sonner'
import { BizCode } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { wmsMenu } from '@/config/menu'
import { useResetDemo } from '@/hooks/use-reset-demo'
import { useDb } from '@/mock/db'
import { warehouses } from '@/mock/seed'
import { useSettings } from '@/stores/settings'
import { useTabs } from '@/stores/tabs'

interface WmsCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WmsCommandPalette({ open, onOpenChange }: WmsCommandPaletteProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useSettings()
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const resetDemo = useResetDemo()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const handleSelectMenu = (path: string, titleKey: string) => {
    navigate(path)
    useTabs.getState().open({ path, titleKey })
    onOpenChange(false)
  }

  const handleSwitchWarehouse = (code: string) => {
    settings.setWarehouse(code)
    toast.success(t('common.switchedWarehouse', { name: code }))
    onOpenChange(false)
  }

  /** 危险操作：先关面板，再走统一的二次确认 */
  const handleResetDemo = () => {
    onOpenChange(false)
    void resetDemo()
  }

  const handleOpenPda = () => {
    window.open('#/pda', '_blank')
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('common.searchMenu')}
      description={t('common.searchPlaceholder')}
    >
      <CommandInput placeholder={t('common.searchPlaceholder')} />
      <CommandList>
        <CommandEmpty>{t('common.noMatchingMenu')}</CommandEmpty>

        {/* 快捷操作区 */}
        <CommandGroup heading={t('common.quickActions')}>
          <CommandItem onSelect={handleOpenPda} className="gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Smartphone className="size-4" />
            </div>
            <span className="flex-1 font-medium">{t('common.openPda')}</span>
            <span className="text-xs text-muted-foreground">{t('common.openNewWindow')}</span>
          </CommandItem>
          <CommandItem onSelect={handleResetDemo} className="gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
              <RotateCcw className="size-4" />
            </div>
            <span className="flex-1 font-medium">{t('common.resetDemo')}</span>
          </CommandItem>
          {warehouses.map((w) => (
            <CommandItem key={w.code} onSelect={() => handleSwitchWarehouse(w.code)} className="gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <WarehouseIcon className="size-4" />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <span>{t('settings.switchWarehouse')}:</span>
                <BizCode className="font-medium">{w.code}</BizCode>
                <span>{warehouseMasters.find((m) => m.code === w.code)?.name ?? t(w.nameKey)}</span>
              </div>
              {w.code === settings.warehouseCode && (
                <TagLabel tone="blue">{t('common.currentSelected')}</TagLabel>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* 全站业务菜单 */}
        {wmsMenu.map((group) => {
          const GroupIcon = group.icon
          return (
            <CommandGroup key={group.key} heading={t(group.titleKey)}>
              {group.children.map((leaf) => (
                <CommandItem
                  key={leaf.path}
                  onSelect={() => handleSelectMenu(leaf.path, leaf.titleKey)}
                  className="gap-3"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
                    <GroupIcon className="size-4" />
                  </div>
                  <span className="flex-1 font-medium">{t(leaf.titleKey)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{leaf.path}</span>
                    <TagLabel tone={leaf.milestone === 'M0' ? 'green' : 'gray'}>{leaf.milestone}</TagLabel>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>

      {/* 底部快捷键指示栏 */}
      <div className="flex h-10 items-center justify-between border-t border-border/60 bg-muted/30 px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-xs shadow-xs">↑</kbd>
            <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-xs shadow-xs">↓</kbd>
            <span>{t('common.kbdMove')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-xs shadow-xs">↵</kbd>
            <span>{t('common.kbdOpen')}</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-xs shadow-xs">ESC</kbd>
          <span>{t('common.close')}</span>
        </span>
      </div>
    </CommandDialog>
  )
}
