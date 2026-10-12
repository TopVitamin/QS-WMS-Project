import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { Num } from '@/components/biz/display'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { putawayOrderStatusMeta } from '@/config/status'
import type { PutawayOrder } from '@/types/inbound'

export function InboundPutawaySheet({
  order,
  onClose,
}: {
  order?: PutawayOrder
  onClose: () => void
}) {
  const { t } = useTranslation()

  const planColumns = useMemo(() => {
    const col = createDataColumns<PutawayOrder['planLines'][number]>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', { header: t('common.sku') }),
      col.accessor('planQty', {
        header: t('inbound.planPutawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])

  const actualColumns = useMemo(() => {
    const col = createDataColumns<PutawayOrder['actualLines'][number]>()
    return col.columns([
      col.accessor('locationCode', { header: t('inbound.targetLocation') }),
      col.accessor('skuCode', { header: t('common.sku') }),
      col.accessor('qty', {
        header: t('inbound.putawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:w-[880px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[92vw]">
        {order && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {order.putawayNo}
                <StatusBadge meta={putawayOrderStatusMeta[order.status]} />
                <TagLabel tone={order.qualityType === 'GOOD' ? 'green' : 'red'}>
                  {t(`enum.quality.${order.qualityType}`)}
                </TagLabel>
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {t('inbound.workContainerNo')}：{order.containerNo ? order.containerNo : t('inbound.bulkPiece')}
              </p>
            </SheetHeader>
            <div className="p-4">
              <Tabs defaultValue="plan">
                <TabsList>
                  <TabsTrigger value="plan">{t('inbound.putawayPlanTab')}</TabsTrigger>
                  <TabsTrigger value="actual">{t('inbound.putawayActualTab')}</TabsTrigger>
                </TabsList>
                <TabsContent value="plan" className="mt-3">
                  <DataTable
                    data={order.planLines}
                    columns={planColumns}
                    getRowId={(line) => String(line.lineNo)}
                    selectable={false}
                    showColumnSettings={false}
                    paginate={false}
                  />
                </TabsContent>
                <TabsContent value="actual" className="mt-3">
                  <DataTable
                    data={order.actualLines}
                    columns={actualColumns}
                    getRowId={(line) => `${line.locationCode}-${line.skuCode}-${line.qty}`}
                    selectable={false}
                    showColumnSettings={false}
                    paginate={false}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
