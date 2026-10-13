import dayjs from 'dayjs'
import { AlertTriangle, ArrowRight, ArrowUpFromLine, Boxes, PackageOpen, Printer, Smartphone, Truck, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { DateTime, DocNo, Money, Num } from '@/components/biz/display'
import { PageContainer, Section } from '@/components/biz/page-container'
import { StatCard } from '@/components/biz/stat-card'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import {
  inboundOrderStatusMeta,
  packageStatusMeta,
  putawayOrderStatusMeta,
  type StatusTone,
} from '@/config/status'
import { formatDateTime } from '@/lib/format'
import { listOpenPutawayOrders, pendingPutawayQty } from '@/lib/putaway'
import { toneDotClass } from '@/lib/tone-styles'
import { textLink } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import type { PackageStatus } from '@/types/wms'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const allInbounds = useDb((s) => s.inbounds)
  const allPackages = useDb((s) => s.packages)
  const allPutawayOrders = useDb((s) => s.putawayOrders)
  const { customerName } = useLookups()

  const data = useMemo(() => {
    const inbounds = allInbounds.filter((o) => o.warehouseCode === warehouse.code)
    const packages = allPackages.filter((p) => p.warehouseCode === warehouse.code)
    const openPutaways = listOpenPutawayOrders(allPutawayOrders, warehouse.code)
    const dayStart = dayjs().tz(warehouse.timezone).startOf('day')
    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = dayStart.subtract(6 - i, 'day')
      const count = inbounds.filter((o) => {
        const c = dayjs(o.createdAt).tz(warehouse.timezone)
        return !c.isBefore(d) && c.isBefore(d.add(1, 'day'))
      }).length
      return { label: d.format('MM-DD'), count }
    })
    const statuses = Object.keys(packageStatusMeta) as PackageStatus[]
    const pkgDist = statuses.map((s) => ({ status: s, count: packages.filter((p) => p.status === s).length }))
    const fee = packages
      .filter((p) => p.status === 'SHIPPED')
      .reduce((a, p) => a + p.shippingFee.amount, 0)
    return {
      pendingInbound: inbounds.filter((o) => o.status === 'PENDING_RECEIVE').length,
      pendingPutaway: openPutaways.reduce((a, p) => a + pendingPutawayQty(p), 0),
      readyPrint: packages.filter((p) => p.status === 'READY_PRINT').length,
      abnormal: packages.filter((p) => p.status === 'HOLD').length,
      shipped: packages.filter((p) => p.status === 'SHIPPED' && dayjs(p.createdAt).isAfter(dayStart.subtract(1, 'day'))).length,
      trend,
      pkgDist,
      pkgTotal: packages.length,
      fee: { amount: fee, currency: warehouse.currency },
      recent: inbounds.slice(0, 6),
    }
  }, [allInbounds, allPackages, allPutawayOrders, warehouse])

  /** 每张 KPI 的颜色取它所统计状态的色调，保证「同一状态同一颜色」 */
  const kpis: { label: string; value: number; icon: LucideIcon; tone: StatusTone; to: string }[] = [
    {
      label: t('dashboard.pendingInbound'),
      value: data.pendingInbound,
      icon: PackageOpen,
      tone: inboundOrderStatusMeta.PENDING_RECEIVE.tone,
      to: '/wms/inbound/orders',
    },
    {
      label: t('dashboard.pendingPutaway'),
      value: data.pendingPutaway,
      icon: ArrowUpFromLine,
      tone: putawayOrderStatusMeta.PENDING.tone,
      to: '/wms/inbound/putaway',
    },
    {
      label: t('dashboard.readyPrint'),
      value: data.readyPrint,
      icon: Printer,
      tone: packageStatusMeta.READY_PRINT.tone,
      to: '/wms/outbound/packages',
    },
    {
      label: t('dashboard.shippedToday'),
      value: data.shipped,
      icon: Truck,
      tone: packageStatusMeta.SHIPPED.tone,
      to: '/wms/outbound/packages',
    },
    {
      label: t('dashboard.abnormal'),
      value: data.abnormal,
      icon: AlertTriangle,
      tone: packageStatusMeta.HOLD.tone,
      to: '/wms/inbound/orders',
    },
  ]
  const maxTrend = Math.max(1, ...data.trend.map((d) => d.count))

  return (
    <PageContainer
      title={t('dashboard.greeting', { name: operator })}
      description={t('dashboard.subtitle', {
        warehouse: `${warehouse.code} ${t(warehouse.nameKey)}`,
        time: formatDateTime(new Date().toISOString(), warehouse.timezone),
      })}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} icon={k.icon} tone={k.tone} to={k.to} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Section title={t('dashboard.inboundTrend')} className="lg:col-span-2">
          <div className="flex h-44 items-end gap-3">
            {data.trend.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground tabular-nums">{d.count}</span>
                <div
                  className="w-full max-w-12 rounded-t bg-primary/85 transition-all hover:bg-primary"
                  style={{ height: `${(d.count / maxTrend) * 120 + 4}px` }}
                />
                <span className="text-xs text-muted-foreground tabular-nums">{d.label}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title={t('dashboard.packageStatus')}
          extra={
            <span className="text-xs text-muted-foreground">
              {t('dashboard.shippingFee')}: <Money value={data.fee} className="font-medium text-foreground" />
            </span>
          }
        >
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            {data.pkgDist.map((d) =>
              d.count ? (
                <div
                  key={d.status}
                  className={toneDotClass[packageStatusMeta[d.status].tone]}
                  style={{ width: `${(d.count / data.pkgTotal) * 100}%` }}
                />
              ) : null,
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {data.pkgDist.map((d) => (
              <div key={d.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn('size-2 rounded-full', toneDotClass[packageStatusMeta[d.status].tone])} />
                  {t(packageStatusMeta[d.status].labelKey)}
                </span>
                <Num value={d.count} className="font-medium" />
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Section
          flush
          className="lg:col-span-2"
          title={t('dashboard.recentInbounds')}
          extra={
            <Link to="/wms/inbound/orders" className={textLink}>
              {t('dashboard.viewAll')}
            </Link>
          }
        >
          <div className="divide-y border-t">
            {data.recent.map((o) => (
              <div key={o.inboundNo} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                <DocNo onClick={() => navigate(`/wms/inbound/orders/${o.inboundNo}`)}>{o.inboundNo}</DocNo>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{customerName(o.customerId)}</span>
                <span className="text-xs text-muted-foreground">
                  {o.items.length} SKU · <Num value={o.items.reduce((a, i) => a + i.plannedQty, 0)} />
                </span>
                <StatusBadge meta={inboundOrderStatusMeta[o.status]} />
                <DateTime value={o.createdAt} className="w-32 text-right text-xs text-muted-foreground" />
              </div>
            ))}
          </div>
        </Section>

        <Section title={t('dashboard.demoFlow')}>
          <p className="text-xs leading-relaxed text-muted-foreground">{t('dashboard.demoFlowDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <a href="#/pda/receive" target="_blank" rel="noreferrer">
                <Smartphone data-icon="inline-start" />
                PDA · {t('pda.receive')}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#/pda/putaway" target="_blank" rel="noreferrer">
                <Smartphone data-icon="inline-start" />
                PDA · {t('pda.putaway')}
              </a>
            </Button>
            <Button variant="outline" onClick={() => navigate('/wms/inbound/orders')}>
              <PackageOpen data-icon="inline-start" />
              {t('menu.inboundOrders')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/wms/inventory/stock')}>
              <Boxes data-icon="inline-start" />
              {t('menu.stock')}
            </Button>
          </div>
          <Link to="/wms/inbound/orders" className={cn(textLink, 'mt-auto inline-flex items-center gap-1')}>
            {t('dashboard.viewAll')}
            <ArrowRight className="size-3.5" />
          </Link>
        </Section>
      </div>
    </PageContainer>
  )
}
