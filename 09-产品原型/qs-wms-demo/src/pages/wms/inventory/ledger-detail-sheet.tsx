import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { qualityMeta } from '@/config/status'
import { ledgerChange, ledgerObject } from '@/lib/inventory-ledger'
import { useDb, useLookups } from '@/mock/db'
import type { InventoryLog } from '@/types/wms'
import { documentPath } from './inventory-helpers'
import { DocLink, SignedNum } from './inventory-shared'

/** 库位或品质之间的转移记一减一加两行，这几类必须能找到成对流水 */
const PAIRED_TYPES: InventoryLog['type'][] = ['PUTAWAY', 'PICK', 'RETURN', 'QUALITY', 'MOVE']

/**
 * 流水详情抽屉（库存流水页面骨架）：变动摘要、余额维度、来源关联、成对流水、SN 清单、原因与留痕。
 * 只读；成对流水点开切换到另一行，找不到配对时提示数据异常，不在前端补造。
 */
export function LedgerDetailSheet({
  log,
  no,
  numbers,
  onOpenLog,
  onClose,
}: {
  log?: InventoryLog
  no?: string
  numbers: Map<string, string>
  onOpenLog: (id: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku, customerCode, customerName } = useLookups()
  const logs = useDb((s) => s.inventoryLogs)
  const warehouses = useDb((s) => s.warehouseMasters)

  if (!log)
    return (
      <DetailSheet open onClose={onClose} title={<DetailTitle title={t('inventory.logs.title')} />}>
        <p className="text-sm text-muted-foreground">{t('inventory.notFoundOrNoAccess')}</p>
      </DetailSheet>
    )

  const object = ledgerObject(log)
  const paired = log.pairedLogId ? logs.find((l) => l.id === log.pairedLogId) : undefined
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
          <DescriptionItem label={t('inventory.logs.before')}>
            <Num value={log.beforeQty ?? 0} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.after')}>
            <Num value={log.afterQty ?? 0} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.logs.occurredAt')}>
            <DateTime value={log.createdAt} />
          </DescriptionItem>
        </Descriptions>
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
            {!reserved && log.qualityType ? <TagLabel meta={qualityMeta[log.qualityType]} /> : <Empty />}
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
          <DescriptionItem label={t('inventory.logs.pairedLog')}>
            {paired ? (
              <span className="inline-flex items-center gap-2">
                <DocNo onClick={() => onOpenLog(paired.id)}>{numbers.get(paired.id) ?? ''}</DocNo>
                <span className="text-muted-foreground">
                  {t('inventory.logs.pairTarget', {
                    change: `${ledgerChange(paired) > 0 ? '+' : ''}${ledgerChange(paired)}`,
                    location: paired.locationCode,
                  })}
                </span>
              </span>
            ) : (
              <Empty />
            )}
          </DescriptionItem>
        </Descriptions>
        {PAIRED_TYPES.includes(log.type) && !paired && (
          <Alert variant="destructive">
            <AlertDescription>{t('inventory.logs.pairMissing')}</AlertDescription>
          </Alert>
        )}
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
