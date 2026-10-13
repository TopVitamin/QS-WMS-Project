import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { createDataColumns, DataTable } from '@/components/biz/data-table'
import { BizCode, CodeName, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { MasterDetailActions } from '@/components/biz/master-detail-actions'
import { DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
import { RowActions } from '@/components/biz/row-actions'
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
  const ownerName = customers.find((c) => c.code === ownerCode)?.name

  const barcodes = useMemo(
    () =>
      skuBarcodes.filter((b) => b.ownerCode === ownerCode && b.skuCode === skuCode).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    [skuBarcodes, ownerCode, skuCode],
  )

  const barcodeColumns = useMemo(() => {
    const disableBarcode = async (row: SkuBarcode) => {
      const ok = await confirm({
        title: t('masterSku.barcodeDisableTitle'),
        description: row.barcode,
        confirmText: t('masterSku.disableAction'),
        cancelText: t('common.cancel'),
        variant: 'destructive',
      })
      if (!ok) return
      const res = setSkuBarcodeStatus(row.id, 'DISABLED')
      if (!res.ok) toast.error(t(res.errorKey))
    }
    const col = createDataColumns<SkuBarcode>()
    return col.columns([
      col.accessor('barcode', {
        header: t('masterSku.barcode'),
        cell: ({ getValue }) => <BizCode>{getValue()}</BizCode>,
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
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                key: 'edit',
                label: t('masterSku.edit'),
                onClick: () => setBarcodeDialog({ mode: 'edit', row: row.original }),
              },
              {
                key: 'disable',
                label: t('masterSku.disableAction'),
                danger: true,
                hidden: row.original.status !== 'ENABLED',
                onClick: () => void disableBarcode(row.original),
              },
            ]}
          />
        ),
      }),
    ])
  }, [confirm, setSkuBarcodeStatus, t])

  if (!ownerCode || !skuCode) return <Navigate to="/wms/master/skus" replace />
  if (!master) return <Navigate to="/wms/master/skus" replace />

  const enabled = master.status === 'ENABLED'
  const yesNo = (v: boolean | undefined) => (v ? t('common.yes') : t('common.no'))

  return (
    <PageContainer
      title={
        <DetailTitle
          title={t('masterSku.detailTitle')}
          code={`${master.ownerCode} / ${master.code}`}
          status={usageStatusMeta[master.status]}
        />
      }
      actions={
        <MasterDetailActions
          scope="masterSku"
          backTo="/wms/master/skus"
          enabled={enabled}
          onToggle={(next) => toggleStatus(ownerCode, skuCode, next)}
          onEdit={() => navigate(skuEditPath(ownerCode, skuCode))}
        />
      }
    >
      <Section title={t('masterSku.sectionBasic')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.ownerCode')}>
            <CodeName code={master.ownerCode} name={ownerName} layout="stacked" />
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.code')}>
            <BizCode>{master.code}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.name')}>{master.name}</DescriptionItem>
          <DescriptionItem label={t('masterSku.nameEn')}>{master.nameEn || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterSku.unit')}>{master.unit}</DescriptionItem>
          <DescriptionItem label={t('masterSku.primaryBarcode')}>
            {master.primaryBarcode ? <BizCode>{master.primaryBarcode}</BizCode> : <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('common.status')}>
            <StatusBadge meta={usageStatusMeta[master.status]} />
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.upstreamSkuId')} className="col-span-2">
            <BizCode>{master.upstreamSkuId}</BizCode>
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.spec')} className="col-span-4" multiline>
            {master.spec || <Empty />}
          </DescriptionItem>
          <DescriptionItem label={t('masterSku.remark')} className="col-span-4" multiline>
            {master.remark || <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterSku.sectionForm')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.productForm')}>{t(PRODUCT_FORM_I18N[master.productForm])}</DescriptionItem>
          <DescriptionItem label={t('masterSku.isBattery')}>{yesNo(master.isBattery)}</DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterSku.sectionTrace')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.snEnabled')}>{yesNo(master.snEnabled)}</DescriptionItem>
          <DescriptionItem label={t('masterSku.snFormat')}>{master.snFormat || <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterSku.batchEnabled')}>{yesNo(master.batchEnabled)}</DescriptionItem>
          <DescriptionItem label={t('masterSku.expiryEnabled')}>{yesNo(master.expiryEnabled)}</DescriptionItem>
          {master.expiryEnabled ? (
            <>
              <DescriptionItem label={t('masterSku.shelfLifeDays')}>{master.shelfLifeDays ?? <Empty />}</DescriptionItem>
              <DescriptionItem label={t('masterSku.inboundDays')}>{master.inboundDays ?? <Empty />}</DescriptionItem>
              <DescriptionItem label={t('masterSku.nearExpiryDays')}>{master.nearExpiryDays ?? <Empty />}</DescriptionItem>
              <DescriptionItem label={t('masterSku.expiredDays')}>{master.expiredDays ?? <Empty />}</DescriptionItem>
            </>
          ) : null}
        </Descriptions>
      </Section>

      <Section title={t('masterSku.sectionQc')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.qcRequired')}>{yesNo(master.qcRequired)}</DescriptionItem>
          <DescriptionItem label={t('masterSku.qcFlowType')}>
            {master.qcFlowType ? t(`masterSku.qcFlow.${master.qcFlowType}`) : <Empty />}
          </DescriptionItem>
        </Descriptions>
      </Section>

      <Section title={t('masterSku.sectionDims')}>
        <Descriptions columns={4}>
          <DescriptionItem label={t('masterSku.grossWeightKg')}>{master.grossWeightKg ?? <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterSku.netWeightKg')}>{master.netWeightKg ?? <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterSku.lengthCm')}>{master.lengthCm ?? <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterSku.widthCm')}>{master.widthCm ?? <Empty />}</DescriptionItem>
          <DescriptionItem label={t('masterSku.heightCm')}>{master.heightCm ?? <Empty />}</DescriptionItem>
        </Descriptions>
      </Section>

      <Section
        flush
        title={t('masterSku.sectionBarcodes')}
        extra={
          enabled ? (
            <Button size="sm" variant="outline" onClick={() => setBarcodeDialog({ mode: 'create', ownerCode, skuCode })}>
              <Plus data-icon="inline-start" />
              {t('masterSku.barcodeAdd')}
            </Button>
          ) : null
        }
      >
        <DataTable data={barcodes} columns={barcodeColumns} getRowId={(r) => r.id} pageSize={10} />
      </Section>

      <MasterAuditPanel scope="masterSku" updatedBy={master.updatedBy} updatedAt={master.updatedAt} />

      <SkuBarcodeDialog state={barcodeDialog} onClose={() => setBarcodeDialog(null)} />
    </PageContainer>
  )
}
