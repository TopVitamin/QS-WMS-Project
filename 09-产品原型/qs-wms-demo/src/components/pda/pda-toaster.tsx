import { cn } from '@/lib/utils'
import { usePdaToastStore, type PdaToastTone } from '@/lib/pda-toast'

const toneClass: Record<PdaToastTone, string> = {
  success: 'border-success/30 bg-success/10 text-success-text',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-primary/30 bg-primary/10 text-primary',
}

/** 渲染在 PDA 模拟机框内的轻提示，替代会挂到桌面视口的 Sonner */
export function PdaToaster() {
  const items = usePdaToastStore((s) => s.items)
  if (!items.length) return null
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-20 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === 'error' ? 'alert' : 'status'}
          className={cn('rounded-xl border px-3 py-2 text-sm font-medium shadow-xs', toneClass[item.tone])}
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
