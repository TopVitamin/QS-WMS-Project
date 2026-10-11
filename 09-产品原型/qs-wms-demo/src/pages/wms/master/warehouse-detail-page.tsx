import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { BizCode } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { usageStatusMeta } from '@/config/status'
import { WarehouseFullAddressPreview } from '@/components/biz/warehouse-full-address-preview'
import { WAREHOUSE_COUNTRY_OPTIONS } from '@/lib/warehouse-master'
import { useWarehouseMasterStatusToggle } from '@/hooks/use-warehouse-master-status'
import { useDb } from '@/mock/db'

export function WarehouseDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const warehouse = useDb((s) => s.warehouseMasters.find((w) => w.code === code))
  const toggleStatus = useWarehouseMasterStatusToggle()

  if (!code || code === 'new') return <Navigate to="/wms/master/warehouses" replace />
  if (!warehouse) return <Navigate to="/wms/master/warehouses" replace />

  const countryLabel =
    WAREHOUSE_COUNTRY_OPTIONS.find((c) => c.value === warehouse.countryCode)?.labelKey ??
    'masterWarehouse.country.OTHER'

  return (
    <PageContainer
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{t('masterWarehouse.detailTitle')}</span>
          <StatusBadge meta={usageStatusMeta[warehouse.status]} />
        </span>
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/wms/master/warehouses">{t('masterWarehouse.backToList')}</Link>
          </Button>
          {warehouse.status === 'ENABLED' ? (
            <Button variant="destructive" onClick={() => toggleStatus(warehouse.code, 'DISABLED')}>
              {t('masterWarehouse.disableAction')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toggleStatus(warehouse.code, 'ENABLED')}>
              {t('masterWarehouse.enableAction')}
            </Button>
          )}
          <Button onClick={() => navigate(`/wms/master/warehouses/${code}/edit`)}>{t('masterWarehouse.edit')}</Button>
        </>
      }
    >
      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterWarehouse.sectionBasic')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.code')}>
            <BizCode>{warehouse.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.name')}>{warehouse.name}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.timezone')}>
            <BizCode>{warehouse.timezone}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.currency')}>{warehouse.currency}</DescriptionItem>
          <DescriptionItem label={t('common.status')}>
            <StatusBadge meta={usageStatusMeta[warehouse.status]} />
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.remark')} className="col-span-3">
            {warehouse.remark || <span className="text-muted-foreground">-</span>}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterWarehouse.sectionAddress')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.countryName')}>{t(countryLabel)}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.state')}>{warehouse.state || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.city')}>{warehouse.city}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.district')}>{warehouse.district || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.address1')} className="col-span-2">{warehouse.address1}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.address2')} className="col-span-2">
            {warehouse.address2 || '-'}
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.postalCode')}>{warehouse.postalCode || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.fullAddress')} className="col-span-3" multiline>
            <WarehouseFullAddressPreview data={warehouse} countryLabel={t(countryLabel)} />
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterWarehouse.sectionContact')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.contactName')}>{warehouse.contactName || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.contactPhone')}>{warehouse.contactPhone || '-'}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.contactEmail')}>{warehouse.contactEmail || '-'}</DescriptionItem>
        </Descriptions>
      </Panel>

      <MasterAuditPanel scope="masterWarehouse" updatedBy={warehouse.updatedBy} updatedAt={warehouse.updatedAt} />
    </PageContainer>
  )
}
