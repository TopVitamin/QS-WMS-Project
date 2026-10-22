import { Download } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DataTable } from '@/components/biz/data-table'
import { DateRangePickerField } from '@/components/biz/date-range-picker-field'
import { FilterBar, FilterItem } from '@/components/biz/filter-bar'
import { OptionSelect } from '@/components/biz/option-select'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUrlListState } from '@/hooks/use-url-list-state'
import { ledgerNumbers } from '@/lib/inventory-ledger'
import { emptyLedgerFilters, matchLedger, sortLedger } from '@/lib/inventory-list-match'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { InventoryLogType } from '@/types/wms'
import { InventoryBasisHelp } from './inventory-shared'
import { useLedgerColumns, type LedgerRow } from './inventory-columns'
import { LedgerDetailSheet } from './ledger-detail-sheet'

const TYPES: InventoryLogType[] = [
  'RECEIVE',
  'PUTAWAY',
  'PICK',
  'RETURN',
  'QUALITY',
  'MOVE',
  'ADJUST',
  'SHIP',
  'RESERVE',
  'RELEASE',
]
const NO_STATUS: readonly never[] = []

/** 库存流水（库存流水前端Demo版PRD）：已生效库存变化的只读查询，默认业务发生时间倒序 */
export function InventoryLogsPage() {
  const { t } = useTranslation()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const logs = useDb((s) => s.inventoryLogs)
  const customers = useDb((s) => s.customers)
  const { sku } = useLookups()
  const [params, setParams] = useSearchParams()
  const list = useUrlListState(emptyLedgerFilters, NO_STATUS)
  const { draft, setDraft, filters } = list
  const numbers = useMemo(() => ledgerNumbers(logs), [logs])
  const skuName = useCallback((code: string) => sku(code)?.name, [sku])

  const rows = useMemo<LedgerRow[]>(
    () =>
      sortLedger(logs.filter((l) => l.warehouseCode === warehouseCode))
        .map((log) => ({ log, no: numbers.get(log.id) ?? '' }))
        .filter((r) => matchLedger(r.log, filters, skuName, r.no)),
    [filters, logs, numbers, skuName, warehouseCode],
  )

  const openId = params.get('log')
  const openLog = useCallback(
    (id: string) => {
      const next = new URLSearchParams(params)
      next.set('log', id)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )
  const closeLog = () => {
    const next = new URLSearchParams(params)
    next.delete('log')
    setParams(next, { replace: true })
  }
  const onOpen = useCallback((r: LedgerRow) => openLog(r.log.id), [openLog])
  const columns = useLedgerColumns({ onOpen })
  // 详情只展示当前仓的流水，不泄露其他仓数据
  const opened = openId ? logs.find((l) => l.id === openId && l.warehouseCode === warehouseCode) : undefined

  return (
    <PageContainer
      fill
      title={t('menu.inventoryLogs')}
      actions={
        <div className="flex items-center gap-2">
          <InventoryBasisHelp />
          <Button variant="outline" onClick={() => toast.info(t('common.exportMock'))}>
            <Download data-icon="inline-start" />
            {t('common.export')}
          </Button>
        </div>
      }
    >
      <Panel className="p-4">
        <FilterBar
          columns={6}
          onSearch={list.search}
          onReset={list.reset}
          advanced={
            <>
              <FilterItem label={t('inventory.owner')}>
                <OptionSelect
                  allOption
                  value={draft.customerId}
                  onValueChange={(v) => setDraft({ ...draft, customerId: v })}
                  options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
                />
              </FilterItem>
              <FilterItem label={t('inventory.quality')}>
                <OptionSelect
                  allOption
                  value={draft.quality}
                  onValueChange={(v) => setDraft({ ...draft, quality: v })}
                  options={['GOOD', 'DEFECTIVE'].map((v) => ({ value: v, label: t(`enum.quality.${v}`) }))}
                />
              </FilterItem>
              <FilterItem label={t('inventory.location')}>
                <Input
                  value={draft.location}
                  placeholder={t('inventory.stock.locationPlaceholder')}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </FilterItem>
              <FilterItem label={t('inventory.batch')}>
                <Input
                  value={draft.batch}
                  placeholder={t('inventory.stock.batchPlaceholder')}
                  onChange={(e) => setDraft({ ...draft, batch: e.target.value })}
                />
              </FilterItem>
              <FilterItem label={t('inventory.serialNo')}>
                <Input
                  value={draft.sn}
                  placeholder={t('inventory.logs.serialPlaceholder')}
                  onChange={(e) => setDraft({ ...draft, sn: e.target.value })}
                />
              </FilterItem>
            </>
          }
        >
          <FilterItem label={t('inventory.logs.logNo')}>
            <Input
              value={draft.no}
              placeholder={t('inventory.logs.logNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, no: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inventory.logs.type')}>
            <OptionSelect
              allOption
              value={draft.type}
              onValueChange={(v) => setDraft({ ...draft, type: v })}
              options={TYPES.map((v) => ({ value: v, label: t(`inventory.type.${v}`) }))}
            />
          </FilterItem>
          <FilterItem label={t('inventory.logs.sourceNo')}>
            <Input
              value={draft.sourceNo}
              placeholder={t('inventory.logs.sourceNoPlaceholder')}
              onChange={(e) => setDraft({ ...draft, sourceNo: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inventory.skuKeyword')}>
            <Input
              value={draft.sku}
              placeholder={t('inventory.stock.skuKeywordPlaceholder')}
              onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
            />
          </FilterItem>
          <FilterItem label={t('inventory.logs.occurredAt')}>
            <DateRangePickerField
              value={{ from: draft.occurredFrom, to: draft.occurredTo }}
              placeholder={t('inventory.logs.occurredRangePlaceholder')}
              onChange={(range) => setDraft({ ...draft, occurredFrom: range.from, occurredTo: range.to })}
            />
          </FilterItem>
        </FilterBar>
      </Panel>
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(r) => r.log.id}
          onRowClick={(r) => openLog(r.log.id)}
          emptyText={t('inventory.logs.empty')}
        />
      </Panel>
      {openId && <LedgerDetailSheet log={opened} no={opened ? numbers.get(opened.id) : undefined} onClose={closeLog} />}
    </PageContainer>
  )
}
