# 出库单前端Demo版PRD·公共与技术约定

> **版本**：WMS-V0.2  
> **更新时间**：2026-10-15  
> **定位**：出库单 Demo 实现的**共用层**：路由、类型与派生、动作、组件与 UI 规范、动作可见性、跨端走查、i18n、代码索引。页面级规则见同目录[列表页](出库单前端Demo版PRD_列表页.md)、[详情页](出库单前端Demo版PRD_详情页.md)、[弹窗与 Mock](出库单前端Demo版PRD_弹窗与Mock.md)。
> **业务真源**：[《出库单主PRD》](../出库单主PRD.md)（§6.4 状态—功能矩阵）；布局见[《出库单页面骨架》](../出库单页面骨架.md)。

**样式与组件（必读）**：

- [《QS-WMS 前端设计与开发规范》](../../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)
- [《业务组件与主数据页面》](../../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)
- **布局与占位须符合[需求文档 PRD / AGENTS.md](../../../AGENTS.md)「布局硬规则」一节**
- 样板：列表 `inbound-order-list-page.tsx`、`putaway-list-page.tsx`；详情 `inbound-order-detail-page.tsx`、`putaway-detail-page.tsx`；子记录 Sheet `inbound-receipt-sheet.tsx`

**验收**：主PRD第12.1节（AC01～AC24）。

---

## 1. 文档分册索引

| 分册 | 功能 | 内容 |
| --- | --- | --- |
| **本文** | — | 路由、类型、派生、动作、组件速查、动作可见性、走查、i18n、代码索引 |
| [列表页](出库单前端Demo版PRD_列表页.md) | F01、F05、F12 | FilterBar、StatusTabs、DataTable、组波 |
| [详情页](出库单前端Demo版PRD_详情页.md) | F02、F03 及页头入口 | 页头按钮矩阵、概览、八个页签、复核记录 Sheet |
| [弹窗与 Mock](出库单前端Demo版PRD_弹窗与Mock.md) | F04、F06～F11 | 确认出库、交接、退拣、包裹信息、Mock、其他出库、处理记录；种子 |

弹窗正文、校验与种子**只在弹窗分册维护**；列表、详情只写入口与成功后的刷新表现。

---

## 2. 路由与页签

| 路由 | 文件 | `page-tabs.ts` |
| --- | --- | --- |
| `/wms/outbound/orders` | `pages/wms/outbound/order-list-page.tsx` | 菜单 `menu.outboundOrders` |
| `/wms/outbound/orders/:outboundNo` | `pages/wms/outbound/order-detail-page.tsx` | 完整 pathname，`outbound.ui.orderTitle` |

波次、拣货任务、返库上架单的路由见各自 Demo PRD；四个对象的列表与详情**分文件实现**，不共用一个按 `kind` 分支的大组件。

- 列表与详情只看顶栏当前仓库：`useSettings().warehouseCode`。详情单不属当前仓 → 空态「未找到出库单」+「返回列表」；**点单号不切换顶栏仓库**。
- 详情「返回列表」带回列表 `search`（`state.listSearch`），与入库单一致。

---

## 3. 领域类型与派生

### 3.1 枚举

| 概念 | 存储值 | 展示 |
| --- | --- | --- |
| 单据状态 | `PENDING_HANDLE` / `PENDING_PICK` / `PENDING_VERIFY` / `PENDING_SHIPMENT` / `SHIPPED` / `CANCELLED` | `outboundStatusMeta` + `StatusBadge` |
| 业务类型 | `B2C` / `FBA` / `WHOLESALE` / `TRANSFER` / `PURCHASE_RETURN` / `OTHER` | `outboundTypeMeta` + `TagLabel` |
| 订单来源 | `OMS` / `MANUAL` | 文本 |
| 复核方式 | `SORT` / `PACK` | 文本 |
| 容器类型 | `NONE` / `PACKAGE` / `BOX` / `PALLET` | 文本 |
| 交接方式 | `CARRIER` / `DRIVER` / `PICKUP` | 文本 |
| 退拣原因 | `CANCEL` / `MISSING` / `DAMAGED` | 人工退拣只可选后两个 |

所有状态色只写在 `config/status.ts`，枚举标签用 `TagLabel meta`。

### 3.2 实体

沿用 `types/outbound.ts`：`OutboundOrder`、`OutboundItem`、`SpecifiedStock`、`OutboundPickTask`、`OutboundVerification`、`OutboundHandover`、`OutboundPutback`、`OutboundMessage`、`OutboundResult`。本轮补：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `OutboundOrder.messageId` | `string?` | 接单消息标识，详情「上游消息标识」直接读，不再从处理记录反查 |
| `OutboundOrder.cancelledAt` | `string?` | 取消受理时间，操作日志与列表排序用 |

