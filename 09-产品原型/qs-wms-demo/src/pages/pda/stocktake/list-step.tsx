import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { DocNoTail } from '@/components/biz/display'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { PdaSkuBlock } from '@/components/pda/pda-stock'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { inventoryTagMeta, stocktakeSourceMeta, stocktakeStatusMeta } from '@/config/status'
import { countingStocktake } from '@/lib/inventory-derive'
import { discoveryStartParams } from '@/lib/pda-stocktake'
import { useDb } from '@/mock/db'
import type { StocktakeFlow } from './use-stocktake-flow'

/**
 * 盘点首页（PDA盘点 PRD）：扫盘点单号或点选本仓盘点中的单据去实盘；下面列出本仓待核对、还没在盘点中的商品，
 * 点开去发起盘点（发现账实不符发起）。主管确认差异与取消只在管理端。
 */
export function StocktakeListStep({ flow }: { flow: StocktakeFlow }) {
  const { t, nav, counting, state, warehouse } = flow
  const navigate = useNavigate()
  const [message, setMessage] = useState<ScanMessage>()

  const pendingSkus = useMemo(
    () =>
      state.skuAllocationControls.filter(
        (c) =>
          c.warehouseCode === warehouse.code &&
          !countingStocktake(state.inventoryCounts, warehouse.code, c.customerId, c.skuCode),
      ),
    [state.inventoryCounts, state.skuAllocationControls, warehouse.code],
  )

  const open = (no: string) => nav.go('location', { no })

  const onScan = (code: string) => {
    const key = code.trim().toUpperCase()
    const found = useDb
      .getState()
      .inventoryCounts.find((c) => c.warehouseCode === warehouse.code && c.no.toUpperCase() === key)
    if (!found) {
      setMessage({ tone: 'error', text: t('pdaStocktake.errNotFound', { code: code.trim() }) })
      return false
    }
    if (found.status !== 'COUNTING') {
      void flow.notice(
        t('pdaStocktake.blockTitle'),
        t('pdaStocktake.errClosed', { no: found.no, status: t(stocktakeStatusMeta[found.status].labelKey) }),
        true,
      )
      return false
    }
    setMessage(undefined)
    open(found.no)
    return true
  }

  return (
    <>
      <PdaHeader title={t('pda.count')} onBack={() => nav.back('home')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput
          label={t('pdaStocktake.promptOrder')}
          onScan={onScan}
          message={message}
          candidates={counting.slice(0, 2).map((c) => ({ value: c.no }))}
        />
        <PdaSection title={t('pdaStocktake.countingList', { count: counting.length })}>
          {counting.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t('pdaStocktake.noCounting')}</p>
          )}
          {counting.map((c) => {
            const { counted, total } = flow.progress(c)
            return (
              <PdaListItem key={c.no} chevron onClick={() => open(c.no)}>
                <div className="flex items-center gap-2">
                  <DocNoTail value={c.no} tail={4} className="text-base" />
                  <TagLabel meta={stocktakeSourceMeta[c.source]} />
                  <span className="ml-auto">
                    <StatusBadge meta={stocktakeStatusMeta[c.status]} />
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t('pdaStocktake.skuCount', { count: c.skus.length })}</span>
                  <span className="ml-auto text-base font-semibold text-primary tabular-nums">
                    {t('pdaStocktake.progress', { counted, total })}
                  </span>
                </div>
              </PdaListItem>
            )
          })}
        </PdaSection>
        {pendingSkus.length > 0 && (
          <PdaSection title={t('pdaStocktake.pendingList', { count: pendingSkus.length })}>
            {pendingSkus.map((c) => (
              <PdaListItem
                key={`${c.customerId}::${c.skuCode}`}
                chevron
                onClick={() => navigate(`/pda/stocktake/start?${new URLSearchParams(discoveryStartParams(c))}`)}
              >
                <PdaSkuBlock
                  skuCode={c.skuCode}
                  name={flow.skuName(c.skuCode)}
                  owner={flow.ownerCode(c.customerId)}
                  tags={<TagLabel meta={inventoryTagMeta.pending} />}
                />
                <div className="mt-1 text-sm text-muted-foreground">
                  {c.sources.map((s) => flow.sourceText(s)).join(t('common.listSeparator'))}
                </div>
              </PdaListItem>
            ))}
          </PdaSection>
        )}
      </div>
    </>
  )
}
