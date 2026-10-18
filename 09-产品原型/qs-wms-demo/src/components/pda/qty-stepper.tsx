import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { interpretQtyInput } from '@/lib/pda-scan'
import { cn } from '@/lib/utils'
import { beep } from '@/lib/scan-beep'

interface QtyStepperProps {
  label: string
  value: number
  /** 返回 false 表示拒绝本次修改（如联动后超上限），组件给出失败反馈并保留原值 */
  onChange: (v: number) => boolean | void
  max?: number
  tone?: 'default' | 'danger'
  /** 数量框收到扫码内容时调用；数量保持原值（规范 §4.2） */
  onScanText?: (code: string) => void
  /** 放在底部操作区、紧挨主按钮时不显示左侧标签（标签仍作读屏名称） */
  hideLabel?: boolean
}

/**
 * 大号数量步进器，适合手持设备。数字可直接改，回车或离开时生效；
 * 超上限拒绝、不截断；扫描头追加进来的条码不会写成数量。
 */
export function QtyStepper({
  label,
  value,
  onChange,
  max,
  tone = 'default',
  onScanText,
  hideLabel,
}: QtyStepperProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!error) return
    const timer = window.setTimeout(() => setError(undefined), 2500)
    return () => window.clearTimeout(timer)
  }, [error])

  const reject = (message: string) => {
    beep(false)
    setError(message)
  }

  const apply = (next: number) => {
    if (next < 0) return
    if (max !== undefined && next > max) {
      reject(t('pda.overMax', { max }))
      return
    }
    if (onChange(next) === false) reject(t('pda.overMax', { max: max ?? value }))
    else setError(undefined)
  }

  const commit = (raw: string) => {
    setDraft(null)
    const result = interpretQtyInput(raw, value)
    if (result.kind === 'unchanged') return
    if (result.kind === 'scan') {
      if (onScanText && result.code) onScanText(result.code)
      else reject(t('pda.invalidQty'))
      return
    }
    apply(result.value)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        {!hideLabel && <span className={cn('text-base', tone === 'danger' && 'text-destructive')}>{label}</span>}
        <div className="flex items-center overflow-hidden rounded-xl border bg-background">
          <button
            type="button"
            className="flex size-12 items-center justify-center active:bg-muted disabled:opacity-40"
            onClick={() => apply(value - 1)}
            disabled={value <= 0}
            aria-label={t('pda.qtyMinus')}
          >
            <Minus className="size-5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={draft ?? String(value)}
            onFocus={(e) => {
              setDraft(String(value))
              e.currentTarget.select()
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              commit(e.currentTarget.value)
              e.currentTarget.select()
            }}
            className="h-12 w-20 border-x text-center text-xl font-semibold tabular-nums outline-none"
            aria-label={label}
          />
          <button
            type="button"
            className="flex size-12 items-center justify-center active:bg-muted"
            onClick={() => apply(value + 1)}
            aria-label={t('pda.qtyPlus')}
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
      {error && <p className="text-right text-sm text-destructive">{error}</p>}
    </div>
  )
}
