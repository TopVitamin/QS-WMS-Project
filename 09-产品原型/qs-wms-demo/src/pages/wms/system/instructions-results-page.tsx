import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { StatusTabs } from '@/components/biz/status-tabs'
import { BizCode, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { Button } from '@/components/ui/button'
import { returnSourceMeta } from '@/config/status'
import { useDb } from '@/mock/db'
import type { ReturnResult } from '@/types/return'

type MessageKind = 'INBOUND' | 'OUTBOUND' | 'MASTER'
type MessageRow = {
  id: string
  at: string
  kind: MessageKind
  action: 'CREATE' | 'CHANGE' | 'CANCEL' | 'PUSH'
  status: 'ACCEPTED' | 'REJECTED'
  refNo: string
  error: string
}

/**
 * 系统集成 → 指令与结果：上游消息留痕与回传结果两个视图。
 * 结果视图保留退货结果重交；上游消息视图汇总入库、出库、基础资料三类 Mock 消息。
 */
export function InstructionsResultsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const results = useDb((s) => s.returnResults)
  const inboundMessages = useDb((s) => s.inboundMessages)
  const outboundMessages = useDb((s) => s.outboundMessages)
  const masterMessages = useDb((s) => s.masterMessages)
  const retry = useDb((s) => s.retryReturnResult)
  const simulateFailure = useDb((s) => s.simulateReturnResultFailure)
  const returnNo = new URLSearchParams(location.search).get('returnNo')
  const [tab, setTab] = useState<'messages' | 'results'>('messages')

  const rows = useMemo(
    () =>
      [...results]
        .filter((result) => !returnNo || result.returnNo === returnNo)
        .sort((a, b) => b.at.localeCompare(a.at)),
    [results, returnNo],
  )

  const messageRows = useMemo<MessageRow[]>(() => {
    const inbound: MessageRow[] = inboundMessages.map((m) => ({
      id: `IN-${m.id}`,
      at: m.at,
      kind: 'INBOUND',
      action: m.action,
      status: m.status,
      refNo: m.inboundNo ?? m.upstreamNo,
      error: m.errorKey ? t(m.errorKey, m.params) : '',
    }))
    const outbound: MessageRow[] = outboundMessages.map((m) => ({
      id: `OUT-${m.id}`,
      at: m.at,
      kind: 'OUTBOUND',
      action: m.action,
      status: m.status,
      refNo: m.orderNo ?? m.upstreamNo,
      error: m.errorKey ? t(m.errorKey, m.params) : '',
    }))
    const master: MessageRow[] = masterMessages.map((m) => ({
      id: `MASTER-${m.id}`,
      at: m.at,
      kind: 'MASTER',
      action: 'PUSH',
      status: m.status,
      refNo: m.skuCode ? `${m.ownerCode} / ${m.skuCode}` : m.ownerCode,
      error: m.reason ?? '',
    }))
    return [...inbound, ...outbound, ...master].sort((a, b) => b.at.localeCompare(a.at))
  }, [inboundMessages, masterMessages, outboundMessages, t])

  const runAction = useCallback(
    (action: (no: string) => { ok: boolean; errorKey?: string }, no: string, successKey: string) => {
      const result = action(no)
      if (!result.ok) toast.error(t(result.errorKey ?? 'return.error.resultNotFound'))
      else toast.success(t(successKey))
    },
    [t],
  )

  const messageColumns = useMemo(() => {
    const col = createDataColumns<MessageRow>()
    return col.columns([
      col.accessor('at', {
        header: t('common.createdAt'),
        enableSorting: true,
        sortFn: 'datetime',
        cell: ({ getValue }) => <DateTime value={getValue()} />,
      }),
      col.accessor('kind', {
        header: t('integration.kind'),
        cell: ({ getValue }) => t(`integration.kinds.${getValue()}`),
      }),
      col.accessor('action', {
        header: t('integration.action'),
        cell: ({ getValue }) => t(`integration.actions.${getValue()}`),
      }),
      col.accessor('status', {
        header: t('common.status'),
        cell: ({ getValue }) =>
          getValue() === 'ACCEPTED' ? t('integration.accepted') : t('integration.rejected'),
      }),
      col.accessor('refNo', {
        header: t('integration.refNo'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
      }),
      col.accessor('error', {
        header: t('integration.error'),
        cell: ({ getValue }) => getValue() || <Empty />,
      }),
    ])
  }, [t])

  const resultColumns = useMemo(() => {
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
      actions={
        returnNo && tab === 'results' ? (
          <Button variant="outline" onClick={() => navigate('/wms/system/instructions-results')}>
            {t('return.result.showAll')}
          </Button>
        ) : undefined
      }
    >
      <Panel className="p-4">
        <StatusTabs
          items={[
            { value: 'messages', label: t('integration.tabs.messages'), count: messageRows.length },
            { value: 'results', label: t('integration.tabs.results'), count: rows.length },
          ]}
          value={tab}
          onChange={(value) => {
            setTab(value as 'messages' | 'results')
            if (value === 'messages' && returnNo) navigate('/wms/system/instructions-results')
          }}
        />
      </Panel>
      {tab === 'results' && returnNo && (
        <p className="text-sm text-muted-foreground">{t('return.result.filteredBy', { no: returnNo })}</p>
      )}
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === 'messages' ? (
          <DataTable
            className="flex-1"
            data={messageRows}
            columns={messageColumns}
            getRowId={(row) => row.id}
            selectable={false}
            emptyText={t('integration.messagesEmpty')}
          />
        ) : (
          <DataTable
            className="flex-1"
            data={rows}
            columns={resultColumns}
            getRowId={(result) => `${result.returnNo}-${result.sequence}`}
            selectable={false}
            emptyText={t('return.result.empty')}
          />
        )}
      </Panel>
    </PageContainer>
  )
}
