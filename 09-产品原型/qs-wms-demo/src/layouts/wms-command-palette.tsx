import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { RotateCcw, Smartphone, Warehouse as WarehouseIcon } from 'lucide-react'
import { toast } from 'sonner'
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
  const resetDemo = useDb((s) => s.resetDemo)

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

  const handleResetDemo = () => {
    resetDemo()
    toast.success(t('common.resetDemoDone'))
    onOpenChange(false)
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
                <span className="font-mono font-medium">{w.code}</span>
                <span>{t(w.nameKey)}</span>
              </div>
              {w.code === settings.warehouseCode && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">当前选中</span>
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
                    <span className="font-mono text-xs text-muted-foreground/60">{leaf.path}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                        leaf.milestone === 'M0'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {leaf.milestone}
                    </span>
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
            <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↑</kbd>
            <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↓</kbd>
            <span>移动选择</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">↵</kbd>
            <span>直达跳转</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs">ESC</kbd>
          <span>关闭</span>
        </span>
      </div>
    </CommandDialog>
  )
}
