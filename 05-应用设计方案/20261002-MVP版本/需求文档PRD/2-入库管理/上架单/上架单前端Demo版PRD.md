# 上架单前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《上架单主PRD》](上架单主PRD.md)的**管理端查询**部分；说明路由、组件、派生口径、Mock 与走查。不重复业务规则与验收表。
> 布局真源：[《上架单页面骨架》](上架单页面骨架.md)。字段真源：[《上架单（详细稿）》](../../../字段清单合集/02-入库管理/上架单/上架单（详细稿）.tsv)。PDA 保存与提交见[《PDA上架前端Demo版PRD》](../../7-PDA作业端/上架作业/PDA上架前端Demo版PRD.md)，两端读写同一份 `putawayOrders`。
> 版本：WMS-V0.1｜日期：2026-10-15｜状态：初稿，演示未验收

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)第四节**。列表参照 `inbound-order-list-page.tsx`（StatusTabs + 双 Panel），详情参照 `inbound-order-detail-page.tsx`；子表列可复用 `inbound-putaway-sheet.tsx`。

## 一、页面与路由

| 路由 | 组件（建议） | 容器 |
| --- | --- | --- |
| `/wms/inbound/putaway` | `putaway-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| `/wms/inbound/putaway/:putawayNo` | `putaway-detail-page.tsx` | `PageContainer` + 分组 `Panel` + `Tabs` |

**菜单**：`config/menu.ts` 已有 `/wms/inbound/putaway`（`menu.putawayTasks`，M1 建设中）。实现时：

- 中文文案由「上架任务」改为「上架单」（en-US「Putaway Orders」），key 可沿用；
- `router.tsx`、`config/page-tabs.ts` 注册列表与 `:putawayNo` 详情；
- 同组的 `/wms/inbound/receipts`（收货记录）与宏观架构「收货记录不设独立菜单」冲突，应从菜单移除，收货记录只在入库单详情页签查看。

**入库单详情联动**：上架单页签的单号改为 `<DocNo>` 链到本详情；行内「查看」Sheet 保留作快览。

数据范围：顶栏当前仓库；`warehouseCode` 不等于当前仓的单据不出现，直接访问详情 URL 时显示「未找到上架单」空态。

## 二、类型补齐

现有 `PutawayOrder`（`types/inbound.ts`）缺主PRD与字段稿要求的追溯字段。实现本页前先补齐，PDA 上架同步使用：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sourceType` | `'INBOUND' \| 'RETURN'` | 来源业务；Demo 种子全部 `INBOUND` |
| `sourceNo` | `string` | 来源单号；替代仅入库可用的 `inboundNo`（`inboundNo` 可保留为兼容别名） |
| `receiptNo` | `string` | 改为必填；入库来源为 RC 号 |
| `stagingLocationCode` | `string` | 来源暂存库位，取自收货记录，生成后不变 |
| `remark` | `string?` | PDA 可录 |
| `PutawayPlanLine.receiptLineNo` | `number` | 对应收货明细行号 |
| `PutawayPlanLine.productionDate` | `string?` | 启用效期时有值 |
| `PutawayActualLine.lineNo` | `number` | 本单内唯一 |
| `PutawayActualLine.planLineNo` | `number` | 关联应上架行；同SKU不同批次靠它区分 |
| `PutawayActualLine.serialNos` | `string[]?` | SN商品落位的序列号，条数等于 `qty` |

`PutawayActualLine.submitted` 可删：上架单只有整单提交，按单头 `status === 'COMPLETED'` 判断即可。

## 三、派生口径（`lib/putaway.ts`）

| 名称 | 公式 | 用于 |
| --- | --- | --- |
| 应上架总数量 | `Σ planLines.planQty` | 列表、详情 |
| 已录数量 | `Σ actualLines.qty` | 列表、详情；已完成单等于应上架 |
| 已上架数量 | `status === 'COMPLETED' ? 应上架总数量 : 0` | 列表、详情；不能用已录代替 |
| 行已录 | `Σ actualLines.qty where planLineNo = 该行` | 应上架明细子表 |
| SKU数 | `planLines` 去重 `skuCode` 计数 | 列表 |

现有 `recordedQty` 按 `skuCode` 汇总，同SKU多批次会串行；改为按 `planLineNo` 汇总，`skuCode` 参数仅供 PDA 落位页按商品筛选时使用。

## 四、列表页

### 页头

| 按钮 | 组件 | 行为 |
| --- | --- | --- |
| 导出 | `Button variant="outline"` | `toast.info(t('common.exportMock'))` |

无新增、导入、批量按钮。

### FilterBar（`columns={6}`，5 常显 + 3 advanced）

`draft` / `filters` 双 state；查询回第一页；重置清空两者。

| 字段 | 位置 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- | --- |
| 上架单号 | 常显 | `Input` | 包含；空格分词多号 | `putaway.filters.putawayNoPlaceholder` |
| 来源单号 | 常显 | `Input` | 包含 | `putaway.filters.sourceNoPlaceholder` |
| 容器号 | 常显 | `Input` | 包含；无容器单不命中 | `putaway.filters.containerNoPlaceholder` |
| 货主 | 常显 | `Select` 可搜索 + 全部 | 精确 | `common.selectPlaceholder` |
| 品质 | 常显 | `Select` 全部/良品/不良品 | 精确 | `common.selectPlaceholder` |
| 来源业务 | advanced | `Select` 全部/入库/退货 | 精确 | `common.selectPlaceholder` |
| 创建时间 | advanced | `DateRangePickerField` | 范围 | `putaway.filters.createdRangePlaceholder` |
| 提交时间 | advanced | `DateRangePickerField` | 范围；未提交单不命中 | `putaway.filters.submittedRangePlaceholder` |

