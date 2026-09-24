import JsBarcode from 'jsbarcode'
import { Printer } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DateTime, Num } from '@/components/biz/display'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLookups } from '@/mock/db'
import type { InboundOrder } from '@/types/wms'

function LabelBarcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !value) return
    svgRef.current.innerHTML = ''
    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      width: 2,
      height: 56,
      margin: 8,
      displayValue: true,
      fontSize: 14,
    })
  }, [value])

  return <svg ref={svgRef} className="mx-auto max-w-full" aria-label={value} />
}

export function PrintLabelDialog({
  order,
  onClose,
}: {
  order?: InboundOrder
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { customerName } = useLookups()

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inbound.printTitle')}</DialogTitle>
          <DialogDescription>{t('inbound.printHint')}</DialogDescription>
        </DialogHeader>

        {order && (
          <div id="inbound-label-print" className="rounded-lg border bg-white p-4 text-black print:border-0 print:p-0">
            <div className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
              {t('inbound.cartonLabel')}
            </div>
            <div className="mb-1 text-center font-mono text-lg font-semibold">{order.warehouseCode}</div>
            <div className="mb-3 text-center text-sm">{customerName(order.customerId)}</div>
            <LabelBarcode value={order.inboundNo} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500">{t('inbound.inboundNo')}</span>
                <span className="mt-0.5 block font-mono text-[13px]">{order.inboundNo}</span>
              </div>
              <div>
                <span className="text-neutral-500">{t('inbound.containerNo')}</span>
                <div className="mt-0.5 font-mono">{order.containerNo}</div>
              </div>
              <div>
                <span className="text-neutral-500">{t('inbound.cartons')}</span>
                <div className="mt-0.5">
                  <Num value={order.plannedCartonQty} />
                </div>
              </div>
              <div>
                <span className="text-neutral-500">{t('inbound.eta')}</span>
                <div className="mt-0.5">
                  <DateTime value={order.etaAt} pattern="YYYY-MM-DD" />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer data-icon="inline-start" />
            {t('inbound.printBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
