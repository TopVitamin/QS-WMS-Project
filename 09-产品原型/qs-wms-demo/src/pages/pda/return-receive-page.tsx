import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaCard, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaContextBar } from '@/components/pda/pda-context-bar'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { parseSerialNos, resolveInboundSkuScan } from '@/lib/inbound-receive'
import { canReceiveReturn, returnLineUnreceived } from '@/lib/return-derive'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'

interface Draft {
  goodQty: number
  defectQty: number
  rejectedQty: number
  batchNo: string
  expiryDate: string
  goodSerialNos: string
  defectSerialNos: string
}

const emptyDraft = (): Draft => ({
  goodQty: 0,
  defectQty: 0,
  rejectedQty: 0,
  batchNo: '',
  expiryDate: '',
  goodSerialNos: '',
  defectSerialNos: '',
})

/** PDA 退货收货：选退货单 → 扫商品 → 录良品/不良/拒收 → 提交 */
export function PdaReturnReceivePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const { confirm } = useConfirm()
  const orders = useDb((s) => s.returnOrders)
  const receiveReturn = useDb((s) => s.receiveReturn)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const masters = useDb((s) => s.skuMasters)
  const { sku, customerCode } = useLookups()
  const [params, setParams] = useSearchParams()
  const returnNo = params.get('no') ?? undefined
  const order = orders.find((o) => o.returnNo === returnNo && o.warehouseCode === warehouse.code)
  const pending = useMemo(
    () => orders.filter((o) => o.warehouseCode === warehouse.code && canReceiveReturn(o)),
    [orders, warehouse.code],
  )
  const [activeSku, setActiveSku] = useState<string>()
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [message, setMessage] = useState<ScanMessage>()
  const [containerNo, setContainerNo] = useState('')

  const draftOf = (code: string) => drafts[code] ?? emptyDraft()
  const setDraft = (code: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [code]: { ...draftOf(code), ...patch } }))

  const submit = async () => {
    if (!order) return
    const lines = Object.entries(drafts)
      .map(([skuCode, d]) => ({
        skuCode,
        goodQty: d.goodQty,
        defectQty: d.defectQty,
        rejectedQty: d.rejectedQty,
        batchNo: d.batchNo || undefined,
        expiryDate: d.expiryDate || undefined,
        goodSerialNos: parseSerialNos(d.goodSerialNos),
        defectSerialNos: parseSerialNos(d.defectSerialNos),
      }))
      .filter((l) => l.goodQty + l.defectQty + l.rejectedQty > 0)
    if (!lines.length) {
      setMessage({ tone: 'error', text: t('return.receive.empty') })
      return
    }
    const ok = await confirm({
      title: t('return.receive.title'),
      description: t('return.receive.hint'),
      confirmText: t('return.receive.submit', { count: lines.length }),
    })
    if (!ok) return
    const result = receiveReturn({ returnNo: order.returnNo, containerNo: containerNo || undefined, lines, operator })
    if (!result.ok) {
      setMessage({ tone: 'error', text: t(result.errorKey, result.params) })
      return
    }
    toast.success(t('return.receive.success', { no: order.returnNo }))
    setDrafts({})
    setActiveSku(undefined)
    setParams({})
  }

  if (!order) {
    return (
      <>
        <PdaHeader title={t('return.pda.title')} onBack={() => navigate('/pda')} />
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          <PdaSection title={t('return.pda.noOrders')}>
            {pending.length === 0 ? (
              <PdaCard className="text-sm text-muted-foreground">{t('return.pda.noOrders')}</PdaCard>
            ) : (
              pending.map((o) => (
                <PdaListItem
                  key={o.returnNo}
                  chevron
                  onClick={() => {
                    setParams({ no: o.returnNo })
                    setDrafts({})
                  }}
                >
                  <div className="font-mono text-base font-semibold">{o.returnNo}</div>
                  <div className="text-sm text-muted-foreground">
                    {t(`return.source.${o.sourceType}`)} · {o.items.length} SKU
                  </div>
                </PdaListItem>
              ))
            )}
          </PdaSection>
        </div>
      </>
    )
  }

  const onScan = (raw: string): boolean => {
    const code = raw.trim()
    const skuCode = resolveInboundSkuScan(
      code,
      order.items.map((l) => l.skuCode),
      {
        ownerCode: customerCode(order.customerId),
        skuBarcodes,
        primaryBarcode: (s) => sku(s, order.customerId)?.barcode,
      },
    )
    const item = skuCode ? order.items.find((l) => l.skuCode === skuCode) : undefined
    if (!item) {
      setMessage({ tone: 'error', text: t('return.receive.skuNotInOrder') })
      return false
    }
    if (returnLineUnreceived(item) <= 0) {
      setMessage({ tone: 'error', text: t('return.receive.overRemain') })
      return false
    }
    setActiveSku(item.skuCode)
    setDrafts((prev) => ({ ...prev, [item.skuCode]: prev[item.skuCode] ?? emptyDraft() }))
    setMessage({ tone: 'success', text: `${item.skuCode} · ${sku(item.skuCode, order.customerId)?.name ?? ''}` })
    return true
  }

  const total = Object.values(drafts).reduce((n, d) => n + d.goodQty + d.defectQty + d.rejectedQty, 0)

  return (
    <>
      <PdaHeader title={t('return.pda.title')} onBack={() => setParams({})} />
      <PdaContextBar>
        <span className="font-mono">{order.returnNo}</span>
        <span>·</span>
        <span>{order.items.length} SKU</span>
        <span>·</span>
        <span>{t('return.pda.pieces', { count: total })}</span>
      </PdaContextBar>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [overflow-anchor:none]">
        <ScanInput label={t('return.pda.scanSku')} onScan={onScan} message={message} />
        <PdaCard>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{t('return.receive.containerNo')}</span>
            <input
              className="h-12 rounded-lg border px-3 text-base"
              value={containerNo}
              onChange={(e) => setContainerNo(e.target.value)}
              placeholder={t('common.inputPlaceholder')}
            />
          </label>
        </PdaCard>
        <PdaSection title={t('return.tabs.items')}>
          {order.items.map((line) => {
            const d = draftOf(line.skuCode)
            const activeLine = activeSku === line.skuCode
            return (
              <PdaListItem key={line.skuCode} selectable selected={activeLine} onClick={() => setActiveSku(line.skuCode)}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-base font-semibold">{line.skuCode}</div>
                    <div className="text-sm text-muted-foreground">{sku(line.skuCode, order.customerId)?.name}</div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {t('inbound.unreceivedQty')} <b className="text-base text-foreground">{returnLineUnreceived(line)}</b>
                  </div>
                </div>
                {activeLine && (
                  <div className="mt-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <QtyStepper
                      label={t('return.receive.good')}
                      value={d.goodQty}
                      max={returnLineUnreceived(line)}
                      onChange={(v) => setDraft(line.skuCode, { goodQty: v })}
                    />
                    <QtyStepper
                      label={t('return.receive.defect')}
                      value={d.defectQty}
                      max={returnLineUnreceived(line)}
                      onChange={(v) => setDraft(line.skuCode, { defectQty: v })}
                      tone="danger"
                    />
                    <QtyStepper
                      label={t('return.receive.rejected')}
                      value={d.rejectedQty}
                      max={returnLineUnreceived(line)}
                      onChange={(v) => setDraft(line.skuCode, { rejectedQty: v })}
                    />
                    {masters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)?.batchEnabled && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('inbound.batchNo')}</span>
                        <Input
                          className="h-12 text-base"
                          value={d.batchNo}
                          placeholder={t('common.inputPlaceholder')}
                          onChange={(e) => setDraft(line.skuCode, { batchNo: e.target.value })}
                        />
                      </label>
                    )}
                    {masters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)?.expiryEnabled && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('inbound.expiryDate')}</span>
                        <Input
                          className="h-12 text-base"
                          type="date"
                          value={d.expiryDate}
                          onChange={(e) => setDraft(line.skuCode, { expiryDate: e.target.value })}
                        />
                      </label>
                    )}
                    {masters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)?.snEnabled && (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">
                            {t('inbound.receive.goodSerialNos', { count: d.goodQty })}
                          </span>
                          <Textarea
                            rows={2}
                            value={d.goodSerialNos}
                            placeholder={t('inbound.receive.serialPlaceholder')}
                            onChange={(e) => setDraft(line.skuCode, { goodSerialNos: e.target.value })}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">
                            {t('inbound.receive.defectSerialNos', { count: d.defectQty })}
                          </span>
                          <Textarea
                            rows={2}
                            value={d.defectSerialNos}
                            placeholder={t('inbound.receive.serialPlaceholder')}
                            onChange={(e) => setDraft(line.skuCode, { defectSerialNos: e.target.value })}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </PdaListItem>
            )
          })}
        </PdaSection>
      </div>
      <PdaFooter hint={total === 0 ? t('return.receive.empty') : undefined}>
        <PdaButton className="flex-1" disabled={total === 0} onClick={() => void submit()}>
          {t('return.pda.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
