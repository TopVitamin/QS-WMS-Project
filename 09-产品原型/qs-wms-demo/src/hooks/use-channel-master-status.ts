import { useCallback } from 'react'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useDb } from '@/mock/db'
import type { UsageStatus } from '@/types/wms'

export function useChannelMasterStatusToggle() {
  const toggle = useMasterUsageStatusToggle('masterChannel')
  const setChannelMasterStatus = useDb((s) => s.setChannelMasterStatus)

  return useCallback(
    (code: string, next: UsageStatus) =>
      toggle({ next, code, apply: () => setChannelMasterStatus(code, next) }),
    [setChannelMasterStatus, toggle],
  )
}
