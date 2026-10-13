import { Empty } from '@/components/biz/display'
import { cn } from '@/lib/utils'
import { formatFullAddress, type AddressParts } from '@/lib/warehouse-master'

interface WarehouseFullAddressPreviewProps {
  /** 仓库、货主等任何带地址片段的对象 */
  data: AddressParts
  /** 已翻译的国家/地区名：t(countryLabelKey(code))；不传则显示国家代码 */
  countryLabel?: string
  className?: string
}

/**
 * 只读地址完整展示：外观与只读输入框一致（灰底、同高基线），分段横向排列。
 * 仓库、货主的表单和详情都用它，不要用裸 <p> 拼地址。
 */
export function WarehouseFullAddressPreview({ data, countryLabel, className }: WarehouseFullAddressPreviewProps) {
  const country = countryLabel ?? data.countryCode
  const segments = [country, data.state, data.city, data.district, data.address1, data.address2, data.postalCode].filter(
    (p) => p && String(p).trim(),
  )

  return (
    <div
      className={cn(
        'flex min-h-8 w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-input bg-muted/40 px-2.5 py-1.5 text-sm leading-snug',
        className,
      )}
      title={segments.length > 0 ? formatFullAddress(data, countryLabel) : undefined}
    >
      {segments.length === 0 ? (
        <Empty />
      ) : (
        segments.map((text, index) => (
          <span key={`${index}-${text}`} className="inline-flex max-w-full items-center gap-2">
            {index > 0 ? <span className="shrink-0 text-muted-foreground select-none" aria-hidden>·</span> : null}
            <span className="break-words">{text}</span>
          </span>
        ))
      )}
    </div>
  )
}
