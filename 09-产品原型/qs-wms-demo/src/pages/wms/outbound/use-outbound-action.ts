import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useDb } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundCommand } from '@/types/outbound'

/**
 * 管理端出库动作：失败 toast 写具体原因并返回 undefined（弹窗保持打开），
 * 成功 toast 写对象与数量（出库单公共分册 §3.4）。
 */
export function useOutboundRun() {
  const { t } = useTranslation()
  const operator = useSettings((s) => s.operator)
  return (command: OutboundCommand, success?: (no?: string) => string) => {
    const result = useDb.getState().outboundAction(command, operator)
    if (!result.ok) {
      toast.error(t(result.errorKey, result.params))
      return undefined
    }
    toast.success(success ? success(result.no) : t('outbound.ui.toastDone'))
    return result
  }
}
