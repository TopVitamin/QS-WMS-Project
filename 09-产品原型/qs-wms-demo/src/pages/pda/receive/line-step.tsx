import { useEffect, useRef, useState } from 'react'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaChoiceGroup } from '@/components/pda/pda-choice-group'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { beep } from '@/lib/scan-beep'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import {
  applyReceiveDraftChange,
  defaultReceiveDraft,
  emptyReceiveDraft,
  REJECT_REASONS,
  validateInboundReceiveDraft,
  type InboundReceiveDraft,
  type ReceiveQtyField,
  type RejectReason,
} from '@/lib/inbound-receive'
import type { InboundOrderLine } from '@/types/wms'
import type { ReceiveSessionBox } from '@/stores/pda-receive-session'
import { ReceiveContext } from './receive-shared'
import type { ReceiveFlow } from './use-receive-flow'

/** 本行录入（PDA 收货 PRD §4）：良品、不良品、拒收一屏录入；再扫同一商品良品 +1 */
export function ReceiveLineStep({ flow }: { flow: ReceiveFlow }) {
  const { nav, session, order, orderReceivable } = flow
  const boxKey = nav.param('box')
  const skuCode = nav.param('sku')
  const entry = nav.param('entry') === 'scan' ? 'scan' : 'pick'
  const box = session.boxes.find((b) => b.key === boxKey)
  const item = order?.items.find((i) => i.skuCode === skuCode)

  useEffect(() => {
    if (!order || !orderReceivable) nav.replace('order')
    else if (!box) nav.replace('container')
    else if (!item) nav.replace('box', { box: box.key })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.inboundNo, orderReceivable, box?.key, item?.skuCode])

  if (!order || !box || !item) return null
  return <LineEditor key={`${box.key}|${item.skuCode}|${entry}`} flow={flow} box={box} item={item} entry={entry} />
}

function initialDraft(saved: InboundReceiveDraft | undefined, entry: 'scan' | 'pick', limit: number) {
  if (entry === 'pick') return { draft: saved ?? defaultReceiveDraft(limit), full: false }
  const base = saved ?? emptyReceiveDraft()
  const next = applyReceiveDraftChange(base, 'goodQty', base.goodQty + 1, limit)
  return next.ok ? { draft: next.draft, full: false } : { draft: base, full: true }
}

