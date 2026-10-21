import { useEffect } from 'react'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { MoveContext, MoveLineCard } from './move-shared'
import type { MoveFlow } from './use-move-flow'

/**
 * 待提交清单（PDA移库 PRD）：查看、删除未提交行；继续添加回到扫源位，去提交进入整次确认。
 * 上次提交失败时标出失败行；移库时确认过账实不符的，提示清单收尾后去盘点。
 */
export function MoveLinesStep({ flow }: { flow: MoveFlow }) {
  const { t, nav, draft } = flow
  const lines = draft?.lines ?? []
  const failure = draft?.failure

  useEffect(() => {
    if (lines.length === 0 && !flow.leaving.current) nav.replace('source')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length])

  if (lines.length === 0) return null
  return (
    <>
      <PdaHeader title={t('pda.move')} onBack={() => nav.back({ step: 'source' })} />
      <MoveContext flow={flow} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {failure && (
          <PdaCard className="border border-destructive/40 text-sm text-destructive">
            <div className="font-medium">{t('pdaMove.atomicFailed')}</div>
            <div>{t(failure.errorKey, failure.params)}</div>
          </PdaCard>
        )}
        {draft?.discrepancy && (
          <PdaCard className="text-sm">
            {t('pdaMove.discrepancyAfterLines', {
              sku: draft.discrepancy.skuCode,
              location: draft.discrepancy.locationCode,
            })}
          </PdaCard>
        )}
        <PdaSection title={t('pdaMove.linesTitle', { count: lines.length })}>
          {lines.map((line, i) => (
            <MoveLineCard
              key={line.id}
              flow={flow}
              line={line}
              index={i}
              failed={failure?.line === i + 1}
              action={
                <button
                  type="button"
                  className="min-h-10 px-1 text-sm font-medium text-destructive"
                  onClick={() => void flow.removeLine(line)}
                >
                  {t('pdaMove.removeLine')}
                </button>
              }
            />
          ))}
        </PdaSection>
        <div className="flex justify-start">
          <button
            type="button"
            className="min-h-10 px-1 text-sm font-medium text-destructive"
            onClick={() => void flow.discard()}
          >
            {t('pdaMove.discardAll')}
          </button>
        </div>
      </div>
      <PdaFooter>
        <PdaButton variant="outline" className="flex-1" onClick={() => nav.returnTo('source')}>
          {t('pdaMove.addAnother')}
        </PdaButton>
        <PdaButton className="flex-1" onClick={() => nav.go('confirm')}>
          {t('pdaMove.toConfirm')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
