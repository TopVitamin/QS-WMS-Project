import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { pdaToast as toast } from '@/lib/pda-toast'
import { useConfirm } from '@/hooks/use-confirm'
import { useInventoryState } from '@/hooks/use-inventory-state'
import { usePdaStep } from '@/hooks/use-pda-step'
import {
  countingStocktake,
  isWorkLocation,
  locationInfo,
  moveTargetIssue,
  pendingControl,
  type MoveTargetIssue,
} from '@/lib/inventory-derive'
import { compareLocation, resolveInventoryScan } from '@/lib/pda-inventory-scan'
import { beep } from '@/lib/scan-beep'
import { useDb, useLookups } from '@/mock/db'
import { useSettings, useCurrentWarehouse } from '@/stores/settings'
import { emptyMoveDraft, usePdaMoveSession, type PdaMoveDraft, type PdaMoveLine } from '@/stores/pda-move-session'
import type { InventoryRecord } from '@/types/wms'

export const MOVE_STEPS = ['source', 'item', 'target', 'lines', 'confirm', 'done'] as const

type Check = { ok: true; code: string } | { ok: false; text: string }
type Discrepancy = NonNullable<PdaMoveDraft['discrepancy']>

/**
 * PDA 移库各步共用的数据与动作（《PDA移库前端Demo版PRD》）：扫源位 → 扫商品／SN → 数量与目标位 → 待提交清单 → 整次提交。
 * 当前行与清单是本机草稿；整次提交与管理端共用 SUBMIT_MOVE，任一行不过整次不生效，重复提交返回原移库作业号。
 */
