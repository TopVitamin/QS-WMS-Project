import { useEffect, useState } from 'react'
import { PdaSection } from '@/components/pda/pda-card'
import { PdaHeader } from '@/components/pda/pda-header'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { resolveInventoryScan, skuScanValue } from '@/lib/pda-inventory-scan'
import { beep } from '@/lib/scan-beep'
import { useDb } from '@/mock/db'
import type { InventoryRecord } from '@/types/wms'
import { MoveContext, MoveRowCard } from './move-shared'
import type { MoveFlow } from './use-move-flow'

/**
 * 扫商品／SN（PDA移库 PRD）：在源库位上定位库存明细；SN 商品可直接扫 SN。同一商品多个批次或品质时，
 * 列表只留命中的几行让人点选。扫到另一个可作源位的库位就换过去。
 */
export function MoveItemStep({ flow }: { flow: MoveFlow }) {
  const { t, nav, state } = flow
  const src = nav.param('src')
  const rows = src ? flow.sourceRows(src, state.inventory) : []
  const [matched, setMatched] = useState<string[]>()
  const [message, setMessage] = useState<ScanMessage>()
  const shown = matched ? rows.filter((r) => matched.includes(r.id)) : rows

  useEffect(() => {
    if ((!src || rows.length === 0) && !flow.leaving.current) nav.replace('source')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, rows.length])

  if (!src || rows.length === 0) return null

  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  /** 选定一行：进入下一步、扫码错误（红字）或已弹业务阻断 */
  const choose = (row: InventoryRecord, serialNo: string | undefined, fromScan: boolean) => {
    const result = flow.chooseRow(row, serialNo, fromScan)
    if (result === undefined) {
      setMessage(undefined)
      setMatched(undefined)
      return 'ok'
    }
    if (result === null) return 'blocked'
    setMessage({ tone: 'error', text: result })
    return 'error'
  }

  const onScan = (code: string) => {
    const s = useDb.getState()
    const hits = resolveInventoryScan(s, flow.warehouse.code, code)
    const here = flow.sourceRows(src, s.inventory)
    const loc = hits.find((h) => h.kind === 'location')
    if (loc) {
      if (loc.code === src) {
        setMessage({ tone: 'info', text: t('pdaMove.infoSameSource', { code: src }) })
        return true
      }
      const check = flow.checkSource(loc.code)
      if (!check.ok) return fail(check.text)
      setMatched(undefined)
      setMessage({ tone: 'info', text: t('pdaMove.infoSourceChanged', { code: check.code }) })
      nav.replace('item', { src: check.code })
      return true
    }
    const serial = hits.find((h) => h.kind === 'serial')
    if (serial && serial.kind === 'serial') {
      const found = here.filter((r) => r.customerId === serial.customerId && r.skuCode === serial.skuCode)
      if (!found.length) return fail(t('pdaMove.errSkuNotHere', { sku: serial.skuCode, location: src }))
      if (found.length === 1) return choose(found[0], undefined, true) === 'ok'
      setMatched(found.map((r) => r.id))
      setMessage({ tone: 'info', text: t('pdaMove.infoPickRow', { sku: serial.skuCode, count: found.length }) })
      return true
    }
    const skus = hits.filter((h) => h.kind === 'sku')
    if (skus.length === 0) return fail(t('pdaMove.errUnknown', { code: code.trim() }))
    const found = here.filter((r) =>
      skus.some((h) => h.kind === 'sku' && h.customerId === r.customerId && h.skuCode === r.skuCode),
    )
    if (found.length === 0)
      return fail(t('pdaMove.errSkuNotHere', { sku: skus[0].kind === 'sku' ? skus[0].skuCode : code, location: src }))
    if (found.length === 1) return choose(found[0], undefined, true) === 'ok'
    setMatched(found.map((r) => r.id))
    setMessage({ tone: 'info', text: t('pdaMove.infoPickRow', { sku: found[0].skuCode, count: found.length }) })
    return true
  }

  const candidates: ScanCandidate[] = [
    ...rows
      .filter((r) => !flow.isSn(r))
      .map((r) => ({ value: skuScanValue(state, r.customerId, r.skuCode), label: r.skuCode })),
    ...rows
      .filter((r) => flow.isSn(r))
      .flatMap((r) => (r.serialNos ?? []).filter((sn) => !flow.usedSerials().has(sn)).slice(0, 1))
      .map((value) => ({ value })),
  ]
    .filter((c, i, all) => all.findIndex((x) => x.value === c.value) === i)
    .slice(0, 4)

  return (
    <>
      <PdaHeader title={t('pda.move')} onBack={() => nav.back({ step: 'source' })} />
      <MoveContext flow={flow} source={src} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput label={t('pdaMove.promptItem')} onScan={onScan} message={message} candidates={candidates} />
        <PdaSection
          title={
            matched
              ? t('pdaMove.pickRowTitle', { count: shown.length })
              : t('pdaMove.sourceStock', { count: rows.length })
          }
          extra={
            matched && (
              <button
                type="button"
                className="min-h-8 px-1 text-primary"
                onClick={() => {
                  setMatched(undefined)
                  setMessage(undefined)
                }}
              >
                {t('pdaMove.showAll')}
              </button>
            )
          }
        >
          {shown.map((row) => (
            <MoveRowCard
              key={row.id}
              flow={flow}
              row={row}
              onClick={() => {
                if (choose(row, undefined, false) === 'error') beep(false)
              }}
            />
          ))}
        </PdaSection>
      </div>
    </>
  )
}
