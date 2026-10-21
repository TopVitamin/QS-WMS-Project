import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { DocNoTail, Empty } from '@/components/biz/display'
import { TagLabel } from '@/components/biz/status-badge'
import { PdaButton, PdaCard } from '@/components/pda/pda-card'
import { PdaFooter, PdaHeader } from '@/components/pda/pda-header'
import { PdaFigure, PdaLocation, PdaSkuBlock } from '@/components/pda/pda-stock'
import { QtyStepper } from '@/components/pda/qty-stepper'
import { ScanInput, type ScanCandidate, type ScanMessage } from '@/components/pda/scan-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { inventoryTagMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useInventoryState } from '@/hooks/use-inventory-state'
import {
  countingStocktake,
  isWorkLocation,
  locationInfo,
  pendingControl,
  stocktakeBlockers,
} from '@/lib/inventory-derive'
import { compareLocation } from '@/lib/pda-inventory-scan'
import { beep } from '@/lib/scan-beep'
import { useDb, useLookups } from '@/mock/db'
import { useCurrentWarehouse, useSettings } from '@/stores/settings'
import type { DiscoveryStage } from '@/types/inventory'

const STAGES: DiscoveryStage[] = [
  'PICK_SHORTAGE',
  'VERIFY_SHORT',
  'PUTAWAY_MISSING',
  'PUTBACK_MISSING',
  'MOVE_MISMATCH',
]

/**
 * 发现账实不符发起盘点（《PDA盘点前端Demo版PRD》第二节）：从原作业带入仓库、货主、SKU、发现环节、原单号和库位，
 * 待核对在发现时已生效。这个 SKU 还有进行中的上架、返库上架、拣货任务或已分配时，提示先收尾、不建单；
 * 补充少了多少和说明后建单。已在盘点中则把本次发现追加到该单发现依据，返回原单号，不重复冻结。
 */
