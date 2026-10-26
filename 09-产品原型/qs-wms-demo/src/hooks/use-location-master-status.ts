import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useLocationWorkReferences } from '@/hooks/use-location-work-references'
import { isLocationOccupied } from '@/lib/location-master'
import { useDb } from '@/mock/db'
import type { UsageStatus } from '@/types/wms'

export function useLocationMasterStatusToggle() {
  const { t } = useTranslation()
  const toggle = useMasterUsageStatusToggle('masterLocation')
  const setLocationMasterStatus = useDb((s) => s.setLocationMasterStatus)
  const locationMasters = useDb((s) => s.locationMasters)
  const inventory = useDb((s) => s.inventory)
  const work = useLocationWorkReferences()

  return useCallback(
    (warehouseCode: string, code: string, next: UsageStatus) => {
      const location = locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code === code)
      return toggle({
        next,
        code,
        beforeDisable:
          next === 'DISABLED' && location
            ? () => {
                if (!isLocationOccupied(location, inventory, work)) return true
                toast.error(t('masterLocation.error.disableOccupied'))
                return false
              }
            : undefined,
        apply: () => setLocationMasterStatus(warehouseCode, code, next),
      })
    },
    [inventory, locationMasters, setLocationMasterStatus, t, toggle, work],
  )
}
