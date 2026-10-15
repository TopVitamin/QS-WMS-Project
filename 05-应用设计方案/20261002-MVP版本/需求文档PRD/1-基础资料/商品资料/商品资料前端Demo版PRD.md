# 商品资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《商品资料主PRD》](商品资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《商品资料页面骨架》](商品资料页面骨架.md)。字段真源：[《商品（详细稿）》](../../../字段清单合集/01-基础资料/商品/商品（详细稿）.tsv)、[《商品条码（详细稿）》](../../../字段清单合集/01-基础资料/商品/商品条码（详细稿）.tsv)。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表模式参考 `warehouse-list-page.tsx` / `location-list-page.tsx`（`FilterBar columns={6}`、无 `StatusTabs`、无 `selectable`、**无列表「新增」**）。

**验收**：主 PRD §6.1（AC01～AC14）。

## 一、页面与路由

| 路由 | 建议文件 | 容器 |
| --- | --- | --- |
| `/wms/master/skus` | `sku-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| `/wms/master/skus/:ownerCode/:skuCode` | `sku-detail-page.tsx` | 分组 `Panel` + `Descriptions` + 条码 `DataTable` |
| `/wms/master/skus/:ownerCode/:skuCode/edit` | `sku-edit-page.tsx` | 分组 `Panel` + 表单（追溯配置）；**不含**条码子表 |

匹配键为货主编码 + 商品编码；`:ownerCode`、`:skuCode` 与 Mock 种子一致。路由注册顺序：`edit` 字面量段排在 `:ownerCode` 复合匹配之前（与仓库 `…/:code/edit` 一致）。

菜单：**基础资料 → 商品管理**（`config/menu.ts` → `path: '/wms/master/skus'`，`titleKey: 'menu.skus'`）。列表 `PageContainer title={t('menu.skus')}`（中文「商品管理」，与仓库/库位等「…管理」一致；路由仍为 `/skus`），勿另起与菜单不一致的 listTitle。

顶栏「当前仓库」只影响**业务单据**默认过滤；商品列表展示**授权可见货主下全部 SKU**（与主 PRD 一致）。

本地：`cd 09-产品原型/qs-wms-demo && npm run dev`。

## 二、列表页

### FilterBar（`columns={6}`：常显筛选项 + 第 6 列操作）

`draft` / `filters` 双状态；点「查询」写入 `filters` 并回到第一页；「重置」清空两者。第 6 列底对齐：**查询**（`type=submit`）、**重置**、**展开/收起**（advanced 字段在展开区，仍占 6 列栅格换行）。

| 区域 | 字段 | 控件 | 匹配 |
| --- | --- | --- | --- |
| 常显 | 所属货主 | `Select` 可搜索，含「全部」 | 精确 |
| 常显 | 商品编码 | `Input` | 包含 |
| 常显 | 商品名称 | `Input` | 包含 |
| 常显 | 使用状态 | `Select` 全部/启用/停用 | 精确 |
| advanced | 主条码 | `Input` | 包含 |
| advanced | 商品形态 | `Select` 全部/轻小件/大件/异形 | 精确 |
| advanced | 是否启用 SN 管理 | `Select` 全部/是/否 | 精确 |
| advanced | 是否启用批次/效期 | `Select`（按详细稿可筛字段） | 精确 |
| advanced | 上游商品标识 | `Input` | 包含 |
| advanced | 最后修改时间 | `DateRangePickerField`（可只填一端） | 范围 |

### DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 所属货主 | 编码 + 名称，`text-xs` 副标题 | — |
| 商品编码 | `<DocNo>` 链详情 | `pin: 'left'` |
| 商品名称 | 文本 | — |
| 主条码 | `BizCode`或sans字体＋`tabular-nums`，空 `—` | — |
| 计量单位 | 文本 | — |
| 商品形态 | 文本 | — |
| 使用状态 | `<StatusBadge>` | — |
| 最后修改时间 | `<DateTime>` | 可排序 |
| 最后修改人 | 文本 | — |
| 操作 | 「编辑」→ 编辑路由；「停用」/「启用」或收进「更多」 | `pin: 'right'` |

列设置默认隐藏：是否 SN/批次/效期、是否带电、规格描述、上游商品标识。内置 **列设置**（`Settings2`）。

默认排序：最后修改时间降序。`pageSize=20`。

### 页头

| 控件 | 行为 |
| --- | --- |
| 导出 | `toast.info`「演示环境未接真实导出」 |
| — | **无新增 SKU、无导入、无审核**（AC10）；新 SKU 仅 OMS Mock／改 `seed.ts` |

停用：行内或详情 `useConfirm` Dialog，失败展示主 PRD R08 类文案。

## 三、详情页

- `title`：固定「查看商品详情」或 `商品 SKU · {货主} / {编码}`（与 `page-tabs` 约定一致后二选一，页签 key 独立配置）；标题旁 `StatusBadge` 使用状态。
- `actions`：`返回列表`（outline）、`编辑`（primary）→ `…/edit`；`停用`/`启用`（outline/destructive）。
- 主档分组 `Panel`，`Descriptions columns={4}`；备注、规格、上游标识可 `multiline` / 跨列。
- **条码子表**：独立 `Panel` 标题「商品条码」；工具区 `+ 新增条码`（商品启用时）；`DataTable` `selectable=false`：

| 列 | 单元格 |
| --- | --- |
| 条码 | `BizCode` / `font-mono` |
| 是否主条码 | 是/否 |
| 条码使用状态 | `<StatusBadge>` |
| 操作 | 「编辑」→ 条码 Dialog；「停用」确认 |

- **维护信息**：`MasterAuditPanel` 或等价 `Panel`，**仅**最后修改人、最后修改时间（不展示创建人/创建时间）。

## 四、编辑页（独立路由）

- 页头：`取消`（outline）、`保存`（primary）；无「提交审核」。
- **只读**：所属货主、商品编码、上游商品标识、主条码（摘要 Panel 提示「保存后于详情维护条码」）。
- 尺重沿用字段清单：长宽高按cm、重量按kg存储；表单和详情按当前仓库单位换算并标明单位，新品维护回写同一仓内规格。
- **可编辑**：名称、英文名、规格、单位、备注、形态、带电、追溯配置全套、尺重；使用状态与页头启停二选一，Demo 与详细稿「编辑页=可编辑」一致即可。
- **不含**条码子表维护入口（AC：编辑后回详情维护条码）。

### 4.1 追溯与联动

| 场景 | 行为 |
| --- | --- |
| 是否启用 SN = 否 | 隐藏或禁用 SN 格式校验 |
| 是否启用效期 = 是 | 保质期、允许入库、临期、过期必填；保存校验 **允许入库 ≥ 临期 ≥ 过期** |
| 关闭 SN/批次/效期 | R09 不通过：`toast.error` + 库存/作业单说明 |
| 保存成功 | `toast.success`「保存成功」；`navigate` 回详情 |

取消：`useMasterDiscardNavigate` 或 `Dialog`「放弃修改？」（见页面骨架）。

## 五、条码 Dialog

容器：`Dialog`（字段 ≤4，不用 Sheet）。

| 字段 | 控件 | 规则 |
| --- | --- | --- |
| 所属货主、商品编码 | 只读文本 | 自动带入 |
| 条码 | `Input` | 新增必填；**保存后只读** |
| 是否主条码 | `Radio` 或 `Switch` | 必填 |
| 条码使用状态 | `Select` | 默认启用 |

保存：`mock/db.ts` action；全系统条码唯一；主条码同步主档展示。成功关闭 Dialog 并刷新详情子表。

## 六、文案与 Mock

| 场景 | 反馈 |
| --- | --- |
| 保存成功 | 保存成功 |
| 校验失败 | 字段下提示 + 可选顶部 `Alert` |
| 条码重复 | 条码已存在 |
| 停用失败 | 存在实际库存或未完结业务，无法停用。 |
| 导出 | 演示环境未接真实导出 |

| 货主 | 商品编码 | 名称 | 主条码 | 说明 |
| --- | --- | --- | --- | --- |
| 自营 | CABLE-01 | USB 数据线 | 690000000001 | 轻小件、免检 |
| 外部货主 A | CABLE-01 | 同名不同货主 | 690000000002 | 同编码跨货主 |
| 自营 | SN-DEMO-01 | 序列号样例 | 690000000003 | 启用 SN |

新 SKU 仅通过 **系统集成 Mock 推送** 或扩展 `mock/sku-masters.ts`；列表页头不提供「模拟推送」。改种子时 `persist version +1`。

## 七、代码索引（待实现）

| 项 | 路径 |
| --- | --- |
| 页面 | `09-产品原型/qs-wms-demo/src/pages/wms/master/sku-*-page.tsx` |
| 表单分区 | `sku-form-fields.tsx` |
| 类型/校验/种子 | `types/wms.ts`、`lib/sku-master.ts`、`mock/sku-masters.ts` |
| 路由 | `#/wms/master/skus`、`#/wms/master/skus/:ownerCode/:skuCode`、`…/edit` |
| 页签 | `config/page-tabs.ts` → `resolvePageTab` 注册上述 pathname |

## 八、Demo 验收

- [ ] 列表双 Panel + `FilterBar columns={6}`，无 StatusTabs、无勾选列
- [ ] 列表标题 `menu.skus`；路由 `/wms/master/skus`（非 `/products`）
- [ ] **无新增 SKU、无导入、无审核**
- [ ] 列表含最后修改时间、最后修改人；详情维护信息仅这两项
- [ ] 编码进详情；详情含条码 `DataTable`；编辑走独立 `…/edit` 路由且含追溯字段
- [ ] 编辑页无条码子表维护入口
- [ ] 条码 Dialog 保存后文本不可改；效期不等式与身份字段只读校验通过
