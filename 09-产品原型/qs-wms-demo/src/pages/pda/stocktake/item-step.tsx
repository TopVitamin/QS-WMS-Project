import { useEffect, useState } from 'react'
import { PdaButton, PdaListItem, PdaSection } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaSkuBlock } from '@/components/pda/pda-stock'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { resolveInventoryScan, skuScanValue } from '@/lib/pda-inventory-scan'
import { useDb } from '@/mock/db'
import type { InventoryCount, StocktakeLine } from '@/types/inventory'
import { CountLineCard, StocktakeContext } from './stocktake-shared'
import type { CountTarget, StocktakeFlow } from './use-stocktake-flow'

type SkuKey = { customerId: string; skuCode: string }
/** 需要人选的一步：同一个码是本单几个货主的商品，或本库位同一商品有几行（批次、品质） */
type Choice =
  { kind: 'owner'; options: SkuKey[] } | { kind: 'line'; sku: SkuKey; lines: StocktakeLine[]; allowNew: boolean }

/**
 * 扫商品／SN（PDA盘点 PRD 第一节）：商品须在本单 SKU 范围；SN 商品扫 SN，SN 账面在别的库位也照实记在这里。
 * 本库位快照里没有的归属明确实物按账面 0 新增一行；认不出归属的提示去无主货登记。
 */
