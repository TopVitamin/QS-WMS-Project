import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { pdaToast as toast } from '@/lib/pda-toast'
import { PdaButton, PdaCard, PdaSection } from '@/components/pda/pda-card'
import { PdaChoiceGroup } from '@/components/pda/pda-choice-group'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanMessage } from '@/components/pda/scan-input'
import { Input } from '@/components/ui/input'
import { sum } from '@/lib/outbound-derive'
import { defaultPackageNo, toVerifyQty, verifyPackProblem } from '@/lib/outbound-verify'
import { beep } from '@/lib/scan-beep'
import { useDb } from '@/mock/db'
import type { WebVerifySession } from '@/stores/web-verify-session'
import type { OutboundOrder, OutboundVerification } from '@/types/outbound'
import { VerifyContext } from './verify-shared'
import type { VerifyFlow } from './use-verify-flow'

const METHODS = ['SORT', 'PACK'] as const
const CONTAINERS = ['NONE', 'PACKAGE', 'BOX', 'PALLET'] as const

/**
 * 装箱提交（出库单主PRD §7.5）：选复核方式与容器，扫容器号；随打包装箱时填模拟重量。
 * 提交成一条复核记录：本单还有待复核就回到扫描继续下一个容器，复核完回到单据列表。
 */
export function VerifyPackStep({ flow }: { flow: VerifyFlow }) {
  const { nav } = flow
  const order = flow.findOrder(nav.param('no'))
  const valid = Boolean(order && flow.verifiable(order))
  const draftTotal = order ? sum(flow.rowsOf(order, flow.sessionOf(order)), (r) => r.qty) : 0

  useEffect(() => {
    if (!valid) nav.replace('list')
    else if (draftTotal === 0) nav.returnTo('scan', { no: order!.no })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, draftTotal])

  if (!order || !valid || draftTotal === 0) return null
  return <PackWorkspace key={order.no} flow={flow} order={order} />
}

