import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BizCode, DateTime, Empty } from '@/components/biz/display'
import { DescriptionItem, Descriptions } from '@/components/biz/descriptions'
import { MasterAuditPanel } from '@/components/biz/master-audit-panel'
import { MasterDetailActions } from '@/components/biz/master-detail-actions'
import { DetailTitle, PageContainer, Section } from '@/components/biz/page-container'
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
import { countryLabelKey } from '@/lib/warehouse-master'
import { useDb } from '@/mock/db'
import type { PutawayRecommendTiming } from '@/types/wms'
import { CustomerFormFields } from './customer-form-fields'

/** 货主详情：按货主 PRD，查看与编辑同路由（`?edit=1`），本期无新增页与独立编辑路由 */
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

  const countryLabel = countryLabelKey(customer.countryCode)

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
          <DetailTitle
            title={t('masterCustomer.detailTitle')}
            code={customer.code}
            status={usageStatusMeta[customer.status]}
          />
        )
      }
      actions={
        editing ? (
          <>
            <Button variant="outline" onClick={() => leave(customerDetailPath(code), dirty)}>{t('common.cancel')}</Button>
            <Button onClick={onSave}>{t('common.save')}</Button>
          </>
        ) : (
          <MasterDetailActions
            scope="masterCustomer"
            backTo="/wms/master/customers"
            enabled={customer.status === 'ENABLED'}
            onToggle={(next) => toggleStatus(customer, next)}
            onEdit={() => setSearchParams({ edit: '1' })}
          />
        )
      }
    >
      {editing ? (
        <CustomerFormFields form={form} setForm={setForm} errors={errors} fieldError={showFieldError} />
      ) : (
        <>
          <Section title={t('masterCustomer.sectionBasic')}>
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
                {customer.remark || <Empty />}
              </DescriptionItem>
            </Descriptions>
          </Section>
          <Section title={t('masterCustomer.sectionUpstream')}>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.upstreamOwnerId')}>
                <BizCode>{customer.upstreamOwnerId}</BizCode>
              </DescriptionItem>
              <DescriptionItem label={t('masterCustomer.lastSyncAt')}>
                <DateTime value={customer.lastSyncAt} />
              </DescriptionItem>
            </Descriptions>
          </Section>
          <Section title={t('masterCustomer.sectionAddress')}>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.countryCode')}>{t(countryLabel)}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.city')}>{customer.city || <Empty />}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.fullAddress')} className="col-span-2">
                {formatCustomerFullAddress(customer, t(countryLabel)) || <Empty />}
              </DescriptionItem>
            </Descriptions>
          </Section>
          <Section title={t('masterCustomer.sectionContact')}>
            <Descriptions columns={4}>
              <DescriptionItem label={t('masterCustomer.contactName')}>{customer.contactName || <Empty />}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.contactPhone')}>{customer.contactPhone || <Empty />}</DescriptionItem>
              <DescriptionItem label={t('masterCustomer.contactEmail')}>{customer.contactEmail || <Empty />}</DescriptionItem>
            </Descriptions>
          </Section>
          <MasterAuditPanel scope="masterCustomer" updatedBy={customer.updatedBy} updatedAt={customer.updatedAt} />
        </>
      )}
    </PageContainer>
  )
}
