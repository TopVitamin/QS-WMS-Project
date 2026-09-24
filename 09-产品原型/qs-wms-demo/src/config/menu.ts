import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  Database,
  LayoutDashboard,
  PackageCheck,
  PackageOpen,
  Settings2,
  Undo2,
  Wallet,
} from 'lucide-react'

export interface MenuLeaf {
  path: string
  /** i18n key */
  titleKey: string
  /** 规划中的里程碑，未实现的页面显示"建设中" */
  milestone: 'M0' | 'M1' | 'M2' | 'M3' | 'M4'
}

export interface MenuGroup {
  key: string
  titleKey: string
  icon: LucideIcon
  children: MenuLeaf[]
}

export const wmsMenu: MenuGroup[] = [
  {
    key: 'dashboard',
    titleKey: 'menu.dashboard',
    icon: LayoutDashboard,
    children: [{ path: '/wms/dashboard', titleKey: 'menu.dashboard', milestone: 'M0' }],
  },
  {
    key: 'inbound',
    titleKey: 'menu.inbound',
    icon: PackageOpen,
    children: [
      { path: '/wms/inbound/orders', titleKey: 'menu.inboundOrders', milestone: 'M0' },
      { path: '/wms/inbound/receipts', titleKey: 'menu.receipts', milestone: 'M1' },
      { path: '/wms/inbound/putaway', titleKey: 'menu.putawayTasks', milestone: 'M1' },
      { path: '/wms/inbound/unclaimed', titleKey: 'menu.unclaimed', milestone: 'M4' },
    ],
  },
  {
    key: 'inventory',
    titleKey: 'menu.inventory',
    icon: Boxes,
    children: [
      { path: '/wms/inventory/stock', titleKey: 'menu.stock', milestone: 'M0' },
      { path: '/wms/inventory/logs', titleKey: 'menu.inventoryLogs', milestone: 'M2' },
      { path: '/wms/inventory/moves', titleKey: 'menu.moves', milestone: 'M2' },
      { path: '/wms/inventory/counts', titleKey: 'menu.counts', milestone: 'M2' },
    ],
  },
  {
    key: 'outbound',
    titleKey: 'menu.outbound',
    icon: PackageCheck,
    children: [
      { path: '/wms/outbound/packages', titleKey: 'menu.packages', milestone: 'M3' },
      { path: '/wms/outbound/waves', titleKey: 'menu.waves', milestone: 'M3' },
      { path: '/wms/outbound/handover', titleKey: 'menu.handover', milestone: 'M3' },
    ],
  },
  {
    key: 'returns',
    titleKey: 'menu.returns',
    icon: Undo2,
    children: [{ path: '/wms/returns/orders', titleKey: 'menu.returnOrders', milestone: 'M4' }],
  },
  {
    key: 'billing',
    titleKey: 'menu.billing',
    icon: Wallet,
    children: [
      { path: '/wms/billing/fees', titleKey: 'menu.fees', milestone: 'M4' },
      { path: '/wms/billing/plans', titleKey: 'menu.feePlans', milestone: 'M4' },
    ],
  },
  {
    key: 'master',
    titleKey: 'menu.master',
    icon: Database,
    children: [
      { path: '/wms/master/warehouses', titleKey: 'menu.warehouses', milestone: 'M4' },
      { path: '/wms/master/locations', titleKey: 'menu.locations', milestone: 'M4' },
      { path: '/wms/master/skus', titleKey: 'menu.skus', milestone: 'M4' },
      { path: '/wms/master/customers', titleKey: 'menu.customers', milestone: 'M4' },
      { path: '/wms/master/channels', titleKey: 'menu.channels', milestone: 'M4' },
    ],
  },
  {
    key: 'system',
    titleKey: 'menu.system',
    icon: Settings2,
    children: [
      { path: '/wms/system/users', titleKey: 'menu.users', milestone: 'M4' },
      { path: '/wms/system/params', titleKey: 'menu.params', milestone: 'M4' },
    ],
  },
]

export const allMenuLeaves: MenuLeaf[] = wmsMenu.flatMap((g) => g.children)

export function findMenuLeaf(path: string): MenuLeaf | undefined {
  return allMenuLeaves.find((m) => path === m.path || path.startsWith(`${m.path}/`))
}

export function findMenuGroup(path: string): MenuGroup | undefined {
  return wmsMenu.find((g) => g.children.some((c) => path === c.path || path.startsWith(`${c.path}/`)))
}