function PackWorkspace({ flow, order }: { flow: VerifyFlow; order: OutboundOrder }) {
  const { t, nav } = flow
  const session = flow.sessionOf(order)
  const rows = flow.rowsOf(order, session)
  const records = flow.records(order)
  const draftTotal = sum(rows, (r) => r.qty)
  const [message, setMessage] = useState<ScanMessage>()
  const update = (patch: Partial<WebVerifySession>) => flow.saveSession(order, { ...session, ...patch })

  const changeMethod = (method: OutboundVerification['method']) => {
    if (method === 'PACK' && order.type === 'B2C')
      update({ method, containerType: 'PACKAGE', containerNo: session.containerNo || defaultPackageNo(order, records) })
    else if (method === 'PACK' && session.containerType === 'NONE') update({ method, containerType: 'BOX' })
    else update({ method })
  }

  const onScanContainer = (code: string) => {
    const container = flow.containers.find(
      (row) =>
        row.warehouseCode === order.warehouseCode &&
        row.containerNo.trim().toUpperCase() === code.trim().toUpperCase(),
    )
    const nextSession = { ...session, containerNo: code, parentContainerNo: container?.parentContainerNo ?? '' }
    if (order.type === 'FBA') {
      const problem = verifyPackProblem(order, nextSession, records, flow.containers)
      if (problem) {
        setMessage({ tone: 'error', text: t(`outbound.ui.${problem.key}Detail`) })
        return false
      }
    }
    update({ containerNo: code, parentContainerNo: container?.parentContainerNo ?? '' })
    setMessage({ tone: 'success', text: t('outbound.pdaVerify.okContainer', { no: code }) })
    return true
  }

  const onScanParent = (code: string) => {
    const problem = verifyPackProblem(order, { ...session, parentContainerNo: code }, records, flow.containers)
    if (problem) {
      setMessage({ tone: 'error', text: t(`outbound.ui.${problem.key}Detail`) })
      return false
    }
    update({ parentContainerNo: code })
    setMessage({ tone: 'success', text: t('outbound.pdaVerify.okContainer', { no: code }) })
    return true
  }

  const submit = () => {
    const problem = verifyPackProblem(order, session, records, flow.containers)
    if (problem) {
      const title =
        problem.key === 'stationContainerNo'
          ? t('outbound.ui.stationContainerNoTitle', {
              type: t(`outbound.containers.${problem.params?.type ?? session.containerType}`),
            })
          : t(`outbound.ui.${problem.key}Title`)
      void flow.notice(title, t(`outbound.ui.${problem.key}Detail`))
      return
    }
    const weight = order.type === 'B2C' && session.method === 'PACK' && session.weight.trim()
      ? Number(session.weight)
      : undefined
    const res = flow.run({
      type: 'VERIFY',
      no: order.no,
      method: session.method,
      containerType: session.containerType,
      containerNo: session.containerType === 'NONE' ? '' : session.containerNo.trim(),
      parentContainerNo: session.parentContainerNo?.trim() || undefined,
      weightKg: weight,
      remark: session.remark?.trim() || undefined,
      lines: rows.filter((r) => r.qty > 0).map((r) => ({ assignmentId: r.id, qty: r.qty, serialNos: r.serialNos })),
    })
    if (!res.ok) {
      void flow.notice(t('outbound.ui.stationSubmitFailTitle'), t(res.errorKey, res.params))
      return
    }
    flow.saveSession(order, undefined)
    const after = useDb.getState().outboundOrders.find((o) => o.no === order.no)
    const left = after ? toVerifyQty(after) : 0
    beep(true)
    toast.success(
      left
        ? t('outbound.pdaVerify.doneLeft', { no: res.no, count: draftTotal, left })
        : t('outbound.pdaVerify.doneAll', { no: res.no, count: draftTotal, order: order.no }),
    )
    // 装箱页总是从扫描页压进来的：还有待复核就退一步接着扫下一个容器
    if (left) nav.back({ step: 'scan', params: { no: order.no } })
    else nav.returnTo('list')
  }

  return (
    <>
      <PdaHeader
        title={t('outbound.pdaVerify.packTitle')}
        onBack={() => nav.back({ step: 'scan', params: { no: order.no } })}
      />
      <VerifyContext flow={flow} order={order} rows={rows} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaSection title={t('outbound.ui.method')}>
          <PdaChoiceGroup
            columns={2}
            value={session.method}
            onChange={changeMethod}
            options={(order.type === 'FBA' ? ['PACK'] as const : METHODS).map((value) => ({
              value,
              label: t(`outbound.verifyMethods.${value}`),
            }))}
          />
        </PdaSection>
        <PdaSection title={t('outbound.ui.containerType')}>
          <PdaChoiceGroup
            value={session.containerType}
            options={(
              order.type === 'FBA'
                ? ['BOX', 'PALLET'] as const
                : order.type === 'WHOLESALE'
                  ? ['NONE', 'BOX', 'PALLET'] as const
                  : CONTAINERS
            ).map((value) => ({ value, label: t(`outbound.containers.${value}`) }))}
            onChange={(containerType) =>
              update({
                containerType,
                parentContainerNo: containerType === 'PALLET' ? '' : session.parentContainerNo,
              })
            }
          />
          {order.type === 'FBA' && (
            <Link className="mt-2 inline-block text-sm text-primary underline" to="/wms/master/containers">
              {t('outbound.ui.manageContainers')}
            </Link>
          )}
        </PdaSection>
        {session.containerType !== 'NONE' && (
          <>
            <PdaCard className="flex items-baseline gap-2 py-2">
              <span className="text-sm text-muted-foreground">{t('outbound.ui.containerNo')}</span>
              {session.containerNo ? (
                <span className="min-w-0 truncate font-mono text-xl font-bold">{session.containerNo}</span>
              ) : (
                <span className="text-sm text-warning-text">{t('outbound.pdaVerify.containerMissing')}</span>
              )}
            </PdaCard>
            <ScanInput
              label={t('outbound.pdaVerify.scanContainer')}
              onScan={onScanContainer}
              message={message}
              candidates={
                order.type === 'FBA'
                  ? flow.containers
                      .filter(
                        (container) =>
                          container.warehouseCode === order.warehouseCode &&
                          container.customerId === order.customerId &&
                          container.containerType === (session.containerType === 'BOX' ? 'CARTON' : 'PALLET') &&
                          (session.containerType !== 'PALLET' || !container.parentContainerNo) &&
                          (container.status === 'IDLE' ||
                            (container.status === 'OUTBOUND' &&
                              records.some(
                                (record) =>
                                  record.lines.some((line) => line.effectiveQty > 0) &&
                                  [record.containerNo, record.parentContainerNo].some(
                                    (no) => no?.trim().toUpperCase() === container.containerNo.trim().toUpperCase(),
                                  ),
                              ))),
                      )
                      .map((container) => ({ value: container.containerNo }))
                  : [
                      {
                        value:
                          session.containerType === 'PACKAGE'
                            ? defaultPackageNo(order, records)
                            : `${session.containerType === 'BOX' ? 'BOX' : 'PLT'}-${order.no.slice(-4)}-${records.length + 1}`,
                      },
                    ]
              }
            />
          </>
        )}
        {order.type === 'FBA' && session.containerType === 'BOX' && (
          <>
            <PdaCard className="flex items-baseline gap-2 py-2">
              <span className="text-sm text-muted-foreground">{t('outbound.ui.parentContainerNo')}</span>
              {session.parentContainerNo ? (
                <span className="min-w-0 truncate font-mono text-lg font-bold">{session.parentContainerNo}</span>
              ) : (
                <span className="text-sm text-muted-foreground">{t('common.inputPlaceholder')}</span>
              )}
            </PdaCard>
            <ScanInput
              label={t('outbound.ui.parentContainerNo')}
              onScan={onScanParent}
              candidates={flow.containers
                .filter(
                  (container) =>
                    container.warehouseCode === order.warehouseCode &&
                    container.customerId === order.customerId &&
                    container.containerType === 'PALLET' &&
                    (container.status === 'IDLE' ||
                      (container.status === 'OUTBOUND' &&
                        records.some(
                          (record) =>
                            record.parentContainerNo?.trim().toUpperCase() === container.containerNo.trim().toUpperCase(),
                        ))),
                )
                .map((container) => ({ value: container.containerNo }))}
            />
          </>
        )}
        {order.type === 'B2C' && session.method === 'PACK' && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t('outbound.ui.weight')}</span>
            <Input
              className="h-12 text-lg"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={session.weight}
              placeholder={t('common.inputPlaceholder')}
              onChange={(e) => update({ weight: e.target.value })}
            />
          </label>
        )}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('outbound.ui.verifyRemark')}</span>
          <Input
            className="h-12 text-base"
            value={session.remark ?? ''}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => update({ remark: e.target.value })}
          />
        </label>
      </div>
      <PdaFooter>
        <PdaButton className="flex-1" onClick={submit}>
          {t('outbound.ui.stationSubmit', { count: draftTotal })}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
