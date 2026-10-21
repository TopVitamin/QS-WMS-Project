import { useEffect } from 'react'
import type { StocktakeFlow } from './use-stocktake-flow'

/** 草稿和路由对应的那一行：快照行，或新增行（草稿里存着归属与批次） */
export function useCountSubject(flow: StocktakeFlow) {
  const { nav } = flow
  const count = flow.findCount(nav.param('no'))
  const loc = nav.param('loc')
  const draft = count ? flow.draftOf(count.no) : undefined
  const lineNo = nav.param('line')
  const line = count && lineNo ? count.lines.find((l) => l.lineNo === Number(lineNo)) : undefined
  const valid = Boolean(
    count &&
    count.status === 'COUNTING' &&
    draft &&
    (line
      ? draft.lineNo === line.lineNo && line.locationCode === loc
      : nav.param('add') && draft.add?.locationCode === loc),
  )
  useEffect(() => {
    if (valid || flow.leaving.current) return
    if (count && loc) nav.replace('item', { no: count.no, loc })
    else if (count) nav.replace('location', { no: count.no })
    else nav.replace('list')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])
  return valid ? { count: count!, draft: draft!, line } : undefined
}
