import type { ComponentType } from 'react'
import { DashboardPage } from './dashboard/dashboard-page'
import { InboundListPage } from './inbound/inbound-list-page'
import { StockPage } from './inventory/stock-page'

/** 已实现的后台页面；菜单里其他页面自动落到"建设中" */
export const wmsPageRegistry: Record<string, ComponentType> = {
  '/wms/dashboard': DashboardPage,
  '/wms/inbound/orders': InboundListPage,
  '/wms/inventory/stock': StockPage,
}
