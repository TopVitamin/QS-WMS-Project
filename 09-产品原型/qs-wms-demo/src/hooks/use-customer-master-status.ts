import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { customerHasInventory } from '@/lib/customer-master'
import { useMasterUsageStatusToggle } from '@/hooks/use-master-usage-status-toggle'
import { useDb } from '@/mock/db'
import type { CustomerMaster, UsageStatus } from '@/types/wms'

export function useCustomerMasterStatusToggle() {
  const { t } = useTranslation()
  const toggle = useMasterUsageStatusToggle('masterCustomer')
  const setCustomerMasterStatus = useDb((s) => s.setCustomerMasterStatus)
  const inventory = useDb((s) => s.inventory)

  return useCallback(
    (customer: CustomerMaster, next: UsageStatus) =>
      toggle({
        next,
        code: customer.code,
        beforeDisable:
          next === 'DISABLED'
            ? () => {
                if (customer.ownerType === 'SELF') {
                  toast.error(t('masterCustomer.error.disableSelf'))
                  return false
                }
                if (customerHasInventory(customer, inventory)) {
                  toast.error(t('masterCustomer.error.disableOccupied'))
                  return false
                }
                return true
              }
            : undefined,
        apply: () => setCustomerMasterStatus(customer.code, next),
      }),
    [inventory, setCustomerMasterStatus, t, toggle],
  )
}
