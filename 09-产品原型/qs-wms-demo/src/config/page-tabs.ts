import { allMenuLeaves } from '@/config/menu'
import type { PageTab } from '@/stores/tabs'

/**
 * 将当前路由解析为页签元数据。
 * 菜单叶子只对应列表等「入口」路径；详情/编辑等子路由单独占一个 tab（path 为完整 pathname）。
 */
export function resolvePageTab(pathname: string): PageTab | undefined {
  const outboundEntry = pathname.match(/^\/wms\/outbound\/(pick-tasks|return-putaway)\/[^/]+\/entry$/)
  if (outboundEntry)
    return {
      path: pathname,
      titleKey: outboundEntry[1] === 'pick-tasks' ? 'outbound.entry.pickTitle' : 'outbound.entry.returnTitle',
    }
  const outbound = pathname.match(/^\/wms\/outbound\/(orders|waves|pick-tasks|return-putaway)\/[^/]+$/)
  if (outbound) return { path: pathname, titleKey: `outbound.ui.${({ orders: 'order', waves: 'wave', 'pick-tasks': 'task', 'return-putaway': 'putback' } as const)[outbound[1] as 'orders']}Title` }
  const returnReceive = pathname.match(/^\/wms\/returns\/orders\/[^/]+\/receive$/)
  if (returnReceive) return { path: pathname, titleKey: 'return.receive.title' }
  const returnDetail = pathname.match(/^\/wms\/returns\/orders\/[^/]+$/)
  if (returnDetail) return { path: pathname, titleKey: 'return.detailTitle' }

  const inventoryDetail = pathname.match(/^\/wms\/inventory\/(moves|counts)\/[^/]+$/)
  if (inventoryDetail)
    return { path: pathname, titleKey: inventoryDetail[1] === 'moves' ? 'inventory.move.title' : 'inventory.stocktake.title' }
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

  const containerDetail = pathname.match(/^\/wms\/master\/containers\/([^/]+)$/)
  if (containerDetail) {
    return { path: pathname, titleKey: 'container.detailTitle' }
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

  const putawayEntry = pathname.match(/^\/wms\/inbound\/putaway\/([^/]+)\/entry$/)
  if (putawayEntry) {
    return { path: pathname, titleKey: 'putaway.tabEntry' }
  }

  const putawayDetail = pathname.match(/^\/wms\/inbound\/putaway\/([^/]+)$/)
  if (putawayDetail) {
    return { path: pathname, titleKey: 'putaway.tabDetail' }
  }

  const inboundReceive = pathname.match(/^\/wms\/inbound\/orders\/([^/]+)\/receive$/)
  if (inboundReceive) {
    return { path: pathname, titleKey: 'inbound.tabReceive' }
  }

  const inboundDetail = pathname.match(/^\/wms\/inbound\/orders\/([^/]+)$/)
  if (inboundDetail) {
    return { path: pathname, titleKey: 'inbound.tabDetail' }
  }

  const leaf = allMenuLeaves.find((m) => pathname === m.path)
  return leaf ? { path: leaf.path, titleKey: leaf.titleKey } : undefined
}
