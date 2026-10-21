import { useEffect } from 'react'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaFigure } from '@/components/pda/pda-stock'
import { MoveContext } from './move-shared'
import type { MoveFlow } from './use-move-flow'

/** 提交确认（PDA移库 PRD）：同仓库、同货主，整次成功或整次失败；提交后返回一个移库作业号 */
export function MoveConfirmStep({ flow }: { flow: MoveFlow }) {
  const { t, nav, draft, warehouse } = flow
  const lines = draft?.lines ?? []

  useEffect(() => {
    if (lines.length === 0 && !flow.leaving.current) nav.replace('source')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length])

  if (lines.length === 0) return null
  const owner = lines[0].customerId
  return (
    <>
      <PdaHeader title={t('pdaMove.confirmTitle')} onBack={() => nav.back({ step: 'lines' })} />
      <MoveContext flow={flow} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard className="grid grid-cols-2 gap-3">
          <PdaFigure label={t('pdaMove.lineCount')} value={lines.length} />
          <PdaFigure label={t('pdaMove.totalQty')} value={lines.reduce((n, l) => n + l.qty, 0)} />
        </PdaCard>
        <PdaCard className="grid grid-cols-2 gap-3">
          <PdaFigure
            size="md"
            label={t('inventory.warehouse')}
            value={<span className="font-mono">{warehouse.code}</span>}
          />
          <PdaFigure size="md" label={t('inventory.owner')} value={flow.ownerCode(owner)} />
        </PdaCard>
        <p className="text-sm text-muted-foreground">{t('pdaMove.confirmHint')}</p>
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={flow.submit}>
          {t('pdaMove.submit')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
