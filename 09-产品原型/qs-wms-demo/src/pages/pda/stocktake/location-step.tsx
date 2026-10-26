import { useEffect, useState } from 'react'
import { pdaToast as toast } from '@/lib/pda-toast'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaLocation } from '@/components/pda/pda-stock'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { isWorkLocation, locationUsage, occupiedByOtherOwner } from '@/lib/inventory-derive'
import { compareLocation } from '@/lib/pda-inventory-scan'
import type { InventoryCount } from '@/types/inventory'
import { StocktakeContext } from './stocktake-shared'
import type { StocktakeFlow } from './use-stocktake-flow'

/**
 * 扫库位（PDA盘点 PRD 第一节）：存储、拣货、不良隔离库位；暂存库位阻断。列出本单库位与进度；
 * 有没保存的实盘时先给出继续或放弃。候选含一个本单之外的空库位，用来演示快照外新发现的实物。
 */
export function StocktakeLocationStep({ flow }: { flow: StocktakeFlow }) {
  const { nav } = flow
  const count = flow.findCount(nav.param('no'))

  useEffect(() => {
    if (!count) nav.replace('list')
    else if (count.status !== 'COUNTING') {
      toast.info(
        flow.t('pdaStocktake.errClosed', { no: count.no, status: flow.t(`inventory.stocktakeStatus.${count.status}`) }),
      )
      nav.replace('list')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count?.no, count?.status])

  if (!count || count.status !== 'COUNTING') return null
  return <LocationWorkspace flow={flow} count={count} />
}

function LocationWorkspace({ flow, count }: { flow: StocktakeFlow; count: InventoryCount }) {
  const { t, nav, state, warehouse } = flow
  const [message, setMessage] = useState<ScanMessage>()
  const locations = flow.locationsOf(count)
  const draft = flow.draftOf(count.no)
  const allCounted = locations.every((l) => l.counted === l.total)

  const candidates = ((): ScanCandidate[] => {
    const open = locations.filter((l) => l.counted < l.total).map((l) => ({ value: l.code }))
    const inCount = new Set(locations.map((l) => l.code))
    const owner = count.skus[0]?.customerId
    const empty = count.containerId
      ? undefined
      : [...new Set(state.locations.filter((l) => l.warehouseCode === warehouse.code).map((l) => l.code))]
      .sort(compareLocation)
      .find(
        (code) =>
          !inCount.has(code) &&
          isWorkLocation(locationUsage(state, warehouse.code, code)) &&
          locationUsage(state, warehouse.code, code) !== 'DEFECT' &&
          !state.inventory.some(
            (r) => r.warehouseCode === warehouse.code && r.locationCode === code && r.onHandQty > 0,
          ) &&
          !(owner && occupiedByOtherOwner(state, warehouse.code, code, owner)),
      )
    return [...open.slice(0, 2), ...(empty ? [{ value: empty, label: t('pdaStocktake.otherLocation') }] : [])]
  })()

  const onScan = (code: string) => {
    const check = flow.checkLocation(code, count)
    if (!check.ok) {
      setMessage({ tone: 'error', text: check.text })
      return false
    }
    setMessage(undefined)
    nav.go('item', { no: count.no, loc: check.code })
    return true
  }

  const resume = () => {
    if (!draft) return
    const subject = flow.draftSubject(count, draft)
    nav.go('count', {
      no: count.no,
      loc: subject.location,
      ...(draft.lineNo !== undefined ? { line: String(draft.lineNo) } : { add: '1' }),
    })
  }

  return (
    <>
      <PdaHeader title={t('pda.count')} onBack={() => nav.back({ step: 'list' })} />
      <StocktakeContext flow={flow} count={count} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {draft && (draft.qty > 0 || draft.serialNos.length > 0) && (
          <PdaCard className="flex flex-col gap-2">
            <div className="text-sm font-medium">
              {t('pdaStocktake.draftTitle', {
                location: flow.draftSubject(count, draft).location,
                sku: flow.draftSubject(count, draft).skuCode,
                qty: draft.qty,
              })}
            </div>
            <div className="flex items-center gap-2">
              <PdaButton variant="outline" className="flex-1" onClick={resume}>
                {t('pdaStocktake.resume')}
              </PdaButton>
              <button
                type="button"
                className="min-h-10 shrink-0 px-2 text-sm font-medium text-destructive"
                onClick={() => void flow.discardDraft(count)}
              >
                {t('pdaStocktake.discardDraft')}
              </button>
            </div>
          </PdaCard>
        )}
        <ScanInput label={t('pdaStocktake.promptLocation')} onScan={onScan} message={message} candidates={candidates} />
        <PdaSection title={t('pdaStocktake.locationList', { count: locations.length })}>
          {locations.map((l) => (
            <PdaCard key={l.code} className="flex min-h-12 items-center gap-3 py-2">
              <PdaLocation code={l.code} usage={flow.usageText(l.code)} className="flex-1" />
              <span className="text-base font-semibold tabular-nums">
                {t('pdaStocktake.progress', { counted: l.counted, total: l.total })}
              </span>
              {l.counted === l.total && <TagLabel tone="green">{t('pdaStocktake.locationDone')}</TagLabel>}
            </PdaCard>
          ))}
        </PdaSection>
      </div>
      {allCounted && (
        <PdaFooter>
          <p className="flex-1 text-sm text-muted-foreground">{t('pdaStocktake.allCounted')}</p>
        </PdaFooter>
      )}
    </>
  )
}
