import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@/i18n'
import { createDataColumns, DataTable } from '@/components/biz/data-table'

afterEach(cleanup)

interface Row {
  id: string
  name: string
  qty: number
}

const rows: Row[] = [
  { id: '1', name: 'CABLE-01', qty: 3 },
  { id: '2', name: 'ANKR-001', qty: 1 },
]

const col = createDataColumns<Row>()
const columns = col.columns([
  col.accessor('name', { header: '名称', enableSorting: true, sortFn: 'text' }),
  col.accessor('qty', { header: '数量', meta: { align: 'right' } }),
])

describe('DataTable', () => {
  it('可排序表头暴露 aria-sort', () => {
    render(<DataTable data={rows} columns={columns} getRowId={(r) => r.id} paginate={false} />)
    const header = screen.getByRole('columnheader', { name: /名称/ })
    expect(header.getAttribute('aria-sort')).toBe('none')
    fireEvent.click(screen.getByRole('button', { name: /名称/ }))
    expect(header.getAttribute('aria-sort')).toBe('ascending')
  })

  it('可点行可以用 Enter 打开', () => {
    const onRowClick = vi.fn()
    render(<DataTable data={rows} columns={columns} getRowId={(r) => r.id} paginate={false} onRowClick={onRowClick} />)
    const bodyRow = screen.getAllByRole('row')[1]
    expect(bodyRow.getAttribute('tabindex')).toBe('0')
    fireEvent.keyDown(bodyRow, { key: 'Enter' })
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })
})
