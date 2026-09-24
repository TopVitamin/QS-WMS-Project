import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DateTime, DocNo, Money, Num, Weight } from '@/components/biz/display'
import { StatusBadge } from '@/components/biz/status-badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { inboundStatusMeta } from '@/config/status'
import { useDb, useLookups } from '@/mock/db'
import type { AuditAction } from '@/types/wms'

export function InboundDetailSheet({ inboundNo, onClose }: { inboundNo?: string; onClose: () => void }) {
  const { t } = useTranslation()
  const order = useDb((s) => s.inbounds.find((o) => o.inboundNo === inboundNo))
  const auditLogs = useDb((s) => s.auditLogs)
  const { customerName, sku } = useLookups()

  const timeline = useMemo(
    () =>
      auditLogs
        .filter((l) => l.refType === 'INBOUND' && l.refNo === inboundNo)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [auditLogs, inboundNo],
  )

  const actionLabel = (action: AuditAction) => t(`audit.action.${action}`)

  return (
    <Sheet open={!!inboundNo} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:w-[880px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[92vw]">
        {order && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-3">
                {t('inbound.detailTitle')}
                <DocNo>{order.inboundNo}</DocNo>
                <StatusBadge meta={inboundStatusMeta[order.status]} />
              </SheetTitle>
              <SheetDescription>{customerName(order.customerId)}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              <section className="border-b p-4">
                <h3 className="mb-3 text-sm font-medium">{t('inbound.basicInfo')}</h3>
                <Descriptions>
                  <DescriptionItem label={t('common.warehouse')}>{order.warehouseCode}</DescriptionItem>
                  <DescriptionItem label={t('inbound.bizType')}>{t(`enum.bizType.${order.bizType}`)}</DescriptionItem>
                  <DescriptionItem label={t('inbound.loadType')}>{t(`enum.loadType.${order.loadType}`)}</DescriptionItem>
                  <DescriptionItem label={t('inbound.containerNo')}>
                    <span className="font-mono text-xs">{order.containerNo}</span>
                  </DescriptionItem>
                  <DescriptionItem label={t('inbound.cartons')}>
                    <Num value={order.plannedCartonQty} />
                  </DescriptionItem>
                  <DescriptionItem label={t('inbound.eta')}>
                    <DateTime value={order.etaAt} />
                  </DescriptionItem>
                  <DescriptionItem label={t('common.createdAt')}>
                    <DateTime value={order.createdAt} />
                  </DescriptionItem>
                  <DescriptionItem label={t('common.updatedAt')}>
                    <DateTime value={order.updatedAt} />
                  </DescriptionItem>
                  <DescriptionItem label={t('common.remark')}>{order.remark ?? '-'}</DescriptionItem>
                </Descriptions>
              </section>

              <section className="p-4">
                <h3 className="mb-3 text-sm font-medium">
                  {t('inbound.items')}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {t('common.total', { count: order.items.length })}
                  </span>
                </h3>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t('common.sku')}</TableHead>
                        <TableHead>{t('common.barcode')}</TableHead>
                        <TableHead>{t('inventory.weight')}</TableHead>
                        <TableHead>{t('inventory.declaredValue')}</TableHead>
                        <TableHead className="text-right">{t('inbound.plannedQty')}</TableHead>
                        <TableHead className="text-right">{t('inbound.goodQty')}</TableHead>
                        <TableHead className="text-right">{t('inbound.defectQty')}</TableHead>
                        <TableHead className="text-right">{t('inbound.putawayQty')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => {
                        const s = sku(item.skuCode)
                        return (
                          <TableRow key={item.skuCode}>
                            <TableCell>
                              <div className="font-mono text-xs">{item.skuCode}</div>
                              <div className="max-w-56 truncate text-xs text-muted-foreground">{s?.name}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{s?.barcode}</TableCell>
                            <TableCell>{s && <Weight grams={s.weightG} />}</TableCell>
                            <TableCell>{s && <Money value={s.declaredValue} />}</TableCell>
                            <TableCell className="text-right">
                              <Num value={item.plannedQty} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Num value={item.receivedGoodQty} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Num value={item.receivedDefectQty} className={item.receivedDefectQty ? 'text-destructive' : ''} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Num value={item.putawayQty} />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </table>
                </div>
              </section>

              <section className="border-t p-4">
                <h3 className="mb-3 text-sm font-medium">{t('audit.title')}</h3>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('audit.empty')}</p>
                ) : (
                  <ol className="relative space-y-4 border-l pl-4">
                    {timeline.map((entry) => (
                      <li key={entry.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-medium">{actionLabel(entry.action)}</span>
                          <span className="text-xs text-muted-foreground">
                            <DateTime value={entry.createdAt} />
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {t('common.operator')}: {entry.operator}
                          {entry.detail && <span className="ml-2">{entry.detail}</span>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
