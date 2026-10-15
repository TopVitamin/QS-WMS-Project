import { createContext } from 'react'

/**
 * 表格工具栏插槽：容器（DetailTabs 页签栏、Section 标题行）提供一个 DOM 节点，
 * 里面的 DataTable 把列设置、批量操作渲染到这个节点上，不再自己占一行 48px 的工具栏。
 * 为 null 时 DataTable 照常在表格上方画工具栏（列表页）。
 */
export const TableToolbarSlotContext = createContext<HTMLElement | null>(null)
