# 入库单前端Demo版PRD·列表页

> **版本**：WMS-V0.4  
> **更新时间**：2026-10-12  
> **定位**：供 AI / 研发实现**入库单列表页**。字段含义与枚举以[《入库单（初稿）》](../../../../字段清单合集/02-入库管理/入库单/入库单（初稿）.tsv)为准；业务规则见[《入库单主PRD》](../入库单主PRD.md)（§6.4、R01、R07、R13；F01、F05）。  
> **本文件只写列表呈现与交互**；弹窗正文见[弹窗与 Mock](入库单前端Demo版PRD_弹窗与Mock.md)；共用约定见[公共与技术约定](入库单前端Demo版PRD_公共与技术约定.md)。

关联：[《入库单页面骨架》](../入库单页面骨架.md) 列表区、[《02-设计规范》](../../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md) §4.1。

**布局与占位须符合 [需求文档 PRD / AGENTS.md](../../../AGENTS.md) 第四节**（`FilterBar columns={6}`）。

**实现参照**：`warehouse-list-page.tsx`（FilterBar 6 列、draft/filters）；`inbound-list-page.tsx` 仅借鉴 **StatusTabs + 双 Panel** 结构，删除 M0 的签收/取消/新增/勾选。

---

## 1. 页面概述

| 项目 | 内容 |
| --- | --- |
| 页面名称 | 入库单列表页 |
| 路由 | `/wms/inbound/orders` |
| 入口 | 入库管理 → 入库单 |
| 目标 | 按仓查询、状态页签、进入详情、条件满足时办理确认收货完结；Demo 推单与导出 Mock |
| 落地功能 | **F01** 列表、**F05** 导出（Mock） |

> **本期边界**  
> - 无新增、导入、审核、行勾选（AC01、Q09）。  
> - 行内**无**「查看」；单号链详情。  
> - 「确认收货完结」见弹窗 PRD §3；列表只写入口。  
> - 收货/上架不在本页操作；走 PDA（公共分册 §6）。

---

## 2. 页头操作

| 按钮 | 组件 | 行为 |
| --- | --- | --- |
| 模拟推送入库指令（Demo） | `Button variant="outline"` + 图标 `data-icon="inline-start"` | 打开[弹窗 PRD §4](入库单前端Demo版PRD_弹窗与Mock.md) |
| 导出 | `Button variant="outline"` | `toast.info(t('common.exportMock'))` |

---

## 3. 查询区 FilterBar

`columns={6}`；`draft` / `filters` 双 state；点「查询」写入 `filters` 并回第一页；「重置」清空两者。

| 字段 | 位置 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- | --- |
| 入库单号 | 常显 | `Input` | 包含；支持空格分词多号；只匹配入库单号 | `inbound.filters.inboundNoPlaceholder` |
| 货主 | 常显 | `Select` 可搜索 + 全部 | 精确 | `common.selectPlaceholder` |
| 业务类型 | 常显 | `Select` | 精确 | `common.selectPlaceholder` |
| 上游单号 | 常显 | `Input` | 包含 | `inbound.filters.upstreamNoPlaceholder` |
| 创建时间 | 常显 | `DateRangePickerField` | 范围 | `inbound.filters.createdRangePlaceholder` |
| 到货方式 | advanced | `Select` | 精确 | `common.selectPlaceholder` |
| 柜号 | advanced | `Input` | 包含 | `inbound.filters.containerNoPlaceholder` |
| 运单号 | advanced | `Input` | 包含 | `inbound.filters.trackingNoPlaceholder` |
| 完成时间 | advanced | `DateRangePickerField` | 范围 | `inbound.filters.completedRangePlaceholder` |
| （第 6 列） | — | 查询 submit、重置（有溢出时含展开/收起） | — | — |

筛选项共 9 个：**5 常显 + 4 进 advanced**，出现「展开/收起」；符合 [需求文档 PRD / AGENTS.md](../../../AGENTS.md) 第四节（>5 项必须展开）。

---

## 4. StatusTabs

`components/biz/status-tabs.tsx`：`ALL`、五态（含**已取消**，一期由 OMS Mock 取消受理）；每项带 `count`。计数 = 当前 **filters 之后** 的数据再按派生 `status` 统计（AC20）。

URL 可选：`?status=RECEIVING` 与筛选参数并存；切换页签不重置 FilterBar。