export function PdaStocktakeStartPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const warehouse = useCurrentWarehouse()
  const operator = useSettings((s) => s.operator)
  const state = useInventoryState()
  const inventoryAction = useDb((s) => s.inventoryAction)
  const { sku, customerCode, customerName } = useLookups()
  const { confirm } = useConfirm()

  const owner = params.get('owner') ?? ''
  const skuCode = params.get('sku') ?? ''
  const rawStage = params.get('stage') as DiscoveryStage | null
  const stage: DiscoveryStage = rawStage && STAGES.includes(rawStage) ? rawStage : 'MOVE_MISMATCH'
  const source = params.get('source') ?? undefined
  const valid = state.skuMasters.some((m) => m.customerId === owner && m.code === skuCode)

  /** 原单带出的库位：拣货任务取报缺货的那一行，返库上架单取应返库的建议库位 */
  const presetLocation = useMemo(() => {
    const given = params.get('loc')
    if (given) return given
    const task = state.outboundPickTasks.find((p) => p.no === source)
    const taskLine = task?.lines.find((l) => l.skuCode === skuCode && l.shortageQty > 0)
    if (taskLine) return taskLine.locationCode
    const putback = state.outboundPutbacks.find((p) => p.no === source)
    return putback?.lines.find((l) => l.skuCode === skuCode)?.suggestedLocation
  }, [params, skuCode, source, state.outboundPickTasks, state.outboundPutbacks])

  const [location, setLocation] = useState(presetLocation ?? '')
  const [diffQty, setDiffQty] = useState(1)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<ScanMessage>()

  const pending = pendingControl(state.skuAllocationControls, warehouse.code, owner, skuCode)
  const existing = countingStocktake(state.inventoryCounts, warehouse.code, owner, skuCode)
  const blockers = existing
    ? []
    : stocktakeBlockers(state, warehouse.code, [{ customerId: owner, skuCode }]).filter((b) => b.kind !== 'COUNTING')

  const back = () => {
    if (((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0) navigate(-1)
    else navigate('/pda/stocktake', { replace: true })
  }

  const onScan = (code: string) => {
    const loc = locationInfo(useDb.getState(), warehouse.code, code)
    if (!loc) {
      setMessage({ tone: 'error', text: t('pdaStocktake.errUnknown', { code: code.trim() }) })
      return false
    }
    if (!loc.enabled || !isWorkLocation(loc.usage)) {
      setMessage({
        tone: 'error',
        text: t('pdaStocktake.errLocationUsage', { code: loc.code, usage: t(`inventory.usage.${loc.usage}`) }),
      })
      return false
    }
    setLocation(loc.code)
    setMessage({ tone: 'success', text: t('pdaStocktake.okLocation', { code: loc.code }) })
    return true
  }

  const submit = () => {
    const res = inventoryAction(
      {
        type: 'CREATE_STOCKTAKE_FROM_DISCREPANCY',
        warehouseCode: warehouse.code,
        customerId: owner,
        skuCode,
        stage,
        locationCode: location,
        diffQty,
        note,
        sourceNo: source,
      },
      operator,
      'PDA',
    )
    if (!res.ok) {
      beep(false)
      void confirm({
        title: t('pdaStocktake.startFailed'),
        description: t(res.errorKey, res.params),
        confirmText: t('pda.gotIt'),
        hideCancel: true,
      })
      return
    }
    beep(true)
    toast.success(
      existing ? t('pdaStocktake.existingStocktake', { no: res.no }) : t('pdaStocktake.created', { no: res.no }),
    )
    navigate(`/pda/stocktake?${new URLSearchParams({ step: 'location', no: res.no ?? '' })}`, { replace: true })
  }

  if (!valid)
    return (
      <>
        <PdaHeader title={t('pdaStocktake.startTitle')} onBack={back} />
        <div className="flex flex-1 flex-col gap-3 p-3">
          <PdaCard className="text-sm text-muted-foreground">{t('pdaStocktake.startMissing')}</PdaCard>
        </div>
      </>
    )

  const candidates: ScanCandidate[] = [
    ...new Set([
      ...(presetLocation ? [presetLocation] : []),
      ...state.inventory
        .filter(
          (r) =>
            r.warehouseCode === warehouse.code && r.customerId === owner && r.skuCode === skuCode && r.onHandQty > 0,
        )
        .map((r) => r.locationCode)
        .filter((code) => isWorkLocation(locationInfo(state, warehouse.code, code)?.usage))
        .sort(compareLocation),
    ]),
  ]
    .slice(0, 3)
    .map((value) => ({ value }))

  const hint =
    blockers.length > 0
      ? t('pdaStocktake.pendingTaskClose')
      : !location
        ? t('pdaStocktake.hintStartLocation')
        : diffQty < 1
          ? t('pdaStocktake.hintDiffQty')
          : !note.trim()
            ? t('pdaStocktake.hintStartNote')
            : undefined

  return (
    <>
      <PdaHeader title={t('pdaStocktake.startTitle')} onBack={back} />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <PdaCard>
          <PdaSkuBlock
            skuCode={skuCode}
            name={sku(skuCode)?.name}
            owner={`${customerCode(owner)} ${customerName(owner)}`}
            tags={pending ? <TagLabel meta={inventoryTagMeta.pending} /> : undefined}
          />
          <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
            <PdaFigure size="md" label={t('pdaStocktake.stage')} value={t(`inventory.stage.${stage}`)} />
            <PdaFigure
              size="md"
              label={t('pdaStocktake.sourceNo')}
              value={source ? <DocNoTail value={source} tail={4} className="text-base" /> : <Empty />}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {pending ? t('pdaStocktake.pendingActive') : t('pdaStocktake.pendingOnSubmit')}
          </p>
        </PdaCard>
        {existing && (
          <PdaCard className="text-sm">{t('pdaStocktake.appendHint', { sku: skuCode, no: existing.no })}</PdaCard>
        )}
        {blockers.length > 0 && (
          <PdaCard className="flex flex-col gap-1 border border-destructive/40 text-sm">
            <div className="font-medium">{t('pdaStocktake.finishTasks')}</div>
            {blockers.map((b) => (
              <div key={`${b.kind}-${b.ref}`} className="text-destructive">
                {t(`inventory.blocker.${b.kind}`, { ref: b.ref })}
              </div>
            ))}
          </PdaCard>
        )}
        {location && (
          <PdaCard className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground">{t('pdaStocktake.discoveryLocation')}</div>
              <PdaLocation
                code={location}
                usage={(() => {
                  const usage = locationInfo(state, warehouse.code, location)?.usage
                  return usage ? t(`inventory.usage.${usage}`) : undefined
                })()}
              />
            </div>
          </PdaCard>
        )}
        <ScanInput
          label={location ? t('pdaStocktake.promptRescanLocation') : t('pdaStocktake.promptStartLocation')}
          onScan={onScan}
          message={message}
          candidates={candidates}
        />
        <QtyStepper
          label={t('pdaStocktake.diffQtyLabel')}
          value={diffQty}
          onChange={(v) => {
            setDiffQty(v)
            return true
          }}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pda-start-note">
            {t('pdaStocktake.discoveryNote')} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="pda-start-note"
            rows={2}
            className="text-base"
            value={note}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <PdaFooter hint={hint}>
        <PdaButton className="flex-1" disabled={Boolean(hint)} onClick={submit}>
          {existing ? t('pdaStocktake.appendSubmit') : t('pdaStocktake.createStocktake')}
        </PdaButton>
      </PdaFooter>
    </>
  )
}
