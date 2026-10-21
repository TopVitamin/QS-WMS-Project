import { useEffect } from 'react'
import { PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { PdaLocation, PdaSkuBlock } from '@/components/pda/pda-stock'
import { resolveInventoryScan } from '@/lib/pda-inventory-scan'
import { targetParams, type QueryFlow } from './use-query-flow'

/** 整屏选择（PDA库存查询 PRD）：同一个码对应多个货主的同一 SKU，或同时是库位和商品时，由人选，不静默猜测 */
export function QueryChooseStep({ flow }: { flow: QueryFlow }) {
  const { t, nav, state, warehouse } = flow
  const code = nav.param('code') ?? ''
  const hits = resolveInventoryScan(state, warehouse.code, code).filter(flow.usable)
  const ownersOnly = hits.every((h) => h.kind === 'sku')

  useEffect(() => {
    if (hits.length < 2) nav.replace('scan')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits.length])

  return (
    <>
      <PdaHeader title={t('pda.query')} onBack={() => nav.back({ step: 'scan' })} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <p className="text-base font-medium">
          {ownersOnly ? t('pdaQuery.selectOwnerHint', { code }) : t('pdaQuery.selectTarget', { code })}
        </p>
        <PdaSection title={ownersOnly ? t('pdaQuery.selectOwner') : t('pdaQuery.selectRecord')}>
          {hits.map((hit) => {
            const target = flow.toTarget(hit)
            return (
              <PdaListItem
                key={Object.values(target).join('|')}
                chevron
                onClick={() => nav.replace('result', targetParams(target))}
              >
                {hit.kind === 'location' ? (
                  <PdaLocation code={hit.code} usage={t(`inventory.usage.${hit.usage}`)} />
                ) : (
                  <PdaSkuBlock
                    skuCode={hit.kind === 'serial' ? hit.serialNo : hit.skuCode}
                    name={hit.kind === 'serial' ? hit.skuCode : flow.skuName(hit.skuCode, 'customerId' in hit ? hit.customerId : undefined)}
                    owner={flow.ownerText(hit.customerId)}
                  />
                )}
              </PdaListItem>
            )
          })}
        </PdaSection>
      </div>
    </>
  )
}
