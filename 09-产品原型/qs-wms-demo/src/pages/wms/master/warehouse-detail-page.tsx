import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { BizCode, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { MasterDetailActions } from '@/components/biz/master-detail-actions'
import { DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { WarehouseFullAddressPreview } from '@/components/biz/warehouse-full-address-preview'
import { usageStatusMeta } from '@/config/status'
import { countryLabelKey } from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'

export function WarehouseDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const warehouse = useDb((s) => s.warehouseMasters.find((w) => w.code === code))

  if (!code || code === 'new') return <Navigate to="/wms/master/warehouses" replace />
  if (!warehouse) return <Navigate to="/wms/master/warehouses" replace />

  const countryLabel = countryLabelKey(warehouse.countryCode)

  return (
    <PageContainer
      title={
        <DetailTitle
          title={t('masterWarehouse.detailTitle')}
          code={warehouse.code}
          status={usageStatusMeta[warehouse.status]}
        />
      }
      actions={
        <MasterDetailActions
          scope="masterWarehouse"
          backTo="/wms/master/warehouses"
          enabled={warehouse.status === 'ENABLED'}
          onToggle={() => undefined}
          showStatusAction={false}
          onEdit={() => navigate(`/wms/master/warehouses/${code}/edit`)}
        />
      }
    >
      <Section title={t('masterWarehouse.sectionBasic')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.code')}>
            <BizCode>{warehouse.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.name')}>{warehouse.name}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.timezone')}>
            <BizCode>{warehouse.timezone}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.currency')}>{warehouse.currency}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.remark')} className="col-span-full xl:col-span-3">
            {warehouse.remark || <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterWarehouse.sectionOperation')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.unitSystem')}>
            {t(`masterWarehouse.unitSystemOption.${warehouse.unitSystem}`)}
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.defaultReceiptMethod')}>
            {t(`enum.arrivalMethod.${warehouse.defaultReceiptMethod}`)}
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.receivingStagingLocation')}>
            <BizCode>{warehouse.receivingStagingLocation}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.outboundStagingLocation')}>
            <BizCode>{warehouse.outboundStagingLocation}</BizCode>
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterWarehouse.sectionAddress')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.countryName')}>{t(countryLabel)}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.state')}>{warehouse.state || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.city')}>{warehouse.city}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.district')}>{warehouse.district || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.address1')} className="col-span-full xl:col-span-2">{warehouse.address1}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.address2')} className="col-span-full xl:col-span-2">
            {warehouse.address2 || <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.postalCode')}>{warehouse.postalCode || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.fullAddress')} className="col-span-full xl:col-span-3" multiline>
            <WarehouseFullAddressPreview data={warehouse} countryLabel={t(countryLabel)} />
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterWarehouse.sectionContact')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterWarehouse.contactName')}>{warehouse.contactName || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.contactPhone')}>{warehouse.contactPhone || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterWarehouse.contactEmail')}>{warehouse.contactEmail || <Empty />}</DescriptionItem>
        </Descriptions>
      </Section>

      <MasterAuditPanel scope="masterWarehouse" updatedBy={warehouse.updatedBy} updatedAt={warehouse.updatedAt} />
    </PageContainer>
  )
}
