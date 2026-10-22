import { Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BizCode } from '@/components/biz/display'
import { FormField } from '@/components/biz/form-field'
import { OptionSelect } from '@/components/biz/option-select'
import { StatusBadge } from '@/components/biz/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { codeNameText } from '@/lib/typography'
import { useDb } from '@/mock/db'

/**
 * OMS Mock 基础资料推送：货主/商品二选一，接受或拒绝都写入 masterMessages 与操作记录。
 * 一期用本机表单模拟上游推送，不提供 JSON 上传或真实 HTTP 接口。
 */
export function MockMasterPushDialog({
  masterType,
  onClose,
}: {
  masterType: 'OWNER' | 'SKU'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const customers = useDb((s) => s.customerMasters)
  const skus = useDb((s) => s.skuMasters)
  const messages = useDb((s) => s.masterMessages)
  const push = useDb((s) => s.mockPushMasterData)
  const [ownerCode, setOwnerCode] = useState(
    customers.find((c) => c.status === 'ENABLED')?.code ?? '',
  )
  const [skuCode, setSkuCode] = useState('')
  const [error, setError] = useState<string>()

  const owner = customers.find((c) => c.code === ownerCode)
  const ownerSkus = useMemo(
    () => skus.filter((m) => m.ownerCode === ownerCode && m.status === 'ENABLED'),
    [skus, ownerCode],
  )
  const selectedSku = ownerSkus.some((m) => m.code === skuCode) ? skuCode : (ownerSkus[0]?.code ?? '')
  const recent = messages.filter((m) => m.masterType === masterType).slice(0, 3)

  const submit = () => {
    if (!ownerCode) return
    if (masterType === 'SKU' && !selectedSku) {
      setError(t('masterPush.error.skuRequired'))
      return
    }
    const result = push({
      masterType,
      ownerCode,
      skuCode: masterType === 'SKU' ? selectedSku : undefined,
    })
    setError(result.ok ? undefined : t(result.errorKey, result.params))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('masterPush.title')}</DialogTitle>
          <DialogDescription>{t('masterPush.hint')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <FormField label={t('masterPush.masterType')}>
            <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm">
              {t(masterType === 'OWNER' ? 'masterPush.owner' : 'masterPush.sku')}
            </div>
          </FormField>
          <FormField label={t('masterPush.owner')} required>
            <OptionSelect
              value={ownerCode}
              onValueChange={(v) => {
                setOwnerCode(v)
                setSkuCode('')
                setError(undefined)
              }}
              options={customers.map((c) => ({ value: c.code, label: codeNameText(c.code, c.name) }))}
            />
          </FormField>
          {masterType === 'SKU' && (
            <FormField label={t('masterPush.sku')} required>
              <OptionSelect
                value={selectedSku}
                onValueChange={setSkuCode}
                options={ownerSkus.map((m) => ({ value: m.code, label: codeNameText(m.code, m.name) }))}
              />
            </FormField>
          )}
          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            {masterType === 'OWNER'
              ? t('masterPush.ownerPayload', { owner: owner ? codeNameText(owner.code, owner.name) : '' })
              : t('masterPush.skuPayload', {
                  owner: owner?.code ?? '',
                  sku: selectedSku || '',
                })}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {recent.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">{t('masterPush.recent')}</div>
            {recent.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <StatusBadge
                  meta={{
                    tone: m.status === 'ACCEPTED' ? 'green' : 'red',
                    labelKey: m.status === 'ACCEPTED' ? 'masterPush.accepted' : 'masterPush.rejected',
                  }}
                />
                <BizCode>{m.skuCode ?? m.ownerCode}</BizCode>
                <span className="ml-auto text-xs text-muted-foreground">
                  {m.reason ? t(`masterPush.error.${m.reason}`) : m.at.slice(11, 19)}
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button onClick={submit}>
            <Send data-icon="inline-start" />
            {t('masterPush.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
