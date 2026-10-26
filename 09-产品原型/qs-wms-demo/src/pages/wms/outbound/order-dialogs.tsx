import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { MockPhotoField } from '@/components/biz/mock-photo-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Num } from '@/components/biz/display'
import { localInputToUtc, toLocalInput } from '@/lib/format'
import { activeAssignments, shipCheck, type ShipProblem } from '@/lib/outbound-derive'
import { codeNameText } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { useDb } from '@/mock/db'
import { useDisplayTimezone } from '@/stores/settings'
import type { OutboundHandover, OutboundHandoverInput, OutboundOrder } from '@/types/outbound'
import { parseSerials } from './outbound-helpers'
import { useOutboundRun } from './use-outbound-action'

/**
 * 出库单详情的弹窗（出库单前端Demo版PRD·弹窗与Mock §2～§5）：
 * 确认出库、补登交接、退拣、补包裹信息。失败 toast 原因并保持打开。
 */

function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} className="flex h-8 flex-wrap items-center gap-4">
      {options.map((o) => (
        <Label key={o.value} className="flex items-center gap-1.5 font-normal">
          <RadioGroupItem value={o.value} />
          {o.label}
        </Label>
      ))}
    </RadioGroup>
  )
}

type HandoverDraft = {
  method: OutboundHandover['method']
  party: string
  channelCode: string
  credential: string
  containerQty: string
  localTime: string
  remark: string
  attachments: string[]
}

function useHandoverDraft(order: OutboundOrder) {
  const tz = useDisplayTimezone()
  const verifications = useDb((s) => s.outboundVerifications)
  const containers = new Set(
    verifications
      .filter((v) => v.orderNo === order.no && !v.deleted && v.containerType !== 'NONE' && v.containerNo)
      .map((v) => v.containerNo),
  ).size
  return useState<HandoverDraft>(() => ({
    method: 'CARRIER',
    party: '',
    channelCode: order.channelCode ?? '',
    credential: '',
    containerQty: String(containers || 1),
    localTime: toLocalInput(new Date().toISOString(), tz),
    remark: '',
    attachments: [],
  }))
}

/** 交接字段：确认出库与补登共用，校验一致 */
function HandoverFields({
  draft,
  onChange,
  showErrors,
}: {
  draft: HandoverDraft
  onChange: (d: HandoverDraft) => void
  showErrors: boolean
}) {
  const { t } = useTranslation()
  const channels = useDb((s) => s.channelMasters)
  const errors = handoverErrors(draft, t)
  return (
    <FormGrid columns={2}>
      <FormField label={t('outbound.ui.handoverMethod')} required>
        <Choice
          value={draft.method}
          onChange={(method) => onChange({ ...draft, method })}
          options={(['CARRIER', 'DRIVER', 'PICKUP'] as const).map((v) => ({
            value: v,
            label: t(`outbound.handoverMethods.${v}`),
          }))}
        />
      </FormField>
      <FormField label={t('outbound.ui.party')} required error={showErrors ? errors.party : undefined}>
        <Input
          value={draft.party}
          placeholder={t('common.inputPlaceholder')}
          onChange={(e) => onChange({ ...draft, party: e.target.value })}
        />
      </FormField>
      <FormField label={t('outbound.ui.channel')}>
        <OptionSelect
          value={draft.channelCode || undefined}
          placeholder={t('common.selectPlaceholder')}
          onValueChange={(channelCode) => onChange({ ...draft, channelCode })}
          options={channels
            .filter((ch) => ch.status === 'ENABLED')
            .map((ch) => ({ value: ch.code, label: codeNameText(ch.code, ch.name) }))}
        />
      </FormField>
      <FormField label={t('outbound.ui.credential')}>
        <Input
          value={draft.credential}
          placeholder={t('common.inputPlaceholder')}
          onChange={(e) => onChange({ ...draft, credential: e.target.value })}
        />
      </FormField>
      <FormField label={t('outbound.ui.containerQty')} required error={showErrors ? errors.containerQty : undefined}>
        <Input
          type="number"
          min={1}
          step={1}
          value={draft.containerQty}
          onChange={(e) => onChange({ ...draft, containerQty: e.target.value })}
        />
      </FormField>
      <FormField label={t('outbound.ui.handoverTime')} required error={showErrors ? errors.localTime : undefined}>
        <Input
          type="datetime-local"
          value={draft.localTime}
          onChange={(e) => onChange({ ...draft, localTime: e.target.value })}
        />
      </FormField>
      <FormField label={t('outbound.ui.handoverRemark')} span="full">
        <Textarea
          rows={2}
          value={draft.remark}
          placeholder={t('common.inputPlaceholder')}
          onChange={(e) => onChange({ ...draft, remark: e.target.value })}
        />
      </FormField>
      <FormField label={t('outbound.ui.attachments')} span="full">
        <MockPhotoField value={draft.attachments} onChange={(attachments) => onChange({ ...draft, attachments })} />
      </FormField>
    </FormGrid>
  )
}

