import { FormFieldLabel } from '@/components/biz/form-field-label'
import { cn } from '@/lib/utils'

/**
 * 表单栅格：新增/编辑页 4 列（md 2 列），弹窗 2 列；行间距 12px、列间距 16px。
 * 字段区只用它，不要再手写 grid class。
 */
export function FormGrid({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 4
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-x-4 gap-y-3',
        columns === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

const spanClass = {
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  full: 'col-span-full',
} as const

/**
 * 表单字段：标签（必填红 *）+ 控件 + 说明 + 校验错误，从上到下排列。
 * - error：直接传 useMasterFormFieldError 返回的节点
 * - span：在 4 列栅格里占 2 / 3 列或整行
 */
export function FormField({
  label,
  required,
  hint,
  error,
  span,
  className,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode
  error?: React.ReactNode
  span?: keyof typeof spanClass
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', span && spanClass[span], className)}>
      <FormFieldLabel required={required}>{label}</FormFieldLabel>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error}
    </div>
  )
}