function LineEditor({
  flow,
  box,
  item,
  entry,
}: {
  flow: ReceiveFlow
  box: ReceiveSessionBox
  item: InboundOrderLine
  entry: 'scan' | 'pick'
}) {
  const { t, nav, session } = flow
  const limit = flow.thisRemain(item.skuCode, box.key)
  const saved = box.lines.find((l) => l.skuCode === item.skuCode)
  const [init] = useState(() => initialDraft(saved, entry, limit))
  const [draft, setDraft] = useState<InboundReceiveDraft>(init.draft)
  const reasonsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (init.full) flow.failScan(t('pdaReceive.fullThisTime', { sku: item.skuCode }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasReject = draft.rejectedQty > 0
  useEffect(() => {
    if (hasReject) reasonsRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [hasReject])

  const total = draft.goodQty + draft.defectQty + draft.rejectedQty
  const spare = Math.max(0, limit - total)
  const change = (field: ReceiveQtyField) => (value: number) => {
    const res = applyReceiveDraftChange(draft, field, value, limit)
    if (!res.ok) return false
    setDraft(res.draft)
    return true
  }

  /** 页面级扫码与数量框收到的扫码内容：同一商品良品 +1，其他商品先加入本容器 */
  const onScan = (code: string) => {
    const hit = flow.resolveSku(code)
    if (hit !== item.skuCode) {
      flow.failScan(hit ? t('pdaReceive.scanNextFirst') : t('pda.notInOrder'))
      return
    }
    const res = applyReceiveDraftChange(draft, 'goodQty', draft.goodQty + 1, limit)
    if (!res.ok) {
      flow.failScan(t('pdaReceive.fullThisTime', { sku: item.skuCode }))
      return
    }
    beep(true)
    setDraft(res.draft)
  }
  usePdaScanListener(onScan)

  const blocker =
    total <= 0 ? t('pdaReceive.needQty') : hasReject && !draft.rejectReason ? t('pdaReceive.needReason') : undefined

  const save = () => {
    const err = validateInboundReceiveDraft({ ...draft, receivedQty: draft.goodQty + draft.defectQty }, limit)
    if (err) {
      flow.failScan(t(err))
      return
    }
    session.upsertLine(box.key, { ...draft, receivedQty: draft.goodQty + draft.defectQty, skuCode: item.skuCode })
    beep(true)
    nav.returnTo('box', { box: box.key })
  }

  const remove = async () => {
    const ok = await flow.confirm({
      title: t('pdaReceive.removeLineTitle', { sku: item.skuCode, box: flow.boxLabel(box) }),
      confirmText: t('pdaReceive.removeLine'),
      variant: 'destructive',
    })
    if (!ok) return
    session.removeLine(box.key, item.skuCode)
    nav.returnTo('box', { box: box.key })
  }

  return (
    <>
      <PdaHeader title={t('pda.receive')} onBack={() => nav.back({ step: 'box', params: { box: box.key } })} />
      <ReceiveContext flow={flow} box={box} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard>
          <div className="flex items-start justify-between gap-2">
            <div className="font-mono text-xl font-bold">{item.skuCode}</div>
            {saved && (
              <button type="button" onClick={remove} className="min-h-8 px-1 text-sm text-destructive">
                {t('pdaReceive.removeLine')}
              </button>
            )}
          </div>
          <div className="line-clamp-2 text-base">{flow.sku(item.skuCode)?.name}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t('pdaReceive.planned', { planned: item.plannedQty, received: item.receivedQty })}{' '}
            <b className="text-base text-primary tabular-nums">{limit}</b>
          </div>
        </PdaCard>

        <PdaCard className="flex flex-col gap-2">
          <QtyStepper
            label={t('pdaReceive.good')}
            value={draft.goodQty}
            max={Math.max(0, limit - draft.defectQty - draft.rejectedQty)}
            onChange={change('goodQty')}
            onScanText={onScan}
          />
          <QtyStepper
            label={t('pdaReceive.defect')}
            value={draft.defectQty}
            max={draft.defectQty + draft.goodQty + spare}
            onChange={change('defectQty')}
            onScanText={onScan}
            tone="danger"
          />
          <QtyStepper
            label={t('pdaReceive.rejected')}
            value={draft.rejectedQty}
            max={draft.rejectedQty + draft.goodQty + spare}
            onChange={change('rejectedQty')}
            onScanText={onScan}
          />
        </PdaCard>

        {hasReject && (
          <div ref={reasonsRef} className="flex flex-col gap-2">
            <div className="text-sm font-medium">{t('inbound.receive.rejectReasonLabel')}</div>
            <PdaChoiceGroup<RejectReason>
              options={REJECT_REASONS.map((r) => ({ value: r, label: t(`inbound.receive.rejectReason.${r}`) }))}
              value={draft.rejectReason as RejectReason | undefined}
              onChange={(v) => setDraft({ ...draft, rejectReason: v })}
            />
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-x-3 text-sm text-muted-foreground">
          <span className="tabular-nums">{t('pdaReceive.total', { total, limit })}</span>
          <span>{t('pdaReceive.scanToCount')}</span>
        </div>
      </div>
      <PdaFooter hint={blocker}>
        <PdaButton variant="outline" className="w-24" onClick={() => nav.returnTo('box', { box: box.key })}>
          {t('common.back')}
        </PdaButton>
        <PdaButton className="flex-1" disabled={!!blocker} onClick={save}>
          {saved ? t('pdaReceive.saveLine') : t('pdaReceive.addToBox')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
