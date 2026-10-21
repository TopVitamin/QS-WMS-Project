/**
 * 作业台（Web 端上架、收货作业台）共用的布局与录入表样式，规范见 docs/04-作业台设计规范.md「宽度变化」。
 * 商品列组件在 components/biz/workbench.tsx（WorkbenchProductCode / WorkbenchProductName）。
 */

/**
 * 页面骨架：按内容区实际宽度切换（容器查询，侧栏收起时也算对），不按屏幕宽度。
 * - 内容区 ≥ 1184px（1440 屏、侧栏展开）：左边作业区，右边 320px 汇总卡
 * - 1106～1183px（1366 屏）：汇总卡收到 280px
 * - < 1106px：上下堆叠，汇总卡挪到作业区下面，整页滚动
 */
export const workbenchLayout = {
  root: '@container flex min-h-0 flex-1 flex-col',
  grid: 'grid gap-3 @max-[1105px]:pb-4 @min-[1106px]:min-h-0 @min-[1106px]:flex-1 @min-[1106px]:grid-cols-[minmax(0,1fr)_280px] @min-[1184px]:grid-cols-[minmax(0,1fr)_320px]',
  main: 'flex min-w-0 flex-col gap-3 p-4 @min-[1106px]:min-h-0',
  aside: '@min-[1106px]:min-h-0',
} as const

/**
 * 录入表：全部左对齐（数量也左对齐，跟输入框对齐）；表头吸顶；
 * 第一列（商品）在窄屏横向滚动时吸左，所以单元格底色必须不透明。选中行用 `rowActive` + 第一格 `rowActiveBar`。
 * 分隔线画在单元格上沿（第一行不画），表头底线用内阴影，吸顶后也在；表格底边不和外框叠成两条。
 */
export const workbenchTable = {
  /** 外框：内容多高就多高，超出才滚动；不要给 flex-1，否则行少时下面留一大块空框 */
  scroll: 'min-h-0 overflow-auto rounded-xl border',
  table: 'w-full table-fixed border-separate border-spacing-0 [&>tbody>tr:first-child>td]:border-t-0',
  th: 'sticky top-0 z-10 h-10 bg-muted px-3 text-left align-middle text-sm font-medium whitespace-nowrap text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]',
  td: 'border-t bg-card px-3 py-3 text-left align-middle text-base',
  /** 同一商品拆出来的子行、序列号行、拒收原因行：上沿用虚线，和商品之间的实线区分开 */
  tdSub: 'border-dashed',
  stickyFirst: 'sticky left-0 z-[1]',
  stickyFirstHead: 'left-0 z-20',
  rowActive: '[&>td]:bg-accent',
  rowActiveBar: 'shadow-[inset_4px_0_0_var(--primary)]',
} as const

/**
 * 商品列宽：20px 的 13 位条码（EAN-13，实测 163px）一行放得下；更长的箱码按字符折成两行，不截断。
 * 名称列不设宽度，吃剩下的宽度。
 */
export const WORKBENCH_PRODUCT_COL_WIDTH = 192
/** 名称列最窄宽度：再窄就让整张表在框内横向滚动（商品列吸左），不再压缩其他列 */
export const WORKBENCH_NAME_MIN_WIDTH = 140
