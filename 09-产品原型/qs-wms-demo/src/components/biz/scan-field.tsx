import { ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 管理端扫码框（收货作业台等）：受控输入，回车提交。
 * 外观与 PDA 的 ScanInput 一致（h-14、2px 主色描边、扫码图标）；
 * PDA 作业页用 components/pda/scan-input（自带自动聚焦、提示音、模拟扫码）。
 */
export function ScanField({
  value,
  onChange,
  onEnter,
  disabled,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onEnter: () => void
  disabled?: boolean
  placeholder: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-3 rounded-xl border-2 border-primary/40 bg-background px-4 focus-within:border-primary',
        disabled && 'opacity-50',
        className,
      )}
    >
      <ScanLine className="size-6 shrink-0 text-primary" />
      <input
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter()
          }
        }}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-base placeholder:text-muted-foreground"
        autoComplete="off"
        autoCapitalize="characters"
      />
    </div>
  )
}
