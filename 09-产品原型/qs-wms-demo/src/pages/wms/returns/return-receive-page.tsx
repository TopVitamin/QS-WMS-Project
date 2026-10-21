import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, CodeName, Empty, Num } from '@/components/biz/display'
import { FormField } from '@/components/biz/form-field'
import { PageContainer, Panel, Section } from '@/components/biz/page-container'
import { SummaryCard, SummaryMetrics } from '@/components/biz/summary-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { parseSerialNos } from '@/lib/inbound-receive'
import { canReceiveReturn, returnLineUnreceived } from '@/lib/return-derive'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { ReturnReceiveLineInput } from '@/types/return'

interface Draft {
  goodQty: string
  defectQty: string
  rejectedQty: string
  rejectReason: string
  batchNo: string
  expiryDate: string
  goodSerialNos: string
  defectSerialNos: string
}

const emptyDraft = (): Draft => ({
  goodQty: '',
  defectQty: '',
  rejectedQty: '',
  rejectReason: '',
  batchNo: '',
  expiryDate: '',
  goodSerialNos: '',
  defectSerialNos: '',
})

export function ReturnReceivePage() {
  const { t } = useTranslation()
  const { returnNo } = useParams<{ returnNo: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const order = useDb((s) => s.returnOrders.find((o) => o.returnNo === returnNo))
  const masters = useDb((s) => s.skuMasters)
  const receiveReturn = useDb((s) => s.receiveReturn)
  const { sku, customerCode, customerName } = useLookups()
  const [containerNo, setContainerNo] = useState('')
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [error, setError] = useState<string>()
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch
  const backTo = listSearch ? `/wms/returns/orders?${listSearch}` : '/wms/returns/orders'

  const draftOf = (lineNo: number) => drafts[lineNo] ?? emptyDraft()
  const setDraft = (lineNo: number, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [lineNo]: { ...draftOf(lineNo), ...patch } }))

  const inputs = useMemo<ReturnReceiveLineInput[]>(() => {
    if (!order) return []
    return order.items
      .map((line) => {
        const d = drafts[line.lineNo] ?? emptyDraft()
        return {
          skuCode: line.skuCode,
          goodQty: Number(d.goodQty) || 0,
          defectQty: Number(d.defectQty) || 0,
          rejectedQty: Number(d.rejectedQty) || 0,
          rejectReason: d.rejectReason || undefined,
          batchNo: d.batchNo || undefined,
          expiryDate: d.expiryDate || undefined,
          goodSerialNos: parseSerialNos(d.goodSerialNos),
          defectSerialNos: parseSerialNos(d.defectSerialNos),
        }
      })
      .filter((l) => l.goodQty + l.defectQty + (l.rejectedQty ?? 0) > 0)
  }, [drafts, order])

  if (!returnNo || !order || order.warehouseCode !== warehouseCode) {
    return <Navigate to={backTo} replace />
  }
  if (!canReceiveReturn(order)) {
    return (
      <PageContainer title={t('return.receive.title')}>
        <Panel className="p-6 text-sm text-muted-foreground">{t('return.receive.completed')}</Panel>
      </PageContainer>
    )
  }

  const submit = () => {
    if (!inputs.length) {
      setError(t('return.receive.empty'))
      return
    }
    const result = receiveReturn({ returnNo: order.returnNo, containerNo: containerNo || undefined, lines: inputs, operator })
    if (!result.ok) {
      setError(t(result.errorKey, result.params))
      return
    }
    toast.success(t('return.receive.success', { no: order.returnNo }))
    navigate(`/wms/returns/orders/${order.returnNo}`, { replace: true })
  }

  const total = inputs.reduce((n, l) => n + l.goodQty + l.defectQty + (l.rejectedQty ?? 0), 0)

  return (
    <PageContainer
      title={t('return.receive.title')}
      description={`${order.returnNo} · ${customerName(order.customerId)}`}
      actions={
        <>
          <Button variant="outline" onClick={() => navigate(backTo)}>
            {t('return.backToList')}
          </Button>
          <Button onClick={submit}>{t('return.receive.submit', { count: inputs.length })}</Button>
        </>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          <Section title={t('return.detail.basic')}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">{t('common.customer')}</div>
                <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
              </div>
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">{t('return.originalOutboundNo')}</div>
                {order.originalOutboundNo ? <BizCode>{order.originalOutboundNo}</BizCode> : <Empty />}
              </div>
              <FormField label={t('return.receive.containerNo')}>
                <Input
                  value={containerNo}
                  placeholder={t('common.inputPlaceholder')}
                  onChange={(e) => setContainerNo(e.target.value)}
                />
              </FormField>
            </div>
          </Section>

          {order.items.map((line) => {
            const d = draftOf(line.lineNo)
            const master = masters.find((m) => m.customerId === order.customerId && m.code === line.skuCode)
            const remain = returnLineUnreceived(line)
            return (
              <Section key={line.lineNo} title={`${line.skuCode} · ${sku(line.skuCode, order.customerId)?.name ?? ''}`}>
                <div className="mb-3 text-sm text-muted-foreground">
                  {t('return.columns.plannedQty')} <Num value={line.plannedQty} /> · {t('inbound.unreceivedQty')}{' '}
                  <Num value={remain} />
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <FormField label={t('return.receive.good')}>
                    <Input
                      type="number"
                      min={0}
                      value={d.goodQty}
                      placeholder={t('common.inputPlaceholder')}
                      onChange={(e) => setDraft(line.lineNo, { goodQty: e.target.value })}
                    />
                  </FormField>
                  <FormField label={t('return.receive.defect')}>
                    <Input
                      type="number"
                      min={0}
                      value={d.defectQty}
                      placeholder={t('common.inputPlaceholder')}
                      onChange={(e) => setDraft(line.lineNo, { defectQty: e.target.value })}
                    />
                  </FormField>
                  <FormField label={t('return.receive.rejected')}>
                    <Input
                      type="number"
                      min={0}
                      value={d.rejectedQty}
                      placeholder={t('common.inputPlaceholder')}
                      onChange={(e) => setDraft(line.lineNo, { rejectedQty: e.target.value })}
                    />
                  </FormField>
                  <FormField label={t('return.receive.rejectReason')}>
                    <Input
                      value={d.rejectReason}
                      placeholder={t('common.inputPlaceholder')}
                      onChange={(e) => setDraft(line.lineNo, { rejectReason: e.target.value })}
                    />
                  </FormField>
                  {master?.batchEnabled && (
                    <FormField label={t('inbound.batchNo')}>
                      <Input
                        value={d.batchNo}
                        placeholder={t('common.inputPlaceholder')}
                        onChange={(e) => setDraft(line.lineNo, { batchNo: e.target.value })}
                      />
                    </FormField>
                  )}
                  {master?.expiryEnabled && (
                    <FormField label={t('inbound.expiryDate')}>
                      <Input
                        type="date"
                        value={d.expiryDate}
                        onChange={(e) => setDraft(line.lineNo, { expiryDate: e.target.value })}
                      />
                    </FormField>
                  )}
                  {master?.snEnabled && (
                    <FormField label={t('inbound.receive.goodSerialNos', { count: Number(d.goodQty) || 0 })} span="full">
                      <Textarea
                        rows={2}
                        value={d.goodSerialNos}
                        placeholder={t('inbound.receive.serialPlaceholder')}
                        onChange={(e) => setDraft(line.lineNo, { goodSerialNos: e.target.value })}
                      />
                    </FormField>
                  )}
                  {master?.snEnabled && (
                    <FormField label={t('inbound.receive.defectSerialNos', { count: Number(d.defectQty) || 0 })} span="full">
                      <Textarea
                        rows={2}
                        value={d.defectSerialNos}
                        placeholder={t('inbound.receive.serialPlaceholder')}
                        onChange={(e) => setDraft(line.lineNo, { defectSerialNos: e.target.value })}
                      />
                    </FormField>
                  )}
                </div>
              </Section>
            )
          })}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <SummaryCard title={t('return.receive.title')}>
          <SummaryMetrics
            items={[
              { label: t('return.columns.plannedQty'), value: order.items.reduce((n, l) => n + l.plannedQty, 0) },
              { label: t('return.columns.receivedQty'), value: total, tone: 'blue' },
            ]}
          />
        </SummaryCard>
      </div>
    </PageContainer>
  )
}
