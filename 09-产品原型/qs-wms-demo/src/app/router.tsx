import { createElement } from 'react'
import { createHashRouter, Navigate } from 'react-router'
import { allMenuLeaves } from '@/config/menu'
import { PdaLayout } from '@/layouts/pda-layout'
import { WmsLayout } from '@/layouts/wms-layout'
import { ComingSoonPage } from '@/pages/coming-soon-page'
import { PdaComingSoonPage } from '@/pages/pda/pda-coming-soon-page'
import { PdaHomePage } from '@/pages/pda/pda-home-page'
import { PdaPutawayPage } from '@/pages/pda/putaway-page'
import { PdaReceivePage } from '@/pages/pda/receive-page'
import { wmsPageRegistry } from '@/pages/wms/registry'

export const router = createHashRouter([
  { path: '/', element: <Navigate to="/wms/dashboard" replace /> },
  {
    path: '/wms',
    element: <WmsLayout />,
    children: [
      { index: true, element: <Navigate to="/wms/dashboard" replace /> },
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
      { path: 'receive', element: <PdaReceivePage /> },
      { path: 'putaway', element: <PdaPutawayPage /> },
      { path: 'soon/:fn', element: <PdaComingSoonPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/wms/dashboard" replace /> },
])
