import { useMemo, useState } from 'react'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { countingStocktake, isWorkLocation, locationUsage } from '@/lib/inventory-derive'
import { compareLocation } from '@/lib/pda-inventory-scan'
import { MoveContext } from './move-shared'
import type { MoveFlow } from './use-move-flow'

/**
 * 扫源位（PDA移库 PRD）：启用、非暂存、有可移库存的库位。有未提交清单时先给出清单入口和放弃（需确认实物已放回）；
 * 账实不符已标记且清单已收尾时，提示去发起盘点。
 */
export function MoveSourceStep({ flow }: { flow: MoveFlow }) {
  const { t, nav, draft, state, warehouse } = flow
  const [message, setMessage] = useState<ScanMessage>()
  const lines = draft?.lines ?? []
  const discrepancy = draft?.discrepancy

  const candidates = useMemo<ScanCandidate[]>(() => {
    const codes = [
      ...new Set(
        state.inventory
          .filter(
            (r) =>
              r.warehouseCode === warehouse.code &&
              r.onHandQty - (r.allocatedQty ?? 0) > 0 &&
              isWorkLocation(locationUsage(state, warehouse.code, r.locationCode)) &&
              !countingStocktake(state.inventoryCounts, warehouse.code, r.customerId, r.skuCode),
          )
          .map((r) => r.locationCode),
      ),
    ].sort(compareLocation)
    return codes.slice(0, 3).map((value) => ({ value }))
  }, [state, warehouse.code])

  const onScan = (code: string) => {
    const check = flow.checkSource(code)
    if (!check.ok) {
      setMessage({ tone: 'error', text: check.text })
      return false
    }
    setMessage(undefined)
    nav.go('item', { src: check.code })
    return true
  }

  return (
    <>
      <PdaHeader title={t('pda.move')} onBack={() => nav.back('home')} />
      {lines.length > 0 && <MoveContext flow={flow} />}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {discrepancy && lines.length === 0 && (
          <PdaCard className="flex flex-col gap-2 border border-destructive/40">
            <p className="text-sm font-medium">
              {t('pdaMove.discrepancyPending', { sku: discrepancy.skuCode, location: discrepancy.locationCode })}
            </p>
            <PdaButton
              variant="outline"
              onClick={() => {
                flow.edit(() => undefined)
                flow.openStocktakeStart(discrepancy)
              }}
            >
              {t('pdaMove.goStocktake')}
            </PdaButton>
          </PdaCard>
        )}
        <ScanInput label={t('pdaMove.promptSource')} onScan={onScan} message={message} candidates={candidates} />
        {lines.length > 0 && (
          <PdaCard className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-medium">{t('pdaMove.draftTitle')}</div>
              <div className="text-muted-foreground">{t('pdaMove.draftHint')}</div>
            </div>
            <button
              type="button"
              className="min-h-10 shrink-0 px-1 text-sm font-medium text-destructive"
              onClick={() => void flow.discard()}
            >
              {t('pdaMove.discard')}
            </button>
          </PdaCard>
        )}
      </div>
      {lines.length > 0 && (
        <PdaFooter>
          <PdaButton className="flex-1" onClick={() => nav.go('lines')}>
            {t('pdaMove.viewLines', { count: lines.length })}
          </PdaButton>
        </PdaFooter>
      )}
    </>
  )
}
