import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { beep } from '@/lib/scan-beep'
import { useConfirm } from '@/hooks/use-confirm'
import { usePdaStep } from '@/hooks/use-pda-step'
import { usePutaway } from '@/hooks/use-putaway'
import { resolveInboundSkuScan } from '@/lib/inbound-receive'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { PutawayOrder } from '@/types/inbound'

export const PUTAWAY_STEPS = ['list', 'work', 'place'] as const

/** PDA 上架各步共用的数据与动作（《PDA上架前端Demo版PRD》） */
export function usePutawayFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(PUTAWAY_STEPS, 'list')
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const putaway = usePutaway(warehouseCode)
  const { customerCode, customerName, sku } = useLookups()
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const { confirm } = useConfirm()

  const findOrder = useCallback(
    (putawayNo?: string) => (putawayNo ? putaway.putawayOrders.find((p) => p.putawayNo === putawayNo) : undefined),
    [putaway.putawayOrders],
  )

  /** 商品解析与收货一致：SKU 编码 → 货主条码 → 主条码，范围限本上架单的商品 */
  const resolveSkuIn = useCallback(
    (order: PutawayOrder, code: string) =>
      resolveInboundSkuScan(
        code,
        order.planLines.map((l) => l.skuCode),
        { ownerCode: customerCode(order.customerId), skuBarcodes, primaryBarcode: (s) => sku(s)?.barcode },
      ),
    [customerCode, sku, skuBarcodes],
  )

  /** 业务阻断：必须点「知道了」（规范 §5） */
  const notice = useCallback(
    (title: string, description?: string) => {
      beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 没有扫码框的屏用的扫码错误提示 */
  const failScan = useCallback((message: string) => {
    beep(false)
    toast.error(message)
  }, [])

  const containerLabel = useCallback((order: PutawayOrder) => order.containerNo ?? t('inbound.bulkPiece'), [t])

  return {
    t,
    nav,
    operator,
    ...putaway,
    customerName,
    sku,
    findOrder,
    resolveSkuIn,
    notice,
    failScan,
    confirm,
    containerLabel,
  }
}

export type PutawayFlow = ReturnType<typeof usePutawayFlow>
