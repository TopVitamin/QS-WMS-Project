# 物流渠道资料前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《物流渠道资料主PRD》](物流渠道资料主PRD.md)；说明路由、`ChannelFormDialog`、校验与 Mock。**不重复**业务规则与验收表。
> 布局真源：[《物流渠道资料页面骨架》](物流渠道资料页面骨架.md)。字段真源：[《物流渠道（详细稿）》](../../../字段清单合集/01-基础资料/物流渠道/物流渠道（详细稿）.tsv)。
> 版本：WMS-V1.1｜日期：2026-10-11

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。列表模式参考 `inbound-list-page.tsx`（去掉 `StatusTabs`、`selectable`）；筛选项状态用 `useMasterListFilters`（见 03 文档 §3.1）。承运商主档弹窗命名与行为对齐 [《物流承运商资料前端Demo版PRD》](../物流承运商资料/物流承运商资料前端Demo版PRD.md) 的 **`CarrierFormDialog`**；本对象为 **`ChannelFormDialog`**。

**验收**：主 PRD §6.1（AC01～AC07）。

## 一、页面与路由

| 路由 | 建议文件 | 容器 |
| --- | --- | --- |
| `/wms/master/channels` | `channel-list-page.tsx` | `PageContainer fill` + 双 `Panel` |

菜单与路由一致：**基础资料 → 物流渠道**（`config/menu.ts`：`path: '/wms/master/channels'`，`titleKey: 'menu.channels'`）。列表 `PageContainer` 的 `title={t('menu.channels')}`，**勿**另起 `listTitle`。

渠道新增/编辑/查看均为 **`ChannelFormDialog`**（建议 `components/biz/channel-form-dialog.tsx` 或 `pages/wms/master/channel-form-dialog.tsx`），由列表页与承运商详情页挂载。**无** `/channels/:code` 详情路由、**无** `page-tabs.ts` 子路由注册。

数据范围：全部渠道，四仓共用，不按当前仓库过滤。

默认排序：最后修改时间降序；`pageSize=20`。

## 二、列表页

### 2.1 结构

```text
PageContainer(title=menu.channels, actions=导出 Mock, 新增)
  Panel → FilterBar
  Panel(flex-1) → DataTable(selectable=false)
```

页头主按钮在左、导出在右（对齐 03 文档 §1）：`actions` 顺序为 **[+ 新增]**（primary，`Plus`）、**导出**（outline，Mock）。

### 2.2 FilterBar（`columns={6}` + 展开）

与 [《业务组件与主数据页面》](../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md) 一致：**主数据列表一律 `columns={6}`**（常显最多 5 项 + 第 6 列查询/重置/展开），**不得**沿用详情区 `Descriptions columns={4}` 或单独写 4 列宽。

`const { filters, draft, setDraft, applySearch, reset } = useMasterListFilters(empty)`；查询写入 `filters` 并回第一页；重置清空两者。

| 区域 | 字段 | 控件 | 匹配 |
| --- | --- | --- | --- |
| 常显（5+1 第 1～5 列） | 渠道编码、渠道名称、所属物流承运商、使用状态、渠道类型 | 见上 | 见上 |
| advanced（展开） | 物流对接方式 | `Select` 全部/线下交接/系统 API 对接（预留） | 精确 |

多条件 AND。

### 2.3 DataTable

| 列 | 单元格 | meta |
| --- | --- | --- |
| 渠道编码 | `<DocNo>` 或链接样式，`onClick` → `ChannelFormDialog` **`mode=view`** | `pin: 'left'` |
| 渠道名称 | 文本 | — |
| 所属物流承运商 | `BizCode` 或编码 + 名称 | 点击 `navigate` → `/wms/master/carriers/:code` |
| 渠道类型 | 文本 | — |
| 使用状态 | `<StatusBadge>` | — |
| 物流对接方式 | 文本 | — |
| 操作 | 「编辑」→ `mode=edit`；停用/启用 | `pin: 'right'` |

列设置：可按 TSV「列表展示=是」扩展最后修改时间等。编码列**不**跳转详情路由。

### 2.4 页头「新增」与 i18n

| key | 中文示例 | 用途 |
| --- | --- | --- |
| `masterChannel.create` | 新增 | 列表页头主按钮文案（与仓库 `masterWarehouse.create` 同级约定） |
| `masterChannel.createTitle` | 新增物流渠道 | `ChannelFormDialog` **create** 模式标题 |
| `masterChannel.editTitle` | 编辑物流渠道 | edit 模式标题 |
| `masterChannel.viewTitle` | 物流渠道详情 | view 模式标题 |

| 条件 | 行为 |
| --- | --- |
| 存在 ≥1 启用承运商 | 打开 `ChannelFormDialog` `mode=create`，标题 `t('masterChannel.createTitle')` → **新增物流渠道** |
| 无启用承运商 | `Button` disabled + `toast`「请先建立并启用物流承运商」 |

