import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, DateTime, DocNo, Num } from '@/components/biz/display'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { returnSourceMeta } from '@/config/status'
import { useDb } from '@/mock/db'
import type { ReturnResult } from '@/types/return'

export function InstructionsResultsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const results = useDb((s) => s.returnResults)
  const retry = useDb((s) => s.retryReturnResult)
  const simulateFailure = useDb((s) => s.simulateReturnResultFailure)
  const returnNo = new URLSearchParams(location.search).get('returnNo')
  const rows = useMemo(
    () =>
      [...results]
        .filter((result) => !returnNo || result.returnNo === returnNo)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [results, returnNo],
  )

  const runAction = useCallback(
    (action: (no: string) => { ok: boolean; errorKey?: string }, no: string, successKey: string) => {
      const result = action(no)
      if (!result.ok) toast.error(t(result.errorKey ?? 'return.error.resultNotFound'))
      else toast.success(t(successKey))
    },
    [t],
  )

  const columns = useMemo(() => {
    const col = createDataColumns<ReturnResult>()
    return col.columns([
      col.accessor('at', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('returnNo', {
        header: t('return.returnNo'),
        cell: ({ getValue }) => (
          <DocNo onClick={() => navigate(`/wms/returns/orders/${getValue()}`)}>{getValue()}</DocNo>
        ),
      }),
      col.accessor('sourceType', {
        header: t('return.sourceType'),
        cell: ({ getValue }) => t(returnSourceMeta[getValue()].labelKey),
      }),
      col.accessor('sourceAssociationNo', {
        header: t('return.forecast.sourceAssociationNo'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('items', {
        header: t('return.result.items'),
        enableSorting: false,
        cell: ({ getValue }) => (
          <div className="space-y-1 py-1">
            {getValue().map((item) => (
              <div key={item.skuCode} className="text-xs leading-5">
                <BizCode>{item.skuCode}</BizCode>
                <span className="ml-2 text-muted-foreground">
                  {t('return.result.itemSummary', {
                    planned: item.plannedQty,
                    received: item.receivedQty,
                    good: item.goodQty,
                    defect: item.defectQty,
                    rejected: item.rejectedQty,
                    short: item.shortQty,
                    putaway: item.putawayQty,
                  })}
                </span>
              </div>
            ))}
          </div>
        ),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) => t(`inbound.upstream.resultStatuses.${getValue()}`),
      }),
      col.accessor('attempts', {
        header: t('return.result.attempts'),
        meta: { align: 'right' },
        cell: ({ getValue }) => <Num value={getValue()} />,
      }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        cell: ({ row }) => {
          const result = row.original
          return result.status === 'FAILED' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => runAction(retry, result.returnNo, 'return.detail.resultRetried')}
            >
              {t('inbound.upstream.retry')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => runAction(simulateFailure, result.returnNo, 'return.result.failureSimulated')}
            >
              {t('return.result.simulateFailure')}
            </Button>
          )
        },
      }),
    ])
  }, [navigate, retry, runAction, simulateFailure, t])

  return (
    <PageContainer
      fill
      title={t('menu.instructionsResults')}
      actions={returnNo ? <Button variant="outline" onClick={() => navigate('/wms/system/instructions-results')}>{t('return.result.showAll')}</Button> : undefined}
    >
      {returnNo && (
        <p className="text-sm text-muted-foreground">
          {t('return.result.filteredBy', { no: returnNo })}
        </p>
      )}
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          className="flex-1"
          data={rows}
          columns={columns}
          getRowId={(result) => `${result.returnNo}-${result.sequence}`}
          selectable={false}
          emptyText={t('return.result.empty')}
        />
      </Panel>
    </PageContainer>
  )
}
