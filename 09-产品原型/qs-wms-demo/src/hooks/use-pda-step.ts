import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

type StepParams = Record<string, string | undefined>

const historyIdx = () => (window.history.state as { idx?: number } | null)?.idx ?? 0

/** 每个作业页记录「各步骤最近一次所在的浏览历史位置」，存 sessionStorage，刷新后仍可用 */
function registryKey(pathname: string) {
  return `qs-wms-demo-pda-steps:${pathname}`
}
function readRegistry(pathname: string): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(registryKey(pathname)) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}
function writeRegistry(pathname: string, registry: Record<string, number>) {
  try {
    sessionStorage.setItem(registryKey(pathname), JSON.stringify(registry))
  } catch {
    // 无痕模式等不可用时退化为替换当前记录
  }
}

/**
 * PDA 作业步骤（《PDA作业端设计规范》§6）：每一步对应一条浏览历史，路由参数 `step` 记录当前步，
 * 安卓返回键与标题栏返回都回到上一步；第一步再返回才回首页。
 */
export function usePdaStep<S extends string>(steps: readonly S[], firstStep: S) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const raw = searchParams.get('step')
  const step: S = raw && (steps as readonly string[]).includes(raw) ? (raw as S) : firstStep

  useEffect(() => {
    const idx = historyIdx()
    // 回到第一步视为重新开始，清掉更早一轮作业留下的位置
    const registry = step === firstStep ? {} : readRegistry(location.pathname)
    registry[step] = idx
    writeRegistry(location.pathname, registry)
  }, [firstStep, location.key, location.pathname, step])

  const build = useCallback((next: S, params?: StepParams) => {
    const sp = new URLSearchParams({ step: next })
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    return `?${sp.toString()}`
  }, [])

  /** 前进一步：新增一条历史 */
  const go = useCallback((next: S, params?: StepParams) => navigate({ search: build(next, params) }), [build, navigate])

  /** 原地切换（不新增历史），用于纠正与暂存不一致的路由参数 */
  const replace = useCallback(
    (next: S, params?: StepParams) => navigate({ search: build(next, params) }, { replace: true }),
    [build, navigate],
  )

  /** 回到之前经过的某一步：后退到它的那条历史；找不到则替换当前记录，避免同一步重复入栈 */
  const returnTo = useCallback(
    (target: S, params?: StepParams) => {
      const targetIdx = readRegistry(location.pathname)[target]
      const current = historyIdx()
      if (targetIdx !== undefined && targetIdx < current) navigate(targetIdx - current)
      else navigate({ search: build(target, params) }, { replace: true })
    },
    [build, location.pathname, navigate],
  )

  /** 标题栏返回：与安卓返回键一致；没有可退的历史时回到上一层 */
  const back = useCallback(
    (fallback: { step: S; params?: StepParams } | 'home') => {
      if (historyIdx() > 0) navigate(-1)
      else if (fallback === 'home') navigate('/pda', { replace: true })
      else navigate({ search: build(fallback.step, fallback.params) }, { replace: true })
    },
    [build, navigate],
  )

  const param = useCallback((key: string) => searchParams.get(key) ?? undefined, [searchParams])

  return useMemo(() => ({ step, param, go, replace, returnTo, back }), [step, param, go, replace, returnTo, back])
}
