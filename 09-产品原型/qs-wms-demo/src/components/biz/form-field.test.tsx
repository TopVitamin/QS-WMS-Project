import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { FormField } from '@/components/biz/form-field'
import { Input } from '@/components/ui/input'

afterEach(cleanup)

describe('FormField 无障碍关联', () => {
  it('把标签、必填、错误和控件关联起来', () => {
    render(
      <FormField label="仓库编码" required error={<p>请填写仓库编码</p>}>
        <Input />
      </FormField>,
    )

    const input = screen.getByLabelText(/仓库编码/) as HTMLInputElement
    expect(input.getAttribute('aria-required')).toBe('true')
    expect(input.getAttribute('aria-invalid')).toBe('true')

    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('请填写仓库编码')
  })

  it('没有错误时不写 aria-describedby / aria-invalid', () => {
    render(
      <FormField label="备注">
        <Input />
      </FormField>,
    )
    const input = screen.getByLabelText('备注')
    expect(input.getAttribute('aria-describedby')).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(input.getAttribute('aria-required')).toBeNull()
  })
})
