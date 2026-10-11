import type { WarehouseMaster } from '@/types/wms'
import { cn } from '@/lib/utils'
import { formatWarehouseFullAddress } from '@/lib/warehouse-master'

type AddressSlice = Pick<
  WarehouseMaster,
  'countryCode' | 'state' | 'city' | 'district' | 'address1' | 'address2' | 'postalCode'
>

interface WarehouseFullAddressPreviewProps {
  data: AddressSlice
  /** 已翻译的国家/地区名；未传则用 format 内置中文标签 */
  countryLabel?: string
  className?: string
}

/** 只读地址完整展示：与输入框同高基线，分段横向排列、垂直居中 */
export function WarehouseFullAddressPreview({ data, countryLabel, className }: WarehouseFullAddressPreviewProps) {
  const country = countryLabel ?? data.countryCode
  const segments = [country, data.state, data.city, data.district, data.address1, data.address2, data.postalCode].filter(
    (p) => p && String(p).trim(),
  )

  if (segments.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-8 w-full items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground',
          className,
        )}
      >
        -
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-8 w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-input bg-muted/40 px-2.5 py-1.5 text-sm leading-snug',
        className,
      )}
      title={formatWarehouseFullAddress(data)}
    >
      {segments.map((text, index) => (
        <span key={`${index}-${text}`} className="inline-flex max-w-full items-center gap-2">
          {index > 0 ? <span className="shrink-0 text-muted-foreground select-none" aria-hidden>·</span> : null}
          <span className="break-words">{text}</span>
        </span>
      ))}
    </div>
  )
}
