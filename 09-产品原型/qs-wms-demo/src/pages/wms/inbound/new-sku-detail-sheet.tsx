import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { BizCode, CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { MockPhotoList } from '@/components/biz/mock-photo-field'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { formatLength, formatWeightValue, lengthUnitLabel, weightUnitLabel } from '@/lib/unit'
import { useDb, useLookups } from '@/mock/db'
import type { NewSkuRecord } from '@/types/inbound'
import type { UnitSystem } from '@/types/wms'

/**
 * 新品维护记录详情（新品维护主PRD 第三节）：只读抽屉，标题「新品维护 · 记录号」，
 * 字段按「基本信息 / 实测规格 / 留底信息」分卡，写法同入库单详情；实测规格按查看仓库单位展示。
 */
export function NewSkuDetailSheet({
  record,
  onClose,
  unit,
}: {
  record?: NewSkuRecord
  onClose: () => void
  unit: UnitSystem
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku, customerCode, customerName } = useLookups()
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const master = record ? sku(record.skuCode) : undefined
  const warehouseName = record ? warehouseMasters.find((w) => w.code === record.warehouseCode)?.name : undefined

  return (
    <DetailSheet
      open={!!record}
      onClose={onClose}
      title={record ? <DetailTitle title={t('newSku.detailTitle')} code={record.recordNo} /> : null}
    >
      {record && (
        <>
          <Section title={t('common.basicInfo')}>
            <Descriptions columns={3}>
              <DescriptionItem label={t('common.customer')}>
                <CodeName code={customerCode(record.customerId)} name={customerName(record.customerId)} />
              </DescriptionItem>
              <DescriptionItem label={t('common.sku')}>
                <CodeName code={record.skuCode} name={master?.name} />
              </DescriptionItem>
              <DescriptionItem label={t('masterSku.barcode')}>
                {master?.barcode ? <BizCode>{master.barcode}</BizCode> : <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('newSku.maintainedWarehouse')}>
                <CodeName code={record.warehouseCode} name={warehouseName} />
              </DescriptionItem>
              <DescriptionItem label={t('newSku.sourceInboundNo')}>
                {record.sourceInboundNo ? (
                  <DocNo onClick={() => navigate(`/wms/inbound/orders/${record.sourceInboundNo}`)}>
                    {record.sourceInboundNo}
                  </DocNo>
                ) : (
                  <Empty />
                )}
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={`${t('newSku.measured')} · ${lengthUnitLabel(unit)} / ${weightUnitLabel(unit)}`}>
            <Descriptions columns={4}>
              <DescriptionItem label={`${t('newSku.length')} (${lengthUnitLabel(unit)})`}>
                <span className="tabular-nums">{formatLength(record.lengthCm, unit)}</span>
              </DescriptionItem>
              <DescriptionItem label={`${t('newSku.width')} (${lengthUnitLabel(unit)})`}>
                <span className="tabular-nums">{formatLength(record.widthCm, unit)}</span>
              </DescriptionItem>
              <DescriptionItem label={`${t('newSku.height')} (${lengthUnitLabel(unit)})`}>
                <span className="tabular-nums">{formatLength(record.heightCm, unit)}</span>
              </DescriptionItem>
              <DescriptionItem label={`${t('newSku.grossWeight')} (${weightUnitLabel(unit)})`}>
                <span className="tabular-nums">{formatWeightValue(record.grossWeightKg, unit)}</span>
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={t('newSku.recordSection')}>
            <Descriptions columns={3}>
              <DescriptionItem label={t('newSku.maintainedBy')}>{record.maintainedBy}</DescriptionItem>
              <DescriptionItem label={t('newSku.maintainedAt')}>
                <DateTime value={record.maintainedAt} />
              </DescriptionItem>
              <DescriptionItem label={t('newSku.remark')} multiline>
                {record.remark || <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.photo')} className="col-span-full xl:col-span-3" multiline>
                <MockPhotoList value={record.photos} />
              </DescriptionItem>
            </Descriptions>
          </Section>
        </>
      )}
    </DetailSheet>
  )
}
