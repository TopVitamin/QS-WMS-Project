import { useEffect } from 'react'
import { useDb } from '@/mock/db'

/** 周期性处理已过期且可转换的良品库存。 */
export function ExpiryProcessor() {
  useEffect(() => {
    const process = () => useDb.getState().inventoryAction({ type: 'PROCESS_EXPIRED_CONVERSIONS' }, 'SYSTEM', 'SYSTEM')
    process()
    const timer = window.setInterval(process, 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return null
}
