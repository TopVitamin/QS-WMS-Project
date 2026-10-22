import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { CodeName, DocNo, Empty, Num } from '@/components/biz/display'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { inventoryTagMeta } from '@/config/status'
import type { LocationUsage } from '@/lib/inventory-derive'
import { toneTextClass } from '@/lib/tone-styles'
import { cn } from '@/lib/utils'
import { documentPath } from './inventory-helpers'

/** 库存详情的找不到空态：记录不存在、不属当前仓或无权限，不展示缓存数据 */
export function InventoryNotFound({ title, backTo }: { title: string; backTo: string }) {
  const { t } = useTranslation()
  return (
    <PageContainer title={title}>
      <Panel className="flex flex-col items-center gap-4 p-10 text-sm text-muted-foreground">
        {t('inventory.notFoundOrNoAccess')}
        <Button variant="outline" asChild>
          <Link to={backTo}>{t('inventory.backToList')}</Link>
        </Button>
      </Panel>
    </PageContainer>
  )
}

/** 带符号的数量：正数加「+」显示绿色，负数显示红色；颜色只辅助，符号始终保留 */
export function SignedNum({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('tabular-nums', value > 0 && toneTextClass.green, value < 0 && toneTextClass.red, className)}>
      {value > 0 && '+'}
      <Num value={value} />
    </span>
  )
}

/** 可用数量：为负时保留真实负数，标红并带「正常品不足」，不截为 0 */
export function AvailableQty({ value }: { value: number }) {
  const { t } = useTranslation()
  if (value >= 0) return <Num value={value} />
  return (
    <span className="inline-flex items-center gap-1.5" title={t('inventory.negativeHint')}>
      <TagLabel meta={inventoryTagMeta.negative} />
      <Num value={value} className={cn('font-medium', toneTextClass.red)} />
    </span>
  )
}

const BASIS_ROWS = ['actual', 'reserved', 'available', 'allocated', 'allocatable'] as const

/** 数量口径说明：SKU 可用、订单预占、批次已分配、可分配不是同一个数。 */
export function InventoryBasisHelp({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className={cn('h-auto gap-1 px-1 text-xs', className)}>
          <Info data-icon="inline-start" />
          {t('inventory.basis.title')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96">
        <PopoverHeader>
          <PopoverTitle>{t('inventory.basis.title')}</PopoverTitle>
          <PopoverDescription>{t('inventory.basis.intro')}</PopoverDescription>
        </PopoverHeader>
        <div className="space-y-2 text-sm">
          {BASIS_ROWS.map((key) => (
            <p key={key} className="text-muted-foreground">
              {t(`inventory.basis.${key}`)}
            </p>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** 库位：编码为主，用途作辅助说明 */
export function LocationCode({ code, usage }: { code: string; usage?: LocationUsage }) {
  const { t } = useTranslation()
  if (!code) return <Empty />
  return <CodeName code={code} name={usage ? t(`inventory.usage.${usage}`) : undefined} />
}

/** 单据号：有详情页的可点开，没有的只显示 */
export function DocLink({ no }: { no?: string }) {
  const navigate = useNavigate()
  if (!no) return <Empty />
  const path = documentPath(no)
  return path ? <DocNo onClick={() => navigate(path)}>{no}</DocNo> : <DocNo>{no}</DocNo>
}

/** 待核对来源：业务单号可点开；PDA 移库等现场发现记为「环节@库位」 */
export function PendingSource({ source }: { source: string }) {
  const { t } = useTranslation()
  const [stage, location] = source.split('@')
  if (location) return <span>{`${t(`inventory.stage.${stage}`)} · ${location}`}</span>
  return <DocLink no={source} />
}

/** 标签直接由业务依据派生，不建立可编辑的分配状态。 */
export function StockFlags({ pending, counting }: { pending?: boolean; counting?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1.5">
      {counting && (
        <span title={t('inventory.countingHint')}>
          <TagLabel meta={inventoryTagMeta.counting} />
        </span>
      )}
      {pending && (
        <span title={t('inventory.pendingHint')}>
          <TagLabel meta={inventoryTagMeta.pending} />
        </span>
      )}
    </span>
  )
}
