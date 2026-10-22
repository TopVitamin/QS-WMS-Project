import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import '@/i18n'
import { ConfirmContext } from '@/hooks/use-confirm'
import { locationDetailPath } from '@/lib/location-master'
import { useDb } from '@/mock/db'
import { createSeedData } from '@/mock/seed'
import { useSettings } from '@/stores/settings'
import type { InboundMessage } from '@/types/inbound'
import { InboundOrderDetailPage } from './inbound/inbound-order-detail-page'
import { LocationDetailPage } from './master/location-detail-page'
import { ReturnDetailPage } from './returns/return-detail-page'

const warehouseCode = 'US-LA-01'
const inboundNo = 'IB-20261002-0001'

beforeEach(() => {
  useDb.setState(createSeedData())
  useSettings.setState({ warehouseCode, language: 'zh-CN' })
})

afterEach(cleanup)

function renderPage(path: string, url: string, page: ReactNode) {
  return render(
    <StrictMode>
      <ConfirmContext value={async () => true}>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route path={path} element={page} />
          </Routes>
        </MemoryRouter>
      </ConfirmContext>
    </StrictMode>,
  )
}

function selectTab(name: RegExp) {
  const tab = screen.getByRole('tab', { name })
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false })
  expect(tab.getAttribute('aria-selected')).toBe('true')
}

describe('详情页使用真实store的渲染回归', () => {
  it('直接进入入库详情并切换上游页签，不产生循环更新', () => {
    renderPage('/inbound/:inboundNo', `/inbound/${inboundNo}`, <InboundOrderDetailPage />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(inboundNo)
    selectTab(/上游消息/)
    expect(screen.getByText('暂无上游消息')).toBeTruthy()
  })

  it('直接进入上游页签，消息写入后数量与列表同步更新，仍只展示本单消息', () => {
    renderPage('/inbound/:inboundNo', `/inbound/${inboundNo}?tab=upstream`, <InboundOrderDetailPage />)
    expect(screen.getByText('暂无上游消息')).toBeTruthy()
    const message: InboundMessage = {
      id: 'DETAIL-REGRESSION-MESSAGE',
      inboundNo,
      upstreamNo: 'REGRESSION-MATCHING-UPSTREAM',
      version: 1,
      action: 'CHANGE',
      status: 'ACCEPTED',
      at: '2026-10-22T02:00:00Z',
    }
    act(() =>
      useDb.setState({
        inboundMessages: [
          { ...message, id: 'UNRELATED', inboundNo: 'IB-OTHER', upstreamNo: 'REGRESSION-OTHER-UPSTREAM' },
          message,
        ],
      }),
    )
    expect(screen.getByRole('tab', { name: /上游消息.*1/ })).toBeTruthy()
    expect(screen.getByText(message.upstreamNo)).toBeTruthy()
    expect(screen.queryByText('REGRESSION-OTHER-UPSTREAM')).toBeNull()
  })

  it('退货详情在无收货、异常及上架记录时也能打开和切换页签', () => {
    const order = useDb.getState().returnOrders.find((o) => o.warehouseCode === warehouseCode)!
    renderPage('/returns/:returnNo', `/returns/${order.returnNo}`, <ReturnDetailPage />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(order.returnNo)
    selectTab(/退货收货/)
    expect(screen.getByText('还没有退货收货记录')).toBeTruthy()
  })

  it.each(['occupied', 'empty'])('库位详情的%s货主集合保持稳定', (kind) => {
    const { inventory, locationMasters } = useDb.getState()
    const location = locationMasters.find((l) => l.warehouseCode === warehouseCode)!
    useDb.setState({
      inventory: [
        {
          ...inventory[0],
          warehouseCode,
          locationCode: location.code,
          onHandQty: kind === 'occupied' ? 1 : 0,
          allocatedQty: 0,
          lockedQty: 0,
        },
      ],
    })
    renderPage('/wms/master/locations/:code', locationDetailPath(warehouseCode, location.code), <LocationDetailPage />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(location.code)
    act(() => useDb.setState({ auditLogs: [...useDb.getState().auditLogs] }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(location.code)
  })
})
