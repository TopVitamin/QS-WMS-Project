import { useEffect, useMemo, useState } from 'react'
import { Empty } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaFigure, PdaLocation, PdaSkuBlock } from '@/components/pda/pda-stock'
import type { ScanMessage } from '@/components/pda/scan-input'
import { expiryLevelMeta, inventoryTagMeta, qualityMeta, serialStatusMeta } from '@/config/status'
import { usePdaScanListener } from '@/hooks/use-pda-scan-listener'
import { formatDateTime } from '@/lib/format'
import {
  deriveBalances,
  deriveSerials,
  deriveSkuStocks,
  locationInfo,
  serialTrack,
  type BalanceRow,
} from '@/lib/inventory-derive'
import { compareLocation } from '@/lib/pda-inventory-scan'
import { beep } from '@/lib/scan-beep'
import type { QueryFlow } from './use-query-flow'

/**
 * 结果屏（PDA库存查询 PRD）：库位按商品、批次、品质列明细；商品先三量再库位分布；SN 显示单件状态和最近轨迹。
 * 可用为负、待核对、盘点中、暂存不参与分配就近提示。只查询，不改数；直接扫下一个码即换结果，返回键回扫描屏。
 */
export function QueryResultStep({ flow }: { flow: QueryFlow }) {
  const { t, nav } = flow
  const kind = nav.param('kind')
  const loc = nav.param('loc')
  const owner = nav.param('owner')
  const sku = nav.param('sku')
  const sn = nav.param('sn')
  const valid =
    (kind === 'location' && loc) || (kind === 'sku' && owner && sku) || (kind === 'serial' && owner && sku && sn)
  const [message, setMessage] = useState<ScanMessage>()

  useEffect(() => {
    if (!valid) nav.replace('scan')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  usePdaScanListener((code) => {
    const result = flow.scan(code, true)
    beep(!result)
    setMessage(result)
  })

  if (!valid) return null
  return (
    <>
      <PdaHeader title={t('pda.query')} onBack={() => nav.back({ step: 'scan' })} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {message && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {message.text}
          </p>
        )}
        {kind === 'location' && <LocationResult flow={flow} code={loc!} />}
        {kind === 'sku' && <SkuResult flow={flow} owner={owner!} sku={sku!} />}
        {kind === 'serial' && <SerialResult flow={flow} owner={owner!} sku={sku!} sn={sn!} />}
      </div>
      <PdaFooter hint={t('pdaQuery.resultHint')}>
        <PdaButton className="flex-1" onClick={() => nav.back({ step: 'scan' })}>
          {t('pdaQuery.scanAgain')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}

/** 一条库存明细：库位或商品，右侧大号实际；批次品质与状态标签一行，已分配／可分配一行 */
function BalanceCard({ flow, row, showSku }: { flow: QueryFlow; row: BalanceRow; showSku?: boolean }) {
  const { t } = flow
  const r = row.record
  const tags = (
    <>
      <TagLabel meta={qualityMeta[r.qualityType]} />
      {row.expiry && row.expiry !== 'NORMAL' && <TagLabel meta={expiryLevelMeta[row.expiry]} />}
      {row.counting && <TagLabel meta={inventoryTagMeta.counting} />}
      {row.pending && <TagLabel meta={inventoryTagMeta.pending} />}
    </>
  )
  return (
    <PdaCard>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {showSku ? (
            <PdaSkuBlock
              skuCode={r.skuCode}
              name={flow.skuName(r.skuCode, r.customerId)}
              owner={flow.ownerText(r.customerId)}
            />
          ) : (
            <PdaLocation code={r.locationCode} usage={row.usage && t(`inventory.usage.${row.usage}`)} />
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {(r.batchNo || r.productionDate || r.expiryDate) && (
              <span className="font-mono text-sm text-muted-foreground">
                {[r.batchNo, r.productionDate, r.expiryDate].filter(Boolean).join(' · ')}
              </span>
            )}
            {tags}
          </div>
        </div>
        <PdaFigure label={t('inventory.actual')} value={r.onHandQty} className="shrink-0 text-right" />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 border-t pt-2 text-sm tabular-nums">
        <span>
          {t('inventory.allocated')} {row.allocated}
        </span>
        <span>
          {t('inventory.allocatable')} {row.allocatable}
        </span>
        {row.stagingGood && <span className="text-muted-foreground">{t('pdaQuery.temporaryNotAllocatable')}</span>}
      </div>
    </PdaCard>
  )
}

/** 当前仓全部库存明细（按库位排序），随库存数据变化重算；各结果再按查询对象筛 */
function useBalances(flow: QueryFlow) {
  const { state, warehouse } = flow
  return useMemo(
    () =>
      deriveBalances(state, warehouse.code, new Date()).sort((a, b) =>
        compareLocation(a.record.locationCode, b.record.locationCode),
      ),
    [state, warehouse.code],
  )
}

function SkuResult({ flow, owner, sku }: { flow: QueryFlow; owner: string; sku: string }) {
  const { t, state, warehouse } = flow
  const rows = useMemo(
    () => deriveSkuStocks(state, warehouse.code).filter((r) => r.customerId === owner && r.skuCode === sku),
    [owner, sku, state, warehouse.code],
  )
  const balances = useBalances(flow).filter((b) => b.record.customerId === owner && b.record.skuCode === sku)
  return (
    <>
      <PdaCard>
        <PdaSkuBlock skuCode={sku} name={flow.skuName(sku, owner)} owner={flow.ownerText(owner)} />
      </PdaCard>
      {rows.map((row) => (
        <PdaCard key={row.id}>
          <div className="flex flex-wrap items-center gap-2">
            <TagLabel meta={qualityMeta[row.qualityType]} />
            {row.pending && <TagLabel meta={inventoryTagMeta.pending} />}
            {row.counting && <TagLabel meta={inventoryTagMeta.counting} />}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
            <PdaFigure label={t('inventory.actual')} value={row.actual} />
            <PdaFigure label={t('inventory.orderReserved')} value={row.orderReserved} />
            <PdaFigure label={t('inventory.available')} value={row.available} />
          </div>
          {row.pending && <p className="mt-2 text-sm text-muted-foreground">{t('inventory.pendingHint')}</p>}
          {row.counting && (
            <p className="mt-2 text-sm text-muted-foreground">{t('pdaQuery.countingHint', { no: row.counting.no })}</p>
          )}
        </PdaCard>
      ))}
      {rows.length === 0 && <p>{t('pdaQuery.empty')}</p>}
      <PdaSection title={t('pdaQuery.distribution', { count: balances.length })}>
        {balances.map((b) => (
          <BalanceCard key={b.id} flow={flow} row={b} />
        ))}
      </PdaSection>
    </>
  )
}

function LocationResult({ flow, code }: { flow: QueryFlow; code: string }) {
  const { t, state, warehouse } = flow
  const info = locationInfo(state, warehouse.code, code)
  const balances = useBalances(flow).filter((b) => b.record.locationCode === code)
  return (
    <>
      <PdaCard>
        <PdaLocation code={code} usage={info && t(`inventory.usage.${info.usage}`)} />
        <div className="mt-1 text-sm text-muted-foreground">
          {t('pdaQuery.locationSummary', {
            skus: new Set(balances.map((b) => `${b.record.customerId}::${b.record.skuCode}`)).size,
            qty: balances.reduce((n, b) => n + b.record.onHandQty, 0),
          })}
        </div>
      </PdaCard>
      <PdaSection title={t('pdaQuery.stockAtLocation', { count: balances.length })}>
        {balances.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('pdaQuery.emptyLocation', { code })}</p>
        )}
        {balances.map((b) => (
          <BalanceCard key={b.id} flow={flow} row={b} showSku />
        ))}
      </PdaSection>
    </>
  )
}

function SerialResult({ flow, owner, sku, sn }: { flow: QueryFlow; owner: string; sku: string; sn: string }) {
  const { t, state, warehouse } = flow
  const row = useMemo(
    () =>
      deriveSerials(state, warehouse.code).find(
        (r) => r.customerId === owner && r.skuCode === sku && r.serialNo === sn,
      ),
    [owner, sku, sn, state, warehouse.code],
  )
  const nodes = useMemo(
    () => serialTrack(state.inventoryLogs, owner, sku, sn).reverse().slice(0, 5),
    [owner, sku, sn, state.inventoryLogs],
  )
  if (!row)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('pdaQuery.notFound', { code: sn })}</p>
  return (
    <>
      <PdaCard>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xl font-bold break-all">{sn}</span>
          <TagLabel meta={serialStatusMeta[row.status]} />
        </div>
        <PdaSkuBlock className="mt-2" skuCode={sku} name={flow.skuName(sku, owner)} owner={flow.ownerText(owner)} />
        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
          <PdaFigure size="md" label={t('inventory.warehouse')} value={row.warehouseCode} />
        </div>
        {row.lastChangedAt && (
          <div className="mt-2 text-sm text-muted-foreground tabular-nums">
            {t('pdaQuery.lastChanged', { time: formatDateTime(row.lastChangedAt, warehouse.timezone) })}
          </div>
        )}
      </PdaCard>
      <PdaSection title={t('pdaQuery.recentTrack')}>
        {nodes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t('pdaQuery.noTrack')}</p>
        )}
        {nodes.map((n) => (
          <PdaCard key={n.id} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-base font-medium">{t(`inventory.type.${n.type}`)}</div>
              <div className="font-mono text-sm">{n.log.locationCode || <Empty />}</div>
              {n.log.refNo && <div className="font-mono text-sm text-muted-foreground">{n.log.refNo}</div>}
            </div>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {formatDateTime(n.at, warehouse.timezone, 'MM-DD HH:mm')}
            </span>
          </PdaCard>
        ))}
      </PdaSection>
    </>
  )
}
