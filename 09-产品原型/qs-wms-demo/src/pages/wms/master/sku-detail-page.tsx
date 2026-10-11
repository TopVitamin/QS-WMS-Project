import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { usageStatusMeta } from '@/config/status'
import { useConfirm } from '@/hooks/use-confirm'
import { useSkuMasterStatusToggle } from '@/hooks/use-sku-master-status'
import { findSkuMaster, PRODUCT_FORM_I18N, skuEditPath } from '@/lib/sku-master'
import { useDb } from '@/mock/db'
import type { SkuBarcode, UsageStatus } from '@/types/wms'
import { SkuBarcodeDialog, type SkuBarcodeDialogState } from './sku-barcode-dialog'

export function SkuDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const { ownerCode, skuCode } = useParams<{ ownerCode: string; skuCode: string }>()
  const skuMasters = useDb((s) => s.skuMasters)
  const skuBarcodes = useDb((s) => s.skuBarcodes)
  const customers = useDb((s) => s.customers)
  const setSkuBarcodeStatus = useDb((s) => s.setSkuBarcodeStatus)
  const toggleStatus = useSkuMasterStatusToggle()

  const [barcodeDialog, setBarcodeDialog] = useState<SkuBarcodeDialogState>(null)

  const master = ownerCode && skuCode ? findSkuMaster(skuMasters, ownerCode, skuCode) : undefined
  const ownerName = customers.find((c) => c.code === ownerCode)?.name ?? ownerCode

  const barcodes = useMemo(
    () =>
      skuBarcodes.filter((b) => b.ownerCode === ownerCode && b.skuCode === skuCode).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [skuBarcodes, ownerCode, skuCode],
  )

  const barcodeColumns = useMemo(() => {
    const col = createDataColumns<SkuBarcode>()
    return col.columns([
      col.accessor('barcode', {
        header: t('masterSku.barcode'),
        cell: ({ getValue }) => <BizCode className="font-mono">{getValue()}</BizCode>,
      }),
      col.accessor('isPrimary', {
        header: t('masterSku.isPrimaryBarcode'),
        cell: ({ getValue }) => (getValue() ? t('common.yes') : t('common.no')),
      }),
      col.accessor('status', {
        header: t('masterSku.barcodeStatus'),
        cell: ({ getValue }) => <StatusBadge meta={usageStatusMeta[getValue() as UsageStatus]} />,
      }),
      col.display({
        id: 'barcodeActions',
        header: t('common.actions'),
        meta: { pin: 'right' },
        cell: ({ row }) => {
          const enabled = row.original.status === 'ENABLED'
          return (
            <div className="flex gap-2">
              <Button variant="link" className="h-auto p-0" onClick={() => setBarcodeDialog({ mode: 'edit', row: row.original })}>
                {t('masterSku.edit')}
              </Button>
              {enabled ? (
                <Button
                  variant="link"
                  className="h-auto p-0 text-destructive"
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('masterSku.barcodeDisableTitle'),
                      description: row.original.barcode,
                      confirmText: t('masterSku.disableAction'),
                      cancelText: t('common.cancel'),
                      variant: 'destructive',
                    })
                    if (!ok) return
                    const res = setSkuBarcodeStatus(row.original.id, 'DISABLED')
                    if (!res.ok) toast.error(t(res.errorKey))
                  }}
                >
                  {t('masterSku.disableAction')}
                </Button>
              ) : null}
            </div>
          )
        },
      }),
    ])
  }, [confirm, setSkuBarcodeStatus, t])

  if (!ownerCode || !skuCode) return <Navigate to="/wms/master/skus" replace />
  if (!master) return <Navigate to="/wms/master/skus" replace />

  const enabled = master.status === 'ENABLED'

  return (
    <PageContainer
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{t('masterSku.detailTitle', { owner: ownerCode, code: skuCode })}</span>
          <StatusBadge meta={usageStatusMeta[master.status]} />
        </span>
      }
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/wms/master/skus">{t('masterSku.backToList')}</Link>
          </Button>
          {enabled ? (
            <Button variant="destructive" onClick={() => toggleStatus(ownerCode, skuCode, 'DISABLED')}>
              {t('masterSku.disableAction')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => toggleStatus(ownerCode, skuCode, 'ENABLED')}>
              {t('masterSku.enableAction')}
            </Button>
          )}
          <Button onClick={() => navigate(skuEditPath(ownerCode, skuCode))}>{t('masterSku.edit')}</Button>
        </>
      }
    >
      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionBasic')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.ownerCode')}>
            <div>
              <BizCode>{master.ownerCode}</BizCode>
              <div className="text-xs text-muted-foreground">{ownerName}</div>
            </div>
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.code')}>
            <BizCode>{master.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.name')}>{master.name}</DescriptionItem>
          <DescriptionItem label={t('masterSku.nameEn')}>{master.nameEn || '—'}</DescriptionItem>
          <DescriptionItem label={t('masterSku.unit')}>{master.unit}</DescriptionItem>
          <DescriptionItem label={t('masterSku.primaryBarcode')}>
            {master.primaryBarcode ? <BizCode className="font-mono text-xs">{master.primaryBarcode}</BizCode> : '—'}
          </DescriptionItem>
          <DescriptionItem label={t('common.status')}>
            <StatusBadge meta={usageStatusMeta[master.status]} />
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.upstreamSkuId')} className="col-span-2">
            <span className="font-mono text-xs">{master.upstreamSkuId}</span>
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.spec')} className="col-span-4" multiline>
            {master.spec || '—'}
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.remark')} className="col-span-4" multiline>
            {master.remark || '—'}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionForm')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.productForm')}>{t(PRODUCT_FORM_I18N[master.productForm])}</DescriptionItem>
          <DescriptionItem label={t('masterSku.isBattery')}>
            {master.isBattery ? t('common.yes') : t('common.no')}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionTrace')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.snEnabled')}>{master.snEnabled ? t('common.yes') : t('common.no')}</DescriptionItem>
          <DescriptionItem label={t('masterSku.snFormat')}>{master.snFormat || '—'}</DescriptionItem>
          <DescriptionItem label={t('masterSku.batchEnabled')}>{master.batchEnabled ? t('common.yes') : t('common.no')}</DescriptionItem>
          <DescriptionItem label={t('masterSku.expiryEnabled')}>{master.expiryEnabled ? t('common.yes') : t('common.no')}</DescriptionItem>
          {master.expiryEnabled ? (
            <>
              <DescriptionItem label={t('masterSku.shelfLifeDays')}>{master.shelfLifeDays ?? '—'}</DescriptionItem>
              <DescriptionItem label={t('masterSku.inboundDays')}>{master.inboundDays ?? '—'}</DescriptionItem>
              <DescriptionItem label={t('masterSku.nearExpiryDays')}>{master.nearExpiryDays ?? '—'}</DescriptionItem>
              <DescriptionItem label={t('masterSku.expiredDays')}>{master.expiredDays ?? '—'}</DescriptionItem>
            </>
          ) : null}
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionQc')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.qcRequired')}>{master.qcRequired ? t('common.yes') : t('common.no')}</DescriptionItem>
          <DescriptionItem label={t('masterSku.qcFlowType')}>
            {master.qcFlowType ? t(`masterSku.qcFlow.${master.qcFlowType}`) : '—'}
          </DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-medium">{t('masterSku.sectionDims')}</h2>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.grossWeightKg')}>{master.grossWeightKg ?? '—'}</DescriptionItem>
          <DescriptionItem label={t('masterSku.netWeightKg')}>{master.netWeightKg ?? '—'}</DescriptionItem>
          <DescriptionItem label={t('masterSku.lengthCm')}>{master.lengthCm ?? '—'}</DescriptionItem>
          <DescriptionItem label={t('masterSku.widthCm')}>{master.widthCm ?? '—'}</DescriptionItem>
          <DescriptionItem label={t('masterSku.heightCm')}>{master.heightCm ?? '—'}</DescriptionItem>
        </Descriptions>
      </Panel>

      <Panel className="flex min-h-0 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">{t('masterSku.sectionBarcodes')}</h2>
          {enabled ? (
            <Button size="sm" variant="outline" onClick={() => setBarcodeDialog({ mode: 'create', ownerCode, skuCode })}>
              <Plus data-icon="inline-start" />
              {t('masterSku.barcodeAdd')}
            </Button>
          ) : null}
        </div>
        <DataTable data={barcodes} columns={barcodeColumns} getRowId={(r) => r.id} pageSize={10} />
      </Panel>

      <MasterAuditPanel scope="masterSku" updatedBy={master.updatedBy} updatedAt={master.updatedAt} />

      <SkuBarcodeDialog state={barcodeDialog} onClose={() => setBarcodeDialog(null)} />
    </PageContainer>
  )
}
