import dayjs from 'dayjs'
import {
  ArchiveRestore,
  ArrowRightLeft,
  ArrowUpFromLine,
  ClipboardCheck,
  Globe,
  Monitor,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  ScanSearch,
  ShoppingCart,
  Truck,
  Undo2,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PdaCard } from '@/components/pda/pda-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { StatusTone } from '@/config/status'
import { listOpenPutawayOrders } from '@/lib/putaway'
import { toneSurfaceClass } from '@/lib/tone-styles'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import { warehouses } from '@/mock/seed'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'

interface PdaFunction {
  key: string
  titleKey: string
  icon: LucideIcon
  to: string
  ready: boolean
}

/** 功能宫格按分组着色（入库 / 库内 / 出库），颜色只取状态色调，不用原始色 */
const groups: { titleKey: string; tone: StatusTone; items: PdaFunction[] }[] = [
  {
    titleKey: 'pda.inboundGroup',
    tone: 'blue',
    items: [
      { key: 'arrival', titleKey: 'pda.arrival', icon: Truck, to: '/pda/soon/arrival', ready: false },
      { key: 'receive', titleKey: 'pda.receive', icon: PackageOpen, to: '/pda/receive', ready: true },
      { key: 'putaway', titleKey: 'pda.putaway', icon: ArrowUpFromLine, to: '/pda/putaway', ready: true },
      { key: 'unclaimed', titleKey: 'menu.unclaimed', icon: PackageSearch, to: '/pda/unclaimed', ready: true },
    ],
  },
  {
    titleKey: 'pda.returnGroup',
    tone: 'orange',
    items: [
      {
        key: 'return-receive',
        titleKey: 'return.pda.title',
        icon: Undo2,
        to: '/pda/return-receive',
        ready: true,
      },
    ],
  },
  {
    titleKey: 'pda.inventoryGroup',
    tone: 'cyan',
    items: [
      { key: 'query', titleKey: 'pda.query', icon: ScanSearch, to: '/pda/inventory', ready: true },
      { key: 'move', titleKey: 'pda.move', icon: ArrowRightLeft, to: '/pda/move', ready: true },
      { key: 'count', titleKey: 'pda.count', icon: ClipboardCheck, to: '/pda/stocktake', ready: true },
    ],
  },
  {
    titleKey: 'pda.outboundGroup',
    tone: 'purple',
    items: [
      { key: 'pick', titleKey: 'outbound.pdaPick.title', icon: ShoppingCart, to: '/pda/pick', ready: true },
      { key: 'verify', titleKey: 'outbound.pdaVerify.title', icon: PackageCheck, to: '/pda/verify', ready: true },
      {
        key: 'return-putaway',
        titleKey: 'outbound.pdaReturn.title',
        icon: ArchiveRestore,
        to: '/pda/return-putaway',
        ready: true,
      },
    ],
  },
]

export function PdaHomePage() {
  const { t } = useTranslation()
  const warehouse = useCurrentWarehouse()
  const { operator, setWarehouse, language, setLanguage } = useSettings()
  const putawayOrders = useDb((s) => s.putawayOrders)
  const logs = useDb((s) => s.inventoryLogs)
  const warehouseMasters = useDb((s) => s.warehouseMasters)

  const stats = useMemo(() => {
    const dayStart = dayjs().tz(warehouse.timezone).startOf('day')
    return {
      pendingTasks: listOpenPutawayOrders(putawayOrders, warehouse.code).length,
      /** 一条业务动作可能写一减一加两条流水，按作业号去重后才等于「完成的作业数」 */
      doneToday: new Set(
        logs
          .filter(
            (l) => l.warehouseCode === warehouse.code && l.operator === operator && dayjs(l.createdAt).isAfter(dayStart),
          )
          .map((l) => l.jobNo || l.refNo || l.id),
      ).size,
    }
  }, [putawayOrders, logs, warehouse, operator])

  return (
    <>
      <header className="shrink-0 bg-primary px-4 pt-4 pb-14 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">{t('app.pdaName')}</div>
            <div className="text-lg font-semibold">{operator}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN')}
              className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm active:bg-primary-foreground/15"
            >
              <Globe className="size-4" />
              {language === 'zh-CN' ? 'EN' : '中' /* design-lint-ignore 语言切换按目标语言原文显示 */}
            </button>
            <Link
              to="/wms/dashboard"
              className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm active:bg-primary-foreground/15"
            >
              <Monitor className="size-4" />
              {t('pda.backToWms')}
            </Link>
          </div>
        </div>
      </header>

      <div className="-mt-10 flex-1 overflow-y-auto px-3 pb-4">
        <PdaCard className="shadow-sm">
          <Select value={warehouse.code} onValueChange={setWarehouse}>
            <SelectTrigger className="h-11! w-full text-base">
              <Warehouse className="text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.code} value={w.code}>
                  {w.code} · {warehouseMasters.find((m) => m.code === w.code)?.name ?? t(w.nameKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-3 grid grid-cols-2 divide-x text-center">
            <Link to="/pda/putaway">
              <div className="text-2xl font-semibold text-primary tabular-nums">{stats.pendingTasks}</div>
              <div className="text-xs text-muted-foreground">{t('pda.pendingPutawayTasks')}</div>
            </Link>
            <div>
              <div className="text-2xl font-semibold tabular-nums">{stats.doneToday}</div>
              <div className="text-xs text-muted-foreground">{t('pda.todayDone')}</div>
            </div>
          </div>
        </PdaCard>

        {groups.map((g) => (
          <section key={g.titleKey} className="mt-4">
            <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">{t(g.titleKey)}</h2>
            <div className="grid grid-cols-3 gap-2">
              {g.items.map((f) => (
                <Link
                  key={f.key}
                  to={f.to}
                  className="relative flex flex-col items-center gap-2 rounded-xl bg-background py-4 shadow-xs active:bg-accent"
                >
                  <div className={cn('flex size-11 items-center justify-center rounded-xl', toneSurfaceClass[g.tone])}>
                    <f.icon className="size-6" />
                  </div>
                  <span className="text-sm font-medium">{t(f.titleKey)}</span>
                  {!f.ready && (
                    <span className="absolute top-1.5 right-2 text-xs text-muted-foreground">{t('pda.soon')}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
