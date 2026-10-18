import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { useDb } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { OutboundOrder, OutboundType } from '@/types/outbound'
import { codeNameText } from '@/lib/typography'
import { outboundTypes, parseSerials } from './outbound-helpers'
import { useOutboundRun } from './use-outbound-action'

export function OutboundMockDialog({
  mode,
  order,
  onClose,
  onCreated,
}: {
  mode: 'CREATE' | 'MANUAL' | 'CHANGE' | 'CANCEL'
  order?: OutboundOrder
  onClose: () => void
  /** 新建或手工创建成功后的新单号（列表据此跳详情） */
  onCreated?: (no: string) => void
}) {
  const { t } = useTranslation()
  const db = useDb()
  const currentWarehouse = useSettings((s) => s.warehouseCode)
  const [warehouse, setWarehouse] = useState(order?.warehouseCode ?? currentWarehouse)
  const [owner, setOwner] = useState(order?.customerId ?? 'C10028')
  const [type, setType] = useState<OutboundType>(mode === 'MANUAL' ? 'OTHER' : (order?.type ?? 'B2C'))
  const [upstream, setUpstream] = useState(() => order?.upstreamNo ?? `OMS-OUT-${Date.now()}`)
  const [messageId, setMessageId] = useState(() => `MSG-${crypto.randomUUID().slice(0, 12)}`)
  const [version, setVersion] = useState(order ? order.version : 0)
  const [recipient, setRecipient] = useState(order?.recipient ?? '')
  const [address, setAddress] = useState(order?.address ?? '')
  const [phone, setPhone] = useState(order?.phone ?? '')
  const [email, setEmail] = useState('')
  const [remark, setRemark] = useState(order?.remark ?? '')
  const [cancelReason, setCancelReason] = useState('')
  const [original, setOriginal] = useState(order?.originalInboundNo ?? '')
  const [channel, setChannel] = useState(order?.channelCode ?? '')
  const [lines, setLines] = useState(
    order?.items.map((i) => ({ skuCode: i.skuCode, qty: i.demandQty, inventoryId: '', sns: '' })) ?? [
      { skuCode: 'CABLE-01', qty: 3, inventoryId: '', sns: '' },
    ],
  )
  const run = useOutboundRun()
  const update = (idx: number, patch: Partial<(typeof lines)[number]>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  const submit = () => {
    const items = lines.map((l) => ({ skuCode: l.skuCode, qty: l.qty }))
    const result =
      mode === 'CANCEL' && order
        ? run({ type: 'CANCEL', no: order.no, messageId, version, reason: cancelReason }, () =>
            t('outbound.ui.toastCancelled', { no: order.no }),
          )
        : mode === 'CHANGE' && order
          ? run({ type: 'CHANGE', no: order.no, messageId, version, items }, () => t('outbound.ui.toastChanged'))
          : run({
              type: 'CREATE',
              input: {
                type,
                warehouseCode: warehouse,
                customerId: owner,
                source: mode === 'MANUAL' ? 'MANUAL' : 'OMS',
                upstreamNo: mode === 'MANUAL' ? undefined : upstream,
                messageId,
                version,
                recipient,
                address,
                phone: phone || undefined,
                emailBasis: email,
                remark: remark || undefined,
                originalInboundNo: original,
                channelCode: channel || undefined,
                items,
                specified:
                  type === 'OTHER'
                    ? lines.map((l, i) => ({
                        itemNo: i + 1,
                        inventoryId: l.inventoryId,
                        qty: l.qty,
                        serialNos: parseSerials(l.sns),
                      }))
                    : [],
              },
            }, (no) => t('outbound.ui.toastCreated', { no }))
    if (!result) return
    onClose()
    if ((mode === 'CREATE' || mode === 'MANUAL') && result.no) onCreated?.(result.no)
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t(
              mode === 'MANUAL'
                ? 'outbound.createOther'
                : mode === 'CHANGE'
                  ? 'outbound.change'
                  : mode === 'CANCEL'
                    ? 'outbound.mockCancel'
                    : 'outbound.mock',
            )}
          </DialogTitle>
          <DialogDescription>
            {t('outbound.source')} · {mode === 'MANUAL' ? t('outbound.sources.MANUAL') : t('outbound.sources.OMS')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <FormGrid columns={2}>
            <FormField label={t('outbound.warehouse')} required>
              <OptionSelect
                value={warehouse}
                disabled={!!order}
                onValueChange={setWarehouse}
                options={db.warehouses.map((w) => ({ value: w.code, label: `${w.code} · ${t(w.nameKey)}` }))}
              />
            </FormField>
            <FormField label={t('outbound.owner')} required>
              <OptionSelect
                value={owner}
                disabled={!!order}
                onValueChange={(v) => {
                  setOwner(v)
                  setLines([{ skuCode: '', qty: 1, inventoryId: '', sns: '' }])
                }}
                options={db.customerMasters
                  .filter((m) => m.status === 'ENABLED')
                  .map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` }))}
              />
            </FormField>
            <FormField label={t('outbound.typeLabel')} required>
              <OptionSelect
                value={type}
                disabled={mode !== 'CREATE'}
                onValueChange={(v) => setType(v as OutboundType)}
                options={outboundTypes.map((v) => ({ value: v, label: t(`outbound.type.${v}`) }))}
              />
            </FormField>
            {mode !== 'MANUAL' && (
              <>
                <FormField label={t('outbound.upstream')} required>
                  <Input
                    value={upstream}
                    readOnly={!!order}
                    onChange={(e) => setUpstream(e.target.value)}
                    placeholder={order ? undefined : t('common.inputPlaceholder')}
                  />
                </FormField>
                <FormField label={t('outbound.messageId')} required>
                  <Input
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    placeholder={t('common.inputPlaceholder')}
                  />
                </FormField>
                <FormField label={t('outbound.version')} required>
                  <Input type="number" value={version} onChange={(e) => setVersion(Number(e.target.value))} />
                </FormField>
              </>
            )}
            {mode === 'MANUAL' && (
              <FormField label={t('outbound.ui.emailBasis')} required className="col-span-2">
                <Textarea
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('common.inputPlaceholder')}
                />
              </FormField>
            )}
            {mode === 'CREATE' && (
              <>
                <FormField label={t('outbound.ui.recipient')} required>
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={t('common.inputPlaceholder')}
                  />
                </FormField>
                <FormField label={t('outbound.address')} required>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t('common.inputPlaceholder')}
                  />
                </FormField>
                <FormField label={t('outbound.phone')}>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('common.inputPlaceholder')}
                  />
                </FormField>
                <FormField label={t('outbound.channel')}>
                  <OptionSelect
                    value={channel}
                    onValueChange={setChannel}
                    options={db.channelMasters
                      .filter((ch) => ch.status === 'ENABLED')
                      .map((ch) => ({ value: ch.code, label: codeNameText(ch.code, ch.name) }))}
                  />
                </FormField>
                <FormField label={t('outbound.orderRemark')}>
                  <Input
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder={t('common.inputPlaceholder')}
                  />
                </FormField>
              </>
            )}
            {mode === 'CANCEL' && (
              <FormField label={t('outbound.cancelReason')}>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('common.inputPlaceholder')}
                />
              </FormField>
            )}
            {type === 'PURCHASE_RETURN' && (
              <FormField label={t('outbound.originalInbound')} required>
                <Input
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder={t('common.inputPlaceholder')}
                />
              </FormField>
            )}
          </FormGrid>
          {mode !== 'CANCEL' &&
            lines.map((l, i) => (
            <div key={i} className="rounded-lg border p-3">
              <FormGrid columns={2}>
                <FormField label={t('outbound.sku')} required>
                  <OptionSelect
                    value={l.skuCode}
                    onValueChange={(skuCode) => update(i, { skuCode, inventoryId: '', sns: '' })}
                    options={db.skuMasters
                      .filter((m) => m.customerId === owner && m.status === 'ENABLED')
                      .map((m) => ({ value: m.code, label: `${m.code} · ${m.name}` }))}
                  />
                </FormField>
                <FormField label={t('outbound.qty')} required>
                  <Input
                    aria-label={`${t('outbound.qty')} ${i + 1}`}
                    type="number"
                    value={l.qty}
                    onChange={(e) => update(i, { qty: Number(e.target.value) })}
                  />
                </FormField>
                {type === 'OTHER' && (
                  <>
                    <FormField label={t('outbound.stock')} required>
                      <OptionSelect
                        value={l.inventoryId}
                        onValueChange={(inventoryId) => update(i, { inventoryId })}
                        options={db.inventory
                          .filter(
                            (r) =>
                              r.warehouseCode === warehouse &&
                              r.customerId === owner &&
                              r.skuCode === l.skuCode &&
                              r.qualityType === 'DEFECTIVE' &&
                              r.onHandQty > (r.allocatedQty ?? 0) &&
                              !r.locationCode.startsWith('STAGE'),
                          )
                          .map((r) => ({
                            value: r.id,
                            label: `${r.locationCode} / ${r.batchNo ?? ''} / ${r.onHandQty - (r.allocatedQty ?? 0)}`,
                          }))}
                      />
                    </FormField>
                    <FormField label={t('outbound.serial')}>
                      <Textarea
                        value={l.sns}
                        onChange={(e) => update(i, { sns: e.target.value })}
                        placeholder={t('common.inputPlaceholder')}
                      />
                    </FormField>
                  </>
                )}
              </FormGrid>
              {lines.length > 1 && (
                <Button variant="ghost" onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}>
                  {t('common.remove')}
                </Button>
              )}
            </div>
          ))}
          {mode !== 'CANCEL' && (
            <Button
              variant="outline"
              onClick={() => setLines((prev) => [...prev, { skuCode: '', qty: 1, inventoryId: '', sns: '' }])}
            >
              {t('outbound.addLine')}
            </Button>
          )}
          {mode === 'CANCEL' && <p className="text-sm text-muted-foreground">{t('outbound.cancelNotice')}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>
            {t(
              mode === 'MANUAL'
                ? 'common.confirm'
                : mode === 'CANCEL'
                  ? 'outbound.cancelOrder'
                  : 'outbound.create',
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
