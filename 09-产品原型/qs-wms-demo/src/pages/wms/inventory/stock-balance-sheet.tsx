import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { BizCode, CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { expiryLevelMeta, inventoryTagMeta, qualityMeta } from '@/config/status'
import type { BalanceRow, SkuStockRow } from '@/lib/inventory-derive'
import { ledgerNumbers } from '@/lib/inventory-ledger'
import { containerIdOf } from '@/lib/container-id'
import { useDb, useLookups } from '@/mock/db'
import { DocLink, LocationCode, SignedNum } from './inventory-shared'
import { QualityConvertDialog } from './quality-convert-dialog'

/**
 * 批次库存详情：余额维度、批次效期、数量、作业提示与追溯；不推断单件SN位置。
 * 正常品且可转换数量大于 0 时页头给「品质转换」，转换成功后在顶部列出本次一减一加两条流水；
 * 自动过期转换只展示结果或待补做原因，不设执行按钮。
 */
export function StockBalanceSheet({
  row,
  skuRow,
  onClose,
}: {
  row?: BalanceRow
  skuRow?: SkuStockRow
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku, customerCode, customerName } = useLookups()
  const logs = useDb((s) => s.inventoryLogs)
  const containers = useDb((s) => s.containers)
  const warehouses = useDb((s) => s.warehouseMasters)
  const [converting, setConverting] = useState(false)
  const [convertedAction, setConvertedAction] = useState<string>()
  const numbers = useMemo(() => ledgerNumbers(logs), [logs])
  const lastLogNo = row?.lastLog ? numbers.get(row.lastLog.id) : undefined
  const convertedLogs = convertedAction ? logs.filter((l) => l.actionId === convertedAction) : []

  if (!row)
    return (
      <DetailSheet open onClose={onClose} title={<DetailTitle title={t('inventory.stock.balanceTitle')} />}>
        <p className="text-sm text-muted-foreground">{t('inventory.notFoundOrNoAccess')}</p>
      </DetailSheet>
    )

  const r = row.record
  const container = containers.find((c) => containerIdOf(c.warehouseCode, c.containerNo) === r.containerId)
  const expiryConversion =
    r.qualityType === 'DEFECTIVE' && row.expiry === 'EXPIRED'
      ? t('inventory.stock.autoConverted')
      : row.expiryPending
        ? t('inventory.stock.pendingConvert', { reason: t(`inventory.expiryPending.${row.expiryPending}`) })
        : undefined
  const viewLogs = () =>
    navigate(
      `/wms/inventory/logs?customerId=${r.customerId}&sku=${encodeURIComponent(r.skuCode)}&quality=${r.qualityType}&location=${encodeURIComponent(r.locationCode)}${r.batchNo ? `&batch=${encodeURIComponent(r.batchNo)}` : ''}`,
    )

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={
        <DetailTitle
          title={t('inventory.stock.balanceTitle')}
          code={
            <span className="flex items-center gap-2">
              <BizCode className="text-base">{r.skuCode}</BizCode>
              <span className="font-normal text-muted-foreground">@</span>
              <BizCode className="text-base">{r.locationCode}</BizCode>
              {row.counting && <TagLabel meta={inventoryTagMeta.counting} />}
            </span>
          }
        />
      }
    >
      {convertedLogs.length > 0 && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {t('inventory.convert.pairLogs')}
            {convertedLogs.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1.5">
                <DocNo onClick={() => navigate(`/wms/inventory/logs?log=${l.id}`)}>{numbers.get(l.id) ?? l.id}</DocNo>
                {l.qualityType && <TagLabel meta={qualityMeta[l.qualityType]} />}
                <SignedNum value={l.qtyChange} />
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}
      <Section
        title={t('inventory.stock.identity')}
        extra={
          <>
            <Button variant="outline" size="sm" onClick={viewLogs}>
              {t('inventory.viewLogs')}
            </Button>
            {row.convertible > 0 && (
              <Button size="sm" onClick={() => setConverting(true)}>
                {t('inventory.convert.title')}
              </Button>
            )}
          </>
        }
      >
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.warehouse')}>
            <CodeName code={r.warehouseCode} name={warehouses.find((w) => w.code === r.warehouseCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.owner')}>
            <CodeName code={customerCode(r.customerId)} name={customerName(r.customerId)} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.sku')}>
            <CodeName code={r.skuCode} name={sku(r.skuCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.location')}>
            <LocationCode code={r.locationCode} usage={row.usage} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.containerNo')}>
            {container ? (
              <Link className="text-primary underline-offset-4 hover:underline" to={`/wms/master/containers/${encodeURIComponent(container.containerNo)}?wh=${encodeURIComponent(container.warehouseCode)}`}>
                <BizCode>{container.containerNo}</BizCode>
              </Link>
            ) : (
              <Empty />
            )}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.quality')}>
            <TagLabel meta={qualityMeta[r.qualityType]} />
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.stock.batchExpiry')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.batchNo')}>{r.batchNo || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('inventory.productionDate')}>{r.productionDate || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('inventory.expiryDate')}>{r.expiryDate || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('inventory.expiry')}>
            {row.expiry ? <TagLabel meta={expiryLevelMeta[row.expiry]} /> : <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.stock.quantity')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.actual')}>
            <Num value={r.onHandQty} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.allocated')}>
            <Num value={row.allocated} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.allocatableQty')}>
            <span className="inline-flex items-center gap-1.5">
              <Num value={row.allocatable} />
              {row.stagingGood && <TagLabel meta={inventoryTagMeta.notAllocatable} />}
            </span>
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.stock.workStatus')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.normalAllocatable')}>
            {row.normalAllocatable ? t('inventory.yes') : t('inventory.no')}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.countStatus')}>
            {row.counting ? (
              <span className="inline-flex items-center gap-2">
                <TagLabel meta={inventoryTagMeta.counting} />
                <DocLink no={row.counting.no} />
              </span>
            ) : (
              <Empty />
            )}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.workHints')}>
            {row.pending ? <TagLabel meta={inventoryTagMeta.pending} /> : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.stock.expiryConversion')}>
            {expiryConversion ?? <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.stock.trace')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.inventoryId')}>
            <BizCode>{r.id}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('inventory.lastLog')}>
            {row.lastLog && lastLogNo ? (
              <DocNo onClick={() => navigate(`/wms/inventory/logs?log=${row.lastLog!.id}`)}>{lastLogNo}</DocNo>
            ) : (
              <Empty />
            )}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.lastChangedAt')}>
            <DateTime value={row.lastChangedAt} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.createdAt')}>
            <DateTime value={row.createdAt} />
          </DescriptionItem>
        </Descriptions>
      </Section>
      {Boolean(r.serialNos?.length) && (
        <Section title={t('inventory.stock.serialCount', { count: r.serialNos!.length })}>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {r.serialNos!.map((sn) => (
              <BizCode key={sn}>{sn}</BizCode>
            ))}
          </div>
        </Section>
      )}
      {converting && (
        <QualityConvertDialog
          row={row}
          skuRow={skuRow}
          onClose={() => setConverting(false)}
          onConverted={setConvertedAction}
        />
      )}
    </DetailSheet>
  )
}
