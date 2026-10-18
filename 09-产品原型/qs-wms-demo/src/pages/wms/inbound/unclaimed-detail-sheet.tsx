import { useTranslation } from 'react-i18next'
import { BizCode, CodeName, DateTime, Empty, Num } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { MockPhotoList } from '@/components/biz/mock-photo-field'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { unclaimedStatusMeta } from '@/config/status'
import { useDb } from '@/mock/db'
import type { UnclaimedRecord } from '@/types/inbound'

/**
 * 无主货登记详情（无主货登记主PRD 第四节）：只读抽屉，标题「无主货登记 · 登记号 [状态]」，
 * 字段按「识别线索 / 登记信息」分卡，写法同入库单详情；不放任何业务按钮，也不出现库位。
 */
export function UnclaimedDetailSheet({ record, onClose }: { record?: UnclaimedRecord; onClose: () => void }) {
  const { t } = useTranslation()
  const warehouseMasters = useDb((s) => s.warehouseMasters)
  const warehouseName = record ? warehouseMasters.find((w) => w.code === record.warehouseCode)?.name : undefined

  return (
    <DetailSheet
      open={!!record}
      onClose={onClose}
      title={
        record ? (
          <DetailTitle
            title={t('unclaimed.detailTitle')}
            code={record.registerNo}
            status={unclaimedStatusMeta[record.status]}
          />
        ) : null
      }
    >
      {record && (
        <>
          <Section title={t('unclaimed.clueSection')}>
            <Descriptions columns={4}>
              <DescriptionItem label={t('unclaimed.trackingNos')} multiline>
                <CodeList values={record.trackingNos} />
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.cartonMarks')} multiline>
                <CodeList values={record.cartonMarks} />
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.containerNo')}>
                {record.containerNo ? <BizCode>{record.containerNo}</BizCode> : <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.cartonQty')}>
                <Num value={record.cartonQty} />
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.description')} className="col-span-4" multiline>
                {record.description || <Empty />}
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.photo')} className="col-span-4" multiline>
                <MockPhotoList value={record.photos} />
              </DescriptionItem>
            </Descriptions>
          </Section>

          <Section title={t('unclaimed.registerSection')}>
            <Descriptions columns={4}>
              <DescriptionItem label={t('common.warehouse')}>
                <CodeName code={record.warehouseCode} name={warehouseName} />
              </DescriptionItem>
              <DescriptionItem label={t('unclaimed.registeredBy')}>{record.registeredBy}</DescriptionItem>
              <DescriptionItem label={t('unclaimed.registeredAt')}>
                <DateTime value={record.registeredAt} />
              </DescriptionItem>
            </Descriptions>
          </Section>
        </>
      )}
    </DetailSheet>
  )
}

/** 运单号、箱唛号可有多个：逐行列出 */
function CodeList({ values }: { values: string[] }) {
  if (values.length === 0) return <Empty />
  return (
    <div className="flex flex-col gap-0.5">
      {values.map((v) => (
        <BizCode key={v}>{v}</BizCode>
      ))}
    </div>
  )
}
