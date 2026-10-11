# 库区资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《库区资料主PRD》](库区资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《库区资料页面骨架》](库区资料页面骨架.md)。字段真源：[《库区（详细稿）》](../../../字段清单合集/01-基础资料/库区/库区（详细稿）.tsv)。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表模式参考 `warehouse-list-page.tsx` / `location-list-page.tsx`（`FilterBar columns={6}`、无 `StatusTabs`、无 `selectable`）。

**验收**：主 PRD §6.1（AC01～AC08）。

## 一、页面与路由

| 路由 | 建议文件 | 容器 |
| --- | --- | --- |
| `/wms/master/zones` | `zone-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| `/wms/master/zones/new` | `zone-create-page.tsx` | `Panel` 表单（字段少，单 Panel 即可） |
| `/wms/master/zones/:code` | `zone-detail-page.tsx` | `Descriptions` 分组 |
| `/wms/master/zones/:code/edit` | `zone-edit-page.tsx` | 同新增；编码只读 |

`:code` 为**仓库内库区编码**；详情/编辑 URL 带 `?wh={warehouseCode}`，避免跨仓编码碰撞（与货位管理一致）。

菜单规划：**基础资料 → 库区管理**（`config/menu.ts` 增加 `menu.zones`，`milestone` 与仓库/货位同级）。列表 `title={t('menu.zones')}`。

顶栏「当前仓库」可预填列表筛选项「所属仓库」，列表数据仍为**授权内全部库区**。

## 二、列表页

### FilterBar（`columns={6}`，4 个筛选项 + 操作列）

`draft` / `filters` 双状态；第 6 列：**查询**、**重置**。一期**不筛库区类型**（在列表「库区类型」列辨认即可）。

| 字段 | 控件 | 匹配 |
| --- | --- | --- |
| 所属仓库 | `Select` 全部 + 授权仓 | 精确 |
| 库区编码 | `Input` | 包含 |
| 库区名称 | `Input` | 包含 |
| 使用状态 | `Select` 全部/启用/停用 | 精确 |

### DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 所属仓库 | 编码 · 名称 | — |
| 库区编码 | 链详情（带 `wh`） | `pin: 'left'` |
| 库区名称 | 文本 | — |
| 库区类型 | 文本 | — |
| 使用状态 | `StatusBadge` | — |
| 最后修改时间 | `<DateTime>` | 可排序 |
| 最后修改人 | 文本 | — |
| 操作 | 编辑；停用/启用 | `pin: 'right'` |

列设置可选：库区备注等详细稿未列列表字段。默认排序：最后修改时间降序。`pageSize=20`。

### 页头

| 控件 | 行为 |
| --- | --- |
| + 新增 | → `/new`；无授权启用仓时 `disabled` + `toast`；页签与页头为「新增库区」（`tabCreate` / `createTitle`，勿与列表按钮 key 混用） |
| 导出 | `toast.info` 演示未接真实导出 |

停用：R07 失败 → `toast.error`（附货位编码摘要，可链货位详情）；通过 → `useConfirm` → 写库。

## 三、新增/编辑页

| 字段 | 要点 |
| --- | --- |
| 所属仓库 | 仅授权且启用；编辑有占用只读 |
| 库区编码 | 新增可录；编辑只读 |
| 库区名称、类型、状态、备注 | 可编辑；新增默认启用 |
| 校验 | R03 同仓唯一；必填见主 PRD F01 |

保存成功「保存成功」；取消「放弃修改？」Dialog。

## 四、详情页

- `title`「查看库区详情」+ 编码 `BizCode` + `StatusBadge`（对齐仓库/货位）。
- 基础信息 `Descriptions columns={4}`；维护信息仅**最后修改人、最后修改时间**。
- actions：返回列表、编辑、停用/启用。

## 五、文案与 Mock

| 仓库编码 | 库区编码 | 名称 | 类型 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| US-WH-LA | Z-STORE | 存储区 A | 存储 | 启用 | — |
| US-WH-LA | Z-PICK | 拣货区 B | 拣货 | 启用 | 下属 `P-B-01` 占用，测 R07 |
| US-WH-LA | Z-STAGE | 收货暂存 | 暂存 | 启用 | — |
| US-WH-LA | Z-OFF | 已停用样例 | 存储 | 停用 | R08 |

种子与现有 `zone-masters.ts`（货位 Demo）对齐；实现库区页时扩展 `mock/db.ts` 的 `zoneMasters` CRUD，与 `location-masters` 联动 R07。

## 六、代码索引

以现有 `zone-*-page.tsx`、`lib/zone-master.ts`、`hooks/use-zone-master-status.ts` 为准；路由见 `app/router.tsx`，菜单 `menu.zones`（库区管理）。
