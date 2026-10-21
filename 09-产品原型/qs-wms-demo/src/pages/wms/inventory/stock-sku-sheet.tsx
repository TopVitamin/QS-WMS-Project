import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { DetailSheet } from '@/components/biz/detail-sheet'
import { DetailTabs } from '@/components/biz/detail-tabs'
import { BizCode, CodeName, Empty, Num } from '@/components/biz/display'
import { DetailTitle, Section } from '@/components/biz/page-container'
import { StatusBadge, TagLabel } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { expiryLevelMeta, inventoryTagMeta, outboundStatusMeta, outboundTypeMeta, qualityMeta } from '@/config/status'
import { isLiveOutbound, type BalanceRow, type SerialRow, type SkuStockRow } from '@/lib/inventory-derive'
import { ledgerNumbers } from '@/lib/inventory-ledger'
import { sortLedger } from '@/lib/inventory-list-match'
import { useDb, useLookups } from '@/mock/db'
import type { OutboundStatus, OutboundType } from '@/types/outbound'
import { useLedgerColumns, type LedgerRow } from './inventory-columns'
import { AvailableQty, DocLink, LocationCode, PendingSource } from './inventory-shared'

interface ReservedRow {
  no: string
  type: OutboundType
  status: OutboundStatus
  reserved: number
}
interface AllocatedRow {
  id: string
  kind: 'PICK' | 'OTHER'
  no: string
  locationCode: string
  batchNo?: string
  qty: number
}

/**
 * SKU库存详情抽屉（库存查询页面骨架）：数量、库位分布、订单占用、已分配来源、SN 与最近流水。
 * 占用与分配都只读，跳原业务记录；待核对、盘点中不在这里手工解除。
 */
