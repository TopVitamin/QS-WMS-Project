import { Tabs as TabsPrimitive } from 'radix-ui'
import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { TableToolbarSlotContext } from '@/lib/table-toolbar-slot'
import { tabBarClass, tabCountClass, tabItemClass } from '@/lib/tab-styles'
import { cn } from '@/lib/utils'

export interface DetailTabItem {
  value: string
  label: string
  /** 显示在页签上的条数（如收货记录 3） */
  count?: number
  content: React.ReactNode
  /** 内容不是表格时设为 true，给内容区加四周内边距；表格默认贴边 */
  padded?: boolean
  /** 为 true 时不显示该页签 */
  hidden?: boolean
}

/**
 * 详情页下半部分的多页签面板：一块白底卡片，顶部页签（带数量），下面切换子表或说明。
 * - 页签外观与列表页 StatusTabs 一致
 * - 传 param 时把当前页签写进 URL（如 ?tab=receipts），刷新、返回后仍停在原页签
 * - 页签栏右侧可放 extra（如「导出」）；当前页签里 DataTable 的列设置也自动放到这里，表格紧贴页签栏
 */
export function DetailTabs({
  items,
  defaultValue,
  param,
  extra,
  className,
}: {
  items: DetailTabItem[]
  defaultValue?: string
  param?: string
  extra?: React.ReactNode
  className?: string
}) {
  const visible = items.filter((item) => !item.hidden)
  const fallback = defaultValue ?? visible[0]?.value ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [localValue, setLocalValue] = useState(fallback)
  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null)

  const fromUrl = param ? searchParams.get(param) : null
  const raw = param ? (fromUrl ?? fallback) : localValue
  const value = visible.some((item) => item.value === raw) ? raw : fallback

  const onValueChange = (next: string) => {
    if (!param) {
      setLocalValue(next)
      return
    }
    const nextParams = new URLSearchParams(searchParams)
    if (next === fallback) nextParams.delete(param)
    else nextParams.set(param, next)
    // 保留 location.state（如入库单详情记住的列表筛选），切页签不产生历史记录
    setSearchParams(nextParams, { replace: true, state: location.state })
  }

  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={cn('flex min-w-0 flex-col rounded-lg border bg-card', className)}
    >
      <div className={cn(tabBarClass, 'justify-between pr-2')}>
        <TabsPrimitive.List className="flex items-center gap-1">
          {visible.map((item) => {
            const active = item.value === value
            return (
              <TabsPrimitive.Trigger key={item.value} value={item.value} className={tabItemClass(active)}>
                {item.label}
                {item.count !== undefined && <span className={tabCountClass(active)}>{item.count}</span>}
              </TabsPrimitive.Trigger>
            )
          })}
        </TabsPrimitive.List>
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          <div ref={setToolbarSlot} className="contents" />
        </div>
      </div>
      {visible.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          // 表格的上边框与页签栏底边重合，去掉一条
          className={cn(
            'min-w-0 text-sm outline-none',
            item.padded ? 'p-4' : '[&_[data-slot=data-table-scroll]]:border-t-0',
          )}
        >
          <TableToolbarSlotContext value={toolbarSlot}>{item.content}</TableToolbarSlotContext>
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
