import dayjs from 'dayjs'
import {
  ArrowRightLeft,
  ArrowUpFromLine,
  ClipboardCheck,
  Globe,
  Monitor,
  PackageCheck,
  PackageOpen,
  ScanSearch,
  ShoppingCart,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import { warehouses } from '@/mock/seed'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'

interface PdaFunction {
  key: string
  titleKey: string
  icon: LucideIcon
  to: string
  tone: string
  ready: boolean
}

const groups: { titleKey: string; items: PdaFunction[] }[] = [
  {
    titleKey: 'pda.inboundGroup',
    items: [
      { key: 'sign', titleKey: 'pda.sign', icon: Truck, to: '/pda/soon/sign', tone: 'bg-cyan-50 text-cyan-600', ready: false },
      { key: 'receive', titleKey: 'pda.receive', icon: PackageOpen, to: '/pda/receive', tone: 'bg-blue-50 text-blue-600', ready: true },
      { key: 'putaway', titleKey: 'pda.putaway', icon: ArrowUpFromLine, to: '/pda/putaway', tone: 'bg-indigo-50 text-indigo-600', ready: true },
    ],
  },
  {
    titleKey: 'pda.inventoryGroup',
    items: [
      { key: 'query', titleKey: 'pda.query', icon: ScanSearch, to: '/pda/soon/query', tone: 'bg-emerald-50 text-emerald-600', ready: false },
      { key: 'move', titleKey: 'pda.move', icon: ArrowRightLeft, to: '/pda/soon/move', tone: 'bg-amber-50 text-amber-600', ready: false },
      { key: 'count', titleKey: 'pda.count', icon: ClipboardCheck, to: '/pda/soon/count', tone: 'bg-violet-50 text-violet-600', ready: false },
    ],
  },
  {
    titleKey: 'pda.outboundGroup',
    items: [
      { key: 'pick', titleKey: 'pda.pick', icon: ShoppingCart, to: '/pda/soon/pick', tone: 'bg-orange-50 text-orange-600', ready: false },
      { key: 'pack', titleKey: 'pda.pack', icon: PackageCheck, to: '/pda/soon/pack', tone: 'bg-pink-50 text-pink-600', ready: false },
      { key: 'handover', titleKey: 'pda.handover', icon: Truck, to: '/pda/soon/handover', tone: 'bg-slate-100 text-slate-600', ready: false },
    ],
  },
]

export function PdaHomePage() {
  const { t } = useTranslation()
  const warehouse = useCurrentWarehouse()
  const { operator, setWarehouse, language, setLanguage } = useSettings()
  const tasks = useDb((s) => s.putawayTasks)
  const logs = useDb((s) => s.inventoryLogs)

  const stats = useMemo(() => {
    const dayStart = dayjs().tz(warehouse.timezone).startOf('day')
    return {
      pendingTasks: tasks.filter((x) => x.warehouseCode === warehouse.code && x.status !== 'COMPLETED').length,
      doneToday: logs.filter(
        (l) => l.warehouseCode === warehouse.code && l.operator === operator && dayjs(l.createdAt).isAfter(dayStart),
      ).length,
    }
  }, [tasks, logs, warehouse, operator])

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
              className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm active:bg-white/15"
            >
              <Globe className="size-4" />
              {language === 'zh-CN' ? 'EN' : '中'}
            </button>
            <Link to="/wms/dashboard" className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm active:bg-white/15">
              <Monitor className="size-4" />
              {t('pda.backToWms')}
            </Link>
          </div>
        </div>
      </header>

      <div className="-mt-10 flex-1 overflow-y-auto px-3 pb-4">
        <div className="rounded-xl bg-background p-3 shadow-sm">
          <Select value={warehouse.code} onValueChange={setWarehouse}>
            <SelectTrigger className="h-11! w-full text-base">
              <Warehouse className="text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.code} value={w.code}>
                  {w.code} · {t(w.nameKey)}
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
        </div>

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
                  <div className={cn('flex size-11 items-center justify-center rounded-xl', f.tone)}>
                    <f.icon className="size-6" />
                  </div>
                  <span className="text-sm font-medium">{t(f.titleKey)}</span>
                  {!f.ready && <span className="absolute top-1.5 right-2 text-[10px] text-muted-foreground">Soon</span>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
