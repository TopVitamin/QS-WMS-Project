import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns } from '@/components/biz/data-table'
import { BizCode, Empty, Num } from '@/components/biz/display'
import { ActionLink } from '@/components/biz/row-actions'
import { useLookups } from '@/mock/db'
import type { PutawayActualLine, PutawayOrder, PutawayPlanLine } from '@/types/inbound'

/** 应上架明细：行号 / 收货明细行号 / 商品编码 / 条码 / 名称 / 批次 / 生产日期 / 失效日期 / 应上架数量 */
export function usePutawayPlanColumns() {
  const { t } = useTranslation()
  const { sku } = useLookups()
  return useMemo(() => {
    const col = createDataColumns<PutawayPlanLine>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('receiptLineNo', { header: t('putaway.receiptLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('skuCode', {
        id: 'barcode',
        header: t('masterSku.barcode'),
        cell: ({ getValue }) => {
          const barcode = sku(getValue())?.barcode
          return barcode ? <BizCode>{barcode}</BizCode> : <Empty />
        },
      }),
      col.accessor('skuCode', {
        id: 'skuName',
        header: t('masterSku.name'),
        cell: ({ getValue }) => sku(getValue())?.name ?? getValue(),
      }),
      col.accessor('batchNo', { header: t('putaway.batchNo'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('productionDate', { header: t('putaway.productionDate'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('expiryDate', { header: t('putaway.expiryDate'), cell: ({ getValue }) => getValue() || <Empty /> }),
      col.accessor('planQty', {
        header: t('putaway.planQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
    ])
  }, [sku, t])
}

/**
 * 实际上架明细：行号 / 应上架行号 / 商品编码 / 批次 / 目标库位 / 上架数量 / 序列号 / 名称。
 * 不传 onViewSerials（如入库单详情里的上架单抽屉，不再叠一层抽屉）时序列号只显示条数。
 */
export function usePutawayActualColumns(order: PutawayOrder, onViewSerials?: (line: PutawayActualLine) => void) {
  const { t } = useTranslation()
  const { sku } = useLookups()
  return useMemo(() => {
    const col = createDataColumns<PutawayActualLine>()
    return col.columns([
      col.accessor('lineNo', { header: t('inbound.lineNo'), meta: { align: 'right' } }),
      col.accessor('planLineNo', { header: t('putaway.planLineNo'), meta: { align: 'right' } }),
      col.accessor('skuCode', { header: t('common.sku'), cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor((line) => order.planLines.find((p) => p.lineNo === line.planLineNo)?.batchNo, {
        id: 'batchNo',
        header: t('putaway.batchNo'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
      col.accessor('locationCode', {
        header: t('inbound.targetLocation'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('qty', {
        header: t('putaway.putawayQty'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.display({
        id: 'serialNos',
        header: t('putaway.serialNos'),
        cell: ({ row }) => {
          const serials = row.original.serialNos ?? []
          if (serials.length === 0) return <Empty />
          if (!onViewSerials) return <Num value={serials.length} />
          return (
            <ActionLink onClick={() => onViewSerials(row.original)}>
              {t('putaway.viewSerials', { count: serials.length })}
            </ActionLink>
          )
        },
      }),
      col.accessor('skuCode', {
        id: 'skuName',
        header: t('masterSku.name'),
        cell: ({ getValue }) => sku(getValue())?.name ?? getValue(),
      }),
    ])
  }, [onViewSerials, order.planLines, sku, t])
}
