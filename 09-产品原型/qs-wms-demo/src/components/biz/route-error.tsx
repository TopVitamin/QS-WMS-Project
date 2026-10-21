import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, Link, useLocation, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * 路由级错误页：替代 React Router 默认的英文 Unexpected Application Error。
 * 懒加载 chunk 失效由 main.tsx 的 vite:preloadError 自动刷新兜底，这里处理渲染/数据错误。
 */
export function RouteError() {
  const { t } = useTranslation()
  const error = useRouteError()
  const location = useLocation()
  const home = location.pathname.startsWith('/pda') ? '/pda' : '/wms/dashboard'
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : ''

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold">{t('common.routeErrorTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('common.routeErrorHint')}</p>
          </div>
        </div>
        {detail && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground">
            {detail}
          </pre>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to={home}>{t('common.backHome')}</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>
        </div>
      </div>
    </div>
  )
}
