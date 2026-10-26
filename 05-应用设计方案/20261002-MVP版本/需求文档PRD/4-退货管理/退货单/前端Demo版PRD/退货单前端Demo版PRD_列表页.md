# 退货单前端Demo版PRD·列表页

> 本文只写退货单列表呈现、筛选、行操作和反馈；业务条件见[退货单主 PRD](../退货单主PRD.md)，详情见[详情页分册](退货单前端Demo版PRD_详情页.md)，收货作业见[收货与双端分册](退货单前端Demo版PRD_收货与双端.md)。

**布局与占位须符合[需求文档 PRD / AGENTS.md](../../../AGENTS.md)「布局硬规则」一节**：列表 `FilterBar columns={6}`，常显不超过 5 项。

## 1. 页面概述

| 项目 | 内容 |
| --- | --- |
| 页面 | 退货单列表 |
| 确认路由 | `/wms/returns/orders` |
| 入口 | 退货管理 → 退货单 |
| 目标 | 查询当前仓退货单，查看三类来源、数量进度和待办操作 |
| 页头 | OMS Mock（Demo）、派送失败建单、导出 Mock |
| 不提供 | 客户退货／平台仓退件手工新建、退货单编辑、批量收货、批量取消 |

## 2. 查询区

`FilterBar columns={6}`；查询／重置提交后回第一页，状态页签与筛选条件并存。

| 字段 | 位置 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- | --- |
| 退货单号 | 常显 | `Input` | 包含；支持空格分词 | `return.filters.returnNoPlaceholder` |
| 退货来源 | 常显 | `OptionSelect` | 精确；全部／三类来源 | `common.selectPlaceholder` |
| 货主 | 常显 | 可搜索 `OptionSelect` | 精确 | `common.selectPlaceholder` |
| 退货运单号 | 常显 | `Input` | 包含 | `return.filters.trackingNoPlaceholder` |
| 创建时间 | 常显 | `DateRangePickerField` | 时间范围 | `return.filters.createdRangePlaceholder` |
| 上游退货预报号 | advanced | `Input` | 包含 | `return.filters.upstreamNoPlaceholder` |
| 原出库单号 | advanced | `Input` | 包含 | `return.filters.outboundNoPlaceholder` |
| 原出库运单号 | advanced | `Input` | 包含 | `return.filters.originalTrackingNoPlaceholder` |
| 平台侧退货单号 | advanced | `Input` | 包含 | `return.filters.platformReturnNoPlaceholder` |
| 完成时间 | advanced | `DateRangePickerField` | 时间范围 | `return.filters.completedRangePlaceholder` |

共 10 个筛选项，5 个常显，5 个进 advanced；符合管理端列表布局约定。

## 3. 状态页签

页签：`ALL`、`PENDING_RECEIPT`、`RECEIVING`、`PUTTING_AWAY`、`COMPLETED`、`CANCELLED`。计数取当前筛选结果，再按退货单派生状态统计；不把退货异常数量当成状态。

## 4. 表格列

默认按创建时间倒序；不提供行勾选。

| 列 | 展示 |
| --- | --- |
| 退货单号 | `<DocNo>` 链到详情；固定左列 |
| 状态 | `<StatusBadge>`，五态颜色沿全局状态映射 |
| 退货来源 | `<TagLabel>` |
| 货主 | 编码＋名称，过长截断 |
| 关联线索 | 有原出库单优先显示原出库单号；否则显示退货预报号／退货运单号；详情查看全部 |
| 预计／实收／拒收 | `<Num>`，右对齐；拒收默认可隐藏 |
| 已上架 | `<Num>`；已提交上架结果汇总 |
| 收货进度 | `实收＋拒收 / 预计`，不显示百分比 |
| 上架进度 | `已上架 / 实收`；实收为 0 显示“—” |
| 创建时间 | 可排序 |
| 操作 | 按状态显示收货、确认收货完结、PDA 收货等入口 |

## 5. 行操作

| 操作 | 显示条件 | 行为 |
| --- | --- | --- |
| Web 端收货 | 待收货／收货中 | 进入 `/wms/returns/orders/:returnNo/receive` |
| PDA 收货 | 待收货／收货中 | 进入 `/pda/return-receive`，带入退货单号 |
| 确认收货完结 | 收货中、累计实收大于 0 | 打开弹窗；正文列出仍未收行和将定型的最终短少 |
| 查看 | 不单独提供 | 点击退货单号进入详情 |

已完成、已取消单的操作列为空；上架操作从详情的共用上架单页签进入，不在退货单列表重复放“上架”按钮。

## 6. 反馈

| 场景 | 反馈 |
| --- | --- |
| 导出 | `toast.info(common.exportMock)` |
| 派送失败建单成功 | `toast.success(return.createFromTrackingSuccess)`，关闭 Dialog，刷新并定位新 RT |
| 重复原运单 | `toast.error(return.originalTrackingActiveDuplicate)`，展示原 RT 号 |
| 当前状态已变化 | `toast.error(return.stale)`，不关闭已有录入页 |
| 当前仓库与单据仓库不符 | 不展示单据并返回列表 |

## 7. 列表走查

- 预报类退货出现在待收货；派送失败扫原运单后出现在待收货；两类来源标签不能混用。
- 退货收货确认后列表实收、拒收、上架进度与详情一致。
- 已完成单只有追溯入口；已取消单不再出现收货和完结按钮。
- 同一筛选条件下各状态计数之和等于全部。
