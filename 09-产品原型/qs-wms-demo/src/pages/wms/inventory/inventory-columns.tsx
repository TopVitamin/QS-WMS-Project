import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns } from '@/components/biz/data-table'
import { CodeName, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { qualityMeta } from '@/config/status'
import { ledgerChange, ledgerObject } from '@/lib/inventory-ledger'
import { useLookups } from '@/mock/db'
import type { AuditLog, InventoryLog } from '@/types/wms'
import { DocLink, SignedNum } from './inventory-shared'

type Translate = (k: string, opts?: Record<string, unknown>) => string

export interface LedgerRow {
  log: InventoryLog
  no: string
}

/**
 * 库存流水列：流水页用全量列；SKU 详情最近流水、移库详情的流水页签用 compact（去掉商品、批次、品质、操作者）。
 * 订单预占类库位、批次显示占位符，品质为良品；来源单据有详情页时可点开。
 */
export function useLedgerColumns({ compact, onOpen }: { compact?: boolean; onOpen: (row: LedgerRow) => void }) {
  const { t } = useTranslation()
  const { sku, customerName } = useLookups()
  return useMemo(() => {
    const col = createDataColumns<LedgerRow>()
    const all = [
      col.accessor((r) => r.log.createdAt, {
        id: 'occurredAt',
        header: t('inventory.logs.occurredShort'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('no', {
        header: t('inventory.logs.logNo'),
        enableHiding: false,
        meta: { pin: 'left' },
        cell: ({ row }) => <DocNo onClick={() => onOpen(row.original)}>{row.original.no}</DocNo>,
      }),
      col.accessor((r) => r.log.type, {
        id: 'type',
        header: t('inventory.logs.type'),
        cell: ({ getValue }) => t(`inventory.type.${getValue()}`),
      }),
      col.accessor((r) => ledgerChange(r.log), {
        id: 'quantityChange',
        header: t('inventory.logs.quantityChange'),
        enableSorting: true,
        meta: { align: 'right', label: t('inventory.logs.quantityChange') },
        cell: ({ row }) => {
          const { log } = row.original
          const basis = ledgerObject(log)
          const reserved = basis === 'RESERVED'
          return (
            <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
              <span
                className="text-xs text-muted-foreground"
                title={t(reserved ? 'inventory.logs.basisReservedNote' : 'inventory.logs.basisActualNote')}
              >
                {t(`inventory.object.${basis}`)}
              </span>
              <span className="tabular-nums">
                <Num value={log.beforeQty ?? 0} /> → <Num value={log.afterQty ?? 0} />（
                <SignedNum value={ledgerChange(log)} />）
              </span>
            </div>
          )
        },
      }),
      col.accessor((r) => r.log.skuCode, {
        id: 'sku',
        header: t('inventory.sku'),
        cell: ({ getValue }) => <CodeName code={getValue()} name={sku(getValue())?.name} className="max-w-56" />,
      }),
      col.accessor((r) => r.log.customerId, {
        id: 'owner',
        header: t('inventory.owner'),
        cell: ({ getValue }) => customerName(getValue()),
      }),
      col.accessor((r) => r.log.locationCode, {
        id: 'location',
        header: t('inventory.location'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((r) => r.log.batchNo ?? '', {
        id: 'batch',
        header: t('inventory.batch'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor((r) => r.log.qualityType ?? '', {
        id: 'quality',
        header: t('inventory.quality'),
        cell: ({ row }) =>
          row.original.log.qualityType ? <TagLabel meta={qualityMeta[row.original.log.qualityType]} /> : <Empty />,
      }),
      col.accessor((r) => r.log.refNo, {
        id: 'source',
        header: t('inventory.logs.sourceDoc'),
        cell: ({ getValue }) => <DocLink no={getValue()} />,
      }),
      col.accessor((r) => r.log.operator, {
        id: 'operator',
        header: t('inventory.operator'),
      }),
    ]
    const hiddenInCompact = new Set(['sku', 'batch', 'quality', 'operator'])
    return compact ? all.filter((c) => !hiddenInCompact.has(c.id ?? '')) : all
  }, [compact, onOpen, sku, customerName, t])
}

/** 库内操作日志列：动作取库内命令文案 */
export function inventoryAuditColumns(t: Translate) {
  const col = createDataColumns<AuditLog>()
  return col.columns([
    col.accessor('createdAt', {
      header: t('inventory.auditTime'),
      cell: ({ getValue }) => <DateTime value={getValue()} />,
    }),
    col.accessor((l) => l.command ?? l.action, {
      id: 'action',
      header: t('inventory.auditAction'),
      cell: ({ row }) =>
        row.original.command
          ? t(`inventory.actions.${row.original.command}`, {
              defaultValue: t(`outbound.actions.${row.original.command}`, { defaultValue: row.original.command }),
            })
          : t(`audit.action.${row.original.action}`),
    }),
    col.accessor('operator', { header: t('inventory.operator') }),
    col.accessor('detail', {
      header: t('inventory.auditDetail'),
      cell: ({ getValue }) => getValue() || <Empty />,
    }),
  ])
}
