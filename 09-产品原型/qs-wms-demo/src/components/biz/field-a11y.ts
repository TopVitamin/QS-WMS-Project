import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

/** 自定义表单控件接入 FormField/FilterItem 时实现的属性；要落到真正的 input/trigger 上 */
export interface FieldControlA11yProps {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

export interface FieldA11y {
  controlId: string
  errorId: string
  hintId: string
  hasError: boolean
  hasHint: boolean
  required: boolean
}

/** 表单字段的无障碍 id：标签 htmlFor、错误 aria-describedby 共用，调用方不用手写 id */
export function useFieldA11y(error?: ReactNode, required?: boolean, hint?: ReactNode): FieldA11y {
  const id = useId()
  return {
    controlId: `${id}-control`,
    errorId: `${id}-error`,
    hintId: `${id}-hint`,
    hasError: Boolean(error),
    hasHint: Boolean(hint),
    required: Boolean(required),
  }
}

/**
 * 给单个表单控件补 id / aria-describedby / aria-invalid / aria-required。
 * 只处理单个元素；字段组（如多选框、照片上传）没有可关联的单一控件，保持原样。
 */
export function connectFieldControl(children: ReactNode, a11y: FieldA11y): ReactNode {
  if (Children.count(children) !== 1 || !isValidElement(children)) return children
  const child = children as ReactElement<Record<string, unknown>>
  const props = child.props
  const describedBy = [props['aria-describedby'], a11y.hasError ? a11y.errorId : undefined].filter(Boolean).join(' ')

  return cloneElement(child, {
    id: props.id ?? a11y.controlId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': props['aria-invalid'] ?? (a11y.hasError ? true : undefined),
    'aria-required': props['aria-required'] ?? (a11y.required ? true : undefined),
  })
}
