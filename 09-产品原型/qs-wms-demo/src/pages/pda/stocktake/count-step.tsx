import { useState } from 'react'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaChoiceGroup } from '@/components/pda/pda-choice-group'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaFigure, PdaSkuBlock } from '@/components/pda/pda-stock'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { qualityMeta } from '@/config/status'
import { deriveSerials } from '@/lib/inventory-derive'
import { resolveInventoryScan, skuScanValue } from '@/lib/pda-inventory-scan'
import { beep } from '@/lib/scan-beep'
import { useDb } from '@/mock/db'
import type { PdaCountDraft } from '@/stores/pda-stocktake-session'
import type { InventoryCount, StocktakeLine } from '@/types/inventory'
import { StocktakeContext } from './stocktake-shared'
import { useCountSubject } from './use-count-subject'
import type { StocktakeFlow } from './use-stocktake-flow'

/**
 * 录入实盘（PDA盘点 PRD 第一节）：盲盘，不显示账面。普通商品再扫同一商品 +1，件数多时改数；
 * SN 商品逐个扫 SN，实盘数量按 SN 数计。账面外新增的批次商品先填批次和有效期。
 */
export function StocktakeCountStep({ flow }: { flow: StocktakeFlow }) {
  const subject = useCountSubject(flow)
  if (!subject) return null
  return <CountWorkspace flow={flow} {...subject} />
}

