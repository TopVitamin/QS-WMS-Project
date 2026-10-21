import { TagLabel } from '@/components/biz/status-badge'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaFigure, PdaSkuBlock } from '@/components/pda/pda-stock'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { inventoryFeatureMeta, qualityMeta } from '@/config/status'
import { toneTextClass } from '@/lib/tone-styles'
import { cn } from '@/lib/utils'
import type { PdaCountDraft } from '@/stores/pda-stocktake-session'
import type { InventoryCount, StocktakeLine } from '@/types/inventory'
import { StocktakeContext } from './stocktake-shared'
import { useCountSubject } from './use-count-subject'
import type { StocktakeFlow } from './use-stocktake-flow'

/**
 * 本行结果（PDA盘点 页面骨架）：这时才对账面，显示账面、实盘、差异；SN 列出没找到的和账外的。
 * 保存只记实盘、不改库存，主管在管理端确认差异后才调账；重复保存更新同一行并记录录入人与时间。
 */
export function StocktakeReviewStep({ flow }: { flow: StocktakeFlow }) {
  const subject = useCountSubject(flow)
  if (!subject) return null
  return <ReviewWorkspace flow={flow} {...subject} />
}

function ReviewWorkspace({
  flow,
  count,
  draft,
  line,
}: {
  flow: StocktakeFlow
  count: InventoryCount
  draft: PdaCountDraft
  line?: StocktakeLine
}) {
  const { t, nav } = flow
  const subject = line ?? draft.add!
  const sn = flow.isSn(subject)
  const book = line?.bookQty ?? 0
  const counted = sn ? draft.serialNos.length : draft.qty
  const diff = counted - book
  const missing = line && sn ? line.bookSerialNos.filter((x) => !draft.serialNos.includes(x)) : []
  const extra = sn ? draft.serialNos.filter((x) => !(line?.bookSerialNos ?? []).includes(x)) : []
  const batch = line ? flow.lineBatch(line) : flow.lineBatch(draft.add ?? {})

  return (
    <>
      <PdaHeader
        title={t('pdaStocktake.reviewTitle')}
        onBack={() =>
          nav.back({
            step: 'count',
            params: {
              no: count.no,
              loc: subject.locationCode,
              ...(line ? { line: String(line.lineNo) } : { add: '1' }),
            },
          })
        }
      />
      <StocktakeContext flow={flow} count={count} location={subject.locationCode} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard>
          <PdaSkuBlock
            skuCode={subject.skuCode}
            name={flow.skuName(subject.skuCode, subject.customerId)}
            owner={flow.ownerCode(subject.customerId)}
            batch={batch}
            tags={
              <>
                <TagLabel meta={qualityMeta[subject.qualityType]} />
                {!line && <TagLabel meta={inventoryFeatureMeta.added} />}
              </>
            }
          />
          <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
            <PdaFigure label={t('inventory.stocktake.bookQty')} value={book} />
            <PdaFigure label={t('inventory.stocktake.countedQty')} value={counted} />
            <PdaFigure
              label={t('inventory.stocktake.diffQty')}
              value={
                <span className={cn(diff > 0 && toneTextClass.green, diff < 0 && toneTextClass.red)}>
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              }
            />
          </div>
        </PdaCard>
        {(missing.length > 0 || extra.length > 0) && (
          <PdaCard className="flex flex-col gap-1 text-sm">
            {missing.length > 0 && (
              <div>
                <span className="text-muted-foreground">
                  {t('pdaStocktake.missingSerials', { count: missing.length })}
                </span>
                <div className={cn('font-mono break-all', toneTextClass.red)}>{missing.join(', ')}</div>
              </div>
            )}
            {extra.length > 0 && (
              <div>
                <span className="text-muted-foreground">{t('pdaStocktake.extraSerials', { count: extra.length })}</span>
                <div className={cn('font-mono break-all', toneTextClass.green)}>{extra.join(', ')}</div>
              </div>
            )}
          </PdaCard>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pda-count-note">{t('inventory.stocktake.diffNote')}</Label>
          <Textarea
            id="pda-count-note"
            rows={2}
            className="text-base"
            value={draft.note}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => {
              const d = flow.liveDraftOf(count.no)
              if (d) flow.setDraft(count.no, { ...d, note: e.target.value })
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('pdaStocktake.saveHint')}</p>
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={() => flow.save(count)}>
          {t('pdaStocktake.saveCount')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
