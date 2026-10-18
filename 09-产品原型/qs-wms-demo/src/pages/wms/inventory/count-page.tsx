import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer, Section } from '@/components/biz/page-container'
import { OptionSelect } from '@/components/biz/option-select'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { BizCode, CodeName, DateTime, Num } from '@/components/biz/display'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import { ActionError, OutboundGrid } from '../outbound/shared'
import { parseSerials, useOutboundAction } from '../outbound/outbound-helpers'

/** 出库差异闭环需要的最小盘点：快照、实盘、主管确认；不扩展计划盘点和盘点任务分派。 */
export function CountPage() {
  const { t } = useTranslation()
  const db = useDb()
  const { customerCode, customerName } = useLookups()
  const wh = useSettings((s) => s.warehouseCode)
  const { run, error } = useOutboundAction()
  const [owner, setOwner] = useState('C10028')
  const [sku, setSku] = useState('CABLE-01')
  const [countNo, setCountNo] = useState<string>()
  const [draft, setDraft] = useState<{ inventoryId: string; qty: number; sns: string }[]>([])
  const count = db.inventoryCounts.find((c) => c.no === countNo)
  const inspect = (no: string) => {
    const c = db.inventoryCounts.find((c) => c.no === no)!
    setCountNo(no)
    setDraft(
      c.lines.map((l) => ({
        inventoryId: l.inventoryId,
        qty: l.actualQty ?? l.bookQty,
        sns: (l.serialNos ?? db.inventory.find((r) => r.id === l.inventoryId)?.serialNos ?? []).join('\n'),
      })),
    )
  }
  const snEnabled =
    count && db.skuMasters.find((m) => m.customerId === count.customerId && m.code === count.skuCode)?.snEnabled
  return (
    <PageContainer title={t('outbound.counts')}>
      <Section title={t('outbound.createCount')}>
        <FormGrid>
          <FormField label={t('outbound.warehouse')}>
            <Input readOnly value={wh} />
          </FormField>
          <FormField label={t('outbound.owner')}>
            <OptionSelect
              value={owner}
              onValueChange={(v) => {
                setOwner(v)
                setSku('')
              }}
              options={db.customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </FormField>
          <FormField label={t('outbound.sku')}>
            <OptionSelect
              value={sku}
              onValueChange={setSku}
              options={db.skuMasters
                .filter((m) => m.customerId === owner)
                .map((m) => ({ value: m.code, label: `${m.code} · ${m.name}` }))}
            />
          </FormField>
          <div className="flex items-end">
            <Button onClick={() => run({ type: 'CREATE_COUNT', warehouseCode: wh, customerId: owner, skuCode: sku })}>
              {t('outbound.createCount')}
            </Button>
          </div>
        </FormGrid>
        <p className="mt-3 text-sm text-muted-foreground">{t('outbound.countHint')}</p>
      </Section>
      <ActionError error={error} />
      <Section title={t('outbound.pending')} flush>
        <OutboundGrid
          columns={['sku', 'owner', 'controlSource']}
          rows={db.skuAllocationControls
            .filter((c) => c.warehouseCode === wh)
            .map((c) => ({
              id: `${c.customerId}-${c.skuCode}`,
              sku: <BizCode>{c.skuCode}</BizCode>,
              owner: <CodeName code={customerCode(c.customerId)} name={customerName(c.customerId)} className="max-w-52" />,
              controlSource: c.sources.join(', '),
            }))}
        />
      </Section>
      <Section title={t('outbound.counts')} flush>
        <OutboundGrid
          columns={['no', 'sku', 'statusLabel', 'time', 'action']}
          rows={db.inventoryCounts
            .filter((c) => c.warehouseCode === wh)
            .map((c) => ({
              id: c.no,
              no: <BizCode>{c.no}</BizCode>,
              sku: <BizCode>{c.skuCode}</BizCode>,
              statusLabel: t(`outbound.status.${c.status}`),
              time: <DateTime value={c.createdAt} />,
              action: (
                <Button variant="outline" onClick={() => inspect(c.no)}>
                  {t('common.view')}
                </Button>
              ),
            }))}
        />
      </Section>
      {count && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) setCountNo(undefined)
          }}
        >
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{count.no}</DialogTitle>
              <DialogDescription>{t('outbound.countHint')}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[55vh] overflow-y-auto">
              <OutboundGrid
                columns={['location', 'quality', 'batch', 'book', 'actual', 'serial']}
                rows={count.lines.map((l, i) => {
                  const r = db.inventory.find((r) => r.id === l.inventoryId)!
                  return {
                    id: l.inventoryId,
                    location: <BizCode>{r.locationCode}</BizCode>,
                    quality: t(`enum.quality.${r.qualityType}`),
                    batch: r.batchNo,
                    book: <Num value={l.bookQty} />,
                    actual: (
                      <Input
                        type="number"
                        aria-label={`${t('outbound.actual')} ${r.locationCode}`}
                        readOnly={count.status !== 'COUNTING'}
                        value={draft[i]?.qty ?? l.bookQty}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev.map((d, idx) => (idx === i ? { ...d, qty: Number(e.target.value) } : d)),
                          )
                        }
                      />
                    ),
                    serial: snEnabled ? (
                      <Textarea
                        aria-label={t('outbound.serial')}
                        readOnly={count.status !== 'COUNTING'}
                        value={draft[i]?.sns ?? ''}
                        onChange={(e) =>
                          setDraft((prev) => prev.map((d, idx) => (idx === i ? { ...d, sns: e.target.value } : d)))
                        }
                      />
                    ) : null,
                  }
                })}
              />
            </div>
            <ActionError error={error} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCountNo(undefined)}>
                {t('outbound.close')}
              </Button>
              {count.status === 'COUNTING' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (run({ type: 'CANCEL_COUNT', no: count.no })) setCountNo(undefined)
                    }}
                  >
                    {t('outbound.cancelCount')}
                  </Button>
                  <Button
                    onClick={() => {
                      if (
                        run({
                          type: 'CONFIRM_COUNT',
                          no: count.no,
                          lines: draft.map((d) => ({
                            inventoryId: d.inventoryId,
                            qty: d.qty,
                            serialNos: parseSerials(d.sns),
                          })),
                        })
                      )
                        setCountNo(undefined)
                    }}
                  >
                    {t('outbound.confirmCount')}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  )
}
