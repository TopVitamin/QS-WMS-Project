import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, DateTime, DocNo, Empty, Num } from '@/components/biz/display'
import { RowActions } from '@/components/biz/row-actions'
import { StatusBadge } from '@/components/biz/status-badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { outboundMessageStatusMeta } from '@/config/status'
import { useDb } from '@/mock/db'
import type { OutboundCommand, OutboundMessage } from '@/types/outbound'
import { useOutboundRun } from './use-outbound-action'

/** 指令处理记录（出库单弹窗与 Mock 分册 §6.3）：按原消息重发，返回原结论 */
export function MessagesDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const messages = useDb((s) => s.outboundMessages)
  const run = useOutboundRun()
  const rows = useMemo(() => [...messages].reverse(), [messages])

  const columns = useMemo(() => {
    const col = createDataColumns<OutboundMessage>()
    const replay = (m: OutboundMessage) => {
      try {
        return JSON.parse(m.fingerprint) as OutboundCommand
      } catch {
        return undefined
      }
    }
    return col.columns([
      col.accessor('id', { header: t('outbound.ui.messageId'), meta: { pin: 'left' }, cell: ({ getValue }) => <BizCode>{getValue()}</BizCode> }),
      col.accessor('upstreamNo', { header: t('outbound.ui.upstream') }),
      col.accessor('action', { header: t('outbound.action'), cell: ({ getValue }) => t(`outbound.actions.${getValue()}`) }),
      col.accessor('version', { header: t('outbound.version'), meta: { align: 'right' }, cell: ({ getValue }) => <Num value={getValue()} /> }),
      col.accessor('status', { header: t('common.status'), cell: ({ getValue }) => <StatusBadge meta={outboundMessageStatusMeta[getValue()]} /> }),
      col.accessor('orderNo', {
        header: t('outbound.ui.no'),
        cell: ({ getValue }) => {
          const no = getValue()
          return no ? (
            <DocNo
              onClick={() => {
                onClose()
                navigate(`/wms/outbound/orders/${no}`)
              }}
            >
              {no}
            </DocNo>
          ) : (
            <Empty />
          )
        },
      }),
      col.accessor('errorKey', {
        header: t('outbound.failure'),
        cell: ({ row }) => (row.original.errorKey ? t(row.original.errorKey, row.original.params) : <Empty />),
      }),
      col.accessor('at', { header: t('outbound.ui.time'), cell: ({ getValue }) => <DateTime value={getValue()} /> }),
      col.display({
        id: 'actions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) => {
          const command = replay(row.original)
          return command ? (
            <RowActions actions={[{ key: 'resend', label: t('outbound.resend'), onClick: () => run(command) }]} />
          ) : null
        },
      }),
    ])
  }, [navigate, onClose, run, t])

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('outbound.ui.messages')}</DialogTitle>
          <DialogDescription>{t('outbound.messageNotice')}</DialogDescription>
        </DialogHeader>
        <DataTable data={rows} columns={columns} getRowId={(m) => m.id} selectable={false} pageSize={10} />
      </DialogContent>
    </Dialog>
  )
}
