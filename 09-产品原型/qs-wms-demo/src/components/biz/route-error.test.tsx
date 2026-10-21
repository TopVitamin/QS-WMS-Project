import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import '@/i18n'
import { RouteError } from '@/components/biz/route-error'

afterEach(cleanup)

function Boom(): never {
  throw new Error('boom')
}

describe('RouteError', () => {
  it('渲染中文错误页和原始错误摘要', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteError /> }])
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('页面出错了')).toBeTruthy()
    expect(screen.getByText(/boom/)).toBeTruthy()
    expect(screen.getByRole('link', { name: '回工作台' })).toBeTruthy()
    spy.mockRestore()
  })
})