---

## 5. 列表表格

`selectable={false}`。`createDataColumns<InboundOrder>()` 于 `useMemo`；toolbar **列设置**（`Settings2`）。

默认排序：`createdAt` 降序（`enableSorting: true`）。

> 列表**无「仓库」列**（按顶栏当前仓库过滤）；`initialColumnVisibility` 默认隐藏「上游单号」与「拒收」两列（列设置仍可打开）。

| # | 列 | 展示 | meta |
| --- | --- | --- | --- |
| 1 | 入库单号 | `<DocNo>` → `/wms/inbound/orders/:inboundNo` | `pin: 'left'` |
| 2 | 单据状态 | `<StatusBadge>` | — |
| 3 | 货主 | 编码 `text-xs text-muted-foreground` + 名称 | truncate |
| 4 | 业务类型 | `<TagLabel>` | — |
| 5 | 上游单号 | 文本 | 默认隐藏 |
| 6 | SKU 种类数 | `<Num>` | `align: 'right'` |
| 7～10 | 预计/实收/拒收/已上架 | `<Num>` | `align: 'right'`；拒收默认隐藏 |
| 11～12 | 收货进度、上架进度 | `Progress h-1.5` + `已完成/分母` 文案（无 `%`） | 上架分母为 0 时 `—` |
| 13 | 创建时间 | `<DateTime>` | 可排序 |
| 14 | 操作 | §6 | `pin: 'right'` |

---

## 6. 行操作

| 按钮 | 显示条件 | 说明 |
| --- | --- | --- |
| Web 端收货 | `canReceiveInbound` | `textLink`；进入 `/wms/inbound/orders/:inboundNo/receive`（收货作业台，见收货分册 §3） |
| PDA 收货 | 同上 | `textLink`；`navigate('/pda/receive', { state: { inboundNo } })` |
| 确认收货完结 | 主 PRD §6.4：**推导单据状态=收货中**，且同时满足 R07 | `textLink`；见 [弹窗 PRD §3](入库单前端Demo版PRD_弹窗与Mock.md) |

操作列用 `RowActions` 横排，顺序为 Web 端收货、确认收货完结、PDA 收货，最多露出 2 个，第 3 个收进「更多」（保持 40px 行高，见《02-设计规范》§5.1）；无任何可操作项时单元格留空（含已取消单）。i18n：`inbound.receive.action`、`inbound.openPdaReceive`。

---

## 7. 分页

`pageSize=20`；查询/重置后回第一页。行为与工程内 `DataTable` 分页一致。

---

## 8. 列表页自检

- [ ] `PageContainer fill` + 双 `Panel`  
- [ ] FilterBar `columns={6}`，5 常显  
- [ ] StatusTabs 计数与 AC20  
- [ ] 无勾选、无 M0 签收/取消/新增  
- [ ] 进度 R13 双列，非已上架÷预计  

---

## 9. 反馈规范

| 操作 | 反馈 | 文案 key |
| --- | --- | --- |
| 导出 | `toast.info` | `common.exportMock` |
| 确认收货完结成功 | `toast.success` | `inbound.receiptCloseSuccess` |
| 确认失败 / 打开弹窗前已不满足 R07 / 并发 | `toast.error` | `inbound.receiptCloseStale` |

弹窗标题、正文、未收明细表见[弹窗分册 §3.2](入库单前端Demo版PRD_弹窗与Mock.md)，本文不重复。

---

## 10. Mock 数据与演示验收（列表侧）

种子单号见[弹窗分册 §6.2](入库单前端Demo版PRD_弹窗与Mock.md)。列表页建议走查：

| 步骤 | AC | 操作 |
| --- | --- | --- |
| 1 | AC01 | 打开列表，确认页头仅 Mock 推单 + 导出 |
| 2 | AC02、AC03 | 页头推送 `OMS-IN-DEMO-001`，再重复推送应 toast 重复 |
| 3 | AC07 | 筛选或页签进入收货中 `…-0003`，行内出现「确认收货完结」 |
| 4 | AC20 | 切换筛选后，各 StatusTabs 数量之和与「全部」一致 |
| 5 | AC05 | `…-0001` 无确认按钮 |
| 6 | AC06 | `…-0002` 显示已取消（零实收取消受理），无任何操作入口 |
