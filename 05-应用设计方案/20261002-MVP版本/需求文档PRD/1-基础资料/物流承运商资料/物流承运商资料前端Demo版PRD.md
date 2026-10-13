# 物流承运商资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《物流承运商资料主PRD》](物流承运商资料主PRD.md)；说明路由、组件、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《物流承运商资料页面骨架》](物流承运商资料页面骨架.md)。字段真源：[《物流承运商（详细稿）》](../../../字段清单合集/01-基础资料/物流承运商/物流承运商（详细稿）.tsv)。渠道弹窗真源：[《物流渠道资料前端Demo版PRD》](../物流渠道资料/物流渠道资料前端Demo版PRD.md)（`ChannelFormDialog`）。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表模式参考 `warehouse-list-page.tsx` / `location-list-page.tsx`（去掉 `StatusTabs`、`selectable`、批量 `toolbar`）。

**验收**：行为与结构见主 PRD §6.1（AC01～AC08）。

## 一、页面与路由

| 路由 | 组件（建议） | 容器 |
| --- | --- | --- |
| `/wms/master/carriers` | `carrier-list-page.tsx` | `PageContainer fill` + 双 `Panel`（见页面骨架「列表页」） |
| `/wms/master/carriers/:code` | `carrier-detail-page.tsx` | `PageContainer` + 分组 `Panel` + 渠道 `DataTable` |

承运商新增/编辑**不占子路由**，列表与详情共用 **`CarrierFormDialog`**（`Dialog`）。渠道维护统一 **`ChannelFormDialog`**（与物流渠道列表、本模块详情子表共用同一组件实现）。

**菜单**：须在 `config/menu.ts` 的「基础资料」下增加**叶子菜单**指向 `/wms/master/carriers`（文案如「物流承运商」，与模块地图一致）；并在 `router.tsx`、`config/page-tabs.ts` 注册列表与 `:code` 详情（详情 pathname 单独解析页签，勿复用列表 path）。

数据范围：全部承运商，四仓共用；顶栏「当前仓库」不限制本列表。

本地：`cd 09-产品原型/qs-wms-demo && npm run dev`。

## 二、列表页

### FilterBar（`columns={6}`：仅 3 个常显筛选项 + 第 6 列操作）

与[《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)主数据约定一致：筛选项不足 5 个时仍用 **6 列栅格**，第 1～3 列放筛选项，第 6 列底对齐 **查询**（`submit`）、**重置**；无 `advanced` 区时不展示「展开/收起」。（若实现侧确认 4 列宽更贴当前 `FilterBar` API，可退化为 3 筛选项 + 操作列共 4 列，但须与骨架线框一致。）

`useListFilters`：`draft` / `filters` 双状态；查询回第一页；重置清空筛选。

| 列位 | 字段 | 控件 | 匹配 |
| --- | --- | --- | --- |
| 1 | 物流承运商编码 | `Input` | 包含 |
| 2 | 物流承运商名称 | `Input` | 包含 |
| 3 | 使用状态 | `Select` 全部/启用/停用 | 精确 |

### DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 物流承运商编码 | `<DocNo>` → 详情路由 | `pin: 'left'` |
| 物流承运商名称 | 文本 | — |
| 物流承运商简称 | 文本，空则回退名称 | — |
| 使用状态 | `<StatusBadge>` | — |
| 最后修改时间 | `<DateTime>` | 可排序；默认降序 |
| 最后修改人 | 文本 | 列设置默认可选隐藏 |
| 操作 | 「编辑」→ 承运商 Dialog；「停用」/「启用」 | `pin: 'right'` |

`pageSize=20`。编码展示用 `BizCode` / `DocNo`，勿混用 `font-mono`（见 03 文档）。

### 页头

| 控件 | i18n / 文案 | 行为 |
| --- | --- | --- |
| 主按钮 | `masterCarrier.create` → **新增** | 打开 `CarrierFormDialog` `mode=create`；`Plus` 图标；primary，在导出左侧 |
| 导出 | outline | `toast.info` Mock |

无导入。列表与详情启停封装 `useCarrierMasterStatusToggle`（内核 `useMasterUsageStatusToggle`）。

## 三、详情页

分区与按钮位置见页面骨架「详情页」。要点：

- `title`：`物流承运商 · {编码}`；标题旁 `StatusBadge`。
- `actions`：`返回列表`、`编辑`（承运商 Dialog）、`停用`/`启用`、`+ 新增渠道`（承运商为启用且有权）。
- 主档：分组 `Panel` + `Descriptions columns={4}`（字段顺序同骨架）。
- **维护信息**：`MasterAuditPanel` 或等价 `Panel`，只读展示 **最后修改人**（`updatedBy`）、**最后修改时间**（`updatedAt`）。
- **渠道子表**：`Panel` 标题「物流渠道」；`DataTable` `selectable=false`；列与渠道列表对齐（无「所属物流承运商」）；渠道编码链打开 `ChannelFormDialog` `mode=view`；行操作 view/edit/启停见物流渠道 Demo PRD。

子表过滤：`carrierCode === 当前详情编码`；渠道保存后刷新子表。物流渠道列表「所属物流承运商」可 `navigate` 至本详情路由。

## 四、承运商 Dialog（`CarrierFormDialog`）

| mode | Dialog 标题 |
| --- | --- |
| create | **新增物流承运商** |
| edit | 编辑物流承运商 |

字段分区与线框见页面骨架「承运商 Dialog」。规则摘要：编码 create 可录、edit `readOnly`；名称必填；**弹窗不含使用状态**（新建保存 `status: ENABLED`，编辑沿用原状态）；启停仅列表/详情 `useCarrierMasterStatusToggle`；邮箱基础格式校验。保存写 `mock/db`；成功 `toast.success('物流承运商已保存')`；关闭未保存走 `useConfirm`（文案见骨架「放弃修改」）。

停用确认与失败文案见主 PRD R06；Demo 文案与渠道侧保持一致。

## 五、渠道 Dialog（共用）

详情「新增渠道」：`ChannelFormDialog` `mode=create`，`defaultCarrierCode=当前编码`。

子表与渠道列表行操作：**不复制**字段表，一律以[《物流渠道资料前端Demo版PRD》](../物流渠道资料/物流渠道资料前端Demo版PRD.md)第三节为准。

## 六、Mock 与建议代码路径

| 项 | 位置 |
| --- | --- |
| 类型 | `types/wms.ts` → `CarrierMaster`（命名可与实现对齐） |
| 种子 | `mock/carrier-masters.ts`；示例 `CAR-DHL`、`CAR-UPS`；子表挂 `CH-DHL-EXP` 等 |
| 校验 | `lib/carrier-master.ts` |
| 写入 | `mock/db.ts` → `createCarrierMaster` / `updateCarrierMaster` |

修改种子时 `version +1`。

### Demo 自检

- [ ] 菜单「基础资料 → 物流承运商」可进 `/wms/master/carriers`
- [ ] 列表双 Panel + FilterBar(6 列布局)、无 StatusTabs/勾选/导入；页头主按钮文案「新增」
- [ ] 新增 Dialog 标题「新增物流承运商」；编码链详情；维护信息为最后修改人/时间
- [ ] 详情渠道子表 + 共用 `ChannelFormDialog`；承运商停用规则可演示
