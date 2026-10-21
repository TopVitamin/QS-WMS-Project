import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldLabelProps {
  className?: string
  required?: boolean
  /** 关联控件的 id；不传时只作为视觉标签 */
  htmlFor?: string
  id?: string
  children: React.ReactNode
}

/** 表单字段标签：必填项用红色 *，与可选字段区分 */
export function FormFieldLabel({ className, required, htmlFor, id, children }: FormFieldLabelProps) {
  return (
    <Label id={id} htmlFor={htmlFor} className={cn('text-xs text-muted-foreground', className)}>
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </Label>
  )
}
