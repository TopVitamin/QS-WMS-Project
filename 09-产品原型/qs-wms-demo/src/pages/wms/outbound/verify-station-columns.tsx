import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createDataColumns } from '@/components/biz/data-table'
import { BizCode, Empty, Num } from '@/components/biz/display'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VerifyRow as StationRow } from '@/lib/outbound-verify'
import type { Sku } from '@/types/wms'
import { X } from 'lucide-react'

/** 普通商品「本次」数量：回车或失焦提交；被拒时回到原值 */
function QtyCell({
  row,
  onCommit,
  onDone,
}: {
  row: StationRow
  onCommit: (row: StationRow, qty: number) => boolean
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const qty = draft.trim() === '' ? 0 : Number(draft)
    setDraft(null)
    if (qty !== row.qty) onCommit(row, qty)
  }
  return (
    <Input
      className="ml-auto h-10 w-24 text-right text-lg font-semibold tabular-nums"
      inputMode="numeric"
      aria-label={t('outbound.ui.stationThisTime')}
      value={draft ?? (row.qty ? String(row.qty) : '')}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit()
          onDone()
        }
      }}
    />
  )
}

/** 复核工作台的逐行录入列；拆出页面组件，列定义和数量输入一起维护 */
export function useVerifyRowColumns({
  sku,
  changeQty,
  setLine,
  refocusScan,
}: {
  sku: (code: string) => Sku | undefined
  changeQty: (row: StationRow, qty: number) => boolean
  setLine: (id: string, qty: number, serialNos: string[]) => void
  refocusScan: () => void
}) {
  const { t } = useTranslation()
  return useMemo(() => {
    const col = createDataColumns<StationRow>()
    return col.columns([
      col.accessor('skuCode', {
        header: t('outbound.ui.sku'),
        meta: { pin: 'left' },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <BizCode className="text-base font-semibold">{row.original.skuCode}</BizCode>
            <span className="truncate text-sm text-muted-foreground">
              {[sku(row.original.skuCode)?.name, sku(row.original.skuCode)?.barcode].filter(Boolean).join(' · ')}
            </span>
          </div>
        ),
      }),
      col.accessor('batchNo', {
        header: t('outbound.ui.batch'),
        cell: ({ getValue }) => (getValue() ? <BizCode className="text-base">{getValue()}</BizCode> : <Empty />),
      }),
      col.accessor('remaining', {
        header: t('outbound.ui.stationToVerify'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} className="text-lg font-semibold" />,
      }),
      col.accessor('qty', {
        header: t('outbound.ui.stationThisTime'),
        meta: { align: 'right' },
        cell: ({ row }) =>
          row.original.sn ? (
            <Num value={row.original.qty} className="text-lg font-semibold" />
          ) : (
            <QtyCell row={row.original} onCommit={changeQty} onDone={refocusScan} />
          ),
      }),
      col.accessor((r) => r.serialNos.join(', '), {
        id: 'serials',
        header: t('outbound.ui.serial'),
        cell: ({ row }) =>
          row.original.sn ? (
            row.original.serialNos.length ? (
              <span className="text-base">{row.original.serialNos.join(', ')}</span>
            ) : (
              <span className="text-sm text-muted-foreground">{t('outbound.ui.stationScanSnHint')}</span>
            )
          ) : (
            <Empty />
          ),
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) =>
          row.original.qty > 0 ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('outbound.ui.stationClearLine')}
              title={t('outbound.ui.stationClearLine')}
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setLine(row.original.id, 0, [])
                refocusScan()
              }}
            >
              <X />
            </Button>
          ) : null,
      }),
    ])
  }, [changeQty, refocusScan, setLine, sku, t])
}
