import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { BizCode, CodeName, Empty, Num } from '@/components/biz/display'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { inventoryFeatureMeta, qualityMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useDb, useLookups } from '@/mock/db'
import type { InventoryCount, StocktakeLine } from '@/types/inventory'
import type { QualityType } from '@/types/wms'
import { useInventoryRun } from './inventory-helpers'
import { SignedNum } from './inventory-shared'

interface Draft {
  qty: string
  serials: string
  note: string
}
const parseSerials = (text: string) =>
  text
    .split(/[\s,，]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
const savedDraft = (l: StocktakeLine): Draft => ({
  qty: l.countedQty === undefined ? '' : String(l.countedQty),
  serials: (l.countedSerialNos ?? []).join('\n'),
  note: l.diffNote ?? '',
})
const emptyAdd = {
  location: '',
  skuKey: '',
  quality: 'GOOD' as QualityType,
  batchNo: '',
  expiryDate: '',
  qty: '',
  serials: '',
  note: '',
}

/**
 * 管理端实盘录入（盘点单前端Demo版PRD 第三节）：逐行录入、可分次保存；SN 商品逐个录 SN，实盘数量按 SN 数计算。
 * 保存只记实盘、不改库存；快照外归属明确的实物用「新增实盘行」按账面 0 补录。与 PDA 共用同一盘点动作。
 */
export function StocktakeEntrySheet({ count, onClose }: { count: InventoryCount; onClose: () => void }) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const run = useInventoryRun()
  const { sku, customerCode } = useLookups()
  const masters = useDb((s) => s.skuMasters)
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() =>
    Object.fromEntries(count.lines.map((l) => [l.lineNo, savedDraft(l)])),
  )
  const [add, setAdd] = useState(emptyAdd)

  const master = (customerId: string, skuCode: string) =>
    masters.find((m) => m.customerId === customerId && m.code === skuCode)
  const isSn = (l: Pick<StocktakeLine, 'customerId' | 'skuCode'>) => Boolean(master(l.customerId, l.skuCode)?.snEnabled)
  const draftQty = (_l: StocktakeLine, d: Draft) => (d.qty.trim() === '' ? undefined : Number(d.qty))
  const changed = count.lines.filter((l) => {
    const d = drafts[l.lineNo]
    const saved = savedDraft(l)
    return d.qty !== saved.qty || d.serials !== saved.serials || d.note !== saved.note
  })
  /** 只提交改过的行；普通商品清空数量视为未录，不提交 */
  const entries = changed.flatMap((l) => {
    const d = drafts[l.lineNo]
    if (d.qty.trim() === '') return []
    return [{ lineNo: l.lineNo, qty: Number(d.qty), serialNos: isSn(l) ? parseSerials(d.serials) : [], note: d.note }]
  })
  const addTouched = JSON.stringify(add) !== JSON.stringify(emptyAdd)

  const setDraft = (lineNo: number, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [lineNo]: { ...prev[lineNo], ...patch } }))

  const requestClose = async () => {
    if (changed.length || addTouched) {
      const ok = await confirm({
        title: t('inventory.discardTitle'),
        description: t('inventory.discardBody'),
        confirmText: t('common.discard'),
        cancelText: t('common.keepEditing'),
      })
      if (!ok) return
    }
    onClose()
  }

  const save = () => {
    const result = run({ type: 'SAVE_COUNTS', no: count.no, entries }, () =>
      t('inventory.stocktake.countsSaved', { count: entries.length }),
    )
    if (result) onClose()
  }

  const addSku = count.skus.find((k) => `${k.customerId}::${k.skuCode}` === add.skuKey)
  const addMaster = addSku ? master(addSku.customerId, addSku.skuCode) : undefined
  const submitAdd = () => {
    if (!addSku) return
    const serials = parseSerials(add.serials)
    const result = run(
      {
        type: 'ADD_COUNT_LINE',
        no: count.no,
        locationCode: add.location,
        customerId: addSku.customerId,
        skuCode: addSku.skuCode,
        batchNo: add.batchNo || undefined,
        expiryDate: add.expiryDate || undefined,
        qualityType: add.quality,
        qty: Number(add.qty),
        serialNos: addMaster?.snEnabled ? serials : [],
        note: add.note,
      },
      () => t('inventory.stocktake.addLineSuccess'),
    )
    if (result) {
      setAdd(emptyAdd)
      onClose()
    }
  }

  return (
    <DetailSheet
      open
      onClose={() => void requestClose()}
      title={<DetailTitle title={t('inventory.stocktake.entryTitle')} code={count.no} />}
      description={t('inventory.stocktake.entryHint')}
    >
      <Section
        flush
        title={t('inventory.stocktake.tabLines')}
        extra={
          <Button size="sm" onClick={save} disabled={!entries.length}>
            {t('inventory.stocktake.saveCounts', { count: entries.length })}
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{t('inventory.lineNo')}</TableHead>
              <TableHead>{t('inventory.location')}</TableHead>
              <TableHead>{t('inventory.sku')}</TableHead>
              <TableHead>{t('inventory.batch')}</TableHead>
              <TableHead>{t('inventory.quality')}</TableHead>
              <TableHead className="text-right">{t('inventory.stocktake.bookQty')}</TableHead>
              <TableHead>{t('inventory.stocktake.countedQty')}</TableHead>
              <TableHead className="text-right">{t('inventory.stocktake.diffQty')}</TableHead>
              <TableHead>{t('inventory.stocktake.diffNote')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {count.lines.map((l) => {
              const d = drafts[l.lineNo]
              const qty = draftQty(l, d)
              const label = `${l.locationCode} ${l.skuCode}`
              return (
                <TableRow key={l.lineNo}>
                  <TableCell className="text-right tabular-nums">{l.lineNo}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <BizCode>{l.locationCode}</BizCode>
                      {l.added && <TagLabel meta={inventoryFeatureMeta.added} />}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CodeName code={l.skuCode} name={sku(l.skuCode)?.name} className="max-w-40" />
                  </TableCell>
                  <TableCell>{l.batchNo || <Empty />}</TableCell>
                  <TableCell>
                    <TagLabel meta={qualityMeta[l.qualityType]} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Num value={l.bookQty} />
                  </TableCell>
                  <TableCell className="min-w-28">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      aria-label={`${t('inventory.stocktake.countedQty')} ${label}`}
                      placeholder={t('common.inputPlaceholder')}
                      value={d.qty}
                      onChange={(e) => setDraft(l.lineNo, { qty: e.target.value })}
                    />
                    {isSn(l) && (
                      <Textarea
                        rows={2}
                        aria-label={`${t('inventory.stocktake.countedSerials')} ${label}`}
                        placeholder={t('inventory.stocktake.serialInputHint')}
                        value={d.serials}
                        onChange={(e) => setDraft(l.lineNo, { serials: e.target.value })}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {qty === undefined || Number.isNaN(qty) ? <Empty /> : <SignedNum value={qty - l.bookQty} />}
                  </TableCell>
                  <TableCell className="min-w-32">
                    <Input
                      aria-label={`${t('inventory.stocktake.diffNote')} ${label}`}
                      placeholder={t('common.inputPlaceholder')}
                      value={d.note}
                      onChange={(e) => setDraft(l.lineNo, { note: e.target.value })}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Section>
      <Section
        title={t('inventory.stocktake.addLine')}
        extra={
          <Button size="sm" variant="outline" onClick={submitAdd} disabled={!addSku || !add.location.trim()}>
            {t('inventory.stocktake.addLineSubmit')}
          </Button>
        }
      >
        <p className="text-xs text-muted-foreground">{t('inventory.stocktake.addLineHint')}</p>
        <FormGrid columns={4}>
          <FormField label={t('inventory.location')} required>
            <Input
              value={add.location}
              placeholder={t('inventory.stock.locationPlaceholder')}
              onChange={(e) => setAdd({ ...add, location: e.target.value })}
            />
          </FormField>
          <FormField label={t('inventory.sku')} required>
            <OptionSelect
              value={add.skuKey || undefined}
              onValueChange={(v) => setAdd({ ...add, skuKey: v })}
              options={count.skus.map((k) => ({
                value: `${k.customerId}::${k.skuCode}`,
                label: `${k.skuCode} · ${customerCode(k.customerId)}`,
              }))}
            />
          </FormField>
          <FormField label={t('inventory.quality')} required>
            <OptionSelect
              value={add.quality}
              onValueChange={(v) => setAdd({ ...add, quality: v })}
              options={(['GOOD', 'DEFECTIVE'] as const).map((q) => ({ value: q, label: t(qualityMeta[q].labelKey) }))}
            />
          </FormField>
          {addMaster?.snEnabled && (
            <FormField label={t('inventory.stocktake.countedSerials')}>
              <Textarea
                rows={2}
                placeholder={t('inventory.stocktake.serialInputHint')}
                value={add.serials}
                onChange={(e) => setAdd({ ...add, serials: e.target.value })}
              />
            </FormField>
          )}
          {
            <FormField label={t('inventory.stocktake.countedQty')} required>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder={t('common.inputPlaceholder')}
                value={add.qty}
                onChange={(e) => setAdd({ ...add, qty: e.target.value })}
              />
            </FormField>
          }
          {(addMaster?.batchEnabled || addMaster?.expiryEnabled) && (
            <FormField label={t('inventory.batchNo')} required>
              <Input
                value={add.batchNo}
                placeholder={t('inventory.stock.batchPlaceholder')}
                onChange={(e) => setAdd({ ...add, batchNo: e.target.value })}
              />
            </FormField>
          )}
          {addMaster?.expiryEnabled && (
            <FormField label={t('inventory.expiryDate')} required>
              <Input
                type="date"
                value={add.expiryDate}
                onChange={(e) => setAdd({ ...add, expiryDate: e.target.value })}
              />
            </FormField>
          )}
          <FormField label={t('inventory.stocktake.diffNote')} span={2}>
            <Input
              value={add.note}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => setAdd({ ...add, note: e.target.value })}
            />
          </FormField>
        </FormGrid>
      </Section>
    </DetailSheet>
  )
}
