import type { Dispatch, SetStateAction } from 'react'
import { useListState } from '@/hooks/use-list-state'

/**
 * 主数据等本地列表的筛选草稿：draft 随输入变化，点「查询」才生效；「重置」同时清空两份。
 * 需要把筛选写进 URL（可分享、返回保留）时用 useListState / useUrlListState。
 */
export function useListFilters<T extends object>(empty: T) {
  const state = useListState({
    empty: empty as T & Record<string, string>,
    statuses: [] as const,
    syncUrl: false,
  })
  return {
    filters: state.filters as T,
    draft: state.draft as T,
    setDraft: state.setDraft as Dispatch<SetStateAction<T>>,
    applySearch: state.search,
    reset: state.reset,
  }
}
