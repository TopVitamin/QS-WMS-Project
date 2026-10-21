import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { BizCode, CodeName, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { MasterDetailActions } from '@/components/biz/master-detail-actions'
import { DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { usageStatusMeta } from '@/config/status'
import { useZoneMasterStatusToggle } from '@/hooks/use-zone-master-status'
import { parseZoneWarehouse, zoneEditPath, ZONE_TYPE_I18N } from '@/lib/zone-master'
import { useDb } from '@/mock/db'
import type { ZoneType } from '@/types/wms'

export function ZoneDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const [search] = useSearchParams()
  const warehouseCode = parseZoneWarehouse(search.toString())
  const toggleStatus = useZoneMasterStatusToggle()

  const zone = useDb((s) =>
    warehouseCode && code
      ? s.zoneMasters.find((z) => z.warehouseCode === warehouseCode && z.code === code)
      : undefined,
  )
  const warehouse = useDb((s) => s.warehouseMasters.find((w) => w.code === warehouseCode))

  if (!code || !warehouseCode) return <Navigate to="/wms/master/zones" replace />
  if (!zone) return <Navigate to="/wms/master/zones" replace />

  return (
    <PageContainer
      title={<DetailTitle title={t('masterZone.detailTitle')} code={zone.code} status={usageStatusMeta[zone.status]} />}
      actions={
        <MasterDetailActions
          scope="masterZone"
          backTo="/wms/master/zones"
          enabled={zone.status === 'ENABLED'}
          onToggle={(next) => toggleStatus(zone, next)}
          onEdit={() => navigate(zoneEditPath(zone.warehouseCode, zone.code))}
        />
      }
    >
      <Section title={t('masterZone.sectionBasic')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterZone.warehouseCode')}>
            <CodeName code={zone.warehouseCode} name={warehouse?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('masterZone.code')}>
            <BizCode>{zone.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterZone.name')}>{zone.name}</DescriptionItem>
          <DescriptionItem label={t('masterZone.zoneType')}>{t(ZONE_TYPE_I18N[zone.zoneType as ZoneType])}</DescriptionItem>
          <DescriptionItem label={t('masterZone.remark')} className="col-span-full xl:col-span-3">
            {zone.remark || <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <MasterAuditPanel scope="masterZone" updatedBy={zone.updatedBy} updatedAt={zone.updatedAt} />
    </PageContainer>
  )
}
