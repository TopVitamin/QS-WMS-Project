import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScanMessage } from '@/components/pda/scan-input'
import { useInventoryState } from '@/hooks/use-inventory-state'
import { usePdaStep } from '@/hooks/use-pda-step'
import { resolveInventoryScan, type InventoryScanHit } from '@/lib/pda-inventory-scan'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse } from '@/stores/settings'

export const QUERY_STEPS = ['scan', 'choose', 'result'] as const

/** 结果屏的查询对象，写在路由参数里，刷新后仍能恢复 */
export type QueryTarget =
  | { kind: 'location'; loc: string }
  | { kind: 'sku'; owner: string; sku: string }
  | { kind: 'serial'; owner: string; sku: string; sn: string }

export const targetParams = (target: QueryTarget): Record<string, string> => ({ ...target })

/**
 * PDA 库存查询（《PDA库存查询前端Demo版PRD》）：扫库位、商品或 SN，按库位 → SKU／条码 → SN 识别；
 * 一个码对应多个对象（多货主同 SKU 等）时整屏选择，不静默猜测。只查询，不形成草稿，数据与管理端库存查询共用。
 */
export function useQueryFlow() {
  const { t } = useTranslation()
  const nav = usePdaStep(QUERY_STEPS, 'scan')
  const warehouse = useCurrentWarehouse()
  const state = useInventoryState()
  const { sku, customerCode, customerName } = useLookups()

  /** 能直接打开的命中：其他仓的 SN、停用库位单独提示 */
  const usable = useCallback(
    (hit: InventoryScanHit) =>
      (hit.kind !== 'serial' || hit.warehouseCode === warehouse.code) && (hit.kind !== 'location' || hit.enabled),
    [warehouse.code],
  )

  const toTarget = (hit: InventoryScanHit): QueryTarget =>
    hit.kind === 'location'
      ? { kind: 'location', loc: hit.code }
      : hit.kind === 'sku'
        ? { kind: 'sku', owner: hit.customerId, sku: hit.skuCode }
        : { kind: 'serial', owner: hit.customerId, sku: hit.skuCode, sn: hit.serialNo }

  /**
   * 扫码：命中一个直接去结果屏；多个去整屏选择；不命中或不可查时返回红字原因。
   * `replace` 用于结果屏上直接扫下一个码，不叠历史，返回键仍回扫描屏。
   */
  const scan = (raw: string, replace = false): ScanMessage | undefined => {
    const code = raw.trim()
    const hits = resolveInventoryScan(useDb.getState(), warehouse.code, code)
    const open = hits.filter(usable)
    const go = replace ? nav.replace : nav.go
    if (open.length === 1) {
      go('result', targetParams(toTarget(open[0])))
      return undefined
    }
    if (open.length > 1) {
      go('choose', { code })
      return undefined
    }
    const blocked = hits[0]
    if (blocked?.kind === 'serial')
      return {
        tone: 'error',
        text: t('pdaQuery.serialOtherWarehouse', { sn: blocked.serialNo, warehouse: blocked.warehouseCode }),
      }
    if (blocked?.kind === 'location')
      return { tone: 'error', text: t('pdaQuery.locationDisabled', { code: blocked.code }) }
    return { tone: 'error', text: t('pdaQuery.notFound', { code }) }
  }

  return {
    t,
    nav,
    warehouse,
    state,
    usable,
    toTarget,
    scan,
    skuName: (code: string, customerId?: string) => sku(code, customerId)?.name,
    ownerText: (customerId: string) => `${customerCode(customerId)} ${customerName(customerId)}`,
    ownerCode: customerCode,
  }
}

export type QueryFlow = ReturnType<typeof useQueryFlow>
