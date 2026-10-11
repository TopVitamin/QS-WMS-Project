import { useCallback } from 'react'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useDb } from '@/mock/db'
import type { UsageStatus } from '@/types/wms'

/** 商品 SKU 启用/停用：二次确认 + Mock 写库（列表、详情共用） */
export function useSkuMasterStatusToggle() {
  const toggle = useMasterUsageStatusToggle('masterSku')
  const setSkuMasterStatus = useDb((s) => s.setSkuMasterStatus)

  return useCallback(
    (ownerCode: string, code: string, next: UsageStatus) =>
      toggle({ next, code: `${ownerCode}/${code}`, apply: () => setSkuMasterStatus(ownerCode, code, next) }),
    [setSkuMasterStatus, toggle],
  )
}
