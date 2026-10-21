import type { ComponentType } from 'react'
import { lazyPage } from '@/lib/lazy-page'

/** 已实现的后台页面；菜单里其他页面自动落到"建设中" */
export const wmsPageRegistry: Record<string, ComponentType> = {
  '/wms/outbound/orders': lazyPage(() => import('./outbound/order-list-page'), 'OutboundOrderListPage'),
  '/wms/outbound/waves': lazyPage(() => import('./outbound/wave-list-page'), 'OutboundWaveListPage'),
  '/wms/outbound/pick-tasks': lazyPage(() => import('./outbound/pick-task-list-page'), 'OutboundPickTaskListPage'),
  '/wms/outbound/return-putaway': lazyPage(() => import('./outbound/putback-list-page'), 'OutboundPutbackListPage'),
  '/wms/outbound/verify-station': lazyPage(
    () => import('./outbound/verify-station-page'),
    'OutboundVerifyStationPage',
  ),
  '/wms/inventory/counts': lazyPage(() => import('./inventory/stocktake-list-page'), 'StocktakeListPage'),
  '/wms/inventory/moves': lazyPage(() => import('./inventory/move-list-page'), 'MoveListPage'),
  '/wms/inventory/logs': lazyPage(() => import('./inventory/logs-page'), 'InventoryLogsPage'),
  '/wms/dashboard': lazyPage(() => import('./dashboard/dashboard-page'), 'DashboardPage'),
  '/wms/inbound/orders': lazyPage(() => import('./inbound/inbound-order-list-page'), 'InboundOrderListPage'),
  '/wms/inbound/putaway': lazyPage(() => import('./inbound/putaway-list-page'), 'PutawayListPage'),
  '/wms/inbound/new-sku': lazyPage(() => import('./inbound/new-sku-list-page'), 'NewSkuListPage'),
  '/wms/inbound/unclaimed': lazyPage(() => import('./inbound/unclaimed-list-page'), 'UnclaimedListPage'),
  '/wms/inventory/stock': lazyPage(() => import('./inventory/stock-page'), 'StockPage'),
  '/wms/master/warehouses': lazyPage(() => import('./master/warehouse-list-page'), 'WarehouseListPage'),
  '/wms/master/zones': lazyPage(() => import('./master/zone-list-page'), 'ZoneListPage'),
  '/wms/master/locations': lazyPage(() => import('./master/location-list-page'), 'LocationListPage'),
  '/wms/master/channels': lazyPage(() => import('./master/channel-list-page'), 'ChannelListPage'),
  '/wms/master/customers': lazyPage(() => import('./master/customer-list-page'), 'CustomerListPage'),
  '/wms/master/skus': lazyPage(() => import('./master/sku-list-page'), 'SkuListPage'),
}
