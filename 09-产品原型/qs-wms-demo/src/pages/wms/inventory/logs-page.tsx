import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, DateTime, Num } from '@/components/biz/display'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { GridRow } from '../outbound/shared'

export function InventoryLogsPage() {
  const { t } = useTranslation()
  const warehouse = useSettings((s) => s.warehouseCode)
  const logs = useDb((s) => s.inventoryLogs)
  const { customerName } = useLookups()
  const rows: GridRow[] = [...logs]
    .filter((l) => l.warehouseCode === warehouse)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((l) => ({
      id: l.id,
      no: <BizCode>{l.refNo}</BizCode>,
      action: t(`inventory.logActions.${l.type}`),
      owner: customerName(l.customerId),
      sku: <BizCode>{l.skuCode}</BizCode>,
      location: <BizCode>{l.locationCode}</BizCode>,
      qty: <Num value={l.qtyChange} />,
      reserved: <Num value={l.reservedChange ?? 0} />,
      allocated: <Num value={l.allocatedChange ?? 0} />,
      operator: l.operator,
      time: <DateTime value={l.createdAt} />,
    }))
  /** 表头固定在库存口径：订单占用是 SKU 级变动，不用出库单的「本单预占」 */
  const columns = useMemo(() => {
    const col = createDataColumns<GridRow>()
    const spec: [key: string, headerKey: string][] = [
      ['no', 'outbound.no'],
      ['action', 'outbound.action'],
      ['owner', 'outbound.owner'],
      ['sku', 'outbound.sku'],
      ['location', 'outbound.location'],
      ['qty', 'outbound.qty'],
      ['reserved', 'inventory.orderReserved'],
      ['allocated', 'outbound.allocated'],
      ['operator', 'outbound.operator'],
      ['time', 'outbound.time'],
    ]
    return spec.map(([key, headerKey], index) =>
      col.accessor(key, {
        header: t(headerKey),
        enableSorting: false,
        meta: { pin: index === 0 ? 'left' : key === 'action' ? 'right' : undefined },
        cell: (info) => info.getValue(),
      }),
    )
  }, [t])
  return (
    <PageContainer title={t('menu.inventoryLogs')}>
      <Panel>
        <DataTable data={rows} columns={columns} getRowId={(r) => r.id} />
      </Panel>
    </PageContainer>
  )
}
