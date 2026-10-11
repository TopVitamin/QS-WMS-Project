# 货主资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《货主资料主PRD》](货主资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《货主资料页面骨架》](货主资料页面骨架.md)。字段真源：[《货主（详细稿）》](../../../字段清单合集/01-基础资料/货主/货主（详细稿）.tsv)（编辑页使用状态以主 PRD F02/F03 为准，不在表单）。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表对齐 `warehouse-list-page.tsx` / `location-list-page.tsx`：`FilterBar columns={6}`、无 `StatusTabs`、无 `selectable`。**一期无新增路由**，页头仅保留导出（无 `+ 新增`）。

**跨模块复用**：

| 能力 | 路径 |
| --- | --- |
| 筛选项「全部」、排序、行 id | `lib/master-data.ts`（`FILTER_ALL`、`masterCompositeRowId`、`sortByUpdatedAtDesc`） |
| 列表 draft / filters | `hooks/use-master-list-filters.ts` |
| 离开未保存编辑 | `hooks/use-master-discard-navigate.ts` → `useMasterDiscardNavigate('masterCustomer')` |
| 启停 | `hooks/use-master-usage-status-toggle.ts`（模块薄封装 `useCustomerMasterStatusToggle`，R06 用 `beforeDisable`） |
| 字段错误行 | `hooks/use-master-form-field-error.tsx` |

i18n 命名空间 `masterCustomer`（扩展 `MasterDataI18nScope`）：`discard*`、`statusChangeSuccess`、`error.*`、启停确认；固定页签 `tabDetail`。

**验收**：主 PRD §6.1（AC01～AC11）。

## 一、页面与路由

| 路由 | 建议文件 | 容器 |
| --- | --- | --- |
| `/wms/master/customers` | `customer-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| `/wms/master/customers/:code` | `customer-detail-page.tsx` | `PageContainer` + 分组 `Panel`；查看默认，`?edit=1` 为编辑模式 |

**本期无** `/customers/new`、无 `/customers/:code/edit` 独立路由。在 `config/page-tabs.ts` 的 `resolvePageTab` 注册列表 path 与 `:code`（含 `?edit=1` 时页签文案仍用 `tabDetail` 或扩展 `tabEdit` 若需区分）。

菜单：**基础资料 → 货主管理**（`config/menu.ts`：`path: '/wms/master/customers'`，`titleKey: 'menu.customers'`）。列表 `PageContainer` **`title={t('menu.customers')}`**（勿另起 `listTitle`）。

顶栏「当前仓库」不限制货主列表（主 PRD：有仓权限可见全部货主）。

`router.tsx` 注册顺序：仅列表与 `:code` 详情（无 `new` / `edit` 子路由）。

默认排序：最后修改时间降序；`pageSize=20`。

## 二、列表页

### 2.1 结构

```text
PageContainer(title=t('menu.customers'), actions=仅导出)
  Panel → FilterBar columns={6}
  Panel(flex-1) → DataTable(selectable=false)
