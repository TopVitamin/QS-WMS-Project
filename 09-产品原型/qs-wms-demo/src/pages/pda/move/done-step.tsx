import { CircleCheck } from 'lucide-react'
import { DocNoTail } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaSkuBlock } from '@/components/pda/pda-stock'
import { qualityMeta } from '@/config/status'
import { toneTextClass } from '@/lib/tone-styles'
import type { MoveFlow } from './use-move-flow'

/** 提交成功（PDA移库 页面骨架）：移库作业号与每行源减、目标增；有待盘点的账实不符时给出去盘点入口 */
export function MoveDoneStep({ flow }: { flow: MoveFlow }) {
  const { t, nav, state, draft } = flow
  const move = state.stockMoves.find((m) => m.no === nav.param('mv') && m.warehouseCode === flow.warehouse.code)
  const discrepancy = draft?.discrepancy

  return (
    <>
      <PdaHeader title={t('pda.move')} onBack={() => nav.returnTo('source')} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="flex flex-col items-center gap-2 py-4">
          <CircleCheck className="size-10 text-success-text" />
          <div className="text-lg font-semibold">{t('pdaMove.doneTitle')}</div>
          {move && <DocNoTail value={move.no} tail={4} className="text-lg" />}
        </PdaCard>
        {discrepancy && (
          <PdaCard className="flex flex-col gap-2 border border-destructive/40">
            <p className="text-sm font-medium">
              {t('pdaMove.discrepancyPending', { sku: discrepancy.skuCode, location: discrepancy.locationCode })}
            </p>
            <PdaButton
              variant="outline"
              onClick={() => {
                flow.edit(() => undefined)
                flow.openStocktakeStart(discrepancy)
              }}
            >
              {t('pdaMove.goStocktake')}
            </PdaButton>
          </PdaCard>
        )}
        {move && (
          <PdaSection title={t('pdaMove.resultLines', { count: move.lines.length })}>
            {move.lines.map((l) => (
              <PdaCard key={l.lineNo}>
                <PdaSkuBlock
                  skuCode={l.skuCode}
                  name={flow.skuName(l.skuCode, move.customerId)}
                  batch={l.batchNo}
                  tags={<TagLabel meta={qualityMeta[l.qualityType]} />}
                />
                <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 font-mono text-base font-bold tabular-nums">
                  <span>
                    {l.sourceLocation} <span className={toneTextClass.red}>−{l.qty}</span>
                  </span>
                  <span>
                    {l.targetLocation} <span className={toneTextClass.green}>+{l.qty}</span>
                  </span>
                </div>
                {l.serialNos.length > 0 && (
                  <div className="mt-1 font-mono text-sm break-all text-muted-foreground">{l.serialNos.join(', ')}</div>
                )}
              </PdaCard>
            ))}
          </PdaSection>
        )}
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={() => nav.returnTo('source')}>
          {t('pdaMove.continue')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
