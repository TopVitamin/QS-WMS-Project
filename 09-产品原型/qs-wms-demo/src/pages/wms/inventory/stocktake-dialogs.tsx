import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Num } from '@/components/biz/display'
import { FormField } from '@/components/biz/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { deriveSkuStocks, lineDiff } from '@/lib/inventory-derive'
import { useDb } from '@/mock/db'
import type { InventoryCount } from '@/types/inventory'
import { useInventoryRun } from './inventory-helpers'
import { SignedNum } from './inventory-shared'

/**
 * 确认盘点差异（盘点单前端Demo版PRD 第三节）：主管二次确认，按盘盈、盘亏、正常／不良变化汇总，
 * 提示会导致负库存并阻断的SKU 和将解除的待核对；提交一次生效，重复确认返回原结果。
 */
export function StocktakeConfirmDialog({ count, onClose }: { count: InventoryCount; onClose: () => void }) {
  const { t } = useTranslation()
  const run = useInventoryRun()
  const inventory = useDb((s) => s.inventory)
  const inventoryLogs = useDb((s) => s.inventoryLogs)
  const inventoryCounts = useDb((s) => s.inventoryCounts)
  const outboundOrders = useDb((s) => s.outboundOrders)
  const skuAllocationControls = useDb((s) => s.skuAllocationControls)
  const skuMasters = useDb((s) => s.skuMasters)
  const locations = useDb((s) => s.locations)
  const locationMasters = useDb((s) => s.locationMasters)
  const warehouses = useDb((s) => s.warehouses)

  const summary = useMemo(() => {
    const diffs = count.lines.map((l) => ({ l, diff: lineDiff(l) ?? 0 }))
    const gains = diffs.filter((d) => d.diff > 0)
    const losses = diffs.filter((d) => d.diff < 0)
    const sum = (rows: typeof diffs) => rows.reduce((n, d) => n + d.diff, 0)
    const skus = deriveSkuStocks(
      {
        inventory,
        inventoryLogs,
        inventoryCounts,
        outboundOrders,
        skuAllocationControls,
        skuMasters,
        locations,
        locationMasters,
        warehouses,
      },
      count.warehouseCode,
    )
    // 预演后会造成负库存则禁止确认，服务动作仍重新校验最新余额。
    const negative = count.skus
      .map((k) => {
        const row = skus.find(
          (r) => r.customerId === k.customerId && r.skuCode === k.skuCode && r.qualityType === 'GOOD',
        )
        const goodDiff = sum(
          diffs.filter(
            (d) => d.l.customerId === k.customerId && d.l.skuCode === k.skuCode && d.l.qualityType === 'GOOD',
          ),
        )
        return { k, after: (row?.available ?? 0) + goodDiff }
      })
      .filter((x) => x.after < 0)
    const pending = count.skus.filter((k) =>
      skuAllocationControls.some(
        (c) => c.warehouseCode === count.warehouseCode && c.customerId === k.customerId && c.skuCode === k.skuCode,
      ),
    )
    return {
      gains: { lines: gains.length, qty: sum(gains) },
      losses: { lines: losses.length, qty: sum(losses) },
      good: sum(diffs.filter((d) => d.l.qualityType === 'GOOD')),
      defective: sum(diffs.filter((d) => d.l.qualityType === 'DEFECTIVE')),
      negative,
      pending,
    }
  }, [
    count,
    inventory,
    inventoryCounts,
    inventoryLogs,
    locationMasters,
    locations,
    outboundOrders,
    skuAllocationControls,
    skuMasters,
    warehouses,
  ])
  const noDiff = summary.gains.lines === 0 && summary.losses.lines === 0

  const submit = () => {
    const result = run({ type: 'CONFIRM_STOCKTAKE', no: count.no }, (no) =>
      t('inventory.stocktake.confirmSuccess', { no }),
    )
    if (result) onClose()
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inventory.stocktake.confirmTitle')}</DialogTitle>
          <DialogDescription>{t('inventory.stocktake.confirmHint')}</DialogDescription>
        </DialogHeader>
        {noDiff ? (
          <p className="text-sm">{t('inventory.stocktake.noDiff')}</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-muted p-3 text-sm">
            <dt className="text-muted-foreground">{t('inventory.stocktake.gain')}</dt>
            <dd className="text-right">
              <Num value={summary.gains.lines} /> · <SignedNum value={summary.gains.qty} />
            </dd>
            <dt className="text-muted-foreground">{t('inventory.stocktake.loss')}</dt>
            <dd className="text-right">
              <Num value={summary.losses.lines} /> · <SignedNum value={summary.losses.qty} />
            </dd>
            <dt className="text-muted-foreground">{t('inventory.goodShort')}</dt>
            <dd className="text-right">
              <SignedNum value={summary.good} />
            </dd>
            <dt className="text-muted-foreground">{t('inventory.defectiveShort')}</dt>
            <dd className="text-right">
              <SignedNum value={summary.defective} />
            </dd>
          </dl>
        )}
        {summary.negative.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              {t('inventory.stocktake.negativeWarn', {
                skus: summary.negative.map((x) => `${x.k.skuCode} (${x.after})`).join(t('common.listSeparator')),
              })}
            </AlertDescription>
          </Alert>
        )}
        {summary.pending.length > 0 && (
          <p className="text-xs text-muted-foreground">{t('inventory.stocktake.pendingRelease')}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={summary.negative.length > 0}>
            {t('inventory.stocktake.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 取消盘点：必填原因；不调账，只解除盘点冻结；来源为账实不符的 SKU 仍待核对 */
export function StocktakeCancelDialog({ count, onClose }: { count: InventoryCount; onClose: () => void }) {
  const { t } = useTranslation()
  const { confirm } = useConfirm()
  const run = useInventoryRun()
  const [reason, setReason] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const requestClose = async () => {
    if (reason.trim()) {
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
    if (!reason.trim()) return
    const result = run({ type: 'CANCEL_STOCKTAKE', no: count.no, reason }, (no) =>
      t('inventory.stocktake.cancelSuccess', { no }),
    )
    if (result) onClose()
  }

  return (
    <Dialog open onOpenChange={(next) => !next && void requestClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inventory.stocktake.cancelTitle')}</DialogTitle>
          <DialogDescription>{t('inventory.stocktake.cancelHint')}</DialogDescription>
        </DialogHeader>
        <FormField
          label={t('inventory.stocktake.cancelReason')}
          required
          error={
            showErrors && !reason.trim() ? (
              <p className="text-xs text-destructive">{t('inventory.error.cancelReason')}</p>
            ) : undefined
          }
        >
          <Textarea
            value={reason}
            placeholder={t('common.inputPlaceholder')}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button variant="outline" onClick={() => void requestClose()}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={submit}>
            {t('inventory.stocktake.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
