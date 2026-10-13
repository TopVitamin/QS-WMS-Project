import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { MasterDataI18nScope } from '@/lib/master-data'
import type { UsageStatus } from '@/types/wms'

/**
 * 主数据详情页头操作，顺序固定：返回列表 → 启用/停用 → 编辑（主按钮，最右）。
 * 页头只能有一个主按钮：传了 extra（如承运商的「新增渠道」）时，编辑降为次要按钮，extra 放最右。
 * 文案取 `${scope}.backToList / disableAction / enableAction / edit`。
 */
export function MasterDetailActions({
  scope,
  backTo,
  enabled,
  onToggle,
  onEdit,
  extra,
}: {
  scope: MasterDataI18nScope
  backTo: string
  enabled: boolean
  onToggle: (next: UsageStatus) => void
  onEdit: () => void
  extra?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <>
      <Button variant="outline" asChild>
        <Link to={backTo}>{t(`${scope}.backToList`)}</Link>
      </Button>
      {enabled ? (
        <Button variant="destructive" onClick={() => onToggle('DISABLED')}>
          {t(`${scope}.disableAction`)}
        </Button>
      ) : (
        <Button variant="outline" onClick={() => onToggle('ENABLED')}>
          {t(`${scope}.enableAction`)}
        </Button>
      )}
      <Button variant={extra ? 'outline' : 'default'} onClick={onEdit}>
        {t(`${scope}.edit`)}
      </Button>
      {extra}
    </>
  )
}
