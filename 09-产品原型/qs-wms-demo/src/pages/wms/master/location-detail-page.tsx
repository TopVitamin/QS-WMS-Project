import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { BizCode } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { usageStatusMeta } from '@/config/status'
import { useLocationMasterStatusToggle } from '@/hooks/use-location-master-status'
import {
  locationEditPath,
  parseLocationWarehouse,
  PRODUCT_FORM_I18N,
  ZONE_TYPE_I18N,
} from '@/lib/location-master'
import { useDb, useLookups } from '@/mock/db'

export function LocationDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const [search] = useSearchParams()
  const warehouseCode = parseLocationWarehouse(search.toString())
  const toggleStatus = useLocationMasterStatusToggle()
  const { customerName, customerCode } = useLookups()

  const location = useDb((s) =>
    warehouseCode && code
      ? s.locationMasters.find((l) => l.warehouseCode === warehouseCode && l.code === code)
      : undefined,
  )
  const warehouse = useDb((s) => s.warehouseMasters.find((w) => w.code === warehouseCode))
  const zone = useDb((s) => s.zoneMasters.find((z) => z.code === location?.zoneCode))

  if (!code || !warehouseCode) return <Navigate to="/wms/master/locations" replace />
  if (!location) return <Navigate to="/wms/master/locations" replace />

  const enabled = location.status === 'ENABLED'
  const occupancy =
    location.occupyingCustomerId
      ? `${customerCode(location.occupyingCustomerId)} · ${customerName(location.occupyingCustomerId)}`
      : t('masterLocation.occupancyIdle')

  const productFormsLabel =
    location.productForms.length > 0
      ? location.productForms.map((f) => t(PRODUCT_FORM_I18N[f])).join('、')
      : t('masterLocation.productFormUnlimited')

  return (
    <PageContainer
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{t('masterLocation.detailTitle')}</span>
          <BizCode>{location.code}</BizCode>
          <StatusBadge meta={usageStatusMeta[location.status]} />
        </span>
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/wms/master/locations">{t('masterLocation.backToList')}</Link>
          </Button>
          {enabled ? (
            <Button
              variant="destructive"
              onClick={() => toggleStatus(location.warehouseCode, location.code, 'DISABLED')}
            >
              {t('masterLocation.disableAction')}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => toggleStatus(location.warehouseCode, location.code, 'ENABLED')}
            >
              {t('masterLocation.enableAction')}
            </Button>
          )}
          <Button onClick={() => navigate(locationEditPath(location.warehouseCode, location.code))}>
            {t('masterLocation.edit')}
          </Button>
        </>
      }
    >
      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionOccupancy')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.currentOccupancy')} className="col-span-3">
            {occupancy}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionBasic')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.zoneCode')}>
            {zone ? `${zone.code} · ${zone.name}` : location.zoneCode}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.warehouseCode')}>
            {warehouse ? `${warehouse.code} · ${warehouse.name}` : location.warehouseCode}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.zoneType')}>
            {t(ZONE_TYPE_I18N[location.zoneType])}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.code')}>
            <BizCode>{location.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('common.status')}>
            <StatusBadge meta={usageStatusMeta[location.status]} />
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.remark')} className="col-span-3">
            {location.remark || <span className="text-muted-foreground">-</span>}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionMix')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.allowMixSku')}>
            {location.allowMixSku ? t('common.yes') : t('common.no')}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.allowMixBatch')}>
            {location.allowMixBatch ? t('common.yes') : t('common.no')}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionOps')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.putawaySequence')}>
            {location.putawaySequence ?? '-'}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.pickSequence')}>
            {location.pickSequence ?? '-'}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionStructure')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.aisle')}>{location.aisle || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterLocation.bay')}>{location.bay || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterLocation.level')}>{location.level || '-'}</DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterLocation.sectionAdapt')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.productForms')} className="col-span-3">
            {productFormsLabel}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <MasterAuditPanel scope="masterLocation" updatedBy={location.updatedBy} updatedAt={location.updatedAt} />
    </PageContainer>
  )
}
