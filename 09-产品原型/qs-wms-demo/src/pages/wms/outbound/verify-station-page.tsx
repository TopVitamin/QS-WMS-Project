import { PackageCheck, PackageOpen } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, DocNoTail, Num } from '@/components/biz/display'
import { DetailTitle, PageContainer, Panel } from '@/components/biz/page-container'
import { ScanField, type ScanFlash } from '@/components/biz/scan-field'
import { TagLabel } from '@/components/biz/status-badge'
import { SummaryCard, SummaryMetrics } from '@/components/biz/summary-card'
import { WorkbenchCurrent, WorkbenchPrompt, type WorkbenchPromptState } from '@/components/biz/workbench'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { outboundStatusMeta, outboundTypeMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { sum } from '@/lib/outbound-derive'
import {
  defaultPackageNo,
  defaultVerifySession,
  toVerifyQty,
  verifyRows,
  type VerifyRow as StationRow,
} from '@/lib/outbound-verify'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import { useWebVerifySession, webVerifyKey, type WebVerifySession } from '@/stores/web-verify-session'
import type { OutboundOrder, OutboundVerification } from '@/types/outbound'
import { VerifyCandidateTable } from './verify-candidate-table'
import { useVerifyRowColumns } from './verify-station-columns'

const live = (o: OutboundOrder) => o.status !== 'SHIPPED' && o.status !== 'CANCELLED'

/**
 * 复核工作台（复核工作台前端Demo版PRD；作业台规范见 docs/04-作业台设计规范.md）：
 * 扫出库单号定位原单，逐件扫商品或序列号，选容器后提交成一条复核记录。
 * 只调用 outboundAction 的 VERIFY，与 PDA 复核共用复核记录与数量口径。
 */
export function OutboundVerifyStationPage() {
  const { t, i18n } = useTranslation()
  const db = useDb(
    useShallow((s) => ({
      outboundOrders: s.outboundOrders,
      outboundPickTasks: s.outboundPickTasks,
      outboundVerifications: s.outboundVerifications,
      skuMasters: s.skuMasters,
      skuBarcodes: s.skuBarcodes,
      outboundAction: s.outboundAction,
    })),
  )
  const warehouse = useSettings((s) => s.warehouseCode)
  const operator = useSettings((s) => s.operator)
  const { customerCode, customerName, sku } = useLookups()
  const { confirm } = useConfirm()
  const [params, setParams] = useSearchParams()
  const no = params.get('no') ?? ''
  const sessions = useWebVerifySession((s) => s.sessions)
  const saveSession = useWebVerifySession((s) => s.set)
  const clearSession = useWebVerifySession((s) => s.clear)

  const scanRef = useRef<HTMLInputElement>(null)
  const containerNoRef = useRef<HTMLInputElement>(null)
  const weightRef = useRef<HTMLInputElement>(null)
  const [scanValue, setScanValue] = useState('')
  const [flash, setFlash] = useState<ScanFlash>()
  const [feedback, setFeedback] = useState<WorkbenchPromptState>()
  // 结果文案在发生时已翻译；切换语言时清掉，回到当前语言的默认提示（规范 §6）
  const [feedbackLang, setFeedbackLang] = useState(i18n.language)
  if (feedbackLang !== i18n.language) {
    setFeedbackLang(i18n.language)
    setFeedback(undefined)
  }

  const verifiable = (o: OutboundOrder) => o.warehouseCode === warehouse && live(o) && toVerifyQty(o) > 0
  const candidates = db.outboundOrders.filter(verifiable)
  const found = db.outboundOrders.find((o) => o.no === no && o.warehouseCode === warehouse)
  const order = found && verifiable(found) ? found : undefined
  const records = useMemo(
    () => (order ? db.outboundVerifications.filter((v) => v.orderNo === order.no && !v.deleted) : []),
    [db.outboundVerifications, order],
  )
  const key = order ? webVerifyKey(warehouse, order.no) : ''
  const session: WebVerifySession | undefined = order
    ? (sessions[key] ?? defaultVerifySession(order, records))
    : undefined
  const update = (patch: Partial<WebVerifySession>) => {
    if (order && session) saveSession(key, { ...session, ...patch })
  }

  const snEnabled = (skuCode: string) =>
    Boolean(order && db.skuMasters.find((m) => m.customerId === order.customerId && m.code === skuCode)?.snEnabled)

  const rows: StationRow[] = useMemo(
    () => (order && session ? verifyRows(db, order, session.lines) : []),
    [db, order, session],
  )

  const draftTotal = sum(rows, (r) => r.qty)
  const toVerify = order ? toVerifyQty(order) : 0

  const refocusScan = () => requestAnimationFrame(() => scanRef.current?.focus())
  const result = (ok: boolean, prompt: WorkbenchPromptState) => {
    setFlash((f) => ({ ok, key: (f?.key ?? 0) + 1 }))
    setFeedback(prompt)
    setScanValue('')
    refocusScan()
  }
  /** 业务阻断：「知道了」弹窗；扫码框先让出焦点，防止扫描枪回车重复触发 */
  const block = async (title: string, description: string) => {
    setFlash((f) => ({ ok: false, key: (f?.key ?? 0) + 1 }))
    scanRef.current?.blur()
    await confirm({ title, description, hideCancel: true, confirmText: t('pda.gotIt') })
    setScanValue('')
    refocusScan()
  }

  const setLine = (id: string, qty: number, serialNos: string[]) => {
    if (!session) return
    const lines = { ...session.lines }
    if (qty > 0) lines[id] = { qty, serialNos }
    else delete lines[id]
    update({ lines, activeId: id })
  }

  /** 定位原单：只接受本仓、未出库未取消、有待复核量的出库单 */
  const openOrder = (code: string) => {
    const target = db.outboundOrders.find((o) => o.no.toLowerCase() === code.toLowerCase())
    if (target && verifiable(target)) {
      setParams({ no: target.no })
      result(true, {
        tone: 'success',
        title: t('outbound.ui.stationOpenedTitle', { no: target.no }),
        detail: t('outbound.ui.stationOpenedDetail', { count: toVerifyQty(target) }),
      })
      return
    }
    result(false, {
      tone: 'error',
      title: t('outbound.ui.stationOrderMissTitle', { code }),
      detail: t(unavailableReason(target, warehouse)),
    })
  }

  const resolveSku = (code: string) => {
    if (!order) return undefined
    const codes = [...new Set(rows.map((r) => r.skuCode))]
    const bySku = codes.find((c) => c.toLowerCase() === code.toLowerCase())
    if (bySku) return bySku
    const ownerCode = customerCode(order.customerId)
    const barcode = db.skuBarcodes.find((b) => b.barcode === code && b.ownerCode === ownerCode)
    if (barcode && codes.includes(barcode.skuCode)) return barcode.skuCode
    return codes.find((c) => sku(c)?.barcode === code)
  }

  const onScan = () => {
    const code = scanValue.trim()
    if (!code) return
    if (!order || !session) {
      openOrder(code)
      return
    }
    // 扫到另一张可复核的出库单：本次没有录入时直接换单
    const other = db.outboundOrders.find((o) => o.no.toLowerCase() === code.toLowerCase() && o.no !== order.no)
    if (other) {
      if (draftTotal > 0) {
        result(false, {
          tone: 'error',
          title: t('outbound.ui.stationSwitchBlockedTitle', { count: draftTotal }),
          detail: t('outbound.ui.stationSwitchBlockedDetail'),
        })
        return
      }
      openOrder(code)
      return
    }
    // 序列号：本单某行尚未复核、本次也没扫过
    const snRow = rows.find((r) => r.sn && r.serialsLeft.includes(code))
    if (snRow) {
      if (snRow.serialNos.includes(code)) {
        result(false, {
          tone: 'error',
          title: t('outbound.ui.stationSnDupTitle', { sn: code }),
          detail: t('outbound.ui.stationSnDupDetail'),
        })
        return
      }
      setLine(snRow.id, snRow.qty + 1, [...snRow.serialNos, code])
      result(true, {
        tone: 'success',
        title: t('outbound.ui.stationBumpTitle', { sku: snRow.skuCode }),
        detail: t('outbound.ui.stationBumpDetail', {
          count: draftTotal + 1,
          left:
            sum(
              rows.filter((r) => r.skuCode === snRow.skuCode),
              (r) => r.remaining - r.qty,
            ) - 1,
        }),
      })
      return
    }
    if (records.some((v) => v.lines.some((l) => l.effectiveQty > 0 && l.serialNos.includes(code)))) {
      result(false, {
        tone: 'error',
        title: t('outbound.ui.stationSnVerifiedTitle', { sn: code }),
        detail: t('outbound.ui.stationSnDupDetail'),
      })
      return
    }
    const hit = resolveSku(code)
    if (!hit) {
      result(false, {
        tone: 'error',
        title: t('outbound.ui.stationMissTitle', { code }),
        detail: t('outbound.ui.stationMissDetail'),
      })
      return
    }
    if (snEnabled(hit)) {
      result(false, {
        tone: 'error',
        title: t('outbound.ui.stationNeedSnTitle', { sku: hit }),
        detail: t('outbound.ui.stationNeedSnDetail'),
      })
      return
    }
    const open = rows.filter((r) => r.skuCode === hit && r.qty < r.remaining)
    const row = open.find((r) => r.id === session.activeId) ?? open[0]
    if (!row) {
      result(false, {
        tone: 'error',
        title: t('outbound.ui.stationFullTitle', { sku: hit }),
        detail: t('outbound.ui.stationFullDetail', {
          count: sum(
            rows.filter((r) => r.skuCode === hit),
            (r) => r.qty,
          ),
        }),
      })
      return
    }
    setLine(row.id, row.qty + 1, [])
    result(true, {
      tone: 'success',
      title: t('outbound.ui.stationBumpTitle', { sku: hit }),
      detail: t('outbound.ui.stationBumpDetail', {
        count: draftTotal + 1,
        left:
          sum(
            rows.filter((r) => r.skuCode === hit),
            (r) => r.remaining - r.qty,
          ) - 1,
      }),
    })
  }

  /** 普通商品直接改本次数量：超过待复核拒绝并保留原值 */
  const changeQty = (row: StationRow, qty: number) => {
    if (!Number.isInteger(qty) || qty < 0 || qty > row.remaining) {
      result(false, {
        tone: 'error',
        title: t('outbound.ui.stationOverTitle', { sku: row.skuCode }),
        detail: t('outbound.ui.stationOverDetail', { max: row.remaining }),
      })
      return false
    }
    setLine(row.id, qty, [])
    setFeedback(undefined)
    return true
  }

  const changeMethod = (method: OutboundVerification['method']) => {
    if (!order) return
    if (method === 'PACK' && order.type === 'B2C')
      update({
        method,
        containerType: 'PACKAGE',
        containerNo: session?.containerNo || defaultPackageNo(order, records),
      })
    else if (method === 'PACK' && session?.containerType === 'NONE') update({ method, containerType: 'BOX' })
    else update({ method })
    refocusScan()
  }

  const fail = (title: string, detail: string, focus?: React.RefObject<HTMLInputElement | null>) => {
    setFlash((f) => ({ ok: false, key: (f?.key ?? 0) + 1 }))
    setFeedback({ tone: 'error', title, detail })
    if (focus) requestAnimationFrame(() => focus.current?.focus())
    else refocusScan()
  }

  const submit = () => {
    if (!order || !session) return
    const lines = rows.filter((r) => r.qty > 0)
    if (!lines.length) return fail(t('outbound.ui.stationEmptyTitle'), t('outbound.ui.stationEmptyDetail'))
    const containerNo = session.containerNo.trim()
    if (session.containerType !== 'NONE' && !containerNo)
      return fail(
        t('outbound.ui.stationContainerNoTitle', { type: t(`outbound.containers.${session.containerType}`) }),
        t('outbound.ui.stationContainerNoDetail'),
        containerNoRef,
      )
    if (session.method === 'SORT' && records.some((v) => v.method === 'SORT'))
      return fail(t('outbound.ui.stationSortUsedTitle'), t('outbound.ui.stationSortUsedDetail'))
    if (order.type === 'B2C' && session.method === 'PACK' && session.containerType !== 'PACKAGE')
      return fail(t('outbound.ui.stationB2cPackageTitle'), t('outbound.ui.stationB2cPackageDetail'))
    const weight = session.method === 'PACK' && session.weight.trim() ? Number(session.weight) : undefined
    if (
      (weight !== undefined && (!Number.isFinite(weight) || weight <= 0)) ||
      (order.type === 'B2C' && session.method === 'PACK' && weight === undefined)
    )
      return fail(t('outbound.ui.stationWeightTitle'), t('outbound.ui.stationWeightDetail'), weightRef)
    const res = db.outboundAction(
      {
        type: 'VERIFY',
        no: order.no,
        method: session.method,
        containerType: session.containerType,
        containerNo: session.containerType === 'NONE' ? '' : containerNo,
        weightKg: weight,
        lines: lines.map((r) => ({ assignmentId: r.id, qty: r.qty, serialNos: r.serialNos })),
      },
      operator,
    )
    if (!res.ok) {
      void block(t('outbound.ui.stationSubmitFailTitle'), t(res.errorKey, res.params))
      return
    }
    const count = sum(lines, (r) => r.qty)
    const record = useDb.getState().outboundVerifications.find((v) => v.no === res.no)
    clearSession(key)
    const after = useDb.getState().outboundOrders.find((o) => o.no === order.no)
    const left = after ? toVerifyQty(after) : 0
    if (left === 0) setParams({})
    result(true, {
      tone: 'success',
      title: t('outbound.ui.stationSubmittedTitle', { no: res.no, count }),
      detail: [
        record?.containerType !== 'NONE' && record?.containerNo
          ? t('outbound.ui.stationSubmittedContainer', {
              type: t(`outbound.containers.${record.containerType}`),
              no: record.containerNo,
            })
          : '',
        record?.trackingNo ? t('outbound.ui.stationSubmittedTracking', { no: record.trackingNo }) : '',
        left === 0
          ? t('outbound.ui.stationSubmittedDone', { no: order.no })
          : t('outbound.ui.stationSubmittedLeft', { count: left }),
      ]
        .filter(Boolean)
        .join(' · '),
    })
  }

  const onClear = async () => {
    const ok = await confirm({
      title: t('outbound.ui.stationClear'),
      description: t('outbound.ui.stationClearConfirm', { count: draftTotal }),
      variant: 'destructive',
    })
    if (!ok) return
    clearSession(key)
    setFeedback(undefined)
    refocusScan()
  }

  const changeOrder = async () => {
    if (draftTotal > 0) {
      const ok = await confirm({
        title: t('outbound.ui.stationChangeOrder'),
        description: t('outbound.ui.stationClearConfirm', { count: draftTotal }),
        variant: 'destructive',
      })
      if (!ok) return
    }
    clearSession(key)
    setParams({})
    setFeedback(undefined)
    refocusScan()
  }

  const defaultPrompt: WorkbenchPromptState = !order
    ? no
      ? {
          tone: 'error',
          title: t('outbound.ui.stationOrderMissTitle', { code: no }),
          detail: t(unavailableReason(found, warehouse)),
        }
      : {
          tone: 'warning',
          title: t('outbound.ui.stationScanOrderTitle'),
          detail: t('outbound.ui.stationScanOrderDetail'),
        }
    : draftTotal > 0 && draftTotal === toVerify
      ? {
          tone: 'info',
          title: t('outbound.ui.stationAllScannedTitle', { count: draftTotal }),
          detail: t('outbound.ui.stationAllScannedDetail'),
        }
      : {
          tone: 'info',
          title: t('outbound.ui.stationScanItemTitle'),
          detail: t('outbound.ui.stationScanItemDetail', { count: draftTotal, left: toVerify - draftTotal }),
        }

  const rowColumns = useVerifyRowColumns({ sku, changeQty, setLine, refocusScan })

  const itemProgress = order
    ? order.items
        .filter((i) => i.pickedQty > 0)
        .map((i) => ({
          ...i,
          thisTime: sum(
            rows.filter((r) => r.itemNo === i.lineNo),
            (r) => r.qty,
          ),
        }))
    : []

  return (
    <PageContainer
      fill
      title={
        order ? (
          <DetailTitle
            title={t('menu.verifyStation')}
            code={<DocNoTail value={order.no} tail={4} className="text-base" />}
            status={outboundStatusMeta[order.status]}
          />
        ) : (
          t('menu.verifyStation')
        )
      }
      actions={
        order && (
          <>
            <Button variant="outline" asChild>
              <Link to={`/wms/outbound/orders/${encodeURIComponent(order.no)}?tab=reviews`}>
                {t('outbound.ui.stationOrderDetail')}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => void changeOrder()}>
              {t('outbound.ui.stationChangeOrder')}
            </Button>
          </>
        )
      }
    >
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto p-4">
          {order && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-base">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('outbound.ui.owner')}</span>
                <CodeName code={customerCode(order.customerId)} name={customerName(order.customerId)} />
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('outbound.ui.type')}</span>
                <TagLabel meta={outboundTypeMeta[order.type]} />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{t('outbound.ui.stationToVerify')}</span>
                <Num value={toVerify} className="text-xl font-semibold" />
              </span>
            </div>
          )}

          <WorkbenchPrompt prompt={feedback ?? defaultPrompt} />

          {order && (
            <WorkbenchCurrent icon={PackageOpen} label={t('outbound.ui.stationCurrentOrder')}>
              <DocNoTail value={order.no} tail={4} className="text-2xl" />
            </WorkbenchCurrent>
          )}

          <ScanField
            inputRef={scanRef}
            flash={flash}
            placeholder={order ? t('outbound.ui.stationScanItem') : t('outbound.ui.stationScanOrder')}
            value={scanValue}
            onChange={setScanValue}
            onEnter={onScan}
          />

          {!order ? (
            <>
              <h2 className="text-base font-medium">{t('outbound.ui.stationCandidates')}</h2>
              <VerifyCandidateTable orders={candidates} onOpen={openOrder} />
            </>
          ) : (
            session && (
              <>
                <DataTable
                  data={rows}
                  columns={rowColumns}
                  getRowId={(r) => r.id}
                  paginate={false}
                  showColumnSettings={false}
                  onRowClick={(r) => {
                    update({ activeId: r.id })
                    refocusScan()
                  }}
                  getRowClassName={(r) => (r.id === session.activeId ? 'bg-primary/5' : undefined)}
                />
                <section className="flex flex-col gap-3 rounded-xl border p-4">
                  <h2 className="text-base font-medium">{t('outbound.ui.stationPacking')}</h2>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <ChoiceRow
                      label={t('outbound.ui.method')}
                      value={session.method}
                      options={(['SORT', 'PACK'] as const).map((v) => ({
                        value: v,
                        label: t(`outbound.verifyMethods.${v}`),
                      }))}
                      onChange={changeMethod}
                    />
                    <ChoiceRow
                      label={t('outbound.ui.containerType')}
                      value={session.containerType}
                      options={(['NONE', 'PACKAGE', 'BOX', 'PALLET'] as const).map((v) => ({
                        value: v,
                        label: t(`outbound.containers.${v}`),
                      }))}
                      onChange={(containerType) => {
                        update({ containerType })
                        refocusScan()
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    {session.containerType !== 'NONE' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('outbound.ui.containerNo')}</span>
                        <Input
                          ref={containerNoRef}
                          className="h-10 w-64 text-base"
                          value={session.containerNo}
                          placeholder={t('common.inputPlaceholder')}
                          onChange={(e) => update({ containerNo: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && refocusScan()}
                        />
                      </label>
                    )}
                    {session.method === 'PACK' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('outbound.ui.weight')}</span>
                        <Input
                          ref={weightRef}
                          className="h-10 w-40 text-base"
                          type="number"
                          min={0}
                          step={0.01}
                          value={session.weight}
                          placeholder={t('common.inputPlaceholder')}
                          onChange={(e) => update({ weight: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && refocusScan()}
                        />
                      </label>
                    )}
                  </div>
                </section>
              </>
            )
          )}
        </Panel>

        <SummaryCard
          size="lg"
          className="min-h-0"
          title={
            <span className="flex items-center gap-2">
              {t('outbound.ui.stationProgress')}
              <TagLabel tone={draftTotal ? 'blue' : 'gray'}>{draftTotal}</TagLabel>
            </span>
          }
          description={order ? t('outbound.ui.stationProgressHint', { count: records.length }) : undefined}
        >
          <div className="-mx-1 flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-1">
            {!order && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <PackageCheck className="size-8 opacity-40" />
                <p className="text-sm">{t('outbound.ui.stationProgressEmpty')}</p>
              </div>
            )}
            {itemProgress.map((i) => (
              <div
                key={i.lineNo}
                className={cn('rounded-lg border px-3 py-2', i.thisTime > 0 && 'border-primary bg-primary/5')}
              >
                <BizCode className="text-base font-semibold">{i.skuCode}</BizCode>
                <div className="text-sm text-muted-foreground">
                  {t('outbound.ui.stationLineProgress', {
                    picked: i.pickedQty,
                    verified: i.verifiedQty,
                    count: i.thisTime,
                  })}
                </div>
              </div>
            ))}
          </div>

          {order && (
            <SummaryMetrics
              size="lg"
              items={[
                { label: t('outbound.ui.picked'), value: sum(order.items, (i) => i.pickedQty) },
                { label: t('outbound.ui.verified'), value: sum(order.items, (i) => i.verifiedQty) },
                { label: t('outbound.ui.stationThisTime'), value: draftTotal, tone: 'blue' },
                {
                  label: t('outbound.ui.stationLeftAfter'),
                  value: toVerify - draftTotal,
                  tone: toVerify - draftTotal ? 'orange' : 'green',
                },
              ]}
            />
          )}

          {order && (
            <div className="flex flex-col gap-2">
              <Button className="h-12 w-full text-base" disabled={draftTotal === 0} onClick={submit}>
                {t('outbound.ui.stationSubmit', { count: draftTotal })}
              </Button>
              {draftTotal > 0 && (
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => void onClear()}>
                  {t('outbound.ui.stationClear')}
                </Button>
              )}
            </div>
          )}
        </SummaryCard>
      </div>
    </PageContainer>
  )
}

function unavailableReason(order: OutboundOrder | undefined, warehouse: string) {
  if (!order || order.warehouseCode !== warehouse) return 'outbound.ui.stationReasonNotFound'
  if (order.status === 'SHIPPED') return 'outbound.ui.stationReasonShipped'
  if (order.status === 'CANCELLED') return 'outbound.ui.stationReasonCancelled'
  return 'outbound.ui.stationReasonNothing'
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1">
        {options.map((o) => (
          <Button
            key={o.value}
            role="radio"
            aria-checked={o.value === value}
            variant={o.value === value ? 'default' : 'outline'}
            className="h-10 px-4 text-base"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
