import { useMemo, useState } from 'react'
import { PdaCard } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { deriveSerials, isWorkLocation, locationUsage } from '@/lib/inventory-derive'
import { compareLocation, skuScanValue } from '@/lib/pda-inventory-scan'
import type { QueryFlow } from './use-query-flow'

/** 扫描屏：一个扫码框，库位、商品条码、SKU 编码、SN 都能扫；模拟候选覆盖多货主同 SKU、在库与已盘亏 SN */
export function QueryScanStep({ flow }: { flow: QueryFlow }) {
  const { t, nav, state, warehouse } = flow
  const [message, setMessage] = useState<ScanMessage>()

  const candidates = useMemo<ScanCandidate[]>(() => {
    const rows = state.inventory
      .filter((r) => r.warehouseCode === warehouse.code && r.onHandQty > 0)
      .sort((a, b) => compareLocation(a.locationCode, b.locationCode))
    const out: ScanCandidate[] = []
    const location = rows.find((r) => isWorkLocation(locationUsage(state, warehouse.code, r.locationCode)))
    if (location) out.push({ value: location.locationCode, label: t('pdaQuery.kindLocation') })
    const owners = new Map<string, Set<string>>()
    rows.forEach((r) => owners.set(r.skuCode, (owners.get(r.skuCode) ?? new Set()).add(r.customerId)))
    const shared = [...owners.entries()].find(([, set]) => set.size > 1)?.[0]
    if (shared) out.push({ value: shared, label: t('pdaQuery.candidateMultiOwner') })
    const barcodeRow = rows.find(
      (r) => r.skuCode !== shared && skuScanValue(state, r.customerId, r.skuCode) !== r.skuCode,
    )
    if (barcodeRow)
      out.push({ value: skuScanValue(state, barcodeRow.customerId, barcodeRow.skuCode), label: barcodeRow.skuCode })
    const serials = deriveSerials(state, warehouse.code)
    const inStock = serials.find((r) => r.status === 'IN_STOCK')
    if (inStock) out.push({ value: inStock.serialNo, label: t('inventory.serialStatus.IN_STOCK') })
    const gone = serials.find((r) => r.status !== 'IN_STOCK')
    if (gone) out.push({ value: gone.serialNo, label: t(`inventory.serialStatus.${gone.status}`) })
    return out
  }, [state, t, warehouse.code])

  const onScan = (code: string) => {
    const result = flow.scan(code)
    setMessage(result)
    return !result
  }

  return (
    <>
      <PdaHeader title={t('pda.query')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput label={t('pdaQuery.scanPrompt')} onScan={onScan} message={message} candidates={candidates} />
        <PdaCard className="text-sm text-muted-foreground">{t('pdaQuery.scanHint')}</PdaCard>
      </div>
    </>
  )
}
