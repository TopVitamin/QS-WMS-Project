import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { pdaToast as toast } from '@/lib/pda-toast'
import { useConfirm } from '@/hooks/use-confirm'
import { useInventoryState } from '@/hooks/use-inventory-state'
import { usePdaStep } from '@/hooks/use-pda-step'
import { deriveSerials, isWorkLocation, locationInfo } from '@/lib/inventory-derive'
import { compareLocation, resolveInventoryScan } from '@/lib/pda-inventory-scan'
import { discoveryOf } from '@/lib/pda-stocktake'
import { beep } from '@/lib/scan-beep'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import {
  stocktakeSessionKey,
  usePdaStocktakeSession,
  type PdaCountDraft,
  type PdaCountNewLine,
} from '@/stores/pda-stocktake-session'
import type { InventoryCount, StocktakeLine } from '@/types/inventory'

export const STOCKTAKE_STEPS = ['list', 'location', 'item', 'count', 'review'] as const

type Check = { ok: true; code: string } | { ok: false; text: string }
type SkuKey = { customerId: string; skuCode: string }
/** 开始盘一行：快照行或账面 0 新增行 */
export type CountTarget = { lineNo: number } | { add: PdaCountNewLine }

const sameAdd = (a?: PdaCountNewLine, b?: PdaCountNewLine) =>
  Boolean(
    a &&
    b &&
    a.customerId === b.customerId &&
    a.skuCode === b.skuCode &&
    a.locationCode === b.locationCode &&
    (a.batchNo ?? '') === (b.batchNo ?? ''),
  )

/**
 * PDA 实盘各步共用的数据与动作（《PDA盘点前端Demo版PRD》第一节）：选盘点单 → 扫库位 → 扫商品／SN → 录入实盘 → 核对差异保存。
 * 录入时不显示账面（盲盘），保存前才对账面；保存只写实盘、不改库存，与管理端共用 SAVE_COUNTS／ADD_COUNT_LINE。
 */
