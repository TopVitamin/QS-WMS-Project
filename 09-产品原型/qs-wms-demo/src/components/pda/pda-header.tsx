import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useCurrentWarehouse } from '@/stores/settings'

interface PdaHeaderProps {
  title: string
  /** 流程页传入：返回上一步；不传则回到 PDA 首页 */
  onBack?: () => void
  right?: React.ReactNode
}

export function PdaHeader({ title, onBack, right }: PdaHeaderProps) {
  const navigate = useNavigate()
  const warehouse = useCurrentWarehouse()
  return (
    <header className="flex h-13 shrink-0 items-center gap-1 bg-primary px-2 text-primary-foreground">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : navigate('/pda'))}
        className="flex size-10 items-center justify-center rounded-lg active:bg-white/15"
        aria-label="back"
      >
        <ChevronLeft className="size-6" />
      </button>
      <h1 className="flex-1 text-lg font-semibold">{title}</h1>
      {right ?? <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-xs">{warehouse.code}</span>}
    </header>
  )
}

/** 底部固定操作区：主按钮高 48px，方便戴手套点击；`hint` 写主按钮不可用的原因（PDA 规范 §3） */
export function PdaFooter({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <footer className="shrink-0 border-t bg-background p-3">
      {hint && <p className="mb-2 text-sm text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">{children}</div>
    </footer>
  )
}
