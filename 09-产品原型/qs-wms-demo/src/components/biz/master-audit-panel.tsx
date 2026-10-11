import { useTranslation } from 'react-i18next'
import { DateTime } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { Panel } from '@/components/biz/page-container'
import type { MasterDataI18nScope } from '@/lib/master-data'

type MasterAuditPanelProps = {
  scope: MasterDataI18nScope
  updatedBy: string
  updatedAt: string
}

/** 详情页「维护信息」：仅最后修改人、最后修改时间 */
export function MasterAuditPanel({ scope, updatedBy, updatedAt }: MasterAuditPanelProps) {
  const { t } = useTranslation()

  return (
    <Panel className="space-y-3 p-4">
      <h2 className="text-sm font-medium">{t(`${scope}.sectionAudit`)}</h2>
      <Descriptions columns={4}>
        <DescriptionItem label={t(`${scope}.updatedBy`)}>{updatedBy}</DescriptionItem>
        <DescriptionItem label={t(`${scope}.updatedAt`)}>
          <DateTime value={updatedAt} />
        </DescriptionItem>
      </Descriptions>
    </Panel>
  )
}
