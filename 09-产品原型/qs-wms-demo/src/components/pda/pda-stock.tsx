import { cn } from '@/lib/utils'

/**
 * 库内作业的商品块（《PDA作业端设计规范》§7）：SKU 编码等宽粗体，名称最多两行（不截成一行），
 * 货主与批次效期各一行；标签放在编码后面。库存查询、移库、盘点共用。
 */
export function PdaSkuBlock({
  skuCode,
  name,
  owner,
  batch,
  tags,
  className,
}: {
  skuCode: string
  name?: string
  owner?: string
  batch?: string
  tags?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono text-lg font-bold">{skuCode}</span>
        {tags}
      </div>
      {name && <div className="mt-0.5 line-clamp-2 text-sm">{name}</div>}
      {owner && <div className="mt-0.5 text-sm text-muted-foreground">{owner}</div>}
      {batch && <div className="mt-0.5 font-mono text-sm text-muted-foreground">{batch}</div>}
    </div>
  )
}

/** 关键数量：上方小标签，下方大号数字（18～24px 粗体） */
export function PdaFigure({
  label,
  value,
  className,
  size = 'lg',
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
  size?: 'lg' | 'md'
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn('font-bold tabular-nums leading-tight', size === 'lg' ? 'text-2xl' : 'text-lg')}>{value}</div>
    </div>
  )
}

/** 库位：等宽粗体编码，后接用途小字 */
export function PdaLocation({ code, usage, className }: { code: string; usage?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span className="font-mono text-lg font-bold">{code}</span>
      {usage && <span className="text-sm text-muted-foreground">{usage}</span>}
    </span>
  )
}
