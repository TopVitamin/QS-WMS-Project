import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/** 把页面模块按导出名包成 React.lazy；路由层按需加载，首屏不打包全部页面 */
export function lazyPage<T extends ComponentType>(
  load: () => Promise<Record<string, unknown>>,
  exportName: string,
): LazyExoticComponent<T> {
  return lazy(async () => ({ default: (await load())[exportName] as T }))
}
