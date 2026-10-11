import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldLabelProps {
  className?: string
  required?: boolean
  children: React.ReactNode
}

/** 表单字段标签：必填项用红色 *，与可选字段区分 */
export function FormFieldLabel({ className, required, children }: FormFieldLabelProps) {
  return (
    <Label className={cn('text-xs text-muted-foreground', className)}>
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
