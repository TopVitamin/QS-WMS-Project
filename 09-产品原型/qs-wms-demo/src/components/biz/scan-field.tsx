import { ScanLine } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { beep } from '@/lib/scan-beep'
import { cn } from '@/lib/utils'

/** 扫码结果反馈：key 每次变化触发一次闪烁和提示音 */
export interface ScanFlash {
  ok: boolean
  key: number
}

/**
 * 管理端扫码框（收货作业台等，见 docs/04-作业台设计规范.md）：受控输入，回车提交。
 * - 外观与 PDA 的 ScanInput 一致（h-14、2px 主色描边、扫码图标、18px 输入）
 * - flash：成功绿闪 + 短高音，失败红闪 + 长低音（反馈分级与 PDA 一致）
 * - 默认自动聚焦；作业后由页面调 ref.focus() 拉回焦点
 * - 兜底：焦点不在任何输入框、也没有弹窗时（如关闭弹窗后焦点落到页面上），敲下的字符直接进扫码框，
 *   保证扫描枪的下一枪不丢（与 PDA 规范 §4.2 一致）
 */
export function ScanField({
  value,
  onChange,
  onEnter,
  disabled,
  placeholder,
  flash,
  autoFocus = true,
  inputRef,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onEnter: () => void
  disabled?: boolean
  placeholder: string
  flash?: ScanFlash
  autoFocus?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
  className?: string
}) {
  const localRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? localRef

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus()
  }, [autoFocus, disabled, ref, placeholder])

  useEffect(() => {
    if (flash) beep(flash.ok)
  }, [flash])

  const latest = useRef({ value, onChange, disabled })
  useEffect(() => {
    latest.current = { value, onChange, disabled }
  })
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const editable =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (editable || latest.current.disabled || document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault()
      latest.current.onChange(latest.current.value + e.key)
      ref.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ref])

  return (
    <div
      key={flash?.key}
      className={cn(
        'flex h-14 items-center gap-3 rounded-xl border-2 border-primary/40 bg-background px-4 focus-within:border-primary',
        flash && (flash.ok ? 'animate-scan-ok' : 'animate-scan-error border-destructive'),
        disabled && 'opacity-50',
        className,
      )}
    >
      <ScanLine className="size-6 shrink-0 text-primary" />
      <input
        ref={ref}
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