type Translate = (k: string, o?: Record<string, unknown>) => string
function handoverErrors(d: HandoverDraft, t: Translate) {
  const qty = Number(d.containerQty)
  return {
    party: d.party.trim() ? undefined : t('outbound.ui.required', { field: t('outbound.ui.party') }),
    containerQty:
      Number.isInteger(qty) && qty > 0 ? undefined : t('outbound.ui.positiveInt', { field: t('outbound.ui.containerQty') }),
    localTime: d.localTime ? undefined : t('outbound.ui.required', { field: t('outbound.ui.handoverTime') }),
  }
}
function toHandoverInput(d: HandoverDraft, tz: string): OutboundHandoverInput {
  return {
    method: d.method,
    party: d.party.trim(),
    channelCode: d.channelCode || undefined,
    credential: d.credential.trim(),
    containerQty: Number(d.containerQty),
    at: localInputToUtc(d.localTime, tz),
    remark: d.remark.trim() || undefined,
    attachments: d.attachments,
  }
}

function problemText(p: ShipProblem, t: Translate) {
  switch (p.key) {
    case 'openTask':
      return t('outbound.ui.problemOpenTask')
    case 'unverified':
      return t('outbound.ui.problemUnverified', { picked: p.picked, verified: p.verified })
    case 'short':
      return t('outbound.ui.problemShort', { count: p.count })
    case 'package':
      return t('outbound.ui.problemPackage')
    case 'fbaContainer':
      return t('outbound.ui.problemFbaContainer')
  }
}

