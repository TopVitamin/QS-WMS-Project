import { useCallback } from 'react'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useDb } from '@/mock/db'
import type { UsageStatus } from '@/types/wms'

export function useCarrierMasterStatusToggle() {
  const toggle = useMasterUsageStatusToggle('masterCarrier')
  const setCarrierMasterStatus = useDb((s) => s.setCarrierMasterStatus)

  return useCallback(
    (code: string, next: UsageStatus) =>
      toggle({ next, code, apply: () => setCarrierMasterStatus(code, next) }),
    [setCarrierMasterStatus, toggle],
  )
}
