import { createElement } from 'react'
import { createHashRouter, Navigate } from 'react-router'
import { RouteError } from '@/components/biz/route-error'
import { allMenuLeaves } from '@/config/menu'
import { PdaLayout } from '@/layouts/pda-layout'
import { WmsLayout } from '@/layouts/wms-layout'
import { lazyPage } from '@/lib/lazy-page'
import { ComingSoonPage } from '@/pages/coming-soon-page'
import { PdaComingSoonPage } from '@/pages/pda/pda-coming-soon-page'
import { wmsPageRegistry } from '@/pages/wms/registry'

// 页面一律按路由分包：首屏只加载当前页，切换菜单时再取对应 chunk
const OutboundOrderDetailPage = lazyPage(
  () => import('@/pages/wms/outbound/order-detail-page'),
  'OutboundOrderDetailPage',
)
const OutboundWaveDetailPage = lazyPage(() => import('@/pages/wms/outbound/wave-detail-page'), 'OutboundWaveDetailPage')
const OutboundPickTaskDetailPage = lazyPage(
  () => import('@/pages/wms/outbound/pick-task-detail-page'),
  'OutboundPickTaskDetailPage',
)
const OutboundPickEntryPage = lazyPage(() => import('@/pages/wms/outbound/pick-entry-page'), 'OutboundPickEntryPage')
const OutboundPutbackDetailPage = lazyPage(
  () => import('@/pages/wms/outbound/putback-detail-page'),
  'OutboundPutbackDetailPage',
)
const OutboundPutbackEntryPage = lazyPage(
  () => import('@/pages/wms/outbound/putback-entry-page'),
  'OutboundPutbackEntryPage',
)
const MoveDetailPage = lazyPage(() => import('@/pages/wms/inventory/move-detail-page'), 'MoveDetailPage')
const StocktakeDetailPage = lazyPage(
  () => import('@/pages/wms/inventory/stocktake-detail-page'),
  'StocktakeDetailPage',
)
const WarehouseDetailPage = lazyPage(() => import('@/pages/wms/master/warehouse-detail-page'), 'WarehouseDetailPage')
const WarehouseEditPage = lazyPage(() => import('@/pages/wms/master/warehouse-edit-page'), 'WarehouseEditPage')
const ZoneCreatePage = lazyPage(() => import('@/pages/wms/master/zone-create-page'), 'ZoneCreatePage')
const ZoneDetailPage = lazyPage(() => import('@/pages/wms/master/zone-detail-page'), 'ZoneDetailPage')
const ZoneEditPage = lazyPage(() => import('@/pages/wms/master/zone-edit-page'), 'ZoneEditPage')
const LocationCreatePage = lazyPage(() => import('@/pages/wms/master/location-create-page'), 'LocationCreatePage')
const LocationDetailPage = lazyPage(() => import('@/pages/wms/master/location-detail-page'), 'LocationDetailPage')
const LocationEditPage = lazyPage(() => import('@/pages/wms/master/location-edit-page'), 'LocationEditPage')
const ContainerDetailPage = lazyPage(
  () => import('@/pages/wms/master/container-detail-page'),
  'ContainerDetailPage',
)
const CarrierListPage = lazyPage(() => import('@/pages/wms/master/carrier-list-page'), 'CarrierListPage')
const CarrierDetailPage = lazyPage(() => import('@/pages/wms/master/carrier-detail-page'), 'CarrierDetailPage')
const CustomerDetailPage = lazyPage(() => import('@/pages/wms/master/customer-detail-page'), 'CustomerDetailPage')
const SkuDetailPage = lazyPage(() => import('@/pages/wms/master/sku-detail-page'), 'SkuDetailPage')
const SkuEditPage = lazyPage(() => import('@/pages/wms/master/sku-edit-page'), 'SkuEditPage')
const InboundOrderDetailPage = lazyPage(
  () => import('@/pages/wms/inbound/inbound-order-detail-page'),
  'InboundOrderDetailPage',
)
const PutawayDetailPage = lazyPage(() => import('@/pages/wms/inbound/putaway-detail-page'), 'PutawayDetailPage')
const PutawayEntryPage = lazyPage(() => import('@/pages/wms/inbound/putaway-entry-page'), 'PutawayEntryPage')
const InboundOrderReceivePage = lazyPage(
  () => import('@/pages/wms/inbound/inbound-order-receive-page'),
  'InboundOrderReceivePage',
)
const PdaHomePage = lazyPage(() => import('@/pages/pda/pda-home-page'), 'PdaHomePage')
const PdaPickPage = lazyPage(() => import('@/pages/pda/pick-page'), 'PdaPickPage')
const PdaVerifyPage = lazyPage(() => import('@/pages/pda/verify-page'), 'PdaVerifyPage')
const PdaReturnPutawayPage = lazyPage(() => import('@/pages/pda/return-putaway-page'), 'PdaReturnPutawayPage')
const PdaReceivePage = lazyPage(() => import('@/pages/pda/receive-page'), 'PdaReceivePage')
const PdaPutawayPage = lazyPage(() => import('@/pages/pda/putaway-page'), 'PdaPutawayPage')
const PdaUnclaimedPage = lazyPage(() => import('@/pages/pda/unclaimed-page'), 'PdaUnclaimedPage')
const PdaInventoryQueryPage = lazyPage(() => import('@/pages/pda/inventory-query-page'), 'PdaInventoryQueryPage')
const PdaMovePage = lazyPage(() => import('@/pages/pda/move-page'), 'PdaMovePage')
const PdaStocktakePage = lazyPage(() => import('@/pages/pda/stocktake-page'), 'PdaStocktakePage')
const PdaStocktakeStartPage = lazyPage(() => import('@/pages/pda/stocktake-start-page'), 'PdaStocktakeStartPage')
const ReturnDetailPage = lazyPage(() => import('@/pages/wms/returns/return-detail-page'), 'ReturnDetailPage')
const ReturnReceivePage = lazyPage(() => import('@/pages/wms/returns/return-receive-page'), 'ReturnReceivePage')
const PdaReturnReceivePage = lazyPage(() => import('@/pages/pda/return-receive-page'), 'PdaReturnReceivePage')

