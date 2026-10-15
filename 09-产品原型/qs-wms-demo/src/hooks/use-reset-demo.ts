import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import { useDb } from '@/mock/db'
import { useWebReceiveSession } from '@/stores/web-receive-session'

/** 重置演示数据：危险操作，统一二次确认（顶栏用户菜单、命令面板共用） */
export function useResetDemo() {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const resetDemo = useDb((s) => s.resetDemo)

  return useCallback(async () => {
    const ok = await confirm({
      title: t('common.resetDemo'),
      description: t('common.resetDemoConfirm'),
      variant: 'destructive',
    })
    if (!ok) return
    resetDemo()
    useWebReceiveSession.getState().reset()
    toast.success(t('common.resetDemoDone'))
  }, [confirm, resetDemo, t])
}
