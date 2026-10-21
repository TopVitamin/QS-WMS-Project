import { useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { tabBarClass, tabCountClass, tabItemClass } from '@/lib/tab-styles'

export interface StatusTabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** 列表页顶部状态页签，带数量，例如：全部(120) 待入库(20) … */
export function StatusTabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: StatusTabItem<T>[]
  value: T
  onChange: (v: T) => void
  /** 页签组的可读名称，默认「状态筛选」；用作视角切换等其他用途时传入 */
  label?: string
}) {
  const { t } = useTranslation()
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const selectAt = (index: number) => {
    const next = items[index]
    if (!next) return
    onChange(next.value)
    refs.current[index]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const step = event.key === 'ArrowRight' ? 1 : -1
      selectAt((index + step + items.length) % items.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      selectAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      selectAt(items.length - 1)
    }
  }

  return (
    <div role="tablist" aria-label={label ?? t('common.statusTabs')} className={tabBarClass}>
      {items.map((item, index) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={tabItemClass(active)}
          >
            {item.label}
            {item.count !== undefined && <span className={tabCountClass(active)}>{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
