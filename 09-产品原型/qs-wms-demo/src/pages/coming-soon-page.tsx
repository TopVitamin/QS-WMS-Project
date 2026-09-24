import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { findMenuLeaf } from '@/config/menu'

export function ComingSoonPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const leaf = findMenuLeaf(location.pathname)
  return (
    <PageContainer title={leaf ? t(leaf.titleKey) : t('common.comingSoon')}>
      <Panel className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Construction className="size-7 text-muted-foreground" />
        </div>
        <div className="text-base font-medium">{t('common.comingSoon')}</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t('common.comingSoonDesc', { milestone: leaf?.milestone ?? '-' })}
        </p>
      </Panel>
    </PageContainer>
  )
}