启停：列表操作列封装 `useChannelMasterStatusToggle`（内核 `useMasterUsageStatusToggle`），与 03 文档 §3.1 一致。

## 三、ChannelFormDialog

统一组件：**`ChannelFormDialog`**（与承运商侧 **`CarrierFormDialog`** 对称命名）。

Props：`mode: 'create' | 'edit' | 'view'`；可选 `defaultCarrierCode`、`channelCode`；`onSaved` 供承运商详情子表刷新。

### 3.1 标题与脚

| mode | 标题（i18n） | Footer |
| --- | --- | --- |
| create | `masterChannel.createTitle`（新增物流渠道） | 取消、保存（primary） |
| edit | `masterChannel.editTitle` | 取消、保存 |
| view | `masterChannel.viewTitle` | 关闭 |

### 3.2 字段

| 字段 | 控件 | 规则 |
| --- | --- | --- |
| 所属物流承运商 | `Select` + `FormFieldLabel required` | create 仅列出**启用**承运商；有出库/交接引用时只读 |
| 渠道编码 | `Input` | create 可录；edit/view `readOnly` |
| 渠道名称 | `Input` | 必填 |
| 渠道类型 | `Select` | 快递｜卡派｜自提｜其他 |
| 使用状态 | **不出现在 create/edit**；保存时新建 `ENABLED`、编辑沿用原值；**view** 只读 `StatusBadge`；启停仅列表/详情操作列 |
| 渠道备注 | `Textarea` | 选填 |
| 物流对接方式 | `Select` | 必填；Demo 默认「线下交接」 |
| 外部服务产品代码 | `Input` | 选填；对接方式为 API 预留时展示 helper 文案 |

**view** 模式：上述字段只读；维护信息用 `Descriptions` 或 `MasterAuditPanel`（创建人/时间、最后修改人/时间）。

### 3.3 校验与反馈

校验建议 `lib/channel-master.ts` → `validateChannelMasterForm`；字段错误用 `useMasterFormFieldError('masterChannel')`。

| 失败 | 文案 |
| --- | --- |
| 名称为空 | 渠道名称不能为空 |
| 未选承运商 | 请选择所属物流承运商 |
| 编码重复 | 渠道编码已存在 |
| 停用被引用 | 存在未完结的出库或交接引用，无法停用 |
| 保存成功 | `物流渠道已保存` |

关闭未保存：`useConfirm`「离开后未保存的内容将丢失，确认离开？」（与承运商 `CarrierFormDialog` 一致）。

## 四、与承运商详情联动

| 入口 | 行为 |
| --- | --- |
| 承运商详情「新增渠道」 | `ChannelFormDialog` `mode=create`，`defaultCarrierCode=当前编码` |
| 子表编码链 | `mode=view` |
| 子表编辑/停用 | `mode=edit` / 停用确认 |

保存后：从详情打开则 `onSaved` 刷新子表 `DataTable`；从渠道列表打开则刷新列表。Mock 写入 `mock/db.ts`（`createChannelMaster` / `updateChannelMaster`），与列表同源。

## 五、Mock 与代码路径（建议）

| 项 | 位置 |
| --- | --- |
| 类型 | `types/wms.ts` → `ChannelMaster` |
| 种子 | `mock/channel-masters.ts` |
| 校验 | `lib/channel-master.ts` |
| 列表页 | `pages/wms/master/channel-list-page.tsx` |
| 弹窗 | `channel-form-dialog.tsx`（与列表同目录或 `components/biz/`） |
| 路由 | `router.tsx` 仅注册 `/wms/master/channels` |
| i18n | `zh-CN.ts` / `en-US.ts` → `masterChannel.*` |

演示编码示例：`CH-DHL-EXP`、`CH-UPS-GND`；修改 `seed.ts` 时 `persist version +1`。

## 六、页面状态与验收勾选

| 场景 | 表现 |
| --- | --- |
| 加载中 | 列表 Skeleton 或「加载中…」 |
| 无数据 | 空态 + 引导点击「新增」 |
| 无查询结果 | 「没有符合条件的记录，请调整筛选条件」 |
| 失败 | `toast.error` + 重试 |

- [ ] 菜单 path `/wms/master/channels`；列表标题 `menu.channels`；页头按钮文案「新增」
- [ ] create 弹窗标题「新增物流渠道」；组件名 `ChannelFormDialog`
- [ ] 双 Panel + `FilterBar`（4 列 + 展开）；无 StatusTabs、无勾选、无导入
- [ ] 编码点击为查看 Dialog；无独立详情路由
- [ ] 所属承运商链进入承运商详情；承运商子表复用同一 Dialog
- [ ] 批量启停/删除不出现