不新增出库单版本字段以外的状态字段；`version` 只供 Mock 校验，不在详情展示。

### 3.3 派生 `lib/outbound-derive.ts`

页面不手算数量，统一调用：

| 函数 | 公式 / 规则 | 用于 |
| --- | --- | --- |
| `orderTotals(order)` | 各行需求、预占、缺货（非其他出库：需求−预占）、已拣、待拣（非其他出库：预占−已拣；其他出库：需求−已拣）、已复核、实发、未发（已出库：需求−实发） | 列表、详情汇总卡、商品明细 |
| `lineQty(order, item)` | 同上，单行 | 商品明细 |
| `orderTasks(db, no)` | 按单、补拣任务 `orderNo = no`，波次任务按份额包含本单 | 拣货任务页签、状态判定 |
| `orderActions(order, db)` | 返回 `{allocate, reallocate, verify, unpick, ship, handover, mockChange, mockCancel, manualCancel, retryResult}` 布尔值，**逐条实现主PRD §6.4**（不按角色裁剪，等同全权限） | 详情页头、更多菜单 |
| `shipCheck(order, db)` | 逐行返回 `{skuCode, demand, picked, verified, shipQty, unshipped, problem?}`，行级 `problem` 为 `unverified`／`short`；整单 `orderProblem` 为 `openTask`（有未完成任务）或 `package`（B2C 包裹信息未齐）；整单 `ok` 与 `shipTotal` | 确认出库弹窗 |
| `taskQtyForOrder(task, no)` | 波次任务只取本单份额的应拣、实拣 | 拣货任务页签 |

`orderActions` 是页头唯一的按钮来源，页面不再写零散的 `status`／`role` 判断。

### 3.4 动作 `mock/db.ts` → `outboundAction`

所有写操作都走 `useDb().outboundAction(command, operator)`，管理端与 PDA 共用，返回 `{ok, no?}` 或 `{ok:false, errorKey, params}`。页面用 `useOutboundAction()` 包一层：

- 失败：`toast.error(t(errorKey, params))`，弹窗保持打开、保留输入；
- 成功：`toast.success` 写明对象与数量（如「已生成拣货任务 PK-…」），弹窗关闭；
- 不再使用页面级红框 `ActionError`。

| 命令 | 页面入口 |
| --- | --- |
| `CREATE` | OMS Mock 新建、创建其他出库 |
| `CHANGE` / `CANCEL` | OMS Mock 变更、取消；手工其他出库取消（无消息标识） |
| `ALLOCATE` | 生成拣货任务、重新分配（同一命令，按状态补占与补拣） |
| `WAVE` | 列表生成波次 |
| `DELETE_VERIFY` / `PACK_VERIFY` | 复核记录页签 |
| `UNPICK` | 退拣弹窗 |
| `SHIP` | 确认出库弹窗（可带 `handover`） |
| `HANDOVER` | 补登交接弹窗 |
| `RETRY_RESULT` | 出库结果重交、模拟失败 |

操作日志：`outboundAction` 成功后写 `auditLogs`，`refType` 按对象写 `OUTBOUND`／`WAVE`／`PICK_TASK`／`PUTBACK`，`refNo` 为该对象单号，`action` 为命令类型，`detail` 写关键数量（如「实发 8」）。出库单详情的操作日志取本单 `refNo`，并合并本单相关任务与返库单的记录，说明前带对象单号。

---

## 4. 组件与 UI 速查

| 场景 | 组件 |
| --- | --- |
| 列表 | `PageContainer fill` + 双 `Panel`；`FilterBar columns={6}` + URL 参数；`StatusTabs`；`DataTable` + `createDataColumns<OutboundOrder>()` |
| 列定义 | 行数据是领域对象本身，**不预先包 JSX、不在 accessor 里写翻译文本**；数字列 `meta.align='right'`，单号列 `pin:'left'` |
| 详情 | `DetailTitle` + `DetailOverview`（`Section`+`Descriptions columns={3}` / `SummaryCard`）+ `DetailTabs param="tab"` |
| 显示 | `DocNo`、`BizCode`、`CodeName`、`Num`、`DateTime`、`Empty`、`StatusBadge`、`TagLabel` |
| 子记录查看 | `DetailSheet`（复核记录） |
| 弹窗 | `Dialog` + `FormGrid columns={2}` + `FormField`；二次确认 `useConfirm()`；宽度 `sm:max-w-*` |
| 交接时间 | `DateTimeField`（按展示时区录入，提交 `toUtcIso(local, tz)`） |
| 数字录入 | `Input type="number"`，`min=1`、整数校验；不用 `QtyStepper`（PDA 专用） |

