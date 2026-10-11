import { useCallback } from 'react'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useDb } from '@/mock/db'
import type { UsageStatus } from '@/types/wms'

/** 仓库启用/停用：二次确认 + Mock 写库（列表、详情共用） */
export function useWarehouseMasterStatusToggle() {
  const toggle = useMasterUsageStatusToggle('masterWarehouse')
  const setWarehouseMasterStatus = useDb((s) => s.setWarehouseMasterStatus)

  return useCallback(
    (code: string, next: UsageStatus) =>
      toggle({ next, code, apply: () => setWarehouseMasterStatus(code, next) }),
    [setWarehouseMasterStatus, toggle],
  )
}
