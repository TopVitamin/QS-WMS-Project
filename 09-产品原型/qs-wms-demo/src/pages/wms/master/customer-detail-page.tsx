import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, DateTime } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { PageContainer, Panel } from '@/components/biz/page-container'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import { usageStatusMeta } from '@/config/status'
import { useCustomerMasterStatusToggle } from '@/hooks/use-customer-master-status'
import { useMasterDiscardNavigate } from '@/hooks/use-master-discard-navigate'
import { useMasterFormFieldError } from '@/hooks/use-master-form-field-error'
import {
  customerDetailPath,
  formatCustomerFullAddress,
  OWNER_TYPE_I18N,
  PUTAWAY_RECOMMEND_I18N,
  validateCustomerMasterForm,
  type CustomerMasterFormErrors,
} from '@/lib/customer-master'
import { WAREHOUSE_COUNTRY_OPTIONS } from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { PutawayRecommendTiming } from '@/types/wms'
import { CustomerFormFields } from './customer-form-fields'

export function CustomerDetailPage() {
  const { t } = useTranslation()
  const { code } = useParams<{ code: string }>()
  const [search, setSearchParams] = useSearchParams()
  const editing = search.get('edit') === '1'
  const leave = useMasterDiscardNavigate('masterCustomer')
  const fieldError = useMasterFormFieldError('masterCustomer')
  const toggleStatus = useCustomerMasterStatusToggle()
  const updateCustomerMaster = useDb((s) => s.updateCustomerMaster)

  const customer = useDb((s) => (code ? s.customerMasters.find((c) => c.code === code) : undefined))

  const [form, setForm] = useState(customer)
  const [errors, setErrors] = useState<CustomerMasterFormErrors>({})

  useEffect(() => {
    if (customer) setForm({ ...customer })
  }, [customer])

  const dirty = useMemo(() => {
    if (!customer || !form) return false
    return JSON.stringify(customer) !== JSON.stringify(form)
  }, [customer, form])

  if (!code) return <Navigate to="/wms/master/customers" replace />
  if (!customer || !form) return <Navigate to="/wms/master/customers" replace />

  const enabled = customer.status === 'ENABLED'
  const countryLabel =
    WAREHOUSE_COUNTRY_OPTIONS.find((c) => c.value === customer.countryCode)?.labelKey ??
    'masterWarehouse.country.OTHER'

  const onSave = () => {
    const nextErrors = validateCustomerMasterForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('masterCustomer.saveValidationFailed'))
      return
    }
    const res = updateCustomerMaster(code, {
      name: form.name.trim(),
      remark: form.remark,
      putawayRecommendTiming: form.putawayRecommendTiming,
      countryCode: form.countryCode,
      state: form.state,
      city: form.city,
      district: form.district,
      address1: form.address1,
      address2: form.address2,
      postalCode: form.postalCode,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail,
      status: customer.status,
    })
    if (!res.ok) {
      toast.error(t(res.errorKey))
      return
    }
    toast.success(t('masterCustomer.saveSuccess'))
    setSearchParams({})
  }

  const showFieldError = (key: keyof CustomerMasterFormErrors) => fieldError(errors, key)

  return (
    <PageContainer
      title={
        editing ? (
          t('masterCustomer.editTitle')
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <span>{t('masterCustomer.detailTitle')}</span>
            <BizCode>{customer.code}</BizCode>
            <StatusBadge meta={usageStatusMeta[customer.status]} />
          </span>
        )
      }
      actions={
        editing ? (
          <>
            <Button variant="outline" onClick={() => leave(customerDetailPath(code), dirty)}>{t('common.cancel')}</Button>
            <Button onClick={onSave}>{t('common.save')}</Button>
          </>
        ) : (
          <>
            <Button variant="outline" asChild>
              <Link to="/wms/master/customers">{t('masterCustomer.backToList')}</Link>
            </Button>
            {enabled ? (
              <Button variant="destructive" onClick={() => toggleStatus(customer, 'DISABLED')}>
                {t('masterCustomer.disableAction')}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => toggleStatus(customer, 'ENABLED')}>
                {t('masterCustomer.enableAction')}
              </Button>
            )}
            <Button onClick={() => setSearchParams({ edit: '1' })}>{t('masterCustomer.edit')}</Button>
          </>
        )
      }
    >
      {editing ? (
        <CustomerFormFields form={form} setForm={setForm} errors={errors} fieldError={showFieldError} />
      ) : (
        <>
          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-medium">{t('masterCustomer.sectionBasic')}</h2>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.code')}><BizCode>{customer.code}</BizCode></DescriptionItem>
              <DescriptionItem label={t('masterCustomer.name')}>{customer.name}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.ownerType')}>{t(OWNER_TYPE_I18N[customer.ownerType])}</DescriptionItem>
              <DescriptionItem label={t('common.status')}>
                <StatusBadge meta={usageStatusMeta[customer.status]} />
              </DescriptionItem>
              <DescriptionItem label={t('masterCustomer.putawayRecommendTiming')}>
                {t(PUTAWAY_RECOMMEND_I18N[customer.putawayRecommendTiming as PutawayRecommendTiming])}
              </DescriptionItem>
              <DescriptionItem label={t('masterCustomer.remark')} className="col-span-3">
                {customer.remark || '—'}
              </DescriptionItem>
            </Descriptions>
          </Panel>
          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-medium">{t('masterCustomer.sectionUpstream')}</h2>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.upstreamOwnerId')}>{customer.upstreamOwnerId}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.lastSyncAt')}>
                <DateTime value={customer.lastSyncAt} />
              </DescriptionItem>
            </Descriptions>
          </Panel>
          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-medium">{t('masterCustomer.sectionAddress')}</h2>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.countryCode')}>{t(countryLabel)}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.city')}>{customer.city || '—'}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.fullAddress')} className="col-span-2">
                {formatCustomerFullAddress(customer)}
              </DescriptionItem>
            </Descriptions>
          </Panel>
          <Panel className="space-y-3 p-4">
            <h2 className="text-sm font-medium">{t('masterCustomer.sectionContact')}</h2>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.contactName')}>{customer.contactName || '—'}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.contactPhone')}>{customer.contactPhone || '—'}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.contactEmail')}>{customer.contactEmail || '—'}</DescriptionItem>
            </Descriptions>
          </Panel>
        </>
      )}
      {!editing && (
        <MasterAuditPanel scope="masterCustomer" updatedBy={customer.updatedBy} updatedAt={customer.updatedAt} />
      )}
    </PageContainer>
  )
}
