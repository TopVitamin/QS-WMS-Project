# 入库单前端Demo版PRD·公共与技术约定

> **版本**：WMS-V0.7  
> **更新时间**：2026-10-14  
> **定位**：入库单 Demo 实现的**共用层**：路由、类型与派生、字段映射、组件与 UI 规范、跨端走查、i18n、代码索引。页面级规则见同目录[列表页](入库单前端Demo版PRD_列表页.md)、[详情页](入库单前端Demo版PRD_详情页.md)、[收货与双端](入库单前端Demo版PRD_收货与双端.md)、[弹窗与 Mock](入库单前端Demo版PRD_弹窗与Mock.md)。  
> **业务真源**：[《入库单主PRD》](../入库单主PRD.md)（§6.4 状态—功能矩阵）；布局见[《入库单页面骨架》](../入库单页面骨架.md)。

**与 ERP 采购订单 Demo 套件对照**：采购拆为列表 / 详情 / 新增编辑 / 弹窗与 Mock **四份**；入库单一期**无管理端新增、编辑页**（主 PRD R01），故本套件为 **列表 + 详情 + 收货与双端 + 弹窗与 Mock + 本公共篇**——建单仅 [弹窗与 Mock §4](入库单前端Demo版PRD_弹窗与Mock.md) 的 Demo 推单。

**样式与组件（必读）**：

- [《QS-WMS 前端设计与开发规范》](../../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)
- [《业务组件与主数据页面》](../../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)（§6 单据列表 vs 主数据）
- [需求文档 PRD / AGENTS.md](../../../AGENTS.md) 第四节

**验收**：主PRD第12.1节（AC01～AC26及补充验收）。

---

## 1. 文档分册索引

| 分册 | 功能 | 内容 |
| --- | --- | --- |
| **本文** | — | 路由、派生、字段映射、组件速查、走查、i18n、代码索引 |
| [列表页](入库单前端Demo版PRD_列表页.md) | F01、F05 | FilterBar、StatusTabs、DataTable、行操作入口 |
| [详情页](入库单前端Demo版PRD_详情页.md) | F02、F03、F07 入口 | 分区、明细表、三类页签、Sheet、页头收货 |
| [收货与双端](入库单前端Demo版PRD_收货与双端.md) | F07 | 两端共用录入规则与提交动作、Web 收货作业台；PDA 交互见 [7-PDA作业端](../../../7-PDA作业端/) |
| [弹窗与 Mock](入库单前端Demo版PRD_弹窗与Mock.md) | F04、F06 | 确认收货完结、模拟推送、种子与 `db` actions |

弹窗正文、Mock 推单校验与种子数据**只在弹窗分册维护**；收货分步与双端**只在收货分册维护**；列表/详情写触发入口与成功后的刷新表现。

---

## 2. 路由与页签

| 路由 | 文件 | `page-tabs.ts` |
| --- | --- | --- |
| `/wms/inbound/orders` | `inbound-order-list-page.tsx` | 菜单 path；`titleKey: menu.inboundOrders` |
| `/wms/inbound/orders/:inboundNo` | `inbound-order-detail-page.tsx` | **完整 pathname** 注册 `inbound.tabDetail` |
| `/wms/inbound/orders/:inboundNo/receive` | `inbound-order-receive-page.tsx` | `inbound.tabReceive` |

`registry.ts` / `router`：列表 → 详情。详情 `返回列表` 须保留列表 `search`（`status`、筛选参数）。

顶栏仓库：`useSettings().warehouseCode` 过滤；详情单不属于当前仓 → `toast.error` + 回列表。

本地：`cd 09-产品原型/qs-wms-demo && npm run dev`。

---

## 3. 领域类型与派生

### 3.1 枚举

与字段详细稿中文一致；代码英文常量 + i18n（§7）。

| 概念 | 存储值（建议） |
| --- | --- |
| 单据状态 | `PENDING_RECEIVE` / `RECEIVING` / `PUTAWAYING` / `COMPLETED` / `CANCELLED` |
| 明细状态 | `PENDING_RECEIVE` / `RECEIVING` / `PUTAWAYING` / `COMPLETED` / `CANCELLED`（随单收口） |
| 已取消 | 一期纳入；仅限零实收，由 OMS Mock 下发取消并受理（主PRD第6节） |
| 收货完结 | `NOT_CONFIRMED` / `CONFIRMED` |
| 业务类型 | `NORMAL` / `TRANSFER` |

