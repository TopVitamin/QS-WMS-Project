import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

/**
 * 业务单据列表的「筛选 + 状态页签」写进 URL（可分享、详情返回时保留）。
 * filters 为字符串字典，每个键直接作为 URL 参数；status 参数控制页签，不在列表内的值回落为 ALL。
 * draft 随输入变化，点「查询」才写 URL；「重置」清空筛选、保留页签。
 */
export function useUrlListState<F extends { [K in keyof F]: string }, S extends string>(
  empty: F,
  statuses: readonly S[],
) {
  const [params, setParams] = useSearchParams()
  const { filters, tab } = useMemo(() => {
    const next = { ...empty }
    ;(Object.keys(empty) as (keyof F)[]).forEach((k) => {
      const v = params.get(String(k))
      if (v !== null) next[k] = v as F[keyof F]
    })
    const status = params.get('status')
    return { filters: next, tab: (statuses.includes(status as S) ? status : 'ALL') as S | 'ALL' }
  }, [params, empty, statuses])

  const [draft, setDraft] = useState<F>(filters)
  const [synced, setSynced] = useState(filters)
  if (synced !== filters) {
    setSynced(filters)
    setDraft(filters)
  }

  const update = useCallback(
    (nextFilters: F, nextTab: S | 'ALL') => {
      const p = new URLSearchParams()
      if (nextTab !== 'ALL') p.set('status', nextTab)
      ;(Object.keys(nextFilters) as (keyof F)[]).forEach((k) => {
        if (nextFilters[k] !== empty[k]) p.set(String(k), nextFilters[k])
      })
      setParams(p, { replace: true })
    },
    [empty, setParams],
  )

  return {
    filters,
    tab,
    draft,
    setDraft,
    search: () => update(draft, tab),
    reset: () => {
      setDraft(empty)
      update(empty, tab)
    },
    setTab: (next: S | 'ALL') => update(filters, next),
    /** 进入详情时随 state 带走，详情「返回列表」恢复 */
    listSearch: params.toString(),
  }
}