/** 确认出库（F08）：逐行展示检查结果，不满足时不能提交；可同时登记交接 */
export function ShipDialog({ order, onClose }: { order: OutboundOrder; onClose: () => void }) {
  const { t } = useTranslation()
  const tz = useDisplayTimezone()
  const tasks = useDb((s) => s.outboundPickTasks)
  const verifications = useDb((s) => s.outboundVerifications)
  const results = useDb((s) => s.outboundResults)
  const containers = useDb((s) => s.containers)
  const inventory = useDb((s) => s.inventory)
  const skuMasters = useDb((s) => s.skuMasters)
  const run = useOutboundRun()
  const check = shipCheck(order, {
    outboundPickTasks: tasks,
    outboundVerifications: verifications,
    outboundResults: results,
    containers,
    inventory,
    skuMasters,
  })
  const [withHandover, setWithHandover] = useState(false)
  const [handover, setHandover] = useHandoverDraft(order)
  const [showErrors, setShowErrors] = useState(false)
  const firstProblem =
    check.orderProblem ?? check.lines.find((l) => l.problem)?.problem ?? (check.shipTotal > 0 ? undefined : null)

  const submit = () => {
    if (withHandover && Object.values(handoverErrors(handover, t)).some(Boolean)) {
      setShowErrors(true)
      return
    }
    const r = run(
      { type: 'SHIP', no: order.no, handover: withHandover ? toHandoverInput(handover, tz) : undefined },
      () => t('outbound.ui.toastShipped', { no: order.no, count: check.shipTotal }),
    )
    if (r) onClose()
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('outbound.ui.shipTitle', { no: order.no })}</DialogTitle>
          <DialogDescription>{t('outbound.ui.shipDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <section className="rounded-lg border">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">{t('outbound.ui.shipCheck')}</div>
            <ul className="divide-y text-sm">
              {check.lines.map((l) => (
                <li key={l.lineNo} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                  <span className="min-w-28 font-medium">{l.skuCode}</span>
                  <span className="text-muted-foreground">
                    {t('outbound.ui.demand')} <Num value={l.demand} />
                  </span>
                  <span className="text-muted-foreground">
                    {t('outbound.ui.picked')} <Num value={l.picked} />
                  </span>
                  <span className="text-muted-foreground">
                    {t('outbound.ui.verified')} <Num value={l.verified} />
                  </span>
                  <span>
                    {t('outbound.ui.shipped')} <Num value={l.shipQty} />
                  </span>
                  <span>
                    {t('outbound.ui.unshipped')} <Num value={l.unshipped} />
                  </span>
                  <span
                    className={cn(
                      'ml-auto text-xs',
                      l.problem ? 'text-destructive' : l.unshipped > 0 ? 'text-warning-text' : 'text-success-text',
                    )}
                  >
                    {l.problem
                      ? problemText(l.problem, t)
                      : l.unshipped > 0
                        ? t('outbound.ui.shipShortAllowed')
                        : t('outbound.ui.shipOk')}
                  </span>
                </li>
              ))}
            </ul>
            {check.orderProblem && (
              <p className="border-t px-3 py-2 text-xs text-destructive">{problemText(check.orderProblem, t)}</p>
            )}
          </section>

          <Label className="flex items-center gap-2 font-normal">
            <Checkbox checked={withHandover} onCheckedChange={(v) => setWithHandover(!!v)} />
            {t('outbound.ui.withHandover')}
          </Label>
          {withHandover && <HandoverFields draft={handover} onChange={setHandover} showErrors={showErrors} />}
        </div>
        <DialogFooter className="items-center">
          {firstProblem !== undefined && (
            <span className="mr-auto text-xs text-destructive">
              {firstProblem ? problemText(firstProblem, t) : t('outbound.ui.problemNone')}
            </span>
          )}
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!check.ok} onClick={submit}>
            {t('outbound.ui.shipSubmit', { count: check.shipTotal })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 补登交接（已出库）：不再扣库 */
export function HandoverDialog({ order, onClose }: { order: OutboundOrder; onClose: () => void }) {
  const { t } = useTranslation()
  const tz = useDisplayTimezone()
  const run = useOutboundRun()
  const [draft, setDraft] = useHandoverDraft(order)
  const [showErrors, setShowErrors] = useState(false)
  const submit = () => {
    if (Object.values(handoverErrors(draft, t)).some(Boolean)) {
      setShowErrors(true)
      return
    }
    const r = run({ type: 'HANDOVER', no: order.no, ...toHandoverInput(draft, tz) }, () => t('outbound.ui.toastHandover'))
    if (r) onClose()
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('outbound.ui.handoverTitle', { no: order.no })}</DialogTitle>
        </DialogHeader>
        <HandoverFields draft={draft} onChange={setDraft} showErrors={showErrors} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('outbound.ui.register')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 退拣（F07）：选有效实拣归属、原因、数量与 SN */
export function UnpickDialog({ order, onClose }: { order: OutboundOrder; onClose: () => void }) {
  const { t } = useTranslation()
  const tasks = useDb((s) => s.outboundPickTasks)
  const skuMasters = useDb((s) => s.skuMasters)
  const run = useOutboundRun()
  const assignments = activeAssignments({ outboundPickTasks: tasks }, order.no)
  const [assignmentId, setAssignmentId] = useState(assignments.length === 1 ? assignments[0].id : '')
  const [reason, setReason] = useState<'MISSING' | 'DAMAGED'>('MISSING')
  const [qty, setQty] = useState('1')
  const [serials, setSerials] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const current = assignments.find((a) => a.id === assignmentId)
  const snEnabled = !!current && !!skuMasters.find((m) => m.customerId === order.customerId && m.code === current.line.skuCode)?.snEnabled
  const n = Number(qty)
  const errors = {
    assignment: current ? undefined : t('outbound.ui.required', { field: t('outbound.ui.assignments') }),
    qty: !Number.isInteger(n) || n <= 0
      ? t('outbound.ui.positiveInt', { field: t('outbound.ui.unpickQty') })
      : current && n > current.activeQty
        ? t('outbound.ui.overMax', { field: t('outbound.ui.unpickQty'), count: current.activeQty })
        : undefined,
    serial: snEnabled && parseSerials(serials).length !== n ? t('outbound.ui.serialCount') : undefined,
  }
  const submit = () => {
    if (Object.values(errors).some(Boolean) || !current) {
      setShowErrors(true)
      return
    }
    const r = run(
      { type: 'UNPICK', no: order.no, assignmentId: current.id, qty: n, serialNos: parseSerials(serials), reason },
      (no) => t('outbound.ui.toastUnpicked', { count: n, no }),
    )
    if (r) onClose()
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('outbound.ui.unpickTitle', { no: order.no })}</DialogTitle>
        </DialogHeader>
        <FormGrid columns={2}>
          <FormField label={t('outbound.ui.assignments')} required span="full" error={showErrors ? errors.assignment : undefined}>
            <OptionSelect
              value={assignmentId || undefined}
              placeholder={t('common.selectPlaceholder')}
              onValueChange={setAssignmentId}
              options={assignments.map((a) => ({
                value: a.id,
                label: [a.line.skuCode, a.line.batchNo, a.line.locationCode, `${t('outbound.ui.activeQty')} ${a.activeQty}`]
                  .filter(Boolean)
                  .join(' · '),
              }))}
            />
          </FormField>
          <FormField
            label={t('outbound.ui.reason')}
            required
            hint={reason === 'MISSING' ? t('outbound.ui.unpickMissingHint') : t('outbound.ui.unpickDamagedHint')}
          >
            <Choice
              value={reason}
              onChange={setReason}
              options={(['MISSING', 'DAMAGED'] as const).map((v) => ({ value: v, label: t(`outbound.unpickReasons.${v}`) }))}
            />
          </FormField>
          <FormField
            label={t('outbound.ui.unpickQty')}
            required
            hint={current ? t('outbound.ui.qtyMax', { count: current.activeQty }) : undefined}
            error={showErrors ? errors.qty : undefined}
          >
            <Input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </FormField>
          {snEnabled && (
            <FormField label={t('outbound.ui.serial')} required span="full" error={showErrors ? errors.serial : undefined}>
              <Textarea
                rows={3}
                value={serials}
                placeholder={t('common.inputPlaceholder')}
                onChange={(e) => setSerials(e.target.value)}
              />
            </FormField>
          )}
        </FormGrid>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('outbound.ui.confirmUnpick')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 补包裹信息（B2C 随分拣复核后）：生成 Mock 运单，不增加复核数量 */
export function PackInfoDialog({ verificationNo, onClose }: { verificationNo: string; onClose: () => void }) {
  const { t } = useTranslation()
  const run = useOutboundRun()
  const v = useDb((s) => s.outboundVerifications.find((x) => x.no === verificationNo))
  const [containerNo, setContainerNo] = useState(v?.containerNo || `PKG-${verificationNo}`)
  const [weight, setWeight] = useState(String(v?.weightKg ?? ''))
  const [showErrors, setShowErrors] = useState(false)
  const w = Number(weight)
  const errors = {
    containerNo: containerNo.trim() ? undefined : t('outbound.ui.required', { field: t('outbound.ui.packNo') }),
    weight: Number.isFinite(w) && w > 0 ? undefined : t('outbound.ui.positiveInt', { field: t('outbound.ui.weight') }),
  }
  const submit = () => {
    if (Object.values(errors).some(Boolean)) {
      setShowErrors(true)
      return
    }
    const r = run({ type: 'PACK_VERIFY', no: verificationNo, containerNo: containerNo.trim(), weightKg: w }, () =>
      t('outbound.ui.toastPacked'),
    )
    if (r) onClose()
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('outbound.ui.packTitle', { no: verificationNo })}</DialogTitle>
          <DialogDescription>{t('outbound.ui.packHint')}</DialogDescription>
        </DialogHeader>
        <FormGrid columns={2}>
          <FormField label={t('outbound.ui.packNo')} required error={showErrors ? errors.containerNo : undefined}>
            <Input value={containerNo} onChange={(e) => setContainerNo(e.target.value)} placeholder={t('common.inputPlaceholder')} />
          </FormField>
          <FormField label={t('outbound.ui.weight')} required error={showErrors ? errors.weight : undefined}>
            <Input type="number" min={0.01} step={0.01} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </FormField>
        </FormGrid>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
