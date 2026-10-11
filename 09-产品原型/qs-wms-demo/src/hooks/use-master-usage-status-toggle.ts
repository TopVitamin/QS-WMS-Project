import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import type { MasterDataI18nScope } from '@/lib/master-data'
import type { UsageStatus } from '@/types/wms'

type DbActionResult = { ok: true } | { ok: false; errorKey: string }

export type MasterUsageToggleParams = {
  next: UsageStatus
  /** 用于启用/停用确认文案中的 {{code}} */
  code: string
  apply: () => DbActionResult
  /** 停用前校验；返回 false 表示已处理（如 toast）并中止 */
  beforeDisable?: () => boolean
}

/** 列表/详情共用：启用停用二次确认 + Mock 写库 */
export function useMasterUsageStatusToggle(scope: MasterDataI18nScope) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()

  return useCallback(
    async ({ next, code, apply, beforeDisable }: MasterUsageToggleParams) => {
      const disabling = next === 'DISABLED'
      if (disabling && beforeDisable && !beforeDisable()) return false

      const ok = await confirm({
        title: t(disabling ? `${scope}.disableConfirmTitle` : `${scope}.enableConfirmTitle`),
        description: t(disabling ? `${scope}.disableConfirmDesc` : `${scope}.enableConfirmDesc`, { code }),
        confirmText: t(disabling ? `${scope}.disableAction` : `${scope}.enableAction`),
        cancelText: t('common.cancel'),
        variant: disabling ? 'destructive' : 'default',
      })
      if (!ok) return false

      const res = apply()
      if (!res.ok) {
        toast.error(t(res.errorKey))
        return false
      }
      toast.success(t(`${scope}.statusChangeSuccess`))
      return true
    },
    [confirm, scope, t],
  )
}
