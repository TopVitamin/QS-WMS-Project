import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { BizCode, CodeName, DateTime, DocNo, Empty } from '@/components/biz/display'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { TagLabel } from '@/components/biz/status-badge'
import { qualityMeta, serialStatusMeta } from '@/config/status'
import { serialTrack, type SerialRow, type SerialTrackNode } from '@/lib/inventory-derive'
import { ledgerNumbers } from '@/lib/inventory-ledger'
import { useDb, useLookups } from '@/mock/db'
import { DocLink } from './inventory-shared'

/**
 * SN库存详情抽屉：单件当前状态、来源信息与轨迹。轨迹按业务发生时间正序，一减一加合成一个节点，
 * 只列实际发生的节点；已出库、已盘亏保留最后位置供追溯。
 */
export function StockSerialSheet({ row, onClose }: { row?: SerialRow; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku, customerCode, customerName } = useLookups()
  const logs = useDb((s) => s.inventoryLogs)
  const track = useMemo(() => (row ? serialTrack(logs, row.customerId, row.skuCode, row.serialNo) : []), [logs, row])
  const numbers = useMemo(() => ledgerNumbers(logs), [logs])

  const columns = useMemo(() => {
    const col = createDataColumns<SerialTrackNode>()
    return col.columns([
      col.accessor('at', {
        header: t('inventory.logs.occurredShort'),
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('type', {
        header: t('inventory.logs.type'),
        cell: ({ getValue }) => t(`inventory.type.${getValue()}`),
      }),
      col.accessor((n) => n.qualityType ?? '', {
        id: 'quality',
        header: t('inventory.quality'),
        cell: ({ row: r }) =>
          r.original.qualityType ? <TagLabel meta={qualityMeta[r.original.qualityType]} /> : <Empty />,
      }),
      col.accessor((n) => n.log.refNo, {
        id: 'source',
        header: t('inventory.logs.sourceDoc'),
        cell: ({ getValue }) => <DocLink no={getValue()} />,
      }),
      col.accessor((n) => n.log.id, {
        id: 'log',
        header: t('inventory.logs.logNo'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/inventory/logs?log=${getValue()}`)}>
            {numbers.get(getValue()) ?? ''}
          </DocNo>
        ),
      }),
    ])
  }, [navigate, numbers, t])

  if (!row)
    return (
      <DetailSheet open onClose={onClose} title={<DetailTitle title={t('inventory.stock.serialTitle')} />}>
        <p className="text-sm text-muted-foreground">{t('inventory.notFoundOrNoAccess')}</p>
      </DetailSheet>
    )

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={
        <DetailTitle
          title={t('inventory.stock.serialTitle')}
          code={row.serialNo}
          status={serialStatusMeta[row.status]}
        />
      }
    >
      <Section title={t('inventory.stock.currentState')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.sku')}>
            <CodeName code={row.skuCode} name={sku(row.skuCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.owner')}>
            <CodeName code={customerCode(row.customerId)} name={customerName(row.customerId)} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.warehouse')}>
            <BizCode>{row.warehouseCode}</BizCode>
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.stock.sourceInfo')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.lastSource')}>
            <DocLink no={row.lastLog?.refNo || row.lastLog?.jobNo} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.lastLog')}>
            {row.lastLog ? (
              <DocNo onClick={() => navigate(`/wms/inventory/logs?log=${row.lastLog!.id}`)}>
                {numbers.get(row.lastLog.id) ?? ''}
              </DocNo>
            ) : (
              <Empty />
            )}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.lastChangedAt')}>
            <DateTime value={row.lastChangedAt} />
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section flush title={t('inventory.stock.track')}>
        <DataTable
          data={track}
          columns={columns}
          getRowId={(n) => n.id}
          paginate={false}
          showColumnSettings={false}
          emptyText={t('inventory.stock.noTrack')}
        />
      </Section>
    </DetailSheet>
  )
}
