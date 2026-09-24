import { ScanLine } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

let audioCtx: AudioContext | undefined

/** 扫码反馈音：成功短高音，失败长低音 */
export function beep(ok: boolean) {
  try {
    audioCtx ??= new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = ok ? 1320 : 220
    osc.type = ok ? 'sine' : 'square'
    gain.gain.value = 0.08
    osc.connect(gain).connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + (ok ? 0.08 : 0.3))
  } catch {
    // 浏览器不支持音频时静默
  }
  if (!ok) navigator.vibrate?.(200)
}

export interface ScanCandidate {
  value: string
  label?: string
}

interface ScanInputProps {
  label: string
  /** 返回 false 表示扫码无效，会触发红色闪烁和失败提示音 */
  onScan: (code: string) => boolean
  /** 演示用：没有扫描枪时点击候选值模拟扫码 */
  candidates?: ScanCandidate[]
}

/**
 * PDA 扫码输入框。工业 PDA 的扫描头模拟键盘输入并以回车结尾，
 * 所以这里只需要保持输入框聚焦、监听回车即可。
 */
export function ScanInput({ label, onScan, candidates }: ScanInputProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [flash, setFlash] = useState<{ ok: boolean; key: number }>()

  useEffect(() => {
    inputRef.current?.focus()
  }, [label])

  const submit = (raw: string) => {
    const code = raw.trim()
    if (!code) return
    const ok = onScan(code)
    beep(ok)
    setFlash({ ok, key: Date.now() })
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        key={flash?.key}
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
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-lg outline-none placeholder:font-sans placeholder:text-base placeholder:text-muted-foreground"
          autoComplete="off"
          autoCapitalize="characters"
          inputMode="none"
        />
      </div>
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
