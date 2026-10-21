import { Keyboard, ScanLine } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import { beep } from '@/lib/scan-beep'
import { cn } from '@/lib/utils'

export interface ScanCandidate {
  value: string
  label?: string
}

/** 扫码结果（《PDA作业端设计规范》§5）：写在扫码框下一行，下一次扫码时由页面换掉 */
export interface ScanMessage {
  tone: 'success' | 'error' | 'info'
  text: string
}

interface ScanInputProps {
  label: string
  /** 返回 false 表示扫码无效，会触发红色闪烁和失败提示音 */
  onScan: (code: string) => boolean
  /** 演示用：没有扫描枪时点击候选值模拟扫码 */
  candidates?: ScanCandidate[]
  message?: ScanMessage
}

const messageClass: Record<ScanMessage['tone'], string> = {
  success: 'text-success-text',
  error: 'text-destructive',
  info: 'text-primary',
}

/**
 * PDA 扫码输入框。工业 PDA 的扫描头模拟键盘输入并以回车结尾，
 * 所以这里只需要保持输入框聚焦、监听回车即可。
 * 闪烁在原外框上重播，不重新挂载输入框，连续快扫时焦点不离开扫码框。
 */
export function ScanInput({ label, onScan, candidates, message }: ScanInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState('')
  const [flash, setFlash] = useState<{ ok: boolean; key: number }>()
  const [keyboard, setKeyboard] = useState(false)

  // 拉回焦点不滚动主区：当前对象（库位卡等）在扫码框上方，滚走就看不到了
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [label])

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!flash || !box) return
    box.style.animation = 'none'
    void box.offsetWidth
    box.style.animation = ''
  }, [flash])

  const submit = (raw: string) => {
    const code = raw.trim()
    if (!code) return
    const ok = onScan(code)
    beep(ok)
    setFlash((prev) => ({ ok, key: (prev?.key ?? 0) + 1 }))
    setValue('')
    inputRef.current?.focus({ preventScroll: true })
  }

  // 焦点不在扫码框时（如关闭弹窗后），扫到的码也按本步处理，不丢（规范 §4.2）
  usePdaScanListener(submit)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        ref={boxRef}
        className={cn(
          'flex h-14 items-center gap-2 rounded-xl border-2 border-primary/40 bg-background px-3 focus-within:border-primary',
          flash && (flash.ok ? 'animate-scan-ok' : 'animate-scan-error border-destructive'),
        )}
      >
        <ScanLine className="size-6 shrink-0 text-primary" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(value)}
          placeholder={t('pda.scanPlaceholder')}
          aria-label={label}
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-lg outline-none placeholder:font-sans placeholder:text-base placeholder:text-muted-foreground"
          autoComplete="off"
          autoCapitalize="characters"
          inputMode={keyboard ? 'text' : 'none'}
        />
        <button
          type="button"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-accent"
          aria-label={t('pda.keyboard')}
          aria-pressed={keyboard}
          onClick={() => {
            setKeyboard((v) => !v)
            requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
          }}
        >
          <Keyboard className="size-5" />
        </button>
      </div>
      {message && (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={cn('text-sm leading-snug font-medium', messageClass[message.tone])}
        >
          {message.text}
        </p>
      )}
      {candidates && candidates.length > 0 && (
        <div className="rounded-lg border border-dashed bg-muted/50 p-2">
          <div className="mb-1.5 text-xs text-muted-foreground">
            {t('pda.simulateScan')} · {t('pda.simulateHint')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => submit(c.value)}
                className="rounded-md border bg-background px-2 py-1 text-left font-mono text-xs active:bg-accent"
              >
                {c.value}
                {c.label && <span className="ml-1 font-sans text-muted-foreground">{c.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
