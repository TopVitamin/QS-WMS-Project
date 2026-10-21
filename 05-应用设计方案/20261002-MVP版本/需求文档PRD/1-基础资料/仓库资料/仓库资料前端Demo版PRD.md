# 仓库资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《仓库资料主PRD》](仓库资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《仓库资料页面骨架》](仓库资料页面骨架.md)。字段真源：[《仓库（详细稿）》](../../../字段清单合集/01-基础资料/仓库/仓库（详细稿）.tsv)。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表模式参考 `inbound-order-list-page.tsx`，但本模块去掉 `StatusTabs`、`selectable` 与批量 `toolbar`。**以现有 `warehouse-*-page.tsx` 为样板**，有冲突时以上位全局背景和主PRD为准，登记代码待改项。

**验收**：行为与结构见主 PRD §6.1（AC01～AC11）。

## 一、页面与路由

| 路由 | 角色 | 容器 |
| --- | --- | --- |
| `/wms/master/warehouses` | 列表 | `PageContainer fill` + 双 `Panel`（结构见页面骨架「列表页」） |
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
| 常显 | 国家/地区 | `Select` 字典 | 精确 |
| 常显 | 最后修改时间 | `DateRangePickerField`（可只填一端） | 范围 |

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
| 操作 | 编辑 | `pin: 'right'` |

列设置默认隐藏：币别、城市、联系人姓名。详情「维护信息」仅展示最后修改人、最后修改时间。默认排序：编码升序；`pageSize=20`。

### 页头

| 控件 | 行为 |
| --- | --- |
| 导出 | `toast.info`「演示环境未接真实导出」 |
| — | 无导入 |

## 三、详情页

- `title`：`DetailTitle`「查看仓库详情 · 仓库编码」+ `StatusBadge`（与库区、库位等主数据详情一致）。
- `actions`：`返回列表`、`编辑`（primary）。
- 使用状态只读展示，无启停动作。
- 分组 `Panel` + `Descriptions columns={4}`；地址完整展示用 `WarehouseFullAddressPreview`。

## 四、预置与路由边界

四仓由系统初始化，无业务侧新增路由。现有代码若保留`/new`或新增按钮，需移除；文档更新不代表代码已经改好。

## 五、编辑页

页头「取消」「保存」。只读：编码（标必填）、地址完整展示。状态不在表单。校验：名称、时区、币别、国家/地区、城市、地址1、邮箱格式。取消有改动：`Dialog` 文案见页面骨架「放弃修改」。成功「保存成功」并 `navigate` 回来源。

## 六、文案与 Mock

| 场景 | 文案 |
| --- | --- |
| 保存成功 | 保存成功 |
| 校验失败 | 字段下提示 ± 顶部 `Alert` |

四仓种子见 `mock/warehouse-masters.ts`，与权限 Mock、`mock/seed` 对齐；改种子时 `persist version +1`。写库：`mock/db.ts` → `updateWarehouseMaster`；创建与启停动作一期不得开放。

## 七、代码索引

| 项 | 路径 |
| --- | --- |
| 页面 | `09-产品原型/qs-wms-demo/src/pages/wms/master/warehouse-*-page.tsx` |
| 表单分区 | `warehouse-form-fields.tsx` |
| 地址预览 | `components/biz/warehouse-full-address-preview.tsx` |
| 路由 | `#/wms/master/warehouses`、`…/:code`、`…/edit` |
