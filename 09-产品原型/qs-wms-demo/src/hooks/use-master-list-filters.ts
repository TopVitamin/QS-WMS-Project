import { useCallback, useState } from 'react'

/** 主数据列表：draft 编辑 + filters 生效（点查询后同步） */
export function useMasterListFilters<T>(empty: T) {
  const [filters, setFilters] = useState<T>(empty)
  const [draft, setDraft] = useState<T>(empty)

  const applySearch = useCallback(() => setFilters(draft), [draft])

  const reset = useCallback(() => {
    setDraft(empty)
    setFilters(empty)
  }, [empty])

  return { filters, draft, setDraft, applySearch, reset }
}
