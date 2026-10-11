# 需求文档 PRD 写作约定（Agent）

本文件约定 **WMS 管理端**《主 PRD》《页面骨架》《前端 Demo 版 PRD》三件制的写法，以及与 `qs-wms-demo` 对齐的**页面布局与交互硬规则**。生成或改写任一对象的前端 Demo 版 PRD 前须通读本节；业务规则仍以各《主 PRD》与 03/04 为准。

更上层文档通则见仓库根目录 [AGENTS.md](../../../AGENTS.md)。基础资料对象映射见 [《WMS基础资料PRD转换说明》](1-基础资料/WMS基础资料PRD转换说明.md)。

实现侧组件与代码路径见原型文档 [《02-设计规范》](../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《03-业务组件与主数据页面》](../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。

## 三件制分工（勿混写）

| 文档 | 写什么 | 不写什么 |
| --- | --- | --- |
| 主 PRD | 业务规则、功能、验收（AC） | 组件名、栅格列数、i18n key 细节 |
| 页面骨架 | ASCII 线框、页面清单、分区与按钮位置 | 校验实现、Mock 路径 |
| 前端 Demo 版 PRD | 路由、`FilterBar`/`DataTable`/Dialog 约定、校验、Mock、**本节布局硬规则** | 重复主 PRD 业务正文 |

## 布局硬规则（主数据与管理端列表）

### 1. 列表搜索区：`FilterBar columns={6}`（「6 列」指栅格，不是筛选项个数）

- 主数据及同类管理端列表**统一** `columns={6}`，**禁止**写成 `columns={4}`（4 列是**详情/编辑表单**用的 `Descriptions`，勿与列表混淆）。
- **常显行**：最多 **5 个**筛选项占第 1～5 列；第 **6** 列底对齐放 **查询、重置**（及有溢出时的 **展开/收起**）。
- **展开区 `advanced`**：仅放 **第 6 个及以后**的筛选项。常显不足 5 个时，应把条件尽量排在常显里，**不要**为 1～2 个条件单独开 `advanced` 却只占 4 列就显示「展开」。
- **何时不出现「展开」**：筛选项总数 ≤5，或 Demo 版 PRD 明确不写 `advanced`（参考仓库列表 5 项常显、无展开）。
- **何时必须「展开」**：筛选项总数 >5；超出 5 的部分全部写在 `advanced`，并在 Demo 版 PRD 的 FilterBar 表中标明「常显 / advanced」。
- 操作列位置：常显筛选项少于 5 个时，查询/重置列 **紧跟**最后一项（`FilterBar` 内按子项数量计算列起点），不要固定空一列。

### 2. 新增 / 编辑页：字段区 **4 列**

- 栅格：`xl:grid-cols-4`（或 Dialog 内等效双列/整行规则见骨架）。
- **使用状态**：新建默认启用；**不在**新增/编辑表单或维护 Dialog 里改状态（无 Switch/Select 状态）。启停仅 **列表操作列**、**详情页头**（及渠道类 **查看 Dialog** 只读 `StatusBadge`）。
- 共享 `*-form-fields.tsx` 或 `*FormDialog`，`mode: 'create' | 'edit'`。

### 3. 查看（详情）页：展示 **4 列**

- 分组 `Panel` + `Descriptions columns={4}`；长字段 `multiline` 或 `col-span-*`。
- 维护信息：`MasterAuditPanel` 或等价，只读 **最后修改人、最后修改时间**（不要堆创建人除非主 PRD 要求）。
- 弹窗「查看」模式：字段只读；状态仅展示，不可编辑。

### 4. Placeholder（占位提示）

| 场景 | Input / Textarea | Select |
| --- | --- | --- |
| **列表筛选** | 编码/名称优先各模块 `*codePlaceholder`、`*namePlaceholder`；其余文本用 `common.inputPlaceholder` | `SelectValue` 统一 `placeholder={t('common.selectPlaceholder')}`；含「全部」选项时默认值常为 `FILTER_ALL`，仍建议写上 placeholder |
| **新增/编辑** | 同上；**只读**字段（编码 edit、系统同步字段）**不设** placeholder | 未选必填项用 `common.selectPlaceholder`；已有默认值的枚举可显示选项文案 |
| **详情/查看** | 只读展示，**不用** placeholder | 只读，**不用** placeholder |
| **日期范围筛选** | — | 用 `DateRangePickerField`，placeholder 用各模块 `updatedRangePlaceholder` 或设计规范约定 |

Demo 版 PRD 的 FilterBar 表须写清：每个筛选项控件类型及是否写 placeholder key，避免实现时留空。

### 5. 菜单与列表标题

- 基础资料侧栏：对象菜单名统一「**…管理**」（如商品管理、物流渠道管理）；`PageContainer title={t('menu.*')}`，勿另起 `listTitle`。
- 路由与 `menu.*`、转换说明保持一致（如商品 `/wms/master/skus`）。

### 6. 列表页头按钮（主数据常见）

- 有新增：**新增**（primary，`master*.create` 文案为「新增」）在左，**导出** Mock（outline）在右；无新增的模块（货主、商品）仅导出等。
- Dialog 维护（承运商/渠道）：列表「新增」+ 弹窗标题「新增物流承运商/渠道」（`createTitle`）。

### 7. 写前端 Demo 版 PRD 时的自检清单

1. FilterBar 是否 `columns={6}`？常显是否 ≤5？>5 项是否仅溢出进 `advanced`？
2. 新增/编辑/Dialog 是否 4 列（或骨架约定）？是否未维护使用状态？
3. 详情是否 `Descriptions columns={4}`？
4. 筛选与表单的可编辑控件是否写明 placeholder？
5. 是否指向 `03-业务组件` 中的样板页（如 `warehouse-list-page`、`warehouse-form-fields`）？
6. 是否与 [《WMS基础资料PRD转换说明》](1-基础资料/WMS基础资料PRD转换说明.md) 路由、三件制一致？

## 基础资料 Demo 版 PRD 推荐样板

| 场景 | 参考实现 |
| --- | --- |
| 列表 5 常显、无展开 | `warehouse-list-page.tsx` |
| 列表 5+1 常显 + advanced | `customer-list-page.tsx`、`channel-list-page.tsx`、`sku-list-page.tsx` |
| 新增/编辑 4 列 | `warehouse-form-fields.tsx` |
| 详情 4 列 | `warehouse-detail-page.tsx` |
| Dialog 维护、无表单状态 | `carrier-form-dialog.tsx`、`channel-form-dialog.tsx` |

改写任一对象 Demo 版 PRD 时，在文首「样式与组件」段增加一句：**布局与占位须符合 [需求文档 PRD / AGENTS.md](../AGENTS.md) 第四节**。