export function StockSkuSheet({
  row,
  balances,
  serials,
  onClose,
}: {
  row?: SkuStockRow
  balances: BalanceRow[]
  serials: SerialRow[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sku, customerCode, customerName } = useLookups()
  const orders = useDb((s) => s.outboundOrders)
  const tasks = useDb((s) => s.outboundPickTasks)
  const inventory = useDb((s) => s.inventory)
  const logs = useDb((s) => s.inventoryLogs)
  const warehouses = useDb((s) => s.warehouseMasters)

  const locationRows = useMemo(
    () =>
      row ? balances.filter((b) => b.record.customerId === row.customerId && b.record.skuCode === row.skuCode) : [],
    [balances, row],
  )
  const reservedRows = useMemo<ReservedRow[]>(
    () =>
      row
        ? orders
            .filter(
              (o) =>
                o.warehouseCode === row.warehouseCode && o.customerId === row.customerId && isLiveOutbound(o.status),
            )
            .map((o) => ({
              no: o.no,
              type: o.type,
              status: o.status,
              reserved: o.items.filter((i) => i.skuCode === row.skuCode).reduce((n, i) => n + i.reservedQty, 0),
            }))
            .filter((r) => r.reserved > 0)
        : [],
    [orders, row],
  )
  const allocatedRows = useMemo<AllocatedRow[]>(() => {
    if (!row) return []
    const picks = tasks
      .filter(
        (task) =>
          task.warehouseCode === row.warehouseCode &&
          task.customerId === row.customerId &&
          (task.status === 'PENDING_PICK' || task.status === 'PICKING'),
      )
      .flatMap((task) =>
        task.lines
          .filter((l) => l.skuCode === row.skuCode && l.plannedQty - l.pickedQty - l.shortageQty > 0)
          .map((l) => ({
            id: l.id,
            kind: 'PICK' as const,
            no: task.no,
            locationCode: l.locationCode,
            batchNo: l.batchNo,
            qty: l.plannedQty - l.pickedQty - l.shortageQty,
          })),
      )
    // 其他出库建单即指定实物；生成拣货任务后由任务行承接，不重复列
    const others = orders
      .filter(
        (o) =>
          o.type === 'OTHER' &&
          o.warehouseCode === row.warehouseCode &&
          o.customerId === row.customerId &&
          isLiveOutbound(o.status) &&
          !tasks.some((task) => task.orderNo === o.no),
      )
      .flatMap((o) =>
        o.specified
          .map((sp) => ({ sp, record: inventory.find((r) => r.id === sp.inventoryId) }))
          .filter(({ record }) => record?.skuCode === row.skuCode)
          .map(({ sp, record }) => ({
            id: `${o.no}-${sp.inventoryId}`,
            kind: 'OTHER' as const,
            no: o.no,
            locationCode: record!.locationCode,
            batchNo: record!.batchNo,
            qty: sp.qty,
          })),
      )
    return [...picks, ...others]
  }, [inventory, orders, row, tasks])
  const serialRows = useMemo(
    () =>
      row
        ? serials.filter((s) => s.customerId === row.customerId && s.skuCode === row.skuCode && s.status === 'IN_STOCK')
        : [],
    [row, serials],
  )
  const logRows = useMemo<LedgerRow[]>(() => {
    if (!row) return []
    const numbers = ledgerNumbers(logs)
    return sortLedger(
      logs.filter(
        (l) => l.warehouseCode === row.warehouseCode && l.customerId === row.customerId && l.skuCode === row.skuCode,
      ),
    )
      .slice(0, 10)
      .map((log) => ({ log, no: numbers.get(log.id) ?? '' }))
  }, [logs, row])

  const openLog = useCallback((r: LedgerRow) => navigate(`/wms/inventory/logs?log=${r.log.id}`), [navigate])
  const ledgerColumns = useLedgerColumns({ compact: true, onOpen: openLog })

  const locationColumns = useMemo(() => {
    const col = createDataColumns<BalanceRow>()
    return col.columns([
      col.accessor((b) => b.record.locationCode, {
        id: 'location',
        header: t('inventory.location'),
        cell: ({ row: r }) => <LocationCode code={r.original.record.locationCode} usage={r.original.usage} />,
      }),
      col.accessor((b) => b.record.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((b) => b.record.qualityType, {
        id: 'quality',
        header: t('inventory.quality'),
        cell: ({ getValue }) => <TagLabel meta={qualityMeta[getValue()]} />,
      }),
      col.accessor((b) => b.expiry ?? '', {
        id: 'expiry',
        header: t('inventory.expiry'),
        cell: ({ row: r }) => (r.original.expiry ? <TagLabel meta={expiryLevelMeta[r.original.expiry]} /> : <Empty />),
      }),
      col.accessor((b) => b.record.onHandQty, {
        id: 'actual',
        header: t('inventory.actual'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('allocated', {
        header: t('inventory.allocated'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.accessor('allocatable', {
        header: t('inventory.allocatable'),
        meta: { align: 'right' },
        cell: ({ row: r }) => (
          <span className="inline-flex items-center justify-end gap-1.5">
            {r.original.stagingGood && <TagLabel meta={inventoryTagMeta.notAllocatable} />}
            <Num value={r.original.allocatable} />
          </span>
        ),
      }),
    ])
  }, [t])
  const reservedColumns = useMemo(() => {
    const col = createDataColumns<ReservedRow>()
    return col.columns([
      col.accessor('no', { header: t('inventory.stock.orderNo'), cell: ({ getValue }) => <DocLink no={getValue()} /> }),
      col.accessor('type', {
        header: t('inventory.stock.orderType'),
        cell: ({ getValue }) => <TagLabel meta={outboundTypeMeta[getValue()]} />,
      }),
      col.accessor('status', {
        header: t('inventory.stock.orderStatus'),
        cell: ({ getValue }) => <StatusBadge meta={outboundStatusMeta[getValue()]} />,
      }),
      col.accessor('reserved', {
        header: t('inventory.stock.reservedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])
  const allocatedColumns = useMemo(() => {
    const col = createDataColumns<AllocatedRow>()
    return col.columns([
      col.accessor('kind', {
        header: t('inventory.stock.allocationKind'),
        cell: ({ getValue }) =>
          t(getValue() === 'PICK' ? 'inventory.stock.allocationPick' : 'inventory.stock.allocationOther'),
      }),
      col.accessor('no', {
        header: t('inventory.stock.allocationJob'),
        cell: ({ getValue }) => <DocLink no={getValue()} />,
      }),
      col.accessor('locationCode', {
        header: t('inventory.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor((a) => a.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('qty', {
        header: t('inventory.stock.allocatedQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [t])
  const serialColumns = useMemo(() => {
    const col = createDataColumns<SerialRow>()
    return col.columns([
      col.accessor('serialNo', {
        header: t('inventory.serialNo'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('locationCode', {
        header: t('inventory.location'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor((s) => s.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((s) => s.qualityType ?? '', {
        id: 'quality',
        header: t('inventory.quality'),
        cell: ({ row: r }) =>
          r.original.qualityType ? <TagLabel meta={qualityMeta[r.original.qualityType]} /> : <Empty />,
      }),
    ])
  }, [t])

  if (!row)
    return (
      <DetailSheet open onClose={onClose} title={<DetailTitle title={t('inventory.stock.skuTitle')} />}>
        <p className="text-sm text-muted-foreground">{t('inventory.notFoundOrNoAccess')}</p>
      </DetailSheet>
    )

  const viewLogs = () =>
    navigate(`/wms/inventory/logs?customerId=${row.customerId}&sku=${encodeURIComponent(row.skuCode)}`)

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={
        <DetailTitle
          title={t('inventory.stock.skuTitle')}
          code={
            <span className="flex items-center gap-2">
              <BizCode className="text-base">{row.skuCode}</BizCode>
              {row.pending && <TagLabel meta={inventoryTagMeta.pending} />}
              {row.counting && <TagLabel meta={inventoryTagMeta.counting} />}
            </span>
          }
        />
      }
    >
      <Section
        title={t('inventory.basicInfo')}
        extra={
          <Button variant="outline" size="sm" onClick={viewLogs}>
            {t('inventory.viewLogs')}
          </Button>
        }
      >
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.warehouse')}>
            <CodeName code={row.warehouseCode} name={warehouses.find((w) => w.code === row.warehouseCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.owner')}>
            <CodeName code={customerCode(row.customerId)} name={customerName(row.customerId)} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.sku')}>
            <CodeName code={row.skuCode} name={sku(row.skuCode)?.name} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.allocation')}>
            {row.pending ? (
              <TagLabel meta={inventoryTagMeta.pending} />
            ) : (
              <TagLabel tone="green">{t('inventory.allocationStatus.NORMAL')}</TagLabel>
            )}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.pendingSources')} multiline>
            {row.pending?.sources.length ? (
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {row.pending.sources.map((source) => (
                  <PendingSource key={source} source={source} />
                ))}
              </span>
            ) : (
              <Empty />
            )}
          </DescriptionItem>
          <DescriptionItem label={t('inventory.relatedStocktake')}>
            {row.counting ? <DocLink no={row.counting.no} /> : <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>
      <Section title={t('inventory.stock.quantity')}>
        <Descriptions columns={3}>
          <DescriptionItem label={t('inventory.good')}>
            <Num value={row.good} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.defective')}>
            <Num value={row.defective} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.orderReserved')}>
            <Num value={row.orderReserved} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.actual')}>
            <Num value={row.actual} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.preoccupied')}>
            <Num value={row.preoccupied} />
          </DescriptionItem>
          <DescriptionItem label={t('inventory.available')}>
            <AvailableQty value={row.available} />
          </DescriptionItem>
        </Descriptions>
        {row.available < 0 && <p className="text-xs text-destructive">{t('inventory.negativeHint')}</p>}
      </Section>
      <DetailTabs
        items={[
          {
            value: 'locations',
            label: t('inventory.stock.tabLocations'),
            count: locationRows.length,
            content: (
              <DataTable
                data={locationRows}
                columns={locationColumns}
                getRowId={(b) => b.id}
                paginate={false}
                emptyText={t('inventory.stock.empty')}
              />
            ),
          },
          {
            value: 'reserved',
            label: t('inventory.stock.tabReserved'),
            count: reservedRows.length,
            content: (
              <DataTable
                data={reservedRows}
                columns={reservedColumns}
                getRowId={(r) => r.no}
                paginate={false}
                emptyText={t('inventory.stock.emptyReserved')}
              />
            ),
          },
          {
            value: 'allocated',
            label: t('inventory.stock.tabAllocated'),
            count: allocatedRows.length,
            content: (
              <DataTable
                data={allocatedRows}
                columns={allocatedColumns}
                getRowId={(r) => r.id}
                paginate={false}
                emptyText={t('inventory.stock.emptyAllocated')}
              />
            ),
          },
          {
            value: 'serials',
            label: t('inventory.stock.tabSerials'),
            count: serialRows.length,
            hidden: serialRows.length === 0,
            content: <DataTable data={serialRows} columns={serialColumns} getRowId={(s) => s.id} paginate={false} />,
          },
          {
            value: 'logs',
            label: t('inventory.stock.tabLogs'),
            count: logRows.length,
            content: (
              <DataTable
                data={logRows}
                columns={ledgerColumns}
                getRowId={(r) => r.log.id}
                paginate={false}
                emptyText={t('inventory.stock.emptyLogs')}
              />
            ),
          },
        ]}
      />
    </DetailSheet>
  )
}
