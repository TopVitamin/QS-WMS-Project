import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { DataTable, createDataColumns } from '@/components/biz/data-table'
import { DateTime, Empty } from '@/components/biz/display'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { Section } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDb } from '@/mock/db'
import type { InboundMessage, InboundOrder } from '@/types/inbound'

/** 上游变更：只改明细与预计数量，不改货主/仓库/业务类型 */
export function InboundChangeDialog({ order, onClose }: { order: InboundOrder; onClose: () => void }) {
  const { t } = useTranslation()
  const change = useDb((s) => s.mockChangeInboundInstruction)
  const [lines, setLines] = useState(() => order.items.map((l) => ({ skuCode: l.skuCode, plannedQty: String(l.plannedQty) })))
  const [error, setError] = useState<string>()

  const submit = () => {
    const items = lines.map((l) => ({ skuCode: l.skuCode, plannedQty: Number(l.plannedQty) }))
    if (items.some((l) => !Number.isInteger(l.plannedQty) || l.plannedQty <= 0)) {
      setError(t('inbound.upstream.qtyInvalid'))
      return
    }
    const result = change({ inboundNo: order.inboundNo, items })
    if (!result.ok) {
      setError(t(result.errorKey))
      return
    }
    toast.success(t('inbound.upstream.changeSuccess', { no: order.inboundNo }))
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inbound.upstream.changeTitle', { no: order.inboundNo })}</DialogTitle>
          <DialogDescription>{t('inbound.upstream.changeHint')}</DialogDescription>
        </DialogHeader>
        <FormGrid columns={2}>
          {lines.map((line, index) => (
            <FormField key={line.skuCode} label={line.skuCode} required>
              <Input
                type="number"
                min={1}
                value={line.plannedQty}
                onChange={(e) =>
                  setLines((prev) => prev.map((l, i) => (i === index ? { ...l, plannedQty: e.target.value } : l)))
                }
              />
            </FormField>
          ))}
        </FormGrid>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('inbound.upstream.changeSubmit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 上游取消：只允许整单零实收，受理后保留收货/拒收事实 */
export function InboundCancelDialog({ order, onClose }: { order: InboundOrder; onClose: () => void }) {
  const { t } = useTranslation()
  const cancel = useDb((s) => s.mockCancelInboundInstruction)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  const submit = () => {
    const result = cancel({ inboundNo: order.inboundNo, reason })
    if (!result.ok) {
      setError(t(result.errorKey))
      return
    }
    toast.success(t('inbound.upstream.cancelSuccess', { no: order.inboundNo }))
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inbound.upstream.cancelTitle', { no: order.inboundNo })}</DialogTitle>
          <DialogDescription>{t('inbound.upstream.cancelHint')}</DialogDescription>
        </DialogHeader>
        <FormField label={t('inbound.upstream.cancelReason')}>
          <Textarea
            rows={3}
            value={reason}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={submit}>
            {t('inbound.upstream.cancelSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 上游消息与完成结果：详情页签只读追溯 */
export function InboundUpstreamPanel({ order }: { order: InboundOrder }) {
  const { t } = useTranslation()
  const messages = useDb(useShallow((s) => s.inboundMessages.filter((m) => m.inboundNo === order.inboundNo)))
  const result = useDb((s) => s.inboundResults.find((r) => r.inboundNo === order.inboundNo))
  const retry = useDb((s) => s.retryInboundResult)

  const col = createDataColumns<InboundMessage>()
  const columns = col.columns([
    col.accessor('at', {
      header: t('common.createdAt'),
      cell: ({ getValue }) => <DateTime value={getValue()} />,
    }),
    col.accessor('action', {
      header: t('inbound.upstream.action'),
      cell: ({ getValue }) => t(`inbound.upstream.actions.${getValue()}`),
    }),
    col.accessor('upstreamNo', { header: t('inbound.upstream.upstreamNo') }),
    col.accessor('status', {
      header: t('inbound.upstream.status'),
      cell: ({ getValue }) => (
        <StatusBadge
          meta={{
            tone: getValue() === 'ACCEPTED' ? 'green' : 'red',
            labelKey: `inbound.upstream.statuses.${getValue()}`,
          }}
        />
      ),
    }),
    col.accessor('errorKey', {
      header: t('inbound.upstream.reason'),
      cell: ({ getValue }) => {
        const key = getValue()
        return key ? t(key) : <Empty />
      },
    }),
  ])

  return (
    <div className="flex flex-col gap-3 p-4">
      <Section title={t('inbound.upstream.results')} flush>
        {result ? (
          <div className="flex flex-wrap items-center gap-3 px-4 pb-4 text-sm">
            <StatusBadge
              meta={{
                tone: result.status === 'SENT' ? 'green' : 'red',
                labelKey: `inbound.upstream.resultStatuses.${result.status}`,
              }}
            />
            <span className="text-muted-foreground">
              {t('inbound.upstream.attempts', { count: result.attempts })}
            </span>
            <span className="text-muted-foreground">
              {t('inbound.upstream.resultQty', {
                received: result.items.reduce((n, i) => n + i.receivedQty, 0),
                rejected: result.items.reduce((n, i) => n + i.rejectedQty, 0),
                putaway: result.items.reduce((n, i) => n + i.putawayQty, 0),
              })}
            </span>
            <Button size="sm" variant="outline" onClick={() => retry(order.inboundNo)}>
              {t('inbound.upstream.retry')}
            </Button>
          </div>
        ) : (
          <p className="px-4 pb-4 text-sm text-muted-foreground">{t('inbound.upstream.noResult')}</p>
        )}
      </Section>
      <DataTable
        data={messages}
        columns={columns}
        getRowId={(m) => m.id}
        selectable={false}
        emptyText={t('inbound.upstream.noMessages')}
      />
    </div>
  )
}
