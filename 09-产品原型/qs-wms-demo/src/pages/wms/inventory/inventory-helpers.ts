import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { locationUsage } from '@/lib/inventory-derive'
import { useDb } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { InventoryCommand } from '@/types/inventory'
import type { AuditLog, AuditRefType } from '@/types/wms'

/**
 * 管理端库内动作：失败 toast 写具体原因并返回 undefined（弹窗保持打开），成功 toast 写对象与数量。
 */
export function useInventoryRun() {
  const { t } = useTranslation()
  const operator = useSettings((s) => s.operator)
  return (command: InventoryCommand, success: (no?: string) => string) => {
    const result = useDb.getState().inventoryAction(command, operator, 'WEB')
    if (!result.ok) {
      toast.error(t(result.errorKey, result.params))
      return undefined
    }
    toast.success(success(result.no))
    return result
  }
}

/** 当前仓的库位用途查询（库区类型决定） */
export function useLocationUsage() {
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  return useMemo(
    () => (code: string) => locationUsage({ locations, locationMasters }, warehouseCode, code),
    [locationMasters, locations, warehouseCode],
  )
}

/** 单号前缀 → 详情路由；没有独立页面的单据（收货记录等）返回 undefined，只显示不链 */
export function documentPath(no?: string): string | undefined {
  if (!no) return undefined
  const prefix = no.split('-')[0]
  const routes: Record<string, string> = {
    RK: '/wms/inbound/orders',
    IB: '/wms/inbound/orders',
    PA: '/wms/inbound/putaway',
    OB: '/wms/outbound/orders',
    WV: '/wms/outbound/waves',
    PK: '/wms/outbound/pick-tasks',
    PB: '/wms/outbound/return-putaway',
    ST: '/wms/inventory/counts',
    MV: '/wms/inventory/moves',
  }
  return routes[prefix] ? `${routes[prefix]}/${no}` : undefined
}

/** 某个库内对象的操作日志，最新在前 */
export function inventoryAuditLogs(logs: AuditLog[], refType: AuditRefType, refNo: string) {
  return logs
    .filter((l) => l.refType === refType && l.refNo === refNo)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
