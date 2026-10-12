import type { ComponentType } from 'react'
import { DashboardPage } from './dashboard/dashboard-page'
import { InboundOrderListPage } from './inbound/inbound-order-list-page'
import { StockPage } from './inventory/stock-page'
import { ChannelListPage } from './master/channel-list-page'
import { CustomerListPage } from './master/customer-list-page'
import { LocationListPage } from './master/location-list-page'
import { SkuListPage } from './master/sku-list-page'
import { WarehouseListPage } from './master/warehouse-list-page'
import { ZoneListPage } from './master/zone-list-page'

/** 已实现的后台页面；菜单里其他页面自动落到"建设中" */
export const wmsPageRegistry: Record<string, ComponentType> = {
  '/wms/dashboard': DashboardPage,
  '/wms/inbound/orders': InboundOrderListPage,
  '/wms/inventory/stock': StockPage,
  '/wms/master/warehouses': WarehouseListPage,
  '/wms/master/zones': ZoneListPage,
  '/wms/master/locations': LocationListPage,
  '/wms/master/channels': ChannelListPage,
  '/wms/master/customers': CustomerListPage,
  '/wms/master/skus': SkuListPage,
}