export const router = createHashRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Navigate to="/wms/dashboard" replace /> },
      {
        path: '/wms',
        element: <WmsLayout />,
        children: [
          { index: true, element: <Navigate to="/wms/dashboard" replace /> },
          { path: 'outbound/orders/:outboundNo', element: <OutboundOrderDetailPage /> },
          { path: 'outbound/waves/:waveNo', element: <OutboundWaveDetailPage /> },
          { path: 'outbound/pick-tasks/:taskNo/entry', element: <OutboundPickEntryPage /> },
          { path: 'outbound/pick-tasks/:taskNo', element: <OutboundPickTaskDetailPage /> },
          { path: 'outbound/return-putaway/:putbackNo/entry', element: <OutboundPutbackEntryPage /> },
          { path: 'outbound/return-putaway/:putbackNo', element: <OutboundPutbackDetailPage /> },
          { path: 'returns/orders/:returnNo/receive', element: <ReturnReceivePage /> },
          { path: 'returns/orders/:returnNo', element: <ReturnDetailPage /> },
          { path: 'outbound/packages', element: <Navigate to="/wms/outbound/orders" replace /> },
          { path: 'outbound/handover', element: <Navigate to="/wms/outbound/orders" replace /> },
          { path: 'inventory/moves/:moveNo', element: <MoveDetailPage /> },
          { path: 'inventory/counts/:stocktakeNo', element: <StocktakeDetailPage /> },
          { path: 'master/warehouses/:code/edit', element: <WarehouseEditPage /> },
          { path: 'master/warehouses/:code', element: <WarehouseDetailPage /> },
          { path: 'master/zones/new', element: <ZoneCreatePage /> },
          { path: 'master/zones/:code/edit', element: <ZoneEditPage /> },
          { path: 'master/zones/:code', element: <ZoneDetailPage /> },
          { path: 'master/locations/new', element: <LocationCreatePage /> },
          { path: 'master/locations/:code/edit', element: <LocationEditPage /> },
          { path: 'master/containers/:containerNo', element: <ContainerDetailPage /> },
          { path: 'master/locations/:code', element: <LocationDetailPage /> },
          { path: 'master/carriers', element: <CarrierListPage /> },
          { path: 'master/carriers/:code', element: <CarrierDetailPage /> },
          { path: 'master/customers/:code', element: <CustomerDetailPage /> },
          { path: 'master/skus/:ownerCode/:skuCode/edit', element: <SkuEditPage /> },
          { path: 'master/skus/:ownerCode/:skuCode', element: <SkuDetailPage /> },
          { path: 'inbound/putaway/:putawayNo/entry', element: <PutawayEntryPage /> },
          { path: 'inbound/putaway/:putawayNo', element: <PutawayDetailPage /> },
          { path: 'inbound/orders/:inboundNo/receive', element: <InboundOrderReceivePage /> },
          { path: 'inbound/orders/:inboundNo', element: <InboundOrderDetailPage /> },
          ...allMenuLeaves.map((leaf) => {
            const Page = wmsPageRegistry[leaf.path]
            return {
              path: leaf.path.replace('/wms/', ''),
              element: Page ? createElement(Page) : <ComingSoonPage />,
            }
          }),
        ],
      },
      {
        path: '/pda',
        element: <PdaLayout />,
        children: [
          { index: true, element: <PdaHomePage /> },
          { path: 'pick', element: <PdaPickPage /> },
          { path: 'verify', element: <PdaVerifyPage /> },
          { path: 'return-putaway', element: <PdaReturnPutawayPage /> },
          { path: 'return-receive', element: <PdaReturnReceivePage /> },
          { path: 'receive', element: <PdaReceivePage /> },
          { path: 'putaway', element: <PdaPutawayPage /> },
          { path: 'unclaimed', element: <PdaUnclaimedPage /> },
          { path: 'inventory', element: <PdaInventoryQueryPage /> },
          { path: 'move', element: <PdaMovePage /> },
          { path: 'stocktake', element: <PdaStocktakePage /> },
          { path: 'stocktake/start', element: <PdaStocktakeStartPage /> },
          { path: 'soon/:fn', element: <PdaComingSoonPage /> },
          { path: '*', element: <Navigate to="/pda" replace /> },
        ],
      },
      { path: '*', element: <Navigate to="/wms/dashboard" replace /> },
    ],
  },
])
