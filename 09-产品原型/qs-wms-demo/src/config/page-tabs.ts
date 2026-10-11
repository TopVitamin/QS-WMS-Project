import { allMenuLeaves } from '@/config/menu'
import type { PageTab } from '@/stores/tabs'

/**
 * 将当前路由解析为页签元数据。
 * 菜单叶子只对应列表等「入口」路径；详情/编辑等子路由单独占一个 tab（path 为完整 pathname）。
 */
export function resolvePageTab(pathname: string): PageTab | undefined {
  if (pathname === '/wms/master/warehouses/new') {
    return { path: pathname, titleKey: 'masterWarehouse.tabCreate' }
  }

  const warehouseEdit = pathname.match(/^\/wms\/master\/warehouses\/([^/]+)\/edit$/)
  if (warehouseEdit && warehouseEdit[1] !== 'new') {
    return { path: pathname, titleKey: 'masterWarehouse.tabEdit' }
  }

  const warehouseDetail = pathname.match(/^\/wms\/master\/warehouses\/([^/]+)$/)
  if (warehouseDetail && warehouseDetail[1] !== 'new') {
    return { path: pathname, titleKey: 'masterWarehouse.tabDetail' }
  }

  if (pathname === '/wms/master/zones/new') {
    return { path: pathname, titleKey: 'masterZone.tabCreate' }
  }

  const zoneEdit = pathname.match(/^\/wms\/master\/zones\/([^/]+)\/edit$/)
  if (zoneEdit && zoneEdit[1] !== 'new') {
    return { path: pathname, titleKey: 'masterZone.tabEdit' }
  }

  const zoneDetail = pathname.match(/^\/wms\/master\/zones\/([^/]+)$/)
  if (zoneDetail && zoneDetail[1] !== 'new') {
    return { path: pathname, titleKey: 'masterZone.tabDetail' }
  }

  if (pathname === '/wms/master/locations/new') {
    return { path: pathname, titleKey: 'masterLocation.tabCreate' }
  }

  const locationEdit = pathname.match(/^\/wms\/master\/locations\/([^/]+)\/edit$/)
  if (locationEdit && locationEdit[1] !== 'new') {
    return { path: pathname, titleKey: 'masterLocation.tabEdit' }
  }

  const locationDetail = pathname.match(/^\/wms\/master\/locations\/([^/]+)$/)
  if (locationDetail && locationDetail[1] !== 'new') {
    return { path: pathname, titleKey: 'masterLocation.tabDetail' }
  }

  const customerDetail = pathname.match(/^\/wms\/master\/customers\/([^/]+)$/)
  if (customerDetail) {
    return { path: pathname, titleKey: 'masterCustomer.tabDetail' }
  }

  const carrierDetail = pathname.match(/^\/wms\/master\/carriers\/([^/]+)$/)
  if (carrierDetail && carrierDetail[1] !== 'new') {
    return { path: pathname, titleKey: 'masterCarrier.tabDetail' }
  }

  const skuEdit = pathname.match(/^\/wms\/master\/skus\/([^/]+)\/([^/]+)\/edit$/)
  if (skuEdit) {
    return { path: pathname, titleKey: 'masterSku.tabEdit' }
  }

  const skuDetail = pathname.match(/^\/wms\/master\/skus\/([^/]+)\/([^/]+)$/)
  if (skuDetail) {
    return { path: pathname, titleKey: 'masterSku.tabDetail' }
  }

  const leaf = allMenuLeaves.find((m) => pathname === m.path)
  return leaf ? { path: leaf.path, titleKey: leaf.titleKey } : undefined
}
