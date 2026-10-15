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
}: {
  items: StatusTabItem<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className={tabBarClass}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button key={item.value} type="button" onClick={() => onChange(item.value)} className={tabItemClass(active)}>
            {item.label}
            {item.count !== undefined && <span className={tabCountClass(active)}>{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