export function useStocktakeFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(STOCKTAKE_STEPS, 'list')
  const location = useLocation()
  /** 保存后要跳回本库位：先清草稿再跳转时，各步的路由纠正不要抢先跳走；路由变化后复位 */
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
  const drafts = usePdaStocktakeSession((s) => s.drafts)
  const setSessionDraft = usePdaStocktakeSession((s) => s.setDraft)

  const counting = useMemo(
    () =>
      state.inventoryCounts
        .filter((c) => c.warehouseCode === warehouse.code && c.status === 'COUNTING')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.inventoryCounts, warehouse.code],
  )
  const findCount = useCallback(
    (no?: string) =>
      no ? state.inventoryCounts.find((c) => c.no === no && c.warehouseCode === warehouse.code) : undefined,
    [state.inventoryCounts, warehouse.code],
  )
  /** 最新盘点单（动作刚写入、组件还没重渲染时用） */
  const latestCount = useCallback(
    (no: string) => useDb.getState().inventoryCounts.find((c) => c.no === no && c.warehouseCode === warehouse.code),
    [warehouse.code],
  )

  const draftOf = useCallback((no: string) => drafts[stocktakeSessionKey(warehouse.code, no)], [drafts, warehouse.code])
  const liveDraftOf = useCallback(
    (no: string) => usePdaStocktakeSession.getState().drafts[stocktakeSessionKey(warehouse.code, no)],
    [warehouse.code],
  )
  const setDraft = useCallback(
    (no: string, draft?: PdaCountDraft) => setSessionDraft(stocktakeSessionKey(warehouse.code, no), draft),
    [setSessionDraft, warehouse.code],
  )

  const master = useCallback(
    (k: SkuKey) => useDb.getState().skuMasters.find((m) => m.customerId === k.customerId && m.code === k.skuCode),
    [],
  )
  const isSn = useCallback((k: SkuKey) => Boolean(master(k)?.snEnabled), [master])
  const needsBatch = useCallback((k: SkuKey) => Boolean(master(k)?.batchEnabled || master(k)?.expiryEnabled), [master])
  const needsExpiry = useCallback((k: SkuKey) => Boolean(master(k)?.expiryEnabled), [master])

  /** 盘点范围内的库位及进度，按库位编号自然顺序 */
  const locationsOf = useCallback((count: InventoryCount) => {
    const map = new Map<string, { code: string; total: number; counted: number }>()
    count.lines.forEach((l) => {
      const row = map.get(l.locationCode) ?? { code: l.locationCode, total: 0, counted: 0 }
      row.total += 1
      if (l.countedQty !== undefined) row.counted += 1
      map.set(l.locationCode, row)
    })
    return [...map.values()].sort((a, b) => compareLocation(a.code, b.code))
  }, [])

  /** 可盘库位：启用的存储、拣货、不良隔离库位；暂存库位跟随收发单据，不在盘点范围 */
  const checkLocation = useCallback(
    (code: string): Check => {
      const hits = resolveInventoryScan(useDb.getState(), warehouse.code, code)
      const loc = hits.find((h) => h.kind === 'location')
      if (!loc) {
        const item = hits.find((h) => h.kind !== 'location')
        if (!item) return { ok: false, text: t('pdaStocktake.errUnknown', { code: code.trim() }) }
        return {
          ok: false,
          text: t('pdaStocktake.errLocationFirst', { code: item.kind === 'serial' ? item.serialNo : item.skuCode }),
        }
      }
      if (!loc.enabled) return { ok: false, text: t('pdaStocktake.errDisabled', { code: loc.code }) }
      if (!isWorkLocation(loc.usage))
        return {
          ok: false,
          text: t('pdaStocktake.errLocationUsage', { code: loc.code, usage: t(`inventory.usage.${loc.usage}`) }),
        }
      return { ok: true, code: loc.code }
    },
    [t, warehouse.code],
  )

  /** 新增行的品质跟库位用途走：不良隔离库位记不良品，其他记正常品 */
  const qualityAt = useCallback(
    (locationCode: string) =>
      locationInfo(useDb.getState(), warehouse.code, locationCode)?.usage === 'DEFECT' ? 'DEFECTIVE' : 'GOOD',
    [warehouse.code],
  )

  /** SN 归属：本仓在库或曾在本仓（已盘亏）的这个商品的序列号；返回账面所在库位 */
  const serialHome = useCallback(
    (k: SkuKey, sn: string) =>
      deriveSerials(useDb.getState(), warehouse.code).find(
        (r) => r.customerId === k.customerId && r.skuCode === k.skuCode && r.serialNo === sn,
      ),
    [warehouse.code],
  )
  /** 这个 SN 已经盘在本单另一行（同一 SN 只能盘在一行） */
  const countedIn = useCallback(
    (count: InventoryCount, k: SkuKey, sn: string, except?: CountTarget) =>
      count.lines.find(
        (l) =>
          l.customerId === k.customerId &&
          l.skuCode === k.skuCode &&
          !(except && 'lineNo' in except && except.lineNo === l.lineNo) &&
          l.countedSerialNos?.includes(sn),
      ),
    [],
  )

  /** 业务阻断：必须点「知道了」（规范 §5） */
  const notice = useCallback(
    (title: string, description?: string, silent?: boolean) => {
      if (!silent) beep(false)
      return confirm({ title, description, confirmText: t('pda.gotIt'), hideCancel: true })
    },
    [confirm, t],
  )

  /** 草稿对应的是哪一行：快照行或新增行 */
  const draftTarget = (d: PdaCountDraft): CountTarget | undefined =>
    d.lineNo !== undefined ? { lineNo: d.lineNo } : d.add ? { add: d.add } : undefined

  const lineOf = (count: InventoryCount, lineNo?: number) => count.lines.find((l) => l.lineNo === lineNo)

  /** 草稿那一行的位置与商品，用于提示 */
  const draftSubject = (count: InventoryCount, d: PdaCountDraft) => {
    const line = lineOf(count, d.lineNo)
    return line
      ? { location: line.locationCode, skuCode: line.skuCode }
      : { location: d.add?.locationCode ?? '', skuCode: d.add?.skuCode ?? '' }
  }

  /**
   * 开始盘一行：另一行还有没保存的计数时先确认放弃；同一行接着数。
   * 扫商品进入时这一件算 1，SN 商品带上扫到的 SN；点行进入从 0 开始。
   */
  const startCount = async (count: InventoryCount, target: CountTarget, init: { qty: number; serialNos: string[] }) => {
    const existing = liveDraftOf(count.no)
    const same =
      existing && ('lineNo' in target ? existing.lineNo === target.lineNo : sameAdd(existing.add, target.add))
    if (existing && !same && (existing.qty > 0 || existing.serialNos.length > 0)) {
      const subject = draftSubject(count, existing)
      const ok = await confirm({
        title: t('pdaStocktake.discardDraftTitle'),
        description: t('pdaStocktake.discardDraftDesc', {
          location: subject.location,
          sku: subject.skuCode,
          qty: existing.qty,
        }),
        confirmText: t('pdaStocktake.discardDraft'),
        variant: 'destructive',
      })
      if (!ok) return
    }
    if (same && existing) {
      const serialNos = [...existing.serialNos, ...init.serialNos.filter((sn) => !existing.serialNos.includes(sn))]
      setDraft(count.no, {
        ...existing,
        serialNos,
        qty: init.serialNos.length ? serialNos.length : existing.qty + init.qty,
      })
    } else {
      setDraft(count.no, {
        ...('lineNo' in target ? { lineNo: target.lineNo } : { add: target.add }),
        qty: init.qty,
        serialNos: init.serialNos,
        note: '',
      })
    }
    const loc = 'lineNo' in target ? lineOf(count, target.lineNo)?.locationCode : target.add.locationCode
    nav.go('count', {
      no: count.no,
      loc,
      ...('lineNo' in target ? { line: String(target.lineNo) } : { add: '1' }),
    })
  }

  /** 保存本行实盘（只写实盘，不改库存）：快照行写 SAVE_COUNTS，新增行写 ADD_COUNT_LINE；保存后回本库位继续 */
  const save = (count: InventoryCount) => {
    const d = liveDraftOf(count.no)
    if (!d) return
    const subjectKey = d.lineNo !== undefined ? lineOf(count, d.lineNo) : d.add
    if (!subjectKey) return
    const qty = isSn(subjectKey) ? d.serialNos.length : d.qty
    const res =
      d.lineNo !== undefined
        ? inventoryAction(
            {
              type: 'SAVE_COUNTS',
              no: count.no,
              entries: [{ lineNo: d.lineNo, qty, serialNos: d.serialNos, note: d.note }],
            },
            operator,
            'PDA',
          )
        : inventoryAction(
            {
              type: 'ADD_COUNT_LINE',
              no: count.no,
              locationCode: d.add!.locationCode,
              customerId: d.add!.customerId,
              skuCode: d.add!.skuCode,
              batchNo: d.add!.batchNo,
              expiryDate: d.add!.expiryDate,
              qualityType: d.add!.qualityType,
              qty,
              serialNos: d.serialNos,
              note: d.note,
            },
            operator,
            'PDA',
          )
    if (!res.ok) {
      void notice(t('pdaStocktake.saveFailed'), t(res.errorKey, res.params))
      return
    }
    const subject = draftSubject(count, d)
    leaving.current = true
    setDraft(count.no, undefined)
    beep(true)
    toast.success(t('pdaStocktake.saved', { location: subject.location, sku: subject.skuCode, qty }))
    nav.returnTo('item', { no: count.no, loc: subject.location })
  }

  /** 放弃这一行没保存的计数（需确认） */
  const discardDraft = async (count: InventoryCount) => {
    const d = liveDraftOf(count.no)
    if (!d) return true
    const subject = draftSubject(count, d)
    const ok = await confirm({
      title: t('pdaStocktake.discardDraftTitle'),
      description: t('pdaStocktake.discardDraftDesc', { location: subject.location, sku: subject.skuCode, qty: d.qty }),
      confirmText: t('pdaStocktake.discardDraft'),
      variant: 'destructive',
    })
    if (ok) setDraft(count.no, undefined)
    return ok
  }

  const usageText = (code: string) => {
    const usage = locationInfo(state, warehouse.code, code)?.usage
    return usage ? t(`inventory.usage.${usage}`) : undefined
  }
  const progress = (count: InventoryCount) => ({
    counted: count.lines.filter((l) => l.countedQty !== undefined).length,
    total: count.lines.length,
  })
  const lineBatch = (l: Pick<StocktakeLine, 'batchNo' | 'expiryDate'>) =>
    [l.batchNo, l.expiryDate].filter(Boolean).join(' · ') || undefined
  /** 待核对来源说明：发现环节 + 原单号或库位 */
  const sourceText = (source: string) => {
    const d = discoveryOf(source)
    return [t(`inventory.stage.${d.stage}`), d.sourceNo ?? d.locationCode].filter(Boolean).join(' ')
  }

  return {
    t,
    nav,
    leaving,
    warehouse,
    operator,
    state,
    counting,
    findCount,
    latestCount,
    draftOf,
    liveDraftOf,
    setDraft,
    draftTarget,
    draftSubject,
    lineOf,
    master,
    isSn,
    needsBatch,
    needsExpiry,
    locationsOf,
    checkLocation,
    qualityAt,
    serialHome,
    countedIn,
    notice,
    startCount,
    save,
    discardDraft,
    usageText,
    progress,
    lineBatch,
    sourceText,
    skuName: (code: string, customerId?: string) => sku(code, customerId)?.name,
    ownerText: (customerId: string) => `${customerCode(customerId)} ${customerName(customerId)}`,
    ownerCode: customerCode,
  }
}

export type StocktakeFlow = ReturnType<typeof useStocktakeFlow>
