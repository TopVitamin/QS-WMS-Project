import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FieldControlA11yProps } from '@/components/biz/field-a11y'
import { usageStatusMeta } from '@/config/status'
import { FILTER_ALL, FILTER_NO, FILTER_YES } from '@/lib/master-data'
import { cn } from '@/lib/utils'
import type { UsageStatus } from '@/types/wms'

export interface SelectOption<T extends string = string> {
  value: T
  label: React.ReactNode
}

/**
 * 通用下拉：筛选区与表单共用。触发器占满宽度，统一 placeholder。
 * - allOption：筛选区用，首项「全部」（值为 FILTER_ALL）
 * - invalid：表单校验失败时标红
 * 编码类选项的文案用 codeNameText(code, name)。
 */
export function OptionSelect<T extends string>({
  value,
  onValueChange,
  options,
  allOption,
  placeholder,
  disabled,
  invalid,
  className,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
}: FieldControlA11yProps & {
  value: T | undefined
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  allOption?: boolean
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Select value={value || undefined} onValueChange={(next) => onValueChange(next as T)} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? (invalid || undefined)}
        aria-required={ariaRequired}
        className={cn('w-full', className)}
      >
        <SelectValue placeholder={placeholder ?? t('common.selectPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {allOption && <SelectItem value={FILTER_ALL}>{t('common.all')}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const USAGE_STATUSES: UsageStatus[] = ['ENABLED', 'DISABLED']

/** 筛选区「使用状态」：全部 / 启用 / 停用 */
export function UsageStatusFilter({
  value,
  onValueChange,
  ...a11y
}: FieldControlA11yProps & { value: string; onValueChange: (value: string) => void }) {
  const { t } = useTranslation()
  return (
    <OptionSelect<string>
      {...a11y}
      allOption
      value={value}
      onValueChange={onValueChange}
      options={USAGE_STATUSES.map((s) => ({ value: s, label: t(usageStatusMeta[s].labelKey) }))}
    />
  )
}

/** 筛选区布尔字段：全部 / 是 / 否（配合 lib/master-data 的 matchYesNo） */
export function YesNoFilter({
  value,
  onValueChange,
  ...a11y
}: FieldControlA11yProps & { value: string; onValueChange: (value: string) => void }) {
  const { t } = useTranslation()
  return (
    <OptionSelect<string>
      {...a11y}
      allOption
      value={value}
      onValueChange={onValueChange}
      options={[
        { value: FILTER_YES, label: t('common.yes') },
        { value: FILTER_NO, label: t('common.no') },
      ]}
    />
  )
}

/** 表单布尔字段：是 / 否 */
export function YesNoSelect({
  value,
  onChange,
  disabled,
  ...a11y
}: FieldControlA11yProps & {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <OptionSelect<string>
      {...a11y}
      value={value ? FILTER_YES : FILTER_NO}
      onValueChange={(v) => onChange(v === FILTER_YES)}
      disabled={disabled}
      options={[
        { value: FILTER_YES, label: t('common.yes') },
        { value: FILTER_NO, label: t('common.no') },
      ]}
    />
  )
}
