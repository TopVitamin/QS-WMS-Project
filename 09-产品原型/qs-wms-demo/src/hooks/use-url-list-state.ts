import type { Dispatch, SetStateAction } from 'react'
import { useListState } from '@/hooks/use-list-state'

/**
 * 业务单据列表的「筛选 + 状态页签」写进 URL（可分享、详情返回时保留）。
 * filters 为字符串字典，每个键默认直接作为 URL 参数；可用 paramNames 映射成更短的参数名。
 */
export function useUrlListState<F extends object, S extends string>(
  empty: F,
  statuses: readonly S[],
  paramNames?: Partial<Record<keyof F, string>>,
) {
  const state = useListState({
    empty: empty as F & Record<string, string>,
    statuses,
    syncUrl: true,
    paramNames,
  })
  return {
    ...state,
    filters: state.filters as F,
    draft: state.draft as F,
    setDraft: state.setDraft as Dispatch<SetStateAction<F>>,
  }
}
