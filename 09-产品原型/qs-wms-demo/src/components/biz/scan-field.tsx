import { ScanLine } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef } from 'react'
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
 * - flash：成功绿闪 + 短高音，失败红闪 + 长低音（反馈分级与 PDA 一致）。闪烁在原外框上重播，
 *   输入框始终是同一个元素，连续快扫时焦点不离开扫码框
 * - 默认自动聚焦；作业后由页面调 ref.focus() 拉回焦点
 * - 兜底：焦点不在任何输入框、也没有弹窗时（如关闭弹窗后焦点落到页面上），敲下的字符直接进扫码框，
 *   扫码框里有内容时回车照常提交，保证扫描枪的下一枪不丢（与 PDA 规范 §4.2 一致）
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
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus()
  }, [autoFocus, disabled, ref, placeholder])

  // 每个扫码结果：提示音 + 闪烁从头播。连续同色时类名不变，先去掉动画、强制回流再放回；
  // 不用 key 重新挂载外框，否则输入框被换掉、焦点落到页面上，紧跟的下一枪会丢
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!flash || !box) return
    beep(flash.ok)
    box.style.animation = 'none'
    void box.offsetWidth
    box.style.animation = ''
  }, [flash])

  const latest = useRef({ value, onChange, onEnter, disabled })
  useEffect(() => {
    latest.current = { value, onChange, onEnter, disabled }
  })
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const editable =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      const { value, onChange, onEnter, disabled } = latest.current
      if (editable || disabled || document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') {
        // 一枪的回车落到了页面上：扫码框有内容就照常提交，焦点由页面处理（阻断弹窗时要让出）；
        // 扫码框为空时不拦，回车仍可点当前按钮
        if (!value.trim()) return
        e.preventDefault()
        onEnter()
        return
      }
      if (e.key.length !== 1) return
      e.preventDefault()
      onChange(value + e.key)
      ref.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ref])

  return (
    <div
      ref={boxRef}
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