### 3.2 实体与子对象

- 头 + 行：`InboundOrder` / `InboundOrderLine`（`types/inbound.ts` 或扩展 `types/wms.ts`）。
- 子集合：`ReceiptRecord[]`、`PutawayOrder[]`、`InboundException[]` 按 `inboundNo` 关联。
- 收货记录的容器以**明细行** `containerNo` 为准（一次提交可含多个容器，主 PRD R16）；单头 `containerNo` 只在单容器提交时有值，页面展示一律从明细汇总（`lib/inbound-receipt-container.ts`）。

### 3.3 派生 `lib/inbound-derive.ts`

与主 PRD §7.3～§7.4、R13：`recomputeInbound(order, children)` 在列表、详情、每次 `db` action 后调用；**UI 禁止手写覆盖 `status`**。

### 3.4 `mock/db.ts` actions

| Action | 规则 |
| --- | --- |
| `submitReceipt` | 两端共用收货提交：一次提交含 1～N 个容器（每个容器多行），落**一条**收货记录；R03/R04/R15/R16；详见收货分册 §2 |
| `submitContainerReceipt` | Web 收货作业台的单容器封装，内部调用 `submitReceipt`；详见收货分册 §3 |
| `savePutawayLine` / `removePutawayLine` | PDA 上架：保存、撤销上架单的实际上架明细，只记进度不动库存（R10）；详见 PDA 上架 PRD |
| `submitPutawayOrder` | PDA 上架：提交上架单，暂存库位库存移到目标库位，已上架增加（R10）；详见 PDA 上架 PRD |
| `confirmReceiptClose` | R07/R08；详见弹窗分册 §3 |
| `mockPushInboundInstruction` | R01/R02；详见弹窗分册 §4 |

WMS没有手工取消入口；Mock收发台须可下发取消消息并返回受理结论。固定种子0002仅供展示，不能代替取消消息验收。

### 3.5 与 M0 样板的差异（实现必读）

M0 占位已迁移完成：`inbound-list-page.tsx`、`inbound-detail-sheet.tsx` 与 `inboundStatusMeta`（`status.inbound.*` 七态）已删除，列表/详情以本套件 **§2 路由**、`inbound-order-list-page.tsx` / `inbound-order-detail-page.tsx`、§3.1 **五态**（`PENDING_RECEIVE`…`CANCELLED`）及 `config/status.ts` 内 **`inboundOrderStatusMeta`** 为准。

**上架对象统一为上架单**：上架单 `PutawayOrder` 是唯一上架对象；PDA 上架按上架单定位（扫容器、上架单号或商品条码），保存/提交写回同一张上架单，见[《PDA上架前端Demo版PRD》](../../../7-PDA作业端/上架作业/PDA上架前端Demo版PRD.md)。M0 的 `PutawayTask`（`putawayTasks`）已从类型、种子与 `db` 中移除；工作台、PDA 首页的「待上架」统计改按未提交的上架单计数。

单号列：**navigate 至详情路由**（《02-设计规范》§4.1 入库单例外）。

---

## 4. 字段与页面映射

字段名称与分组以 [入库单（详细稿）](../../../../字段清单合集/02-入库管理/入库单/入库单（详细稿）.tsv) 为准；子对象列见同模块收货记录、上架单、入库异常详细稿。字段初稿是详细稿五列投影，不独立维护。

| 字段 | 列表 | 筛选 | 详情 |
| --- | --- | --- | --- |
| 入库单号 | DocNo | 常显 Input | 基本信息 |
| 单据状态 | StatusBadge | StatusTabs | 基本信息 |
| 货主、业务类型、上游单号 | 见列表分册 | 常显 | 基本信息 |
| 数量与双进度 | 列 | — | 数量汇总 |
| 收货完结三字段 | — | — | 时间与完结 |
| 创建/完成时间 | 创建可排序 | DateRange | 时间与完结 |

明细列、子对象列见[详情页分册](入库单前端Demo版PRD_详情页.md)。

---

## 5. 组件与 UI 速查

### 5.1 列表布局（《02-设计规范》§4.1）