### StatusTabs

`ALL`、`PENDING`、`PUTAWAYING`、`COMPLETED`，标签用 `putawayOrderStatusMeta`；计数取 filters 之后的数据。URL 可带 `?status=`，切换页签不重置筛选。

### DataTable

`selectable={false}`；默认 `createdAt` 降序；`pageSize=20`。

| # | 列 | 展示 | meta |
| --- | --- | --- | --- |
| 1 | 上架单号 | `<DocNo>` → 详情 | `pin: 'left'` |
| 2 | 单据状态 | `<StatusBadge>` | — |
| 3 | 品质 | `<StatusBadge>`（`qualityMeta`） | — |
| 4 | 来源业务 | `<TagLabel>` | 默认隐藏 |
| 5 | 来源单号 | 入库来源 `<DocNo>` → 入库单详情；退货来源纯文本 | — |
| 6 | 容器号 | `<BizCode>`；空值显示 `putaway.noContainer`（无容器收货） | — |
| 7 | 货主 | 编码小字 + 名称 | truncate |
| 8 | SKU数 | `<Num>` | `align: 'right'` |
| 9～11 | 应上架、已录、已上架 | `<Num>` | `align: 'right'` |
| 12 | 创建时间 | `<DateTime>` | 可排序 |
| 13 | 提交时间 | `<DateTime>`；空为 `—` | 可排序 |
| 14 | 操作 | 见下 | `pin: 'right'` |

行操作：

| 按钮 | 显示条件 | 行为 |
| --- | --- | --- |
| PDA上架 | `status !== 'COMPLETED'` | `textLink`；进入 `/pda/putaway` 并直达该单的上架单作业步骤（参数写法沿用 `use-pda-step`） |

已完成单单元格留空，不渲染 disabled 按钮。

## 五、详情页

页头：`title = 上架单 · {putawayNo}` + `<StatusBadge>`；右侧 `返回列表`（outline），未完成单再加 `PDA上架`。

| Panel | 字段（`Descriptions columns={4}`） |
| --- | --- |
| 基本信息 | 上架单号、单据状态、品质、来源业务、来源单号（链）、来源收货记录号、容器号、仓库、货主、来源暂存库位、创建时间 |
| 数量 | 应上架总数量、已录数量、已上架数量、录入进度（`Progress` + `已录/应上架`，无百分号） |
| 提交信息 | 提交人、提交时间、备注（`col-span-2`，`multiline`） |

`Tabs`（角标为行数）：

| 页签 | 列 |
| --- | --- |
| 应上架明细 | 行号、收货明细行号、商品编码、商品条码、商品名称、批次号、生产日期、失效日期、应上架数量、已录 |
| 实际上架明细 | 行号、应上架行号、商品编码、批次号（按应上架行带出）、目标库位、上架数量、序列号 |

- 实际上架为空：`EmptyState` + `putaway.noActualLines`。
- 序列号列：有 `serialNos` 时显示 `textLink`「查看({{count}})」，打开 `DetailSheet` 列出序列号；否则 `—`。
- 未找到单据或不属当前仓：`EmptyState` + `返回列表`。

本页只读，不调用 `savePutawayLine`、`removePutawayLine`、`submitPutawayOrder`。PDA 提交后返回本页时按 `useDb` 订阅自动刷新。

## 六、i18n

| key | zh-CN |
| --- | --- |
| `menu.putawayTasks` | 上架单 |
| `putaway.filters.putawayNoPlaceholder` | 请输入上架单号 |
| `putaway.filters.sourceNoPlaceholder` | 请输入来源单号 |
| `putaway.filters.containerNoPlaceholder` | 请输入容器号 |
| `putaway.filters.createdRangePlaceholder` / `submittedRangePlaceholder` | 创建时间 / 提交时间 |
| `putaway.recordedQty` / `putawayQty` | 已录 / 已上架 |
| `putaway.noContainer` | 无容器收货 |
| `putaway.noActualLines` | 尚未保存上架明细 |
| `putaway.notFound` | 未找到上架单 |
| `putaway.openPda` | PDA上架 |

en-US 同步维护。

## 七、Mock 种子与走查

沿用 `mock/inbound-seed.ts` 现有上架单，补齐第二节字段后应至少覆盖：

| 种子 | 状态 | 用途 |
| --- | --- | --- |
| 良品单，容器 C-A01，已提交 | 已完成 | 列表无操作；详情有提交人、时间 |
| 良品单，同SKU两个批次各一条应上架行，已保存部分落位 | 上架中 | 已录与已上架分列；按批次显示行已录 |
| 不良品单，同容器 | 待上架 | 品质标签；实际明细空态 |
| SN商品单，两件分到两个库位且已提交 | 已完成 | 序列号 Sheet |
| 无容器收货合并单 | 待上架 | 容器号显示「无容器收货」 |

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开上架单列表 | 页头只有导出；状态页签数量之和等于全部 |
| 2 | 输入某入库单号查询 | 只剩该来源单的上架单 |
| 3 | 打开上架中的多批次单 | 已录>0、已上架 0；两条应上架行已录分别计算 |
| 4 | 点「PDA上架」，在PDA录满并提交，返回详情 | 状态已完成；已上架等于应上架；提交人与时间有值；「PDA上架」消失 |
| 5 | 从入库单详情上架单页签点单号 | 进入同一详情页 |
| 6 | 切换顶栏仓库后刷新详情 URL | 显示未找到上架单 |

以上为演示走查要求，页面尚未实现和验证。
