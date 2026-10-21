import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

export interface UseListStateOptions<F extends Record<string, string>, S extends string> {
  empty: F
  /** 状态页签；不传表示这个列表没有页签 */
  statuses?: readonly S[]
  /** true：筛选与页签写进 URL；false：只保存在页面内（主数据列表） */
  syncUrl?: boolean
  /** 筛选字段名 → URL 参数名；默认直接使用字段名 */
  paramNames?: Partial<Record<keyof F, string>>
  /** 查询、重置、切页签时原样保留的其他 URL 参数（如库存查询的视角 view） */
  keepParams?: readonly string[]
}

/**
 * 列表页统一的筛选 / 草稿 / 状态页签状态。
 * - draft 随输入变化，search 才生效；reset 同时清空两份并保留当前页签
 * - syncUrl 时写进 URL，详情返回、刷新、分享链接都能恢复筛选
 */
export function useListState<F extends Record<string, string>, S extends string>({
  empty,
  statuses = [],
  syncUrl = true,
  paramNames,
  keepParams,
}: UseListStateOptions<F, S>) {
  const [params, setParams] = useSearchParams()
  const paramOf = useCallback((key: keyof F) => paramNames?.[key] ?? String(key), [paramNames])

  const { filters, tab } = useMemo(() => {
    const next = { ...empty }
    ;(Object.keys(empty) as (keyof F)[]).forEach((key) => {
      const value = params.get(paramOf(key))
      if (value !== null) next[key] = value as F[keyof F]
    })
    const status = params.get('status')
    return {
      filters: next,
      tab: (statuses.includes(status as S) ? status : 'ALL') as S | 'ALL',
    }
  }, [empty, paramOf, params, statuses])

  // 用内容而不是对象身份判断筛选是否变了，调用方传内联空对象时也不会反复重置草稿
  const draftSource = syncUrl ? filters : empty
  const draftKey = JSON.stringify(draftSource)
  const [draft, setDraft] = useState<F>(draftSource)
  const [syncedKey, setSyncedKey] = useState(draftKey)
  if (syncedKey !== draftKey) {
    setSyncedKey(draftKey)
    setDraft(draftSource)
  }

  const [localFilters, setLocalFilters] = useState<F>(empty)
  const [localTab, setLocalTab] = useState<S | 'ALL'>('ALL')

  const updateUrl = useCallback(
    (nextFilters: F, nextTab: S | 'ALL') => {
      const next = new URLSearchParams()
      keepParams?.forEach((key) => {
        const value = params.get(key)
        if (value !== null) next.set(key, value)
      })
      if (nextTab !== 'ALL') next.set('status', nextTab)
      ;(Object.keys(nextFilters) as (keyof F)[]).forEach((key) => {
        if (nextFilters[key] !== empty[key]) next.set(paramOf(key), nextFilters[key])
      })
      setParams(next, { replace: true })
    },
    [empty, keepParams, paramOf, params, setParams],
  )

  const activeFilters = syncUrl ? filters : localFilters
  const activeTab = syncUrl ? tab : localTab

  const search = useCallback(() => {
    if (syncUrl) updateUrl(draft, activeTab)
    else setLocalFilters(draft)
  }, [activeTab, draft, syncUrl, updateUrl])

  const reset = useCallback(() => {
    setDraft(empty)
    if (syncUrl) updateUrl(empty, activeTab)
    else setLocalFilters(empty)
  }, [activeTab, empty, syncUrl, updateUrl])

  const setTab = useCallback(
    (next: S | 'ALL') => {
      if (syncUrl) updateUrl(filters, next)
      else setLocalTab(next)
    },
    [filters, syncUrl, updateUrl],
  )

  return {
    filters: activeFilters,
    tab: activeTab,
    draft,
    setDraft,
    search,
    reset,
    setTab,
    /** 进入详情时随 state 带走，详情「返回列表」恢复；本地列表为空串 */
    listSearch: syncUrl ? params.toString() : '',
  }
}
