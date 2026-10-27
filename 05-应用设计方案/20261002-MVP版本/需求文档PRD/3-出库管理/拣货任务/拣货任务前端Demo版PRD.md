# 拣货任务前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《拣货任务主PRD》](拣货任务主PRD.md)的管理端查询与 Web 端拣货录入；说明路由、组件、派生、Mock 与走查。不重复业务规则与验收表。
> 布局真源：[《拣货任务页面骨架》](拣货任务页面骨架.md)。字段真源：[《拣货任务（详细稿）》](../../../字段清单合集/03-出库管理/拣货任务/拣货任务（详细稿）.tsv)。PDA 按库位拣货见[《PDA拣货前端Demo版PRD》](../../7-PDA作业端/拣货作业/PDA拣货前端Demo版PRD.md)，两端读写同一份 `outboundPickTasks`、调用同一组动作。共用约定见[出库单公共分册](../出库单/前端Demo版PRD/出库单前端Demo版PRD_公共与技术约定.md)。
> 版本：WMS-V0.3｜日期：2026-10-18。V0.3：新增 Web 端拣货录入页（第五节），列表、详情、波次详情加入口。

**样式与组件**：**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)「布局硬规则」一节**。列表参照 `putaway-list-page.tsx`，详情参照 `putaway-detail-page.tsx`，录入页参照上架单「Web 端上架」`putaway-entry-page.tsx`（管理端补录页）。

## 一、页面与路由

| 路由 | 组件 | `page-tabs` |
| --- | --- | --- |
| `/wms/outbound/pick-tasks` | `pick-task-list-page.tsx` | 菜单 `menu.pickTasks` |
| `/wms/outbound/pick-tasks/:taskNo` | `pick-task-detail-page.tsx` | `outbound.ui.taskTitle` |
| `/wms/outbound/pick-tasks/:taskNo/entry` | `pick-entry-page.tsx` | `outbound.entry.pickTitle` |

顶栏仓库过滤；不属当前仓或不存在显示「未找到拣货任务」+「返回列表」。录入页打开已完成或已关闭的任务直接 `replace` 回详情。

## 二、类型补齐与派生

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `OutboundPickTask.submittedBy` | `string?` | `FINISH_PICK` 写入操作人 |
| `OutboundPickTask.remark` | `string?` | 任务备注 |
| `PickLine.replacedQty` | `number` | `SHORTAGE` 时记录本次换位补上的数量，默认 0 |

| 名称 | 公式 | 用于 |
| --- | --- | --- |
| 行短拣 | `shortageQty − replacedQty` | 应拣明细、列表短拣 |
| 应拣、实拣、上报缺货、短拣总数 | 各行之和 | 列表、汇总卡 |

- 任务原始应拣取生成时的计划行之和，换位行不增加原始应拣；`replacedQty` 作为替代分配单独展示。进度分母使用有效应拣（原始应拣减已取消成员未拣份额），实拣含替代行已拣；短拣仍按 `shortageQty − replacedQty`。
| 行剩余 | `plannedQty − pickedQty − shortageQty`（`pickLineRemaining`） | 录入页、PDA |
| 拣货路径 | 剩余大于 0 的行按库位编号自然顺序排（`pickLinesInRouteOrder` / `pickStops`，`lib/outbound-pick-route.ts`） | 录入页应拣行下拉与待拣明细顺序、PDA 逐站 |
| 已处理 | 实拣 + 上报缺货 | 录入进度卡 |
| 所属单据 | `source='WAVE'` → `waveNo`；否则 `orderNo` | 列表、基本信息 |
| 是否未完成 | `openTask(task)`（待拣货或拣货中） | 列表行操作、页头入口 |

## 三、列表页

页头：导出（Mock）。

### FilterBar（`columns={6}`，4 常显，无 advanced）

| 字段 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- |
| 拣货任务号 | `Input` | 包含；空格分词 | `outbound.ui.taskNoPlaceholder` |
| 出库单号 | `Input` | 命中 `orderNo`、任一份额或归属的出库单号 | `outbound.ui.noPlaceholder` |
| 任务来源 | `OptionSelect` 含全部 | 精确 | `common.selectPlaceholder` |
| 货主 | `OptionSelect` 含全部 | 精确 | `common.selectPlaceholder` |

### StatusTabs

