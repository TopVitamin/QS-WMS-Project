import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { blockingLocationCodes } from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { UsageStatus, ZoneMaster } from '@/types/wms'

export function useZoneMasterStatusToggle() {
  const { t } = useTranslation()
  const toggle = useMasterUsageStatusToggle('masterZone')
  const setZoneMasterStatus = useDb((s) => s.setZoneMasterStatus)
  const locationMasters = useDb((s) => s.locationMasters)
  const inventory = useDb((s) => s.inventory)

  return useCallback(
    (zone: ZoneMaster, next: UsageStatus) =>
      toggle({
        next,
        code: zone.code,
        beforeDisable:
          next === 'DISABLED'
            ? () => {
                const codes = blockingLocationCodes(zone, locationMasters, inventory)
                if (codes.length === 0) return true
                toast.error(t('masterZone.error.disableOccupied', { codes: codes.join('、') }))
                return false
              }
            : undefined,
        apply: () => setZoneMasterStatus(zone.warehouseCode, zone.code, next),
      }),
    [inventory, locationMasters, setZoneMasterStatus, t, toggle],
  )
}
