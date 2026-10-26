import { CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaLocation } from '@/components/pda/pda-stock'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { moveTargetIssue } from '@/lib/inventory-derive'
import { resolveInventoryScan, skuScanValue } from '@/lib/pda-inventory-scan'
import { beep } from '@/lib/scan-beep'
import { useDb } from '@/mock/db'
import type { PdaMoveCurrent } from '@/stores/pda-move-session'
import type { InventoryRecord } from '@/types/wms'
import { MoveContext, MoveRowCard } from './move-shared'
import type { MoveFlow } from './use-move-flow'

/** 数量与目标（PDA移库 PRD）：普通商品默认 1、可调到可移上限，再扫同一商品 +1；SN 商品逐件扫 SN；扫目标库位后加入清单 */
export function MoveTargetStep({ flow }: { flow: MoveFlow }) {
  const { nav, state, draft } = flow
  const src = nav.param('src')
  const inv = nav.param('inv')
  const row = state.inventory.find((r) => r.id === inv)
  const cur = draft?.current
  const valid = Boolean(src && row && cur && cur.inventoryId === inv && row.locationCode === src)

  useEffect(() => {
    if (valid || flow.leaving.current) return
    if (src) nav.replace('item', { src })
    else nav.replace('source')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  if (!valid || !row || !cur) return null
  return <TargetWorkspace key={row.id} flow={flow} row={row} current={cur} />
}

function TargetWorkspace({ flow, row, current }: { flow: MoveFlow; row: InventoryRecord; current: PdaMoveCurrent }) {
  const { t, nav, state } = flow
  const sn = flow.isSn(row)
  const max = flow.movable(row.id)
  const qty = sn ? current.serialNos.length : current.qty
  const [message, setMessage] = useState<ScanMessage>()

  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  const ok = (text: string) => {
    setMessage({ tone: 'success', text })
    return true
  }
  const setCurrent = (patch: Partial<PdaMoveCurrent>) =>
    flow.edit((x) => (x.current ? { ...x, current: { ...x.current, ...patch } } : x))

  const onScan = (code: string) => {
    const s = useDb.getState()
    const live = flow.liveDraft()?.current
    const r = s.inventory.find((x) => x.id === row.id)
    if (!live || !r) return false
    const hits = resolveInventoryScan(s, flow.warehouse.code, code)
    const loc = hits.find((h) => h.kind === 'location')
    if (loc) {
      const issue = moveTargetIssue(s, r, loc.code)
      if (issue) return fail(flow.targetIssueText(issue, loc.code, r))
      setCurrent({ targetLocation: loc.code })
      return ok(t('pdaMove.okTarget', { code: loc.code }))
    }
    const liveMax = flow.movable(r.id)
    const sameSku = hits.some((h) => h.kind === 'sku' && h.customerId === r.customerId && h.skuCode === r.skuCode)
    if (sn) {
      const serial = hits.find((h) => h.kind === 'serial')
      if (serial?.kind === 'serial' && serial.customerId === r.customerId && serial.skuCode === r.skuCode) {
        if (!r.serialNos?.includes(serial.serialNo))
          return fail(t('pdaMove.errSerialNotHere', { sn: serial.serialNo, location: r.locationCode }))
        if (live.serialNos.includes(serial.serialNo) || flow.usedSerials().has(serial.serialNo))
          return fail(t('pdaMove.errSerialRepeat', { sn: serial.serialNo }))
        if (live.serialNos.length + 1 > liveMax) return fail(t('pdaMove.errFull', { max: liveMax }))
        const serialNos = [...live.serialNos, serial.serialNo]
        setCurrent({ serialNos, qty: serialNos.length })
        return ok(t('pdaMove.okSerial', { sn: serial.serialNo, count: serialNos.length }))
      }
      if (sameSku) return fail(t('pdaMove.errNeedSerial', { sku: r.skuCode }))
    } else if (sameSku) {
      if (live.qty + 1 > liveMax) return fail(t('pdaMove.errFull', { max: liveMax }))
      setCurrent({ qty: live.qty + 1 })
      return ok(t('pdaMove.okBump', { sku: r.skuCode, count: live.qty + 1, max: liveMax }))
    }
    if (hits.length > 0) return fail(t('pdaMove.errOtherItem', { code: code.trim() }))
    return fail(t('pdaMove.errUnknown', { code: code.trim() }))
  }

  const candidates: ScanCandidate[] = [
    ...(sn
      ? (row.serialNos ?? [])
          .filter((x) => !current.serialNos.includes(x) && !flow.usedSerials().has(x))
          .slice(0, 2)
          .map((value) => ({ value }))
      : []),
    ...(!current.targetLocation
      ? flow.targetCandidates(row).map((value) => ({ value, label: t('pdaMove.targetLabel') }))
      : []),
    ...(!sn && current.targetLocation
      ? [{ value: skuScanValue(state, row.customerId, row.skuCode), label: row.skuCode }]
      : []),
  ]

  return (
    <>
      <PdaHeader title={t('pda.move')} onBack={() => nav.back({ step: 'item', params: { src: row.locationCode } })} />
      <MoveContext flow={flow} source={row.locationCode} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <MoveRowCard flow={flow} row={row} />
        {current.containerId && (
          <PdaCard className="text-sm text-muted-foreground">
            {t('inventory.containerNo')}: {current.containerId.split('::').at(-1)} · {t('pdaMove.containerHint')}
          </PdaCard>
        )}
        {row.containerId && current.containerId && (
          <PdaButton
            variant="outline"
            onClick={() => setCurrent({ containerId: undefined, asLoose: true, qty: 1, serialNos: [] })}
          >
            {t('pdaMove.asLoose')}
          </PdaButton>
        )}
        {row.containerId && current.asLoose && (
          <PdaCard className="text-sm text-muted-foreground">{t('pdaMove.looseHint')}</PdaCard>
        )}
        {flow.pending(row) && <p className="text-sm text-muted-foreground">{t('pdaMove.pendingHint')}</p>}
        <PdaCard className="flex min-h-14 items-center gap-3">
          {current.targetLocation ? (
            <>
              <CircleCheck className="size-6 shrink-0 text-success-text" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted-foreground">{t('pdaMove.targetLabel')}</div>
                <PdaLocation code={current.targetLocation} usage={flow.locationUsageText(current.targetLocation)} />
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{t('pdaMove.noTarget')}</span>
          )}
        </PdaCard>
        <ScanInput
          label={
            sn && qty === 0
              ? t('pdaMove.promptSerial')
              : current.targetLocation
                ? t('pdaMove.promptTargetSet')
                : t('pdaMove.promptTarget')
          }
          onScan={onScan}
          message={message}
          candidates={candidates}
        />
        {sn && current.serialNos.length > 0 && (
          <PdaCard className="flex items-start gap-3">
            <div className="min-w-0 flex-1 font-mono text-sm break-all text-primary">
              {current.serialNos.join(', ')}
            </div>
            <button
              type="button"
              className="min-h-10 shrink-0 px-1 text-sm font-medium text-destructive"
              onClick={() => setCurrent({ serialNos: [], qty: 0 })}
            >
              {t('pdaMove.clearSerials')}
            </button>
          </PdaCard>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            className="min-h-10 px-1 text-sm font-medium text-destructive"
            onClick={() => void flow.reportMismatch(row)}
          >
            {t('pdaMove.mismatch')}
          </button>
        </div>
      </div>
      <PdaFooter
        hint={sn && qty === 0 ? t('pdaMove.hintSerial') : !current.targetLocation ? t('pdaMove.hintTarget') : undefined}
      >
        {!sn && (!current.containerId || current.asLoose) && (
          <QtyStepper
            hideLabel
            label={t('pdaMove.qtyLabel')}
            value={current.qty}
            max={max}
            onChange={(v) => {
              setCurrent({ qty: v })
              return true
            }}
            onScanText={(code) => beep(onScan(code))}
          />
        )}
        <PdaButton className="flex-1" disabled={!current.targetLocation || qty <= 0} onClick={() => flow.addLine(row)}>
          {t('pdaMove.addLine')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
