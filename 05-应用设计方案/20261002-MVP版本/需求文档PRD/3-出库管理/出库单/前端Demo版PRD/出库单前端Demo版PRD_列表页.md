# 出库单前端Demo版PRD·列表页

> **版本**：WMS-V0.2  
> **更新时间**：2026-10-15  
> **定位**：供 AI / 研发实现**出库单列表页**。字段以[《出库单（详细稿）》](../../../../字段清单合集/03-出库管理/出库单/出库单（详细稿）.tsv)为准；业务规则见[《出库单主PRD》](../出库单主PRD.md)（§6.4、R01、R16；F01、F05、F12）。  
> **本文件只写列表呈现与交互**；弹窗见[弹窗与 Mock](出库单前端Demo版PRD_弹窗与Mock.md)；共用约定见[公共与技术约定](出库单前端Demo版PRD_公共与技术约定.md)。

## 1. 页面概述

| 项 | 内容 |
| --- | --- |
| 路由 | `/wms/outbound/orders` |
| 文件 | `order-list-page.tsx`，样板 `inbound-order-list-page.tsx` |
| 容器 | `PageContainer fill title={t('menu.outboundOrders')}` + 筛选 `Panel` + 表格 `Panel` |
| 数据 | `useDb().outboundOrders`，按顶栏仓库过滤 |

> **本期边界**  
> - 无普通出库新增、导入；无行内「查看」，单号链详情。  
> - **待处理**单的组织拣货：列表工具栏与详情页头均可操作（二选一：按单生成任务 / 组波批量拣货）。  
> - 其他状态动作（复核、确认出库等）仍在详情页头。

## 2. 页头操作

| 按钮 | 显示条件 | 样式 | 行为 |
| --- | --- | --- | --- |
| 创建其他出库 | 始终 | primary | 打开创建其他出库弹窗（弹窗分册 §4） |
| OMS Mock | 始终 | outline | 打开 OMS Mock 弹窗，默认新建模式（弹窗分册 §3） |
| 指令处理记录 | 始终 | outline | 打开处理记录弹窗（弹窗分册 §6） |
| 导出 | 始终 | outline + `Download` 图标 | `toast.info(t('common.exportMock'))` |

页面底部不放其他链接按钮。

## 3. 查询区 FilterBar（`columns={6}`，5 常显 + 1 advanced）

`draft` 与 URL 双状态：输入改 `draft`，点查询写 URL 参数并回第一页；重置清空筛选，保留当前状态页签。

| 字段 | 位置 | 控件 | 匹配 | URL 参数 | placeholder |
| --- | --- | --- | --- | --- | --- |
| 出库单号 | 常显 | `Input` | 包含；空格分词多号 | `no` | `outbound.ui.noPlaceholder` |
| 上游指令号 | 常显 | `Input` | 包含 | `upstream` | `outbound.ui.upstreamPlaceholder` |
| 业务类型 | 常显 | `OptionSelect` 含全部 | 精确 | `type` | `common.selectPlaceholder` |
| 货主 | 常显 | `OptionSelect` 含全部，选项 `编码 名称` | 精确 | `customer` | `common.selectPlaceholder` |
| 创建时间 | 常显 | `DateRangePickerField` | 范围 | `createdFrom`、`createdTo` | `outbound.ui.createdRangePlaceholder` |
| 引用原入库单号 | advanced | `Input` | 包含；非采购退货单不命中 | `inbound` | `outbound.ui.inboundPlaceholder` |

不设仓库筛选（顶栏决定）、不设状态筛选（`StatusTabs` 决定）。匹配函数 `matchOutboundOrderFilters` 写在 `lib/outbound-list-match.ts`。

## 4. StatusTabs

`ALL`、`PENDING_HANDLE`、`PENDING_PICK`、`PENDING_VERIFY`、`PENDING_SHIPMENT`、`SHIPPED`、`CANCELLED`；标签取 `outboundStatusMeta`，计数取筛选后的数据；URL `?status=`，切页签不重置筛选。

## 5. 列表表格

`createDataColumns<OutboundOrder>()`；默认按 `createdAt` 降序；`pageSize=20`。

| # | 列 | accessor | 展示 | meta |
| --- | --- | --- | --- | --- |
| 1 | 出库单号 | `no` | `<DocNo>` → 详情，带 `state.listSearch` | `pin:'left'`，不可隐藏 |
| 2 | 状态 | `status` | `<StatusBadge meta={outboundStatusMeta[v]}>` | — |
| 3 | 业务类型 | `type` | `<TagLabel meta={outboundTypeMeta[v]}>` | — |
| 4 | 订单品种类型 | `orderComposition(o)` | `<TagLabel meta={outboundCompositionMeta[v]}>`：单品单件 / 单品多件 / 多品混合 | — |
| 5 | 物流渠道 | `channelCode` | `<CodeName>` 查 `channelMasters` | — |
| 6 | 物流承运商 | 渠道关联 `carrierCode` | `<CodeName>` 查 `carrierMasters` | — |
| 7 | 货主 | `customerId` | `<CodeName>`，`max-w-52` | — |
| 8～13 | 需求、预占、缺货、待拣、已拣、已复核 | `orderTotals(o).*` | `<Num>`；其他出库预占/缺货显示 `<Empty/>` | `align:'right'`，可排序 |
| 14 | 实发 | `orderTotals(o).shipped ?? 0` | `<Num>` | `align:'right'`，可排序 |
| 15 | 创建时间 | `createdAt` | `<DateTime>` | 可排序 |
| 16 | 上游指令号 | `upstreamNo` | 文本；空为 `<Empty/>` | 默认显示 |
| 17～19 | 收货人、联系电话、订单来源 | `recipient` / `phone` / `source` | 文本或 `<TagLabel>` | 默认隐藏，列设置可打开 |

不设操作列。

## 6. 勾选与组织拣货（待处理）

组织者或主管可见勾选列；仅 `status='PENDING_HANDLE'` 的行可勾。

| 工具栏按钮 | 显示条件 | 含义 | 提交 |
| --- | --- | --- | --- |
| **按单生成拣货任务**（primary） | 已选 ≥1 张且全部为待处理 | 每张单各生成一张按单拣货任务 | 逐张 `run({type:'ALLOCATE', no})`；全部成功后清空勾选；单张成功 toast 任务号，多张 toast 数量 |
| **组波批量拣货**（outline） | 已选 ≥2 张且全部为待处理 B2C | 同仓同货主组波，生成一张波次拣货任务 | `run({type:'WAVE', orderNos})`；成功跳波次详情并清空勾选 |
| 提示文案 | 未满足上述任一条件 | 说明待处理单可二选一 | — |

B2C 单在待处理时既可只勾 1 张按单拣，也可勾多张组波；FBA / B2B 等只能按单。详情页头保留同名「按单生成拣货任务」按钮。

## 7. 反馈

| 场景 | 表现 |
| --- | --- |
| 无数据 | `DataTable` 默认空态 |
| 查询无结果 | 空态，筛选保留 |
| Mock、其他出库、组波成功 | 列表随 `useDb` 刷新；新单出现在第一行 |

## 8. 列表页自检

1. 页头按钮顺序与显示条件符合 §2；无「查看库存」等游离按钮。
2. 筛选 5 常显 + 1 advanced，写入 URL，刷新后保留。
3. 状态页签数量之和等于全部（AC23）。
4. 数字列右对齐、可排序；货主显示编码 + 名称。
5. 只有待拣货 B2C 可勾选；切到现场人员角色后「生成波次」不出现。
