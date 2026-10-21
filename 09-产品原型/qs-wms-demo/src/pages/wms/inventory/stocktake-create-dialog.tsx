import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CodeName } from '@/components/biz/display'
import { FormField, FormGrid } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { isWorkLocation, locationUsage, stocktakeBlockers } from '@/lib/inventory-derive'
import { matchesKeyword } from '@/lib/inventory-list-match'
import { FILTER_ALL } from '@/lib/master-data'
import { codeNameText } from '@/lib/typography'
import { useDb, useLookups } from '@/mock/db'
import { useSettings } from '@/stores/settings'
import type { StocktakeSku } from '@/types/inventory'
import { useInventoryRun } from './inventory-helpers'

const keyOf = (k: StocktakeSku) => `${k.customerId}::${k.skuCode}`

/**
 * 创建计划盘点（盘点单前端Demo版PRD 第二节）：按货主、库区缩小候选，SKU 可搜索多选。
 * 选中区逐个显示阻断原因（进行中任务、已在盘点中、已分配），有任一阻断整次不创建，不静默跳过 SKU。
 */
export function StocktakeCreateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (no: string) => void
}) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const run = useInventoryRun()
  const warehouseCode = useSettings((s) => s.warehouseCode)
  const customers = useDb((s) => s.customers)
  const inventory = useDb((s) => s.inventory)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  const inventoryCounts = useDb((s) => s.inventoryCounts)
  const outboundPickTasks = useDb((s) => s.outboundPickTasks)
  const outboundPutbacks = useDb((s) => s.outboundPutbacks)
  const putawayOrders = useDb((s) => s.putawayOrders)
  const { sku, customerCode } = useLookups()
  const [owner, setOwner] = useState(FILTER_ALL)
  const [zone, setZone] = useState(FILTER_ALL)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StocktakeSku[]>([])
  const [remark, setRemark] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const zoneOf = useMemo(() => {
    const map = new Map<string, string>()
    locations.filter((l) => l.warehouseCode === warehouseCode).forEach((l) => map.set(l.code, l.zone))
    locationMasters.filter((l) => l.warehouseCode === warehouseCode).forEach((l) => map.set(l.code, l.zoneCode))
    return (code: string) => map.get(code)
  }, [locationMasters, locations, warehouseCode])

  /** 候选：本仓存储、拣货、不良隔离库位上有库存的 SKU */
  const stockRows = useMemo(
    () =>
      inventory.filter(
        (r) =>
          r.warehouseCode === warehouseCode &&
          r.onHandQty > 0 &&
          isWorkLocation(locationUsage({ locations, locationMasters }, warehouseCode, r.locationCode)),
      ),
    [inventory, locationMasters, locations, warehouseCode],
  )
  const zones = useMemo(
    () => [...new Set(stockRows.map((r) => zoneOf(r.locationCode)).filter((z): z is string => Boolean(z)))].sort(),
    [stockRows, zoneOf],
  )
  const candidates = useMemo(() => {
    const seen = new Map<string, StocktakeSku>()
    stockRows
      .filter((r) => owner === FILTER_ALL || r.customerId === owner)
      .filter((r) => zone === FILTER_ALL || zoneOf(r.locationCode) === zone)
      .filter((r) => matchesKeyword([r.skuCode, sku(r.skuCode)?.name], search))
      .forEach((r) => seen.set(keyOf(r), { customerId: r.customerId, skuCode: r.skuCode }))
    return [...seen.values()].sort(
      (a, b) => a.skuCode.localeCompare(b.skuCode) || a.customerId.localeCompare(b.customerId),
    )
  }, [owner, search, sku, stockRows, zone, zoneOf])

  const blockers = useMemo(
    () =>
      stocktakeBlockers(
        { inventory, inventoryCounts, outboundPickTasks, outboundPutbacks, putawayOrders, locations, locationMasters },
        warehouseCode,
        selected,
      ),
    [
      inventory,
      inventoryCounts,
      locationMasters,
      locations,
      outboundPickTasks,
      outboundPutbacks,
      putawayOrders,
      selected,
      warehouseCode,
    ],
  )
  const isSelected = (k: StocktakeSku) => selected.some((s) => keyOf(s) === keyOf(k))
  const toggle = (k: StocktakeSku, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, k] : prev.filter((s) => keyOf(s) !== keyOf(k))))

  const dirty = selected.length > 0 || remark.trim() !== ''
  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm({
        title: t('inventory.discardTitle'),
        description: t('inventory.discardBody'),
        confirmText: t('common.discard'),
        cancelText: t('common.keepEditing'),
      })
      if (!ok) return
    }
    onClose()
  }

  const submit = () => {
    setShowErrors(true)
    if (!selected.length || blockers.length) return
    const result = run({ type: 'CREATE_STOCKTAKE', warehouseCode, skus: selected, remark }, (no) =>
      t('inventory.stocktake.createSuccess', { no }),
    )
    if (result?.no) {
      onClose()
      onCreated(result.no)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && void requestClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inventory.stocktake.createTitle')}</DialogTitle>
          <DialogDescription>{t('inventory.stocktake.skusHint')}</DialogDescription>
        </DialogHeader>
        <FormGrid columns={2}>
          <FormField label={t('inventory.owner')}>
            <OptionSelect
              allOption
              value={owner}
              onValueChange={setOwner}
              options={customers.map((c) => ({ value: c.id, label: codeNameText(c.code, c.name) }))}
            />
          </FormField>
          <FormField label={t('inventory.stocktake.zone')}>
            <OptionSelect
              allOption
              value={zone}
              onValueChange={setZone}
              options={zones.map((z) => ({ value: z, label: z }))}
            />
          </FormField>
          <FormField
            label={t('inventory.stocktake.skus')}
            required
            span="full"
            error={
              showErrors && !selected.length ? (
                <p className="text-xs text-destructive">{t('inventory.error.skuEmpty')}</p>
              ) : undefined
            }
          >
            <Input
              value={search}
              placeholder={t('inventory.stocktake.skuSearch')}
              onChange={(e) => setSearch(e.target.value)}
            />
          </FormField>
        </FormGrid>
        <div
          role="group"
          aria-label={t('inventory.stocktake.skus')}
          className="max-h-56 overflow-y-auto rounded-lg border"
        >
          {candidates.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{t('inventory.stocktake.noCandidates')}</p>
          ) : (
            candidates.map((k) => (
              <Label key={keyOf(k)} className="flex items-center gap-2 border-b px-3 py-2 font-normal last:border-b-0">
                <Checkbox checked={isSelected(k)} onCheckedChange={(checked) => toggle(k, checked === true)} />
                <CodeName code={k.skuCode} name={sku(k.skuCode)?.name} className="min-w-0 flex-1" />
                <span className="text-xs text-muted-foreground">{customerCode(k.customerId)}</span>
              </Label>
            ))
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs text-muted-foreground">
            {t('inventory.stocktake.selectedSkus', { count: selected.length })}
          </span>
          {selected.map((k) => {
            const reasons = blockers.filter((b) => b.customerId === k.customerId && b.skuCode === k.skuCode)
            return (
              <div key={keyOf(k)} className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <CodeName code={k.skuCode} name={sku(k.skuCode)?.name} />
                  <span className="text-xs text-muted-foreground">{customerCode(k.customerId)}</span>
                </span>
                {reasons.map((b) => (
                  <span key={`${b.kind}-${b.ref}`} className="text-xs text-destructive">
                    {t(`inventory.blocker.${b.kind}`, { ref: b.ref })}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        <FormField label={t('inventory.stocktake.remark')}>
          <Textarea
            value={remark}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => setRemark(e.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button variant="outline" onClick={() => void requestClose()}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={selected.length > 0 && blockers.length > 0}>
            {t('inventory.stocktake.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
