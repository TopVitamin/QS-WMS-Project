import { useCallback } from 'react'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useDb } from '@/mock/db'
import type { UsageStatus } from '@/types/wms'

export function useLocationMasterStatusToggle() {
  const toggle = useMasterUsageStatusToggle('masterLocation')
  const setLocationMasterStatus = useDb((s) => s.setLocationMasterStatus)

  return useCallback(
    (warehouseCode: string, code: string, next: UsageStatus) =>
      toggle({
        next,
        code,
        apply: () => setLocationMasterStatus(warehouseCode, code, next),
      }),
    [setLocationMasterStatus, toggle],
  )
}