export function useMoveFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const nav = usePdaStep(MOVE_STEPS, 'source')
  const location = useLocation()
  /**
   * 动作自己要跳转时置位：先改草稿再跳转，各步「数据不对就纠正路由」的校验这时不要抢先跳走；
   * 跳转完成（路由变化）后复位。
   */
  const leaving = useRef(false)
  useEffect(() => {
    leaving.current = false
  }, [location.key])
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const state = useInventoryState()
  const inventoryAction = useDb((s) => s.inventoryAction)
  const { sku, customerCode, customerName } = useLookups()
  const { confirm } = useConfirm()
  const draft = usePdaMoveSession((s) => s.drafts[warehouse.code])
  const update = usePdaMoveSession((s) => s.update)

  /** 扫码处理读最新草稿：连续快扫时组件可能还没重渲染 */
  const liveDraft = useCallback(() => usePdaMoveSession.getState().drafts[warehouse.code], [warehouse.code])
  const edit = useCallback(
    (fn: (d: PdaMoveDraft) => PdaMoveDraft | undefined) => update(warehouse.code, fn),
    [update, warehouse.code],
  )

  const master = useCallback(
    (r: Pick<InventoryRecord, 'customerId' | 'skuCode'>) =>
      useDb.getState().skuMasters.find((m) => m.customerId === r.customerId && m.code === r.skuCode),
    [],
  )
  const isSn = useCallback(
    (r: Pick<InventoryRecord, 'customerId' | 'skuCode'>) => Boolean(master(r)?.snEnabled),
    [master],
  )

  /** 某条库存明细还能移多少：实际 − 已分配 − 清单里已加的（移库作业主PRD 第二节） */
  const movable = useCallback(
    (inventoryId: string, d = liveDraft()) => {
      const r = useDb.getState().inventory.find((x) => x.id === inventoryId)
      if (!r) return 0
      const inList = (d?.lines ?? []).filter((l) => l.inventoryId === inventoryId).reduce((n, l) => n + l.qty, 0)
      return r.onHandQty - (r.allocatedQty ?? 0) - inList
    },
    [liveDraft],
  )
  const usedSerials = useCallback(
    (d = liveDraft()) => new Set((d?.lines ?? []).flatMap((l) => l.serialNos)),
    [liveDraft],
  )

  /** 源库位上的库存明细（有实际的） */
  const sourceRows = useCallback(
    (locationCode: string, inventory = useDb.getState().inventory) =>
      inventory
        .filter((r) => r.warehouseCode === warehouse.code && r.locationCode === locationCode && r.onHandQty > 0)
        .sort((a, b) => a.skuCode.localeCompare(b.skuCode) || (a.batchNo ?? '').localeCompare(b.batchNo ?? '')),
    [warehouse.code],
  )
  const frozen = useCallback(
    (r: InventoryRecord) =>
      countingStocktake(useDb.getState().inventoryCounts, r.warehouseCode, r.customerId, r.skuCode),
    [],
  )
  const pending = useCallback(
    (r: InventoryRecord) =>
      Boolean(pendingControl(useDb.getState().skuAllocationControls, r.warehouseCode, r.customerId, r.skuCode)),
    [],
  )

  /** 源库位：启用的存储、拣货、不良隔离库位，且有不在盘点中的可移库存 */
  const checkSource = useCallback(
    (code: string): Check => {
      const s = useDb.getState()
      const hits = resolveInventoryScan(s, warehouse.code, code)
      const loc = hits.find((h) => h.kind === 'location')
      if (!loc) {
        const item = hits.find((h) => h.kind !== 'location')
        if (!item) return { ok: false, text: t('pdaMove.errUnknown', { code: code.trim() }) }
        return {
          ok: false,
          text: t('pdaMove.errSourceFirst', { code: item.kind === 'serial' ? item.serialNo : item.skuCode }),
        }
      }
      if (!loc.enabled) return { ok: false, text: t('pdaMove.errDisabled', { code: loc.code }) }
      if (!isWorkLocation(loc.usage))
        return {
          ok: false,
          text: t('pdaMove.errSourceUsage', { code: loc.code, usage: t(`inventory.usage.${loc.usage}`) }),
        }
      const rows = sourceRows(loc.code, s.inventory)
      if (!rows.some((r) => movable(r.id) > 0))
        return { ok: false, text: t('pdaMove.errNothingMovable', { code: loc.code }) }
      if (rows.every((r) => frozen(r) || movable(r.id) <= 0))
        return { ok: false, text: t('pdaMove.errAllCounting', { code: loc.code }) }
      return { ok: true, code: loc.code }
    },
    [frozen, movable, sourceRows, t, warehouse.code],
  )

  /** 业务阻断：必须点「知道了」（规范 §5）；扫码触发时扫码框已响过错误音 */
  const notice = useCallback(
    (title: string, description?: string, silent?: boolean) => {
      if (!silent) beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /**
   * 选定源库存明细，进入数量与目标：盘点中阻断；清单已有其他货主时阻断；没有可移数量时提示。
   * 返回 undefined 表示已进入下一步；返回文字表示扫码错误；返回 null 表示已弹阻断。
   */
  const chooseRow = useCallback(
    (row: InventoryRecord, serialNo: string | undefined, fromScan: boolean): string | null | undefined => {
      const counting = frozen(row)
      if (counting) {
        void notice(
          t('pdaMove.blockTitle'),
          t('inventory.error.counting', { sku: row.skuCode, no: counting.no }),
          fromScan,
        )
        return null
      }
      const d = liveDraft()
      const other = d?.lines.find((l) => l.customerId !== row.customerId)
      if (other) {
        void notice(
          t('pdaMove.blockTitle'),
          t('pdaMove.blockOwner', { owner: customerCode(other.customerId) }),
          fromScan,
        )
        return null
      }
      const left = movable(row.id, d)
      if (left <= 0) return t('pdaMove.errNoMovable', { sku: row.skuCode, allocated: row.allocatedQty ?? 0 })
      if (serialNo && usedSerials(d).has(serialNo)) return t('pdaMove.errSerialInList', { sn: serialNo })
      const sn = isSn(row)
      edit((x) => ({
        ...x,
        current: { inventoryId: row.id, qty: sn ? (serialNo ? 1 : 0) : 1, serialNos: serialNo ? [serialNo] : [] },
      }))
      nav.go('target', { src: row.locationCode, inv: row.id })
      return undefined
    },
    [customerCode, edit, frozen, isSn, liveDraft, movable, nav, notice, t, usedSerials],
  )

  const targetIssueText = (issue: MoveTargetIssue, code: string, row: InventoryRecord) => {
    switch (issue) {
      case 'SAME':
        return t('pdaMove.errSameLocation')
      case 'QUALITY':
        return row.qualityType === 'DEFECTIVE' ? t('pdaMove.errDefectOnly') : t('pdaMove.errNoDefectTarget', { code })
      case 'OCCUPIED':
        return t('pdaMove.errOccupied', { code })
      default:
        return t('pdaMove.errTarget', { code })
    }
  }

  /** 合法的目标库位候选：先放已有本货主同商品的库位（并箱），再放空库位 */
  const targetCandidates = (row: InventoryRecord, limit = 2) => {
    const s = useDb.getState()
    const codes = [
      ...new Set([
        ...s.locations.filter((l) => l.warehouseCode === warehouse.code).map((l) => l.code),
        ...s.locationMasters.filter((l) => l.warehouseCode === warehouse.code).map((l) => l.code),
      ]),
    ].sort(compareLocation)
    const valid = codes.filter((code) => !moveTargetIssue(s, row, code))
    const same = valid.filter((code) =>
      s.inventory.some(
        (r) =>
          r.warehouseCode === warehouse.code &&
          r.locationCode === code &&
          r.customerId === row.customerId &&
          r.skuCode === row.skuCode &&
          r.onHandQty > 0,
      ),
    )
    const empty = valid.filter(
      (code) =>
        !s.inventory.some((r) => r.warehouseCode === warehouse.code && r.locationCode === code && r.onHandQty > 0),
    )
    return [...same.slice(0, 1), ...empty].slice(0, limit)
  }

  const openStocktakeStart = useCallback(
    (d: Discrepancy) =>
      navigate(
        `/pda/stocktake/start?${new URLSearchParams({ owner: d.customerId, sku: d.skuCode, stage: 'MOVE_MISMATCH', loc: d.locationCode })}`,
      ),
    [navigate],
  )

  /**
   * 现场发现源位账实不符（移库作业主PRD 第二节）：确认后立即标记待核对，本行不移；
   * 清单里还有其他行时先提交或放弃这些行，再去发起盘点，不能用改数量绕过差异。
   */
  const reportMismatch = async (row: InventoryRecord) => {
    const ok = await confirm({
      title: t('pdaMove.mismatchTitle'),
      description: t('pdaMove.mismatchDesc', { sku: row.skuCode, location: row.locationCode }),
      confirmText: t('pdaMove.mismatchConfirm'),
      variant: 'destructive',
    })
    if (!ok) return
    const res = inventoryAction(
      {
        type: 'REPORT_DISCREPANCY',
        warehouseCode: warehouse.code,
        customerId: row.customerId,
        skuCode: row.skuCode,
        stage: 'MOVE_MISMATCH',
        locationCode: row.locationCode,
      },
      operator,
      'PDA',
    )
    if (!res.ok) {
      void notice(t('pdaMove.mismatchTitle'), t(res.errorKey, res.params))
      return
    }
    const discrepancy = { customerId: row.customerId, skuCode: row.skuCode, locationCode: row.locationCode }
    const lines = liveDraft()?.lines.length ?? 0
    leaving.current = true
    if (lines > 0) {
      edit((x) => ({ ...x, current: undefined, discrepancy }))
      await notice(t('pdaMove.mismatchMarked'), t('pdaMove.finishLinesFirst', { count: lines }), true)
      nav.replace('lines')
      return
    }
    edit(() => undefined)
    toast.info(t('pdaMove.mismatchMarked'))
    openStocktakeStart(discrepancy)
  }

  /** 把正在录的一行加入待提交清单（确认实物已搬到位） */
  const addLine = (row: InventoryRecord) => {
    const d = liveDraft()
    const cur = d?.current
    if (!d || !cur?.targetLocation) return
    const qty = isSn(row) ? cur.serialNos.length : cur.qty
    const max = movable(row.id, d)
    if (qty <= 0 || qty > max) {
      void notice(t('pdaMove.blockTitle'), t('pdaMove.errQty', { max }))
      return
    }
    const issue = moveTargetIssue(useDb.getState(), row, cur.targetLocation)
    if (issue) {
      void notice(t('pdaMove.blockTitle'), targetIssueText(issue, cur.targetLocation, row))
      return
    }
    const line: PdaMoveLine = {
      id: `${Date.now().toString(36)}-${d.lines.length}`,
      inventoryId: row.id,
      customerId: row.customerId,
      skuCode: row.skuCode,
      sourceLocation: row.locationCode,
      targetLocation: cur.targetLocation,
      batchNo: row.batchNo,
      qualityType: row.qualityType,
      qty,
      serialNos: isSn(row) ? cur.serialNos : [],
    }
    leaving.current = true
    edit((x) => ({ ...x, current: undefined, failure: undefined, lines: [...x.lines, line] }))
    beep(true)
    toast.success(t('pdaMove.lineAdded', { sku: row.skuCode, qty, target: cur.targetLocation }))
    nav.replace('lines')
  }

  const removeLine = async (line: PdaMoveLine) => {
    const ok = await confirm({
      title: t('pdaMove.removeTitle', { sku: line.skuCode, target: line.targetLocation }),
      description: t('pdaMove.removeDesc', { source: line.sourceLocation }),
      confirmText: t('pdaMove.removeLine'),
      variant: 'destructive',
    })
    if (ok) edit((x) => ({ ...x, lines: x.lines.filter((l) => l.id !== line.id), failure: undefined }))
  }

  /** 放弃草稿：已搬的实物须全部放回源位（需确认）；有待盘点的账实不符时接着去发起盘点 */
  const discard = async () => {
    const d = liveDraft()
    if (!d) return
    const ok = await confirm({
      title: t('pdaMove.discardTitle'),
      description: t('pdaMove.confirmPhysicalRestored', { count: d.lines.length }),
      confirmText: t('pdaMove.discard'),
      variant: 'destructive',
    })
    if (!ok) return
    leaving.current = true
    edit(() => undefined)
    if (d.discrepancy) openStocktakeStart(d.discrepancy)
    else nav.returnTo('source')
  }

  /** 整次提交：成功清除草稿并显示移库作业号；失败草稿全部保留并标出失败行 */
  const submit = () => {
    const d = liveDraft()
    if (!d?.lines.length) return
    const res = inventoryAction(
      {
        type: 'SUBMIT_MOVE',
        requestId: d.requestId,
        warehouseCode: warehouse.code,
        lines: d.lines.map((l) => ({
          inventoryId: l.inventoryId,
          targetLocation: l.targetLocation,
          qty: l.qty,
          serialNos: l.serialNos,
        })),
      },
      operator,
      'PDA',
    )
    if (!res.ok) {
      const line = typeof res.params?.line === 'number' ? res.params.line : undefined
      edit((x) => ({ ...x, failure: { line, errorKey: res.errorKey, params: res.params } }))
      void notice(t('pdaMove.atomicFailed'), t(res.errorKey, res.params))
      nav.returnTo('lines')
      return
    }
    leaving.current = true
    edit(() => (d.discrepancy ? { ...emptyMoveDraft(), discrepancy: d.discrepancy } : undefined))
    beep(true)
    toast.success(t('pdaMove.submitSuccess', { no: res.no }))
    nav.replace('done', { mv: res.no })
  }

  const locationUsageText = (code: string) => {
    const usage = locationInfo(state, warehouse.code, code)?.usage
    return usage ? t(`inventory.usage.${usage}`) : undefined
  }

  return {
    t,
    nav,
    leaving,
    warehouse,
    state,
    draft,
    liveDraft,
    edit,
    isSn,
    movable,
    usedSerials,
    sourceRows,
    frozen,
    pending,
    checkSource,
    chooseRow,
    targetIssueText,
    targetCandidates,
    reportMismatch,
    addLine,
    removeLine,
    discard,
    submit,
    notice,
    openStocktakeStart,
    locationUsageText,
    skuName: (code: string, customerId?: string) => sku(code, customerId)?.name,
    ownerText: (customerId: string) => `${customerCode(customerId)} ${customerName(customerId)}`,
    ownerCode: customerCode,
  }
}

export type MoveFlow = ReturnType<typeof useMoveFlow>
