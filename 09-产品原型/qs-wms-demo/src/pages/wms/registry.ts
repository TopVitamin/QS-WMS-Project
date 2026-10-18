import type { ComponentType } from 'react'
import { OutboundOrderListPage } from './outbound/order-list-page'
import { OutboundWaveListPage } from './outbound/wave-list-page'
import { OutboundPickTaskListPage } from './outbound/pick-task-list-page'
import { OutboundPutbackListPage } from './outbound/putback-list-page'
import { OutboundVerifyStationPage } from './outbound/verify-station-page'
import { CountPage } from './inventory/count-page'
import { InventoryLogsPage } from './inventory/logs-page'
import { DashboardPage } from './dashboard/dashboard-page'
import { InboundOrderListPage } from './inbound/inbound-order-list-page'
import { NewSkuListPage } from './inbound/new-sku-list-page'
import { PutawayListPage } from './inbound/putaway-list-page'
import { UnclaimedListPage } from './inbound/unclaimed-list-page'
import { StockPage } from './inventory/stock-page'
import { ChannelListPage } from './master/channel-list-page'
import { CustomerListPage } from './master/customer-list-page'
import { LocationListPage } from './master/location-list-page'
import { SkuListPage } from './master/sku-list-page'
import { WarehouseListPage } from './master/warehouse-list-page'
import { ZoneListPage } from './master/zone-list-page'

/** 已实现的后台页面；菜单里其他页面自动落到"建设中" */
export const wmsPageRegistry: Record<string, ComponentType> = {
  '/wms/outbound/orders': OutboundOrderListPage,
  '/wms/outbound/waves': OutboundWaveListPage,
  '/wms/outbound/pick-tasks': OutboundPickTaskListPage,
  '/wms/outbound/return-putaway': OutboundPutbackListPage,
  '/wms/outbound/verify-station': OutboundVerifyStationPage,
  '/wms/inventory/counts': CountPage,
  '/wms/inventory/logs': InventoryLogsPage,
  '/wms/dashboard': DashboardPage,
  '/wms/inbound/orders': InboundOrderListPage,
  '/wms/inbound/putaway': PutawayListPage,
  '/wms/inbound/new-sku': NewSkuListPage,
  '/wms/inbound/unclaimed': UnclaimedListPage,
  '/wms/inventory/stock': StockPage,
  '/wms/master/warehouses': WarehouseListPage,
  '/wms/master/zones': ZoneListPage,
  '/wms/master/locations': LocationListPage,
  '/wms/master/channels': ChannelListPage,
  '/wms/master/customers': CustomerListPage,
  '/wms/master/skus': SkuListPage,
}
