import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router'
import { useConfirm } from '@/hooks/use-confirm'
import type { MasterDataI18nScope } from '@/lib/master-data'

/**
 * 未保存离开拦截：切换菜单/页签/浏览器返回时二次确认，关闭或刷新标签页时走浏览器原生提示。
 * `markSaved` 在保存成功后调用，避免保存完成后的跳转又被自己的拦截器挡住。
 */
export function useUnsavedChangesGuard(dirty: boolean, scope: MasterDataI18nScope) {
  const { confirm } = useConfirm()
  const { t } = useTranslation()
  const dirtyRef = useRef(dirty)
  const savedRef = useRef(false)

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const skip = (nextLocation.state as { skipUnsavedGuard?: boolean } | null)?.skipUnsavedGuard
    return dirtyRef.current && !savedRef.current && !skip && currentLocation.pathname !== nextLocation.pathname
  })

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    let active = true
    void confirm({
      title: t(`${scope}.discardTitle`),
      description: t(`${scope}.discardDesc`),
      confirmText: t(`${scope}.discardConfirm`),
      cancelText: t(`${scope}.keepEditing`),
      variant: 'destructive',
    }).then((ok) => {
      if (!active) return
      if (ok) blocker.proceed()
      else blocker.reset()
    })
    return () => {
      active = false
    }
  }, [blocker, confirm, scope, t])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  return {
    markSaved: () => {
      savedRef.current = true
    },
  }
}
