import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import { useDb } from '@/mock/db'
import { usePdaMoveSession } from '@/stores/pda-move-session'
import { usePdaOutboundSession } from '@/stores/pda-outbound-session'
import { usePdaPutawaySession } from '@/stores/pda-putaway-session'
import { useReceiveSession } from '@/stores/pda-receive-session'
import { usePdaStocktakeSession } from '@/stores/pda-stocktake-session'
import { useWebReceiveSession } from '@/stores/web-receive-session'
import { useWebVerifySession } from '@/stores/web-verify-session'

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
    // 旧版 PDA 出库草稿直接存在 localStorage，这里一并清掉
    Object.keys(localStorage)
      .filter((key) => key.startsWith('qs-wms-outbound-draft:'))
      .forEach((key) => localStorage.removeItem(key))
    // 演示态草稿全部清空；新增 *-session store 时记得在这里补一行
    usePdaOutboundSession.getState().reset()
    usePdaPutawaySession.getState().reset()
    usePdaMoveSession.getState().reset()
    usePdaStocktakeSession.getState().reset()
    useReceiveSession.getState().reset()
    useWebVerifySession.getState().reset()
    useWebReceiveSession.getState().reset()
    toast.success(t('common.resetDemoDone'))
  }, [confirm, resetDemo, t])
}