function CountWorkspace({
  flow,
  count,
  draft,
  line,
}: {
  flow: StocktakeFlow
  count: InventoryCount
  draft: PdaCountDraft
  line?: StocktakeLine
}) {
  const { t, nav, state, warehouse } = flow
  const subject = line ?? draft.add!
  const sn = flow.isSn(subject)
  const needBatch = !line && flow.needsBatch(subject)
  const needExpiry = !line && flow.needsExpiry(subject)
  const qty = sn ? draft.serialNos.length : draft.qty
  const [message, setMessage] = useState<ScanMessage>()

  const update = (patch: Partial<PdaCountDraft>) => {
    const d = flow.liveDraftOf(count.no)
    if (d) flow.setDraft(count.no, { ...d, ...patch })
  }
  const updateAdd = (patch: Partial<NonNullable<PdaCountDraft['add']>>) => {
    const d = flow.liveDraftOf(count.no)
    if (d?.add) flow.setDraft(count.no, { ...d, add: { ...d.add, ...patch } })
  }
  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  const ok = (text: string) => {
    setMessage({ tone: 'success', text })
    return true
  }

  const onScan = (code: string) => {
    const d = flow.liveDraftOf(count.no)
    const live = flow.latestCount(count.no) ?? count
    if (!d) return false
    const hits = resolveInventoryScan(useDb.getState(), warehouse.code, code)
    if (hits.some((h) => h.kind === 'location')) return fail(t('pdaStocktake.errSaveFirst'))
    const same = (h: { customerId: string; skuCode: string }) =>
      h.customerId === subject.customerId && h.skuCode === subject.skuCode
    const sameSku = hits.some((h) => h.kind === 'sku' && same(h))
    if (sn) {
      const serial = hits.find((h) => h.kind === 'serial' && same(h))
      if (serial?.kind === 'serial') {
        const no = serial.serialNo
        if (serial.warehouseCode !== warehouse.code)
          return fail(t('pdaStocktake.errSerialOtherWarehouse', { sn: no, warehouse: serial.warehouseCode }))
        if (d.serialNos.includes(no)) return fail(t('pdaStocktake.errSerialRepeat', { sn: no }))
        const other = flow.countedIn(live, subject, no, line ? { lineNo: line.lineNo } : undefined)
        if (other) return fail(t('pdaStocktake.errSerialCounted', { sn: no, location: other.locationCode }))
        const serialNos = [...d.serialNos, no]
        update({ serialNos, qty: serialNos.length })
        return ok(t('pdaStocktake.okSerial', { sn: no, count: serialNos.length }))
      }
      if (sameSku) return fail(t('pdaStocktake.errNeedSerial', { sku: subject.skuCode }))
    } else if (sameSku) {
      update({ qty: d.qty + 1 })
      return ok(t('pdaStocktake.okBump', { sku: subject.skuCode, count: d.qty + 1 }))
    }
    if (hits.length > 0) return fail(t('pdaStocktake.errOtherItem', { sku: subject.skuCode }))
    return fail(t('pdaStocktake.errUnknownItem', { code: code.trim() }))
  }

  /** 新增批次行的批次候选：本仓这个商品已有的批次 */
  const batches = needBatch
    ? [
        ...new Map(
          state.inventory
            .filter(
              (r) =>
                r.warehouseCode === warehouse.code &&
                r.customerId === subject.customerId &&
                r.skuCode === subject.skuCode &&
                r.batchNo,
            )
            .map((r) => [r.batchNo!, { batchNo: r.batchNo!, expiryDate: r.expiryDate }]),
        ).values(),
      ].slice(0, 4)
    : []

  const candidates: ScanCandidate[] = sn
    ? deriveSerials(state, warehouse.code)
        .filter(
          (r) =>
            r.customerId === subject.customerId &&
            r.skuCode === subject.skuCode &&
            r.status === 'IN_STOCK' &&
            !draft.serialNos.includes(r.serialNo),
        )
        .sort(
          (a, b) => Number(b.locationCode === subject.locationCode) - Number(a.locationCode === subject.locationCode),
        )
        .slice(0, 3)
        .map((r) => ({
          value: r.serialNo,
          label: r.locationCode === subject.locationCode ? undefined : r.locationCode,
        }))
    : [{ value: skuScanValue(state, subject.customerId, subject.skuCode), label: subject.skuCode }]

  const blocked = !line && qty <= 0
  const batchMissing = needBatch && (!draft.add?.batchNo?.trim() || (needExpiry && !draft.add?.expiryDate))

  return (
    <>
      <PdaHeader
        title={t('pda.count')}
        onBack={() => nav.back({ step: 'item', params: { no: count.no, loc: subject.locationCode } })}
      />
      <StocktakeContext flow={flow} count={count} location={subject.locationCode} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard>
          <div className="flex items-start gap-3">
            <PdaSkuBlock
              className="flex-1"
              skuCode={subject.skuCode}
              name={flow.skuName(subject.skuCode)}
              owner={flow.ownerCode(subject.customerId)}
              batch={line ? flow.lineBatch(line) : undefined}
              tags={
                <>
                  <TagLabel meta={qualityMeta[subject.qualityType]} />
                  {!line && <TagLabel tone="orange">{t('inventory.stocktake.added')}</TagLabel>}
                </>
              }
            />
            <PdaFigure
              label={t('pdaStocktake.countedLabel')}
              value={<span className="text-primary">{qty}</span>}
              className="shrink-0 text-right"
            />
          </div>
        </PdaCard>
        {needBatch && (
          <PdaCard className="flex flex-col gap-2">
            {batches.length > 0 && (
              <PdaChoiceGroup
                columns={2}
                value={batches.find((b) => b.batchNo === draft.add?.batchNo)?.batchNo}
                onChange={(v) => {
                  const b = batches.find((x) => x.batchNo === v)
                  if (b) updateAdd({ batchNo: b.batchNo, expiryDate: b.expiryDate })
                }}
                options={batches.map((b) => ({ value: b.batchNo, label: b.batchNo }))}
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="pda-count-batch">{t('inventory.batchNo')}</Label>
                <Input
                  id="pda-count-batch"
                  className="h-12 font-mono"
                  value={draft.add?.batchNo ?? ''}
                  placeholder={t('common.inputPlaceholder')}
                  onChange={(e) => updateAdd({ batchNo: e.target.value.toUpperCase() })}
                />
              </div>
              {needExpiry && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="pda-count-expiry">{t('inventory.expiryDate')}</Label>
                  <Input
                    id="pda-count-expiry"
                    type="date"
                    className="h-12"
                    value={draft.add?.expiryDate ?? ''}
                    onChange={(e) => updateAdd({ expiryDate: e.target.value || undefined })}
                  />
                </div>
              )}
            </div>
          </PdaCard>
        )}
        <ScanInput
          label={sn ? t('pdaStocktake.promptSerial') : t('pdaStocktake.promptCount')}
          onScan={onScan}
          message={message}
          candidates={candidates}
        />
        {sn && draft.serialNos.length > 0 && (
          <PdaCard className="flex items-start gap-3">
            <div className="min-w-0 flex-1 font-mono text-sm break-all text-primary">{draft.serialNos.join(', ')}</div>
            <button
              type="button"
              className="min-h-10 shrink-0 px-1 text-sm font-medium text-destructive"
              onClick={() => update({ serialNos: [], qty: 0 })}
            >
              {t('pdaStocktake.clearSerials')}
            </button>
          </PdaCard>
        )}
      </div>
      <PdaFooter
        hint={
          batchMissing
            ? t('pdaStocktake.hintBatch')
            : blocked
              ? t('pdaStocktake.hintNewLineQty')
              : t('pdaStocktake.hintCount')
        }
      >
        {!sn && (
          <QtyStepper
            hideLabel
            label={t('pdaStocktake.countedLabel')}
            value={draft.qty}
            onChange={(v) => {
              update({ qty: v })
              return true
            }}
            onScanText={(code) => beep(onScan(code))}
          />
        )}
        <PdaButton
          className="flex-1"
          disabled={blocked || batchMissing}
          onClick={() =>
            nav.go('review', {
              no: count.no,
              loc: subject.locationCode,
              ...(line ? { line: String(line.lineNo) } : { add: '1' }),
            })
          }
        >
          {t('pdaStocktake.next')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
