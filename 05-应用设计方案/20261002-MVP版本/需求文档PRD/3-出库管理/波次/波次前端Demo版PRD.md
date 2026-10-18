# 波次前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《波次主PRD》](波次主PRD.md)的管理端查询；说明路由、组件、派生、Mock 与走查。不重复业务规则与验收表。
> 布局真源：[《波次页面骨架》](波次页面骨架.md)。字段真源：[《波次（详细稿）》](../../../字段清单合集/03-出库管理/波次/波次（详细稿）.tsv)。组波入口与动作见[出库单列表页分册](../出库单/前端Demo版PRD/出库单前端Demo版PRD_列表页.md) §6；共用约定见[出库单公共分册](../出库单/前端Demo版PRD/出库单前端Demo版PRD_公共与技术约定.md)。
> 版本：WMS-V0.2｜日期：2026-10-15。

**样式与组件**：**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)「布局硬规则」一节**。列表参照 `putaway-list-page.tsx`，详情参照 `putaway-detail-page.tsx`。

## 一、页面与路由

| 路由 | 组件 | `page-tabs` |
| --- | --- | --- |
| `/wms/outbound/waves` | `wave-list-page.tsx` | 菜单 `menu.outboundWaves` |
| `/wms/outbound/waves/:waveNo` | `wave-detail-page.tsx` | `outbound.ui.waveTitle` |

顶栏仓库过滤；不属当前仓或不存在显示「未找到波次」+「返回列表」。

## 二、派生（`lib/outbound-derive.ts`）

| 名称 | 公式 | 用于 |
| --- | --- | --- |
| `waveStatus(wave, tasks)` | `CANCELLED`＝头已取消；`COMPLETED`＝全部波次拣货任务已完成/已关闭；`ALLOCATED`＝头为已分配；否则 `RELEASED`（已下发任务） | 列表、详情 |
| 应拣、实拣 | 波次任务各行 `plannedQty`、`pickedQty` 之和 | 列表、汇总卡 |
| 波次行状态 | 出库单 `CANCELLED` → 已取消，否则在波次内 | 出库单页签、汇总卡「已取消单」 |

组波 Mock 写入 `status: 'RELEASED'`。成员全部取消时写入 `CANCELLED`。

`OutboundWave` 含 `status: WaveStatus`；`remark?: string`。

## 三、列表页

页头：导出（Mock）。

### FilterBar（`columns={6}`，3 常显，无 advanced）

| 字段 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- |
| 波次号 | `Input` | 包含；空格分词 | `outbound.ui.waveNoPlaceholder` |
| 出库单号 | `Input` | 任一包含该单的波次 | `outbound.ui.noPlaceholder` |
| 货主 | `OptionSelect` 含全部 | 精确 | `common.selectPlaceholder` |

### StatusTabs

`ALL`、`ALLOCATED`、`RELEASED`、`COMPLETED`、`CANCELLED`，`outboundWaveStatusMeta`；URL `?status=`。

### DataTable（`createDataColumns<OutboundWave>()`，`selectable={false}`，创建时间倒序）

| 列 | 展示 | meta |
| --- | --- | --- |
| 波次号 | `<DocNo>` → 详情 | `pin:'left'` |
| 状态 | `<StatusBadge>` | — |
| 货主 | `<CodeName>` | — |
| 波次拣货任务 | `<DocNo>` → 拣货任务详情 | — |
| 出库单数、应拣、实拣 | `<Num>` | 右对齐，可排序 |
| 创建时间 | `<DateTime>` | 可排序 |

## 四、详情页

页头：`<DetailTitle title="波次" code={waveNo} status>`；按钮：返回列表（outline）、去拣货（primary，**已下发任务**且存在未关闭任务，跳 `/pda/pick?no=任务号`）。

| 区块 | 内容 |
| --- | --- |
| 基本信息 `Descriptions columns={3}` | 货主、仓库（`CodeName`）、波次拣货任务（`DocNo`）、出库单数、创建时间、波次备注（`col-span-3`） |
| `SummaryCard`「拣货进度」 | `SummaryProgress` 实拣/应拣；`SummaryMetrics`：出库单数、应拣、实拣、已取消单（为 0 隐藏） |

页签（`DetailTabs param="tab"`）：**出库单**（序号、出库单号、波次状态、出库单状态、需求/数量/已拣/已复核、组波时间）、**商品明细**（应拣行、库位、商品、批次、出库单号、行号、数量）、操作日志。

## 五、i18n

| key | zh-CN |
| --- | --- |
| `menu.outboundWaves` | 波次管理 |
| `status.wave.*` | 已分配 / 已下发任务 / 已完成 / 已取消 |
| `outbound.ui.waveTitle` / `waveNotFound` | 波次 / 未找到波次 |

## 六、Mock 与走查

种子：每仓 0009、0010 已组波，波次 **已下发任务**，任务待拣货。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开波次列表 | 1 条已下发任务；任务号可点 |
| 2 | 进详情 | 出库单 2 行、商品明细多行；出库单页签在波次内 |
| 3 | 出库单列表勾 0001、0002 生成波次 | 跳新波次详情；列表增加一条已下发任务 |
| 4 | 对 0009 发 Mock 取消 | 0009 行波次状态已取消；波次仍已下发任务 |
| 5 | 波次任务提交 | 波次已完成 |
| 6 | 切德国仓 | 只显示该仓波次 |
