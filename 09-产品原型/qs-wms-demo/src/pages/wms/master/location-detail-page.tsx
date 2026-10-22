import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { BizCode, CodeName, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { MasterDetailActions } from '@/components/biz/master-detail-actions'
import { DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
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
  const occupants = useDb(
    useShallow((s) =>
      warehouseCode && code
        ? [
            ...new Set(
              s.inventory
                .filter((r) => r.warehouseCode === warehouseCode && r.locationCode === code && r.onHandQty > 0)
                .map((r) => r.customerId),
            ),
          ]
        : [],
    ),
  )
  const zone = useDb((s) => s.zoneMasters.find((z) => z.code === location?.zoneCode))

  if (!code || !warehouseCode) return <Navigate to="/wms/master/locations" replace />
  if (!location) return <Navigate to="/wms/master/locations" replace />

  const productFormsLabel =
    location.productForms.length > 0
      ? location.productForms.map((f) => t(PRODUCT_FORM_I18N[f])).join(t('common.listSeparator'))
      : t('masterLocation.productFormUnlimited')

  return (
    <PageContainer
      title={
        <DetailTitle
          title={t('masterLocation.detailTitle')}
          code={location.code}
          status={usageStatusMeta[location.status]}
        />
      }
      actions={
        <MasterDetailActions
          scope="masterLocation"
          backTo="/wms/master/locations"
          enabled={location.status === 'ENABLED'}
          onToggle={(next) => toggleStatus(location.warehouseCode, location.code, next)}
          onEdit={() => navigate(locationEditPath(location.warehouseCode, location.code))}
        />
      }
    >
      <Section title={t('masterLocation.sectionOccupancy')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.currentOccupancy')} className="col-span-full xl:col-span-3">
            {occupants.length ? (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {occupants.map((id) => (
                  <CodeName key={id} code={customerCode(id)} name={customerName(id)} />
                ))}
              </div>
            ) : (
              t('masterLocation.occupancyIdle')
            )}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterLocation.sectionBasic')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.zoneCode')}>
            <CodeName code={location.zoneCode} name={zone?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.warehouseCode')}>
            <CodeName code={location.warehouseCode} name={warehouse?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.zoneType')}>
            {t(ZONE_TYPE_I18N[location.zoneType])}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.code')}>
            <BizCode>{location.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.remark')} className="col-span-full xl:col-span-3">
            {location.remark || <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterLocation.sectionOps')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.putawaySequence')}>
            {location.putawaySequence ?? <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('masterLocation.pickSequence')}>
            {location.pickSequence ?? <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterLocation.sectionStructure')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.aisle')}>{location.aisle || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterLocation.bay')}>{location.bay || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterLocation.level')}>{location.level || <Empty />}</DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterLocation.sectionAdapt')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterLocation.productForms')} className="col-span-full xl:col-span-3">
            {productFormsLabel}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <MasterAuditPanel scope="masterLocation" updatedBy={location.updatedBy} updatedAt={location.updatedAt} />
    </PageContainer>
  )
}