```
PageContainer fill
├─ Panel：FilterBar columns={6}（draft/filters）
└─ Panel flex-1：StatusTabs + DataTable
```

### 5.2 详情布局

独立路由 + 多 `Panel` + `Descriptions columns={4}` + 明细 `DataTable` + `Tabs`；子对象查看用 **Sheet 880px**。

### 5.3 组件表

| 能力 | 组件 |
| --- | --- |
| 筛选 | `FilterBar` / `FilterItem`、`DateRangePickerField` |
| 表格 | `DataTable` + `createDataColumns`、`<DocNo>` `<Num>` `<DateTime>` |
| 状态 | `StatusBadge` ← `config/status.ts` `inboundOrderStatusMeta` |
| 进度 | `Progress` + `done/total` 文案（无百分比）；收货=实收/预计，上架=已上架/实收 |
| 写库 | `mock/db.ts`；`{ ok } \| { ok: false, errorKey }` |

**状态 tone**：待收货 `gray`、收货中 `blue`、上架中 `orange`、已完成 `green`、已取消 `gray`。

列表单号/货主：**不用** `font-mono`（管理端编码用 sans + `tabular-nums`，见设计规范 §1）。

---

## 6. 演示走查（跨端）

1. 列表 → [模拟推送](入库单前端Demo版PRD_弹窗与Mock.md)（AC02）  
2. [Web 收货作业台](入库单前端Demo版PRD_收货与双端.md)（AC21、AC22）或 [PDA 收货](../../../7-PDA作业端/收货作业/PDA收货前端Demo版PRD.md)（多容器，AC23～AC26）→ [PDA 上架](../../../7-PDA作业端/上架作业/PDA上架前端Demo版PRD.md)按上架单保存、提交  
3. 详情核对页签（AC04、AC14）  
4. [确认收货完结](入库单前端Demo版PRD_弹窗与Mock.md)（AC08）  
5. 管理端看已完成与短少（AC10）  
6. 切到「已取消」页签看零实收取消受理（0002，AC06）

「Web 端收货」→ `/wms/inbound/orders/:inboundNo/receive`（`inbound-order-receive-page.tsx`）；「PDA 收货」→ `/pda/receive`。可收货：`canReceiveInbound`。

---

## 7. i18n（节选）

| key | 中文 |
| --- | --- |
| `inbound.receive.action` | Web 端收货 |
| `inbound.openPdaReceive` | PDA 收货 |
| `inbound.workContainerNo` | 作业容器 |
| `inbound.bulkPiece` | 无容器收货 |
| `inbound.receiptClose` | 确认收货完结 |
| `inbound.mockPush` | 模拟推送入库指令（Demo） |
| `inbound.detailTitle` | 入库单 · {{no}} |
| `status.inboundOrder.*` | 五态（含已取消） |

完整弹窗文案见[弹窗分册 §5](入库单前端Demo版PRD_弹窗与Mock.md)。

---

## 8. 代码索引

| 项 | 路径 |
| --- | --- |
| 列表 | `pages/wms/inbound/inbound-order-list-page.tsx` |
| 详情 | `pages/wms/inbound/inbound-order-detail-page.tsx` |
| 收货 | `inbound-order-receive-page.tsx`、`inbound-receive-line-form.tsx`、`lib/inbound-receive.ts`、`mock/inbound-receive-actions.ts`、`lib/inbound-receipt-container.ts`；PDA 见 PDA 收货 PRD §8 |
| 上架 | `lib/putaway.ts`、`services/putaway.ts`、`hooks/use-putaway.ts`；PDA 见 PDA 上架 PRD §8 |
| 弹窗/Sheet | `receipt-close-dialog.tsx`、`inbound-mock-push-dialog.tsx`、`inbound-receipt-sheet.tsx`、`inbound-putaway-sheet.tsx` |
| 派生/种子 | `lib/inbound-derive.ts`、`lib/doc-no.ts`、`mock/inbound-seed.ts` |
| 已删除 M0 | `inbound-list-page.tsx`、`inbound-detail-sheet.tsx` |

---

## 9. 实现自检（全局）

- [ ] 分册入口与主 PRD F01～F07 一一对应  
- [ ] `recompute` 后展示；弹窗逻辑不散落在页面 JSX  
- [ ] `tsc` + `build`；EN + `DE-FRA-01` 抽检  
