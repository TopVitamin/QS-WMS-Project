import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { PdaHeader } from '@/components/pda/pda-header'

const milestoneOf: Record<string, string> = {
  sign: 'M1',
  query: 'M2',
  move: 'M2',
  count: 'M2',
  pick: 'M3',
  pack: 'M3',
  handover: 'M3',
}

export function PdaComingSoonPage() {
  const { t } = useTranslation()
  const { fn = '' } = useParams()
  return (
    <>
      <PdaHeader title={t(`pda.${fn}`, { defaultValue: t('common.comingSoon') })} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <Construction className="size-12 text-muted-foreground" />
        <div className="text-base font-medium">{t('common.comingSoon')}</div>
        <p className="text-sm text-muted-foreground">{t('common.comingSoonDesc', { milestone: milestoneOf[fn] ?? '-' })}</p>
      </div>
    </>
  )
}
