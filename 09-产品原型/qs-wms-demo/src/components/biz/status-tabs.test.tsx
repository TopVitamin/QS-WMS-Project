import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { StatusTabs } from '@/components/biz/status-tabs'

afterEach(cleanup)

const items = [
  { value: 'ALL', label: '全部', count: 3 },
  { value: 'PENDING', label: '待处理', count: 2 },
  { value: 'DONE', label: '已完成', count: 1 },
]

describe('StatusTabs', () => {
  it('使用 tab 语义并标出当前页签', () => {
    render(<StatusTabs items={items} value="ALL" onChange={() => {}} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
    expect(tabs[0].getAttribute('tabindex')).toBe('0')
    expect(tabs[1].getAttribute('tabindex')).toBe('-1')
  })

  it('方向键切换页签', () => {
    const onChange = vi.fn()
    render(<StatusTabs items={items} value="ALL" onChange={onChange} />)
    fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('PENDING')
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1])
  })
})