`ALL`、`PENDING_PICK`、`PICKING`、`COMPLETED`、`CLOSED`，`outboundPickStatusMeta`；URL `?status=`。

### DataTable（`createDataColumns<OutboundPickTask>()`，创建时间倒序）

| 列 | 展示 | meta |
| --- | --- | --- |
| 拣货任务号 | `<DocNo>` → 详情 | `pin:'left'` |
| 状态 | `<StatusBadge>` | — |
| 任务来源 | `<TagLabel meta={pickSourceMeta}>` | — |
| 所属单据 | `<DocNo>` → 出库单或波次详情 | — |
| 货主 | `<CodeName>` | — |
| 应拣、实拣、短拣 | `<Num>` | 右对齐，可排序 |
| 创建时间、提交时间 | `<DateTime>` | 可排序 |
| 操作 | `RowActions`：Web 端拣货（→ 录入页）、PDA拣货（→ `/pda/pick?step=work&no=`），均仅未完成时 | `pin:'right'` |

## 四、详情页

页头：`<DetailTitle title="拣货任务" code status>`；按钮：返回列表、Web 端拣货、PDA拣货（均 outline；后两个仅未完成时）。波次详情页头同样给出这两个入口（指向波次任务）。

| 区块 | 内容 |
| --- | --- |
| 基本信息 `Descriptions columns={3}` | 任务来源、所属出库单／所属波次（`DocNo`）、货主、仓库（`CodeName`）、出库暂存库位、创建时间、提交人、提交时间、任务备注（`col-span-3`） |
| `SummaryCard`「拣货进度」 | `SummaryProgress` 实拣/应拣；`SummaryMetrics`：应拣、实拣、上报缺货（为 0 隐藏）、短拣（orange，为 0 隐藏） |

页签（`DetailTabs param="tab"`）：

| 页签 | 列 |
| --- | --- |
| 应拣明细 | 行号、库位、商品、批次号、品质（`TagLabel`）、应拣、实拣、上报缺货、缺货原因、换位补上、短拣 |
| 实拣归属 | 应拣行号、出库单号（`DocNo`）、出库单行号、归属实拣、有效数量、序列号、操作人、时间 |
| 原单份额 | 仅波次任务：应拣行号、库位、商品、出库单号（`DocNo`）、出库单行号、份额数量 |
| 操作日志 | `outboundLogColumns`；`refType='PICK_TASK'` 且 `refNo` 为本任务 |

行号取应拣行在任务内的序号（1 起），实拣归属的应拣行号按 `lineId` 换算。

## 五、Web 端拣货（录入页）

页头：`<DetailTitle title="拣货录入" code status>`；按钮：返回详情（outline）。`DetailOverview` 左侧「基本信息」+「录入拣货结果」，右侧「录入进度」卡；下方 `DetailTabs`。

### 5.1 基本信息

`Descriptions columns={3}`：任务来源、所属单据（`DocNo`）、货主、仓库、出库暂存库位、创建时间。

### 5.2 录入表单（`<form>` + `FormGrid` 4 列，回车即保存）

| 字段 | 控件 | 默认 | 校验（不过则红字写在表单底部左侧） |
| --- | --- | --- | --- |
| 应拣行 * | `OptionSelect`（跨 2 列），选项为剩余大于 0 的行，按拣货路径排序，文案 `#行号 · 库位 · 商品 · 批次 · 剩余 n` | 路径上第一条 | 未选：`outbound.entry.pickLineFirst` |
| 实拣数量 * | `Input type=number` | 本行剩余；hint「剩余 n」 | 整数且 ≥0：`qtyInvalid`；实拣与缺货都为 0：`qtyRequired`；两者之和大于剩余：`overRemain` |
| 缺货数量 | `Input type=number` | 空；hint「库位上实物不够时填，系统换位一次」 | 同上 |
| 缺货原因 * | `OptionSelect`：无货、残损；仅缺货数量 > 0 时出现 | 未选 | `reasonRequired` |
| 序列号 * | `Textarea`（整行），仅 SN 商品；空白或逗号分隔 | 空 | 条数须等于实拣数量：`serialCount` |

