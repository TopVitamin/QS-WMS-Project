import { createElement } from 'react'
import { OutboundOrderDetailPage } from '@/pages/wms/outbound/order-detail-page'
import { OutboundWaveDetailPage } from '@/pages/wms/outbound/wave-detail-page'
import { OutboundPickTaskDetailPage } from '@/pages/wms/outbound/pick-task-detail-page'
import { OutboundPickEntryPage } from '@/pages/wms/outbound/pick-entry-page'
import { OutboundPutbackDetailPage } from '@/pages/wms/outbound/putback-detail-page'
import { OutboundPutbackEntryPage } from '@/pages/wms/outbound/putback-entry-page'
import { PdaPickPage } from '@/pages/pda/pick-page'
import { PdaReturnPutawayPage } from '@/pages/pda/return-putaway-page'
import { PdaVerifyPage } from '@/pages/pda/verify-page'
import { createHashRouter, Navigate } from 'react-router'
import { allMenuLeaves } from '@/config/menu'
import { PdaLayout } from '@/layouts/pda-layout'
import { WmsLayout } from '@/layouts/wms-layout'
import { ComingSoonPage } from '@/pages/coming-soon-page'
import { PdaComingSoonPage } from '@/pages/pda/pda-coming-soon-page'
import { PdaHomePage } from '@/pages/pda/pda-home-page'
import { PdaPutawayPage } from '@/pages/pda/putaway-page'
import { PdaUnclaimedPage } from '@/pages/pda/unclaimed-page'
import { PdaReceivePage } from '@/pages/pda/receive-page'
import { ZoneCreatePage } from '@/pages/wms/master/zone-create-page'
import { ZoneDetailPage } from '@/pages/wms/master/zone-detail-page'
import { ZoneEditPage } from '@/pages/wms/master/zone-edit-page'
import { ZoneListPage } from '@/pages/wms/master/zone-list-page'
import { LocationCreatePage } from '@/pages/wms/master/location-create-page'
import { LocationDetailPage } from '@/pages/wms/master/location-detail-page'
import { LocationEditPage } from '@/pages/wms/master/location-edit-page'
import { LocationListPage } from '@/pages/wms/master/location-list-page'
import { WarehouseCreatePage } from '@/pages/wms/master/warehouse-create-page'
import { WarehouseDetailPage } from '@/pages/wms/master/warehouse-detail-page'
import { WarehouseEditPage } from '@/pages/wms/master/warehouse-edit-page'
import { WarehouseListPage } from '@/pages/wms/master/warehouse-list-page'
import { CarrierDetailPage } from '@/pages/wms/master/carrier-detail-page'
import { CarrierListPage } from '@/pages/wms/master/carrier-list-page'
import { CustomerDetailPage } from '@/pages/wms/master/customer-detail-page'
import { CustomerListPage } from '@/pages/wms/master/customer-list-page'
import { SkuDetailPage } from '@/pages/wms/master/sku-detail-page'
import { SkuEditPage } from '@/pages/wms/master/sku-edit-page'
import { SkuListPage } from '@/pages/wms/master/sku-list-page'
import { InboundOrderDetailPage } from '@/pages/wms/inbound/inbound-order-detail-page'
import { PutawayDetailPage } from '@/pages/wms/inbound/putaway-detail-page'
import { PutawayEntryPage } from '@/pages/wms/inbound/putaway-entry-page'
import { InboundOrderReceivePage } from '@/pages/wms/inbound/inbound-order-receive-page'
import { wmsPageRegistry } from '@/pages/wms/registry'

export const router = createHashRouter([
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
      { path: 'outbound/packages', element: <Navigate to="/wms/outbound/orders" replace /> },
      { path: 'outbound/handover', element: <Navigate to="/wms/outbound/orders" replace /> },
      { path: 'master/warehouses', element: <WarehouseListPage /> },
      { path: 'master/warehouses/new', element: <WarehouseCreatePage /> },
      { path: 'master/warehouses/:code/edit', element: <WarehouseEditPage /> },
      { path: 'master/warehouses/:code', element: <WarehouseDetailPage /> },
      { path: 'master/zones', element: <ZoneListPage /> },
      { path: 'master/zones/new', element: <ZoneCreatePage /> },
      { path: 'master/zones/:code/edit', element: <ZoneEditPage /> },
      { path: 'master/zones/:code', element: <ZoneDetailPage /> },
      { path: 'master/locations', element: <LocationListPage /> },
      { path: 'master/locations/new', element: <LocationCreatePage /> },
      { path: 'master/locations/:code/edit', element: <LocationEditPage /> },
      { path: 'master/locations/:code', element: <LocationDetailPage /> },
      { path: 'master/carriers', element: <CarrierListPage /> },
      { path: 'master/carriers/:code', element: <CarrierDetailPage /> },
      { path: 'master/customers', element: <CustomerListPage /> },
      { path: 'master/customers/:code', element: <CustomerDetailPage /> },
      { path: 'master/skus', element: <SkuListPage /> },
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
      { path: 'receive', element: <PdaReceivePage /> },
      { path: 'putaway', element: <PdaPutawayPage /> },
      { path: 'unclaimed', element: <PdaUnclaimedPage /> },
      { path: 'soon/:fn', element: <PdaComingSoonPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/wms/dashboard" replace /> },
])
