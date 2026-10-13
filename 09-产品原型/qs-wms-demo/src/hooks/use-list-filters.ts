import { useCallback, useState } from 'react'

/**
 * 列表筛选：draft 随输入变化，filters 点「查询」才生效；「重置」同时清空两份。
 * 需要把筛选条件写进 URL（可分享、返回保留）时参照入库单列表自行同步 searchParams。
 */
export function useListFilters<T>(empty: T) {
  const [filters, setFilters] = useState<T>(empty)
  const [draft, setDraft] = useState<T>(empty)

  const applySearch = useCallback(() => setFilters(draft), [draft])

  const reset = useCallback(() => {
    setDraft(empty)
    setFilters(empty)
  }, [empty])

  return { filters, draft, setDraft, applySearch, reset }
}
