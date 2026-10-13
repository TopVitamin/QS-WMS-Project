# 仓库资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《仓库资料主PRD》](仓库资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《仓库资料页面骨架》](仓库资料页面骨架.md)。字段真源：[《仓库（详细稿）》](../../../字段清单合集/01-基础资料/仓库/仓库（详细稿）.tsv)（与新增页列对齐见主 PRD Q04）。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表模式参考 `inbound-list-page.tsx`，但本模块去掉 `StatusTabs`、`selectable` 与批量 `toolbar`。**以现有 `warehouse-*-page.tsx` 为样板**，冲突时样板优先并回填本文。

**验收**：行为与结构见主 PRD §6.1（AC01～AC11）。

## 一、页面与路由

| 路由 | 角色 | 容器 |
| --- | --- | --- |
| `/wms/master/warehouses` | 列表 | `PageContainer fill` + 双 `Panel`（结构见页面骨架「列表页」） |
| `/wms/master/warehouses/new` | 新增 | 与编辑同布局；编码可录入 |
| `/wms/master/warehouses/:code` | 详情 | `PageContainer` + 分组 `Panel` + `Descriptions columns={4}` |
| `/wms/master/warehouses/:code/edit` | 编辑 | 分组 `Panel` + 表单 |

顶栏「当前仓库」只影响**业务单据**默认过滤；仓库资料列表展示**授权内全部仓库**（主 PRD Q05：与 `warehouseMasters` 自动同步一期不做，联调登记）。

菜单：**基础资料 → 仓库管理**。本地：`cd 09-产品原型/qs-wms-demo && npm run dev`。

## 二、列表页

### FilterBar（`columns={6}`：5 筛选项 + 操作列）

`draft` / `filters` 双状态；「查询」写入 `filters` 并回第一页；「重置」清空两者。

| 区域 | 字段 | 控件 | 匹配 |
| --- | --- | --- | --- |
| 常显 | 仓库编码 | `Input` | 包含 |
| 常显 | 仓库名称 | `Input` | 包含 |
| 常显 | 使用状态 | `Select` 全部/启用/停用 | 精确 |
| advanced | 国家/地区 | `Select` 字典 | 精确 |
| advanced | 最后修改时间 | `DateRangePickerField`（可只填一端） | 范围 |

第 6 列底对齐：**查询**（`submit`）、**重置**、**展开/收起**（有 advanced 时）。

### DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 仓库编码 | `<DocNo>` 链详情 | `pin: 'left'` |
| 仓库名称 | 文本 | — |
| 时区 | `BizCode`（`tabular-nums`） | — |
| 使用状态 | `<StatusBadge>` | — |
| 地址完整展示 | `truncate` + `title` 全文 | — |
| 最后修改时间 | `<DateTime>` | 可排序 |
| 最后修改人 | 文本 | — |
| 操作 | 「编辑」+「停用」/「启用」（停用 `text-destructive`） | `pin: 'right'` |

列设置默认隐藏：币别、城市、联系人姓名。详情「维护信息」仅展示最后修改人、最后修改时间。默认排序：编码升序；`pageSize=20`。

### 页头

| 控件 | 行为 |
| --- | --- |
| + 新增 | → `/new`；页签与页头为「新增仓库」（`tabCreate` / `createTitle`）；列表按钮文案仍为「新增」（`create`） |
| 导出 | `toast.info`「演示环境未接真实导出」 |
| — | 无导入 |

## 三、详情页

- `title`：`DetailTitle`「查看仓库详情 · 仓库编码」+ `StatusBadge`（与库区、货位等主数据详情一致）。
- `actions`：`返回列表`、`停用`/`启用`（停用 `destructive` outline）、`编辑`（primary）。
- 启停：`useConfirm` → `toast.success`「状态已更新」；Mock 写库即可（完整 MD-FR-006 见主 PRD F03）。
- 分组 `Panel` + `Descriptions columns={4}`；地址完整展示用 `WarehouseFullAddressPreview`。

## 四、新增页

与编辑同布局（4 列栅格）；编码必填 `*`；唯一性失败提示「编码已存在」。保存后进详情，默认启用。

## 五、编辑页

页头「取消」「保存」。只读：编码（标必填）、地址完整展示。状态不在表单。校验：编码（新增）、名称、时区、币别、国家/地区、城市、地址1、邮箱格式。取消有改动：`Dialog` 文案见页面骨架「放弃修改」。成功「保存成功」并 `navigate` 回来源。

## 六、文案与 Mock

| 场景 | 文案 |
| --- | --- |
| 保存成功 | 保存成功 |
| 启停成功 | 状态已更新 |
| 校验失败 | 字段下提示 ± 顶部 `Alert` |

四仓种子见 `mock/warehouse-masters.ts`，与权限 Mock、`mock/seed` 对齐；改种子时 `persist version +1`。写库：`mock/db.ts` → `createWarehouseMaster` / `updateWarehouseMaster` / `setWarehouseMasterStatus`。

## 七、代码索引

| 项 | 路径 |
| --- | --- |
| 页面 | `09-产品原型/qs-wms-demo/src/pages/wms/master/warehouse-*-page.tsx` |
| 表单分区 | `warehouse-form-fields.tsx` |
| 地址预览 | `components/biz/warehouse-full-address-preview.tsx` |
| 路由 | `#/wms/master/warehouses`、`…/new`、`…/:code`、`…/edit` |