```

### 2.2 FilterBar（`columns={6}`：5 筛选项 + 操作列）

`useMasterListFilters` 管理 `draft` / `filters`；「查询」写入 `filters` 并回第一页；「重置」清空两者。

| 区域 | 字段 | 控件 | 匹配 |
| --- | --- | --- | --- |
| 常显 | 货主编码 | `Input` | 包含 |
| 常显 | 货主名称 | `Input` | 包含 |
| 常显 | 货主类型 | `Select` 全部/自营/外部 | 精确 |
| 常显 | 使用状态 | `Select` 全部/启用/停用 | 精确 |
| advanced | 国家/地区 | `Select` 启用中的地区字典 | 精确 |
| advanced | 上游货主标识 | `Input` | 包含 |

第 6 列底对齐：**查询**（`submit`）、**重置**、**展开/收起**（有 advanced 时）。编码/名称/上游标识输入框回车触发查询。

### 2.3 DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 货主编码 | `<DocNo>` / `<BizCode>` 链详情 | `pin: 'left'` |
| 货主名称 | 文本 | — |
| 货主类型 | 文本 | — |
| 使用状态 | `<StatusBadge>` | — |
| 地址完整展示 | `truncate` + `title` 全文 | — |
| 最后修改时间 | `<DateTime>` | 可排序 |
| 最后修改人 | 文本 | — |
| 操作 | 「编辑」→ `?edit=1`；「停用」/「启用」（停用 `text-destructive`） | `pin: 'right'` |

列设置：除上表默认列外，不默认展示创建人/创建时间；**维护相关列仅最后修改人、最后修改时间**（与 `MasterAuditPanel` 一致）。

### 2.4 页头

| 控件 | 行为 |
| --- | --- |
| 导出 | `toast.info`「演示环境未接真实导出」 |
| — | **无新增**、无导入、无删除 |

启停（行内，与详情页头一致）：R06 失败 → `toast.error` + 摘要，**不**开 Dialog；通过 → `useConfirm`（文案见页面骨架）→ `toast.success`（`statusChangeSuccess`）。

## 三、详情页（查看 / 编辑同路由）

- 路由：`/wms/master/customers/:code`；编辑：`?edit=1`（`useSearchParams` 或等价）。
- `title`：查看态可用 `t('masterCustomer.detailTitle')` + 编码 `BizCode`；标题旁 `StatusBadge`。
- **view** `actions`：`返回列表`（outline）、`停用`/`启用`（停用 `destructive` outline）、`编辑`（primary）→ `setSearchParams({ edit: '1' })`。
- **edit** `actions`：`返回列表`、`取消`（outline）、`保存`（primary）；取消/返回走 `useMasterDiscardNavigate` +「放弃修改？」Dialog。
- 分组 `Panel`：view 用 `Descriptions columns={4}`；edit 用 `customer-form-fields.tsx`（`mode: 'view' | 'edit'`），栅格 `xl:grid-cols-4`。
- **维护信息**：仅 `MasterAuditPanel`（**最后修改人、最后修改时间**）；不在编辑表单展示。
- **使用状态**：不在编辑表单；仅列表操作列与详情页头启停（主 PRD F03）。

### 3.1 编辑字段（详细稿「编辑页=可编辑」，除状态）

| 字段 | 控件 | 校验 |
| --- | --- | --- |
| 货主编码、货主类型 | 只读 | R01、R04 |
| 货主名称 | `Input` | 必填；trim |
| 货主备注 | `Textarea` | 选填 |
| 上架库位推荐时机 | `Select` 三选一 | 必填；R08 |
| 上游货主标识、最近资料同步时间 | 只读 | F04 |
| 国家/地区～联系人邮箱 | 与详细稿一致 | 邮箱格式；地址完整展示只读块（可参考 `WarehouseFullAddressPreview` 对齐行高） |

保存：`validateCustomerMasterForm`（`lib/customer-master.ts`）；成功 `toast.success`「保存成功」并去掉 `edit` 查询参数。

## 四、文案与 Mock

| 场景 | 文案 |
| --- | --- |
| 保存成功 | 保存成功 |
| R06 停用失败 | 存在实际库存或未完结业务，无法停用（可附 Mock 摘要） |
| 启停成功 | `statusChangeSuccess` |
| 导出 | 演示环境未接真实导出 |

| 货主编码 | 名称 | 类型 | 状态 | 上游标识 | 推荐时机 | 用途 |
| --- | --- | --- | --- | --- | --- | --- |
| `OWNER-SELF` | QS 自营 | 自营 | 启用 | `MOCK-SELF-001` | 收货确认后推荐 | 只读身份 |
| `OWNER-B` | 演示外部货主 B | 外部 | 启用 | `MOCK-OWNER-B` | 上架扫描时再推荐 | 编辑走查 |
| `OWNER-IDLE` | 无占用外部货主 | 外部 | 启用 | `MOCK-OWNER-IDLE` | 不系统推荐 | 停用成功 |
| `OWNER-BUSY` | 有库存占用 | 外部 | 启用 | `MOCK-OWNER-BUSY` | 上架扫描时再推荐 | 停用 R06 失败 |

种子：`mock/customer-masters.ts`；写库 `mock/db.ts` → `updateCustomerMaster` / `setCustomerMasterStatus`；改种子 `persist version +1`。

## 五、代码索引（实现后对齐）

| 项 | 路径 |
| --- | --- |
| 页面 | `09-产品原型/qs-wms-demo/src/pages/wms/master/customer-list-page.tsx`、`customer-detail-page.tsx` |
| 表单分区 | `customer-form-fields.tsx` |
| 校验与路径 | `lib/customer-master.ts` |
| 类型 | `types/wms.ts` → `CustomerMaster`（或项目内货主类型命名） |
| 路由 | `#/wms/master/customers`、`#/wms/master/customers/:code`、`?edit=1` |

## 六、Demo 走查清单

- [ ] 列表 `title={t('menu.customers')}`；页头仅导出，无新增/导入/删除
- [ ] 双 `Panel` + `FilterBar` 6 列；无 `StatusTabs`、无勾选
- [ ] 编码链详情；行内编辑为同路由 `?edit=1`
- [ ] 启停：列表与详情一致；编辑表单无使用状态
- [ ] 维护信息仅最后修改人/时间；列表维护列一致
- [ ] 复用 `use-master-list-filters`、`use-master-discard-navigate`、`use-master-usage-status-toggle`、`lib/master-data.ts`
