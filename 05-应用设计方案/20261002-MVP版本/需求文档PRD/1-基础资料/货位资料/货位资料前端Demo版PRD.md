# 库位资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《库位资料主PRD》](货位资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《库位资料页面骨架》](货位资料页面骨架.md)。字段真源：[《库位（详细稿）》](../../../字段清单合集/01-基础资料/货位/货位（详细稿）.tsv)。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。库区下拉与启用过滤对齐[《库区资料前端Demo版PRD》](../库区资料/库区资料前端Demo版PRD.md)。列表模式参考 `warehouse-list-page.tsx`（无 `StatusTabs`、无 `selectable`）。

**验收**：主 PRD §6.1（AC01～AC11）。

## 一、页面与路由

| 路由 | 建议文件 | 容器 |
| --- | --- | --- |
| `/wms/master/locations` | `location-list-page.tsx` | `PageContainer fill` + 双 `Panel`（见页面骨架「列表页」） |
| `/wms/master/locations/new` | `location-create-page.tsx` | 多 `Panel` 长表单 |
| `/wms/master/locations/:code` | `location-detail-page.tsx` | 多 `Panel` + `Descriptions` |
| `/wms/master/locations/:code/edit` | `location-edit-page.tsx` | 同新增；编码只读 |

`:code` 为**仓库内库位编码**；详情/编辑须带 `warehouseId`（路由 state 或 query），避免跨仓编码碰撞（R02）。

菜单与列表页标题：**基础资料 → 库位管理**（`menu.locations`，与 `warehouse-list-page` 一样用菜单 key 作 `PageContainer` 标题）。

## 二、列表页

### FilterBar（`columns={6}`：5 筛选项 + 操作列，与仓库管理一致）

`draft` / `filters` 双状态；第 6 列底对齐：**查询**、**重置**、**展开/收起**（本页无advanced）。

| 区域 | 字段 | 控件 | 匹配 |
| --- | --- | --- | --- |
| 常显 | 所属仓库 | `Select` 启用仓库；默认顶栏当前仓库，变更清空库区 draft | 精确 |
| 常显 | 所属库区 | `Select` 随仓库；仅启用库区；含「全部」 | 精确 |
| 常显 | 库位编码 | `Input` | 包含 |
| 常显 | 库位类型 | `Select` 与库区类型枚举一致 | 精确 |
| 常显 | 使用状态 | `Select` 全部/启用/停用 | 精确 |

### DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 所属仓库 | Code-Name | — |
| 所属库区 | Code-Name | — |
| 库位编码 | 链接 → 详情（带 warehouse 上下文） | `pin: 'left'` |
| 库位类型 | 文本 | — |
| 使用状态 | `StatusBadge` | — |
| 最后修改时间 | `<DateTime>` | 可排序 |
| 最后修改人 | 文本 | — |
| 操作 | 编辑；停用/启用 | `pin: 'right'` |

默认隐藏（列设置）：库位备注。默认排序：最后修改时间降序。`pageSize=20`。详情「维护信息」仅最后修改人、最后修改时间。

### 页头

| 控件 | 行为 |
| --- | --- |
| + 新增 | 无启用库区 → 按钮 `disabled` + `toast.warning('请先创建并启用库区')`；页签与页头为「新增库位」（`tabCreate` / `createTitle`） |
| 导出 | `toast.info('演示环境未接真实导出')` |

停用：R09 预校验失败 → `toast.error`；通过 → `useConfirm`「确认停用库位？」（见页面骨架 Dialog）。

## 三、新增页 / 编辑页

| 事件 | 行为 |
| --- | --- |
| 选所属库区 | 回填仓库（只读）、库位类型（只读）；选项为所选仓库下启用库区 |
| 保存 | R02 同仓编码唯一；R03 父库区有效；编辑改库区受 R10 |

| 分组 | 控件要点 | 新增默认 |
| --- | --- | --- |
| 基础 | 库区 `Select`；编码 `Input`；备注 `Textarea`（使用状态不在表单维护，启停走列表与详情页头） | 新增默认启用 |
| 作业 | `InputNumber` 非负整数 | 空 |
| 结构 | `Input` | 空 |
| 适配 | `MultiSelect` 商品形态枚举 | 空（不限制） |

编辑：编码只读；有占用时库区只读。必填见主 PRD F01。成功「保存成功」；取消用放弃修改 Dialog。

## 四、详情页

`title` = `查看库位详情` + 编码 `BizCode` + `StatusBadge`（对齐仓库详情）；actions：`返回列表`、`编辑`、`停用/启用`。

占用 `Panel`：`当前货主占用`来自实际库存与未提交上架、返库、移库目标位占用；目标库位无占用时为`空闲`，收发暂存库位展示`允许多货主`及现有货主，不套用单货主阻断。其余 `Panel` 顺序同骨架；形态空值展示 `不限制`。

## 五、文案与 Mock

| 库区 | 库位编码 | 类型 | 形态 | 占用 |
| --- | --- | --- | --- | --- |
| Z-PICK | P-B-01 | 拣货 | 轻小件 | OWNER-B |
| Z-STORE | S-A-01 | 存储 | 大件 | 空闲 |
| Z-STAGE | STAGE-IN-01 | 暂存 | — | 多货主，按库存分别记账 |

`P-B-01` 停用应触发 R09 失败；另一仓库可同名编码验收 R02。建议落盘：`mock/location-masters.ts`（待建）+ `mock/db.ts` 增删改查与占用标记。

## 六、代码索引

样式参考现有`location-*`样板，业务行为遵循本文和主PRD；有冲突时以上位全局背景和主PRD为准，登记代码待改项。

| 项 | 路径 |
| --- | --- |
| 列表 / 新增 / 详情 / 编辑 | `09-产品原型/qs-wms-demo/src/pages/wms/master/location-*-page.tsx` |
| 表单分区 | `location-form-fields.tsx` |
| 规则与路径 | `lib/location-master.ts` |
| 库位 / 库区种子 | `mock/location-masters.ts`、`mock/zone-masters.ts` |
| 持久化 | `mock/db.ts` → `createLocationMaster` / `updateLocationMaster` / `setLocationMasterStatus` |
| 路由 | `#/wms/master/locations`、`…/new`、`…/:code?wh=`、`…/:code/edit?wh=` |

本地启动：`cd 09-产品原型/qs-wms-demo && npm run dev`，菜单 **基础资料 → 库位管理**。