**动作可见性**：不提供登录与角色切换；页头按钮与动作层按主PRD §6.4 状态矩阵展示，等同全权限。

---

## 5. 演示走查（跨端）

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 列表打开 0001 → 生成拣货任务 | 状态待拣货；拣货任务页签 1 条 |
| 2 | 拣货任务详情 → PDA 拣货，分次确认 1、2 并提交 | 回出库单：已拣 3，待复核；库存流水两次下架 |
| 3 | 出库单「去复核」→ 复核工作台或 PDA 复核 3 | 复核记录 1 条，有效 3 |
| 4 | 「确认出库」勾同时登记交接 | 已出库；交接 1、出库结果 1 |
| 5 | 打开 0008（已取消） | 返库上架单页签 1 张未完成；点单号进返库上架单详情 |
| 6 | 切 English、切 DE-FRA-01 | 文案与时区随之变化；德国仓列表只显示该仓单据 |

---

## 6. i18n

文案集中在 `i18n/locales/outbound.ts`（`[中文, English]` 成对维护）。管理端四个对象的页面文案统一放在 `outbound.ui.*` 一组；`outbound.actions` / `type` / `status` / `sources` 等枚举组与 PDA 共用。菜单名在 `zh-CN.ts`／`en-US.ts` 的 `menu`：

| key | zh-CN |
| --- | --- |
| `menu.outboundOrders` / `outboundWaves` / `pickTasks` / `verifyStation` / `outboundPutbacks` | 出库单 / 波次管理 / 拣货任务 / 复核工作台 / 返库上架单 |
| `outbound.ui.noPlaceholder` / `upstreamPlaceholder` / `inboundPlaceholder` / `createdRangePlaceholder` | 请输入出库单号 / 请输入上游指令号 / 请输入原入库单号 / 创建时间 |
| `outbound.ui.allocate` / `reallocate` | 生成拣货任务 / 重新分配 |
| `outbound.ui.goVerify` / `goVerifyStation` / `goVerifyPda` / `ship` / `handoverAdd` | 去复核 / 复核工作台 / PDA 复核 / 确认出库 / 补登交接 |
| `outbound.ui.orderNotFound` | 未找到出库单 |
| `outbound.ui.problemOpenTask` / `problemUnverified` / `problemShort` / `problemPackage` | 还有未完成的拣货任务 / 已拣 {{picked}}，已复核 {{verified}}，须全部复核 / 还差 {{count}} 件，本类型须足量 / B2C 包裹信息未齐 |
| `outbound.ui.shipSubmit` | 确认出库（实发 {{count}} 件） |
| `outbound.ui.toast*` | 各动作成功提示 |

新增文案中英文同时补齐。

---

## 7. 代码索引

| 文件 | 内容 |
| --- | --- |
| `types/outbound.ts` | 领域类型 |
| `mock/outbound-actions.ts` | 纯函数动作，`applyOutboundAction` |
| `mock/outbound-seed.ts` | 种子（见弹窗与 Mock 分册 §7） |
| `lib/outbound-derive.ts` | §3.3 派生 |
| `lib/outbound-list-match.ts` | 四个列表的筛选匹配 |
| `pages/wms/outbound/order-list-page.tsx` | 列表 |
| `pages/wms/outbound/order-detail-page.tsx` | 详情 |
| `pages/wms/outbound/verification-sheet.tsx` | 复核记录 Sheet |
| `pages/wms/outbound/order-dialogs.tsx` | 确认出库、补登交接、退拣、包裹信息 |
| `pages/wms/outbound/mock-dialog.tsx`、`messages-dialog.tsx` | OMS Mock、其他出库、处理记录 |
| `pages/wms/outbound/outbound-log-columns.tsx` | 操作日志列，四个详情共用 |
| `pages/wms/outbound/use-outbound-action.ts` | 动作封装与 toast |

## 8. 实现自检（全局）

1. 列表是否 `FilterBar columns={6}` + `StatusTabs`，筛选写进 URL？是否无仓库筛选、无「查看」按钮？
2. 表格行是否为领域对象、列用 `createDataColumns<T>()`？列 key 与取值是否一一对应（不再出现列有值为空）？
3. 页头按钮是否只来自 `orderActions`，条件不满足不渲染？
4. 所有失败是否 toast 出具体原因，成功是否带对象与数量？
5. 交接时间是否按展示时区录入、UTC 存储？
6. 中英文 key 是否成对？切英文、切德国仓各看一遍。
7. `npx tsc -p tsconfig.app.json --noEmit && npm run lint && npx vitest run && npm run build` 通过。
