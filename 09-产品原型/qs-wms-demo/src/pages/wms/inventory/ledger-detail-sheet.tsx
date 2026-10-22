import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { BizCode, CodeName, DateTime, Empty, Num } from '@/components/biz/display'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { qualityMeta } from '@/config/status'
import { ledgerChange, ledgerObject } from '@/lib/inventory-ledger'
import { useDb, useLookups } from '@/mock/db'
import type { InventoryLog } from '@/types/wms'
import { documentPath } from './inventory-helpers'
import { DocLink, SignedNum } from './inventory-shared'

/**
 * 流水详情只读本条数量变化、余额维度、业务来源及实际SN依据；不合并或联动另一条流水。
 */
export function LedgerDetailSheet({ log, no, onClose }: { log?: InventoryLog; no?: string; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku, customerCode, customerName } = useLookups()
  const warehouses = useDb((s) => s.warehouseMasters)

  if (!log)
    return (
      <DetailSheet open onClose={onClose} title={<DetailTitle title={t('inventory.logs.title')} />}>
        <p className="text-sm text-muted-foreground">{t('inventory.notFoundOrNoAccess')}</p>
      </DetailSheet>
    )

  const object = ledgerObject(log)
  const sourcePath = documentPath(log.refNo)
  const reserved = object === 'RESERVED'

  return (
    <DetailSheet open onClose={onClose} title={<DetailTitle title={t('inventory.logs.title')} code={no} />}>
      <Section
        title={t('inventory.logs.changeSection')}
        extra={
          sourcePath ? (
            <Button variant="outline" size="sm" onClick={() => navigate(sourcePath)}>
              {t('inventory.logs.sourceDoc')}
            </Button>
          ) : undefined
        }
      >
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.logs.type')}>{t(`inventory.type.${log.type}`)}</DescriptionItem>
          <DescriptionItem label={t('inventory.logs.object')}>{t(`inventory.object.${object}`)}</DescriptionItem>
          <DescriptionItem label={t('inventory.logs.change')}>
            <SignedNum value={ledgerChange(log)} />
          </DescriptionItem>
          <DescriptionItem label={t(reserved ? 'inventory.logs.beforeReserved' : 'inventory.logs.beforeActual')}>
            <Num value={log.beforeQty ?? 0} />
          </DescriptionItem>
          <DescriptionItem label={t(reserved ? 'inventory.logs.afterReserved' : 'inventory.logs.afterActual')}>
            <Num value={log.afterQty ?? 0} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.occurredAt')}>
            <DateTime value={log.createdAt} />
          </DescriptionItem>
        </Descriptions>
        <p className="mt-2 text-xs text-muted-foreground">
          {t(reserved ? 'inventory.logs.basisReservedNote' : 'inventory.logs.basisActualNote')}
        </p>
      </Section>
      <Section title={t('inventory.logs.dimensions')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.warehouse')}>
            <CodeName code={log.warehouseCode} name={warehouses.find((w) => w.code === log.warehouseCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.owner')}>
            <CodeName code={customerCode(log.customerId)} name={customerName(log.customerId)} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.sku')}>
            <CodeName code={log.skuCode} name={sku(log.skuCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.location')}>
            {!reserved && log.locationCode ? <BizCode>{log.locationCode}</BizCode> : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.batchNo')}>{(!reserved && log.batchNo) || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('inventory.quality')}>
            {log.qualityType ? <TagLabel meta={qualityMeta[log.qualityType]} /> : <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.logs.source')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.logs.sourceType')}>
            {log.sourceType ? t(`inventory.source.${log.sourceType}`) : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.sourceNo')}>
            <DocLink no={log.refNo} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.sourceLine')}>
            {log.sourceLineNo ? <Num value={log.sourceLineNo} /> : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.jobNo')}>
            <DocLink no={log.jobNo} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.actionId')}>
            {log.actionId ? <BizCode>{log.actionId}</BizCode> : <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>
      {Boolean(log.serialNos?.length) && (
        <Section title={t('inventory.logs.serials')}>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {log.serialNos!.map((sn) => (
              <BizCode key={sn}>{sn}</BizCode>
            ))}
          </div>
        </Section>
      )}
      <Section title={t('inventory.logs.reason')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.logs.reasonCode')}>
            {log.reasonCode ? t(`inventory.reason.${log.reasonCode}`) : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.ownerNotice')}>
            {log.ownerNotice ? t(`inventory.ownerNotice.${log.ownerNotice}`) : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.operator')}>{log.operator || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('inventory.logs.terminal')}>
            {log.terminal ? t(`inventory.terminal.${log.terminal}`) : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.reasonNote')} className="col-span-full" multiline>
            {log.reasonNote || <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.evidence')} className="col-span-full" multiline>
            {log.evidence || <Empty />}
          </DescriptionItem>
        </Descriptions>
        {log.type === 'ADJUST' && <p className="text-xs text-muted-foreground">{t('inventory.logs.stocktakeLink')}</p>}
      </Section>
    </DetailSheet>
  )
}
