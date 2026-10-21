import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useConfirm } from '@/hooks/use-confirm'
import type { MasterDataI18nScope } from '@/lib/master-data'

/** 新增/编辑页取消：脏数据时二次确认后跳转 */
export function useMasterDiscardNavigate(scope: MasterDataI18nScope) {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { t } = useTranslation()

  return useCallback(
    async (to: string, dirty: boolean) => {
      if (dirty) {
        const ok = await confirm({
          title: t(`${scope}.discardTitle`),
          description: t(`${scope}.discardDesc`),
          confirmText: t(`${scope}.discardConfirm`),
          cancelText: t(`${scope}.keepEditing`),
        })
        if (!ok) return
      }
      // 已经在这里确认过，useUnsavedChangesGuard 不再重复弹一次
      navigate(to, { state: { skipUnsavedGuard: true } })
    },
    [confirm, navigate, scope, t],
  )
}