export function StocktakeItemStep({ flow }: { flow: StocktakeFlow }) {
  const { nav } = flow
  const count = flow.findCount(nav.param('no'))
  const loc = nav.param('loc')
  const valid = Boolean(count && count.status === 'COUNTING' && loc)

  useEffect(() => {
    if (!valid) nav.replace(count ? 'location' : 'list', count ? { no: count.no } : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  if (!valid || !count || !loc) return null
  return <ItemWorkspace key={`${count.no}|${loc}`} flow={flow} count={count} location={loc} />
}

function ItemWorkspace({ flow, count, location }: { flow: StocktakeFlow; count: InventoryCount; location: string }) {
  const { t, nav, state } = flow
  const [message, setMessage] = useState<ScanMessage>()
  const [choice, setChoice] = useState<Choice>()
  const lines = count.lines.filter((l) => l.locationCode === location)
  const left = lines.filter((l) => l.countedQty === undefined).length

  const fail = (text: string) => {
    setMessage({ tone: 'error', text })
    return false
  }
  const begin = (target: CountTarget, init: { qty: number; serialNos: string[] }) => {
    setChoice(undefined)
    setMessage(undefined)
    void flow.startCount(count, target, init)
  }
  const newLine = (sku: SkuKey): CountTarget => ({
    add: {
      customerId: sku.customerId,
      skuCode: sku.skuCode,
      locationCode: location,
      qualityType: flow.qualityAt(location),
    },
  })

  /** 定位到商品后：本库位没有这一行就新增；只有一行且不分批次直接盘；否则整屏点选（可选新增其他批次） */
  const chooseSku = (sku: SkuKey, viaScan: boolean) => {
    if (flow.isSn(sku) && viaScan) return fail(t('pdaStocktake.errNeedSerial', { sku: sku.skuCode }))
    const here = lines.filter((l) => l.customerId === sku.customerId && l.skuCode === sku.skuCode)
    const init = { qty: viaScan ? 1 : 0, serialNos: [] }
    if (here.length === 0) {
      begin(newLine(sku), init)
      return true
    }
    if (here.length === 1 && !flow.needsBatch(sku)) {
      begin({ lineNo: here[0].lineNo }, init)
      return true
    }
    setChoice({ kind: 'line', sku, lines: here, allowNew: flow.needsBatch(sku) })
    setMessage({ tone: 'info', text: t('pdaStocktake.infoPickLine', { sku: sku.skuCode }) })
    return true
  }

  const onScan = (code: string) => {
    const s = useDb.getState()
    const live = flow.latestCount(count.no) ?? count
    const hits = resolveInventoryScan(s, flow.warehouse.code, code)
    const loc = hits.find((h) => h.kind === 'location')
    if (loc) {
      if (loc.code === location) {
        setMessage({ tone: 'info', text: t('pdaStocktake.infoSameLocation', { code: location }) })
        return true
      }
      const check = flow.checkLocation(loc.code)
      if (!check.ok) return fail(check.text)
      setChoice(undefined)
      setMessage(undefined)
      nav.replace('item', { no: count.no, loc: check.code })
      return true
    }
    const inScope = (k: SkuKey) => live.skus.some((x) => x.customerId === k.customerId && x.skuCode === k.skuCode)
    const serial = hits.find((h) => h.kind === 'serial')
    if (serial?.kind === 'serial' && inScope(serial)) {
      const sn = serial.serialNo
      const other = flow.countedIn(live, serial, sn)
      if (other && other.locationCode !== location)
        return fail(t('pdaStocktake.errSerialCounted', { sn, location: other.locationCode }))
      const here = live.lines.filter(
        (l) => l.locationCode === location && l.customerId === serial.customerId && l.skuCode === serial.skuCode,
      )
      const line = here.find((l) => l.bookSerialNos.includes(sn)) ?? here[0]
      const home = flow.serialHome(serial, sn)
      if (home && home.status === 'IN_STOCK' && home.locationCode !== location)
        setMessage({ tone: 'info', text: t('pdaStocktake.infoSerialElsewhere', { sn, location: home.locationCode }) })
      void flow.startCount(live, line ? { lineNo: line.lineNo } : newLine(serial), { qty: 1, serialNos: [sn] })
      return true
    }
    const skus = hits.filter((h) => h.kind === 'sku').map((h) => ({ customerId: h.customerId, skuCode: h.skuCode }))
    const scoped = skus.filter(inScope)
    if (scoped.length === 0) {
      if (skus.length > 0 || serial) {
        const code0 = serial?.kind === 'serial' ? serial.skuCode : skus[0].skuCode
        return fail(t('inventory.error.skuOutOfScope', { sku: code0 }))
      }
      return fail(t('pdaStocktake.errUnknownItem', { code: code.trim() }))
    }
    if (scoped.length > 1) {
      setChoice({ kind: 'owner', options: scoped })
      setMessage({ tone: 'info', text: t('pdaStocktake.infoPickOwner', { sku: scoped[0].skuCode }) })
      return true
    }
    return chooseSku(scoped[0], true)
  }

  const candidates: ScanCandidate[] = [
    ...lines
      .filter((l) => l.countedQty === undefined)
      .map((l) =>
        flow.isSn(l)
          ? { value: l.bookSerialNos[0] ?? skuScanValue(state, l.customerId, l.skuCode) }
          : { value: skuScanValue(state, l.customerId, l.skuCode), label: l.skuCode },
      ),
    ...count.skus
      .filter((k) => !lines.some((l) => l.customerId === k.customerId && l.skuCode === k.skuCode) && !flow.isSn(k))
      .map((k) => ({
        value: skuScanValue(state, k.customerId, k.skuCode),
        label: t('pdaStocktake.foundHere', { sku: k.skuCode }),
      })),
  ]
    .filter((c, i, all) => c.value && all.findIndex((x) => x.value === c.value) === i)
    .slice(0, 3)

  return (
    <>
      <PdaHeader title={t('pda.count')} onBack={() => nav.back({ step: 'location', params: { no: count.no } })} />
      <StocktakeContext flow={flow} count={count} location={location} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <ScanInput label={t('pdaStocktake.promptItem')} onScan={onScan} message={message} candidates={candidates} />
        {choice?.kind === 'owner' && (
          <PdaSection title={t('pdaStocktake.pickOwner')}>
            {choice.options.map((k) => (
              <PdaListItem key={k.customerId} chevron onClick={() => chooseSku(k, true)}>
                <PdaSkuBlock skuCode={k.skuCode} name={flow.skuName(k.skuCode, k.customerId)} owner={flow.ownerText(k.customerId)} />
              </PdaListItem>
            ))}
          </PdaSection>
        )}
        {choice?.kind === 'line' && (
          <PdaSection title={t('pdaStocktake.pickLine', { sku: choice.sku.skuCode })}>
            {choice.lines.map((l) => (
              <CountLineCard
                key={l.lineNo}
                flow={flow}
                line={l}
                onClick={() => begin({ lineNo: l.lineNo }, { qty: 1, serialNos: [] })}
              />
            ))}
            {choice.allowNew && (
              <PdaListItem chevron onClick={() => begin(newLine(choice.sku), { qty: 1, serialNos: [] })}>
                <div className="text-base font-medium">{t('pdaStocktake.otherBatch')}</div>
                <div className="text-sm text-muted-foreground">{t('pdaStocktake.otherBatchHint')}</div>
              </PdaListItem>
            )}
          </PdaSection>
        )}
        {!choice && (
          <PdaSection title={t('pdaStocktake.linesHere', { count: lines.length })}>
            {lines.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('pdaStocktake.noLinesHere')}</p>
            )}
            {lines.map((l) => (
              <CountLineCard
                key={l.lineNo}
                flow={flow}
                line={l}
                onClick={() => begin({ lineNo: l.lineNo }, { qty: 0, serialNos: [] })}
              />
            ))}
          </PdaSection>
        )}
        <p className="text-sm text-muted-foreground">{t('pdaStocktake.unknownHint')}</p>
      </div>
      <PdaFooter hint={left > 0 ? t('pdaStocktake.hintItem', { count: left }) : undefined}>
        <PdaButton
          className="flex-1"
          variant={left > 0 ? 'outline' : 'default'}
          onClick={() => nav.returnTo('location', { no: count.no })}
        >
          {t('pdaStocktake.nextLocation')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