保存按钮（outline）文案写明本次件数：`保存（实拣 n · 缺货 m）`。保存顺序：实拣 > 0 时先调 `PICK`（新的 `confirmationId`），成功 toast `outbound.entry.savedPick`；缺货 > 0 时再调 `SHORTAGE`，按动作前后应拣行比较换位结果（`replacementStops`），toast「已换位到 …」或「没有可换位的库存，提交后按短拣」。`PICK` 已成功而 `SHORTAGE` 失败时清空实拣数，保留缺货让文员改。保存成功后本行还有剩余就留在本行（实拣带出新剩余），否则切到路径上下一条；数量框自动选中，可连续回车录入。

表单底部左侧无错误时显示提示：保存即下架到出库暂存，不能撤销，多录的走出库单退拣。

### 5.3 录入进度卡

`SummaryProgress` 已处理/应拣；`SummaryMetrics`：应拣、实拣（blue）、上报缺货（orange，为 0 隐藏）、剩余（有剩余时 orange）。卡片底部主按钮「提交拣货任务」：已处理 = 应拣时可点，否则 disabled 并在下方写「还有 n 件没拣也没报缺货」。点击后确认弹窗（与 PDA 同一文案），调 `FINISH_PICK`；成功后任务已完成，页面自动回到详情。

### 5.4 页签

| 页签 | 列 |
| --- | --- |
| 待拣明细 | 行号、库位、商品（`CodeName`）、批次号、应拣、实拣、上报缺货、剩余、操作「录入」（剩余为 0 隐藏）；未完成行按路径在前，已完成行排后 |
| 实拣记录 | 应拣行号、库位、商品、出库单号（`DocNo`）、归属实拣、序列号、操作人、时间；最新在前，空表 `outbound.entry.noRecords` |

剩余随录入变化：行数据先算好剩余再交给 `DataTable`（表格按行对象缓存单元格）。

## 六、i18n

| key | zh-CN |
| --- | --- |
| `menu.pickTasks` | 拣货任务 |
| `outbound.ui.taskTitle` / `taskNotFound` | 拣货任务 / 未找到拣货任务 |
| `outbound.ui.taskNoPlaceholder` | 请输入拣货任务号 |
| `outbound.ui.planLines` / `assignments` / `shares` | 应拣明细 / 实拣归属 / 原单份额 |
| `outbound.ui.reported` / `reason` / `replaced` / `short` / `active` / `staging` / `belongsTo` | 上报缺货 / 缺货原因 / 换位补上 / 短拣 / 有效 / 出库暂存库位 / 所属单据 |
| `outbound.ui.goPick` | PDA拣货 |
| `outbound.entry.pickAction` / `pickTitle` / `backToDetail` | Web 端拣货 / 拣货录入 / 返回详情 |
| `outbound.entry.pickFormTitle` / `planLine` / `pickedQty` / `shortQty` / `shortReason` | 录入拣货结果 / 应拣行 / 实拣数量 / 缺货数量 / 缺货原因 |
| `outbound.entry.save` / `savedPick` / `processed` / `submitBlocked` | 保存（实拣 n · 缺货 m） / …实拣 n 件，已下架到出库暂存 / 已处理 / 还有 n 件没拣也没报缺货 |
| `outbound.entry.linesTab` / `recordsTab` / `record` | 待拣明细 / 实拣记录 / 录入 |

## 七、Mock 与走查

种子见[出库单弹窗与 Mock 分册 §7.2](../出库单/前端Demo版PRD/出库单前端Demo版PRD_弹窗与Mock.md)：0007 的按单任务已完成；0008、0020 的任务已关闭；0009、0010 的波次任务、0013、0018、0019 的任务未完成；0019 的任务跨 A-01-01、A-01-02 两个库位。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开列表 | 状态各异；未完成行有「Web 端拣货」「PDA拣货」 |
| 2 | 打开波次任务 | 原单份额页签两行；页头有两个入口 |
| 3 | PDA 拣 1 件后返回详情 | 状态拣货中；实拣归属 1 行，归属序号 1 的出库单 |
| 4 | Web 端拣货：0013 的任务录实拣 2、缺货 1，不选原因保存 | 红字提示选缺货原因，未保存 |
| 5 | 选「无货」保存 | 两条 toast：实拣 2 件下架；缺货 1 件换位到某库位或按短拣；该行处理完后表单切到下一条 |
| 6 | 全部处理完点「提交拣货任务」 | 确认后任务已完成，页面回到详情；提交人为当前用户 |
| 7 | 打开 0008 的任务 | 已关闭；无入口按钮；实拣归属有效数量为 0 |
