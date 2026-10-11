import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { BizCode } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
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

  const enabled = zone.status === 'ENABLED'
  const warehouseLabel = warehouse ? `${warehouse.code} · ${warehouse.name}` : warehouseCode

  return (
    <PageContainer
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{t('masterZone.detailTitle')}</span>
          <BizCode>{zone.code}</BizCode>
          <StatusBadge meta={usageStatusMeta[zone.status]} />
        </span>
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/wms/master/zones">{t('masterZone.backToList')}</Link>
          </Button>
          {enabled ? (
            <Button variant="destructive" onClick={() => toggleStatus(zone, 'DISABLED')}>
              {t('masterZone.disableAction')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toggleStatus(zone, 'ENABLED')}>
              {t('masterZone.enableAction')}
            </Button>
          )}
          <Button onClick={() => navigate(zoneEditPath(zone.warehouseCode, zone.code))}>{t('masterZone.edit')}</Button>
        </>
      }
    >
      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterZone.sectionBasic')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterZone.warehouseCode')}>{warehouseLabel}</DescriptionItem>
          <DescriptionItem label={t('masterZone.code')}>
            <BizCode>{zone.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterZone.name')}>{zone.name}</DescriptionItem>
          <DescriptionItem label={t('masterZone.zoneType')}>{t(ZONE_TYPE_I18N[zone.zoneType as ZoneType])}</DescriptionItem>
          <DescriptionItem label={t('common.status')}>
            <StatusBadge meta={usageStatusMeta[zone.status]} />
          </DescriptionItem>
          <DescriptionItem label={t('masterZone.remark')} className="col-span-3">
            {zone.remark || <span className="text-muted-foreground">-</span>}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <MasterAuditPanel scope="masterZone" updatedBy={zone.updatedBy} updatedAt={zone.updatedAt} />
    </PageContainer>
  )
}
