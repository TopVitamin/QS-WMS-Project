import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** 路由懒加载时的占位：保持页面骨架高度，避免加载瞬间跳到页脚 */
export function PageLoading() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-40 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {t('common.loading')}
    </div>
  )
}
