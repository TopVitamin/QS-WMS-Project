# 返库上架单前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《返库上架单主PRD》](返库上架单主PRD.md)的管理端查询与 Web 端返库录入；说明路由、组件、派生、Mock 与走查。不重复业务规则与验收表。
> 布局真源：[《返库上架单页面骨架》](返库上架单页面骨架.md)。字段真源：[《返库上架单（详细稿）》](../../../字段清单合集/03-出库管理/返库上架单/返库上架单（详细稿）.tsv)。PDA 按库位返库见[《PDA返库上架前端Demo版PRD》](../../7-PDA作业端/返库上架作业/PDA返库上架前端Demo版PRD.md)，两端读写同一份 `outboundPutbacks`、调用同一组动作。共用约定见[出库单公共分册](../出库单/前端Demo版PRD/出库单前端Demo版PRD_公共与技术约定.md)。
> 版本：WMS-V0.3｜日期：2026-10-18。V0.3：新增 Web 端返库录入页（第五节）；`SAVE_PUTBACK` 可带实际扫到的序列号。

**样式与组件**：**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)「布局硬规则」一节**。列表参照 `putaway-list-page.tsx`，详情参照 `putaway-detail-page.tsx`（与上架单详情同一版式），录入页参照 `putaway-entry-page.tsx`（管理端补录页）。

## 一、页面与路由

| 路由 | 组件 | `page-tabs` |
| --- | --- | --- |
| `/wms/outbound/return-putaway` | `putback-list-page.tsx` | 菜单 `menu.outboundPutbacks` |
| `/wms/outbound/return-putaway/:putbackNo` | `putback-detail-page.tsx` | `outbound.ui.putbackTitle` |
| `/wms/outbound/return-putaway/:putbackNo/entry` | `putback-entry-page.tsx` | `outbound.entry.returnTitle` |

顶栏仓库过滤；不属当前仓或不存在显示「未找到返库上架单」+「返回列表」。**详情页只依赖返库上架单本身的数据，不得读取拣货任务字段**。录入页打开已完成的单直接 `replace` 回详情。

## 二、派生与动作

| 名称 | 公式 | 用于 |
| --- | --- | --- |
| 应返库 | `Σ lines.qty`（`putbackExpected`） | 列表、详情、录入页 |
| 已保存 | `Σ lines.savedQty`（`putbackSaved`） | 只在录入页、PDA 作业页 |
| 已返库 | `status === 'COMPLETED' ? 应返库 : 0` | 列表、详情；不展示「已保存」 |
| 行剩余 | `qty − savedQty`（`putbackLineRemaining`） | 录入页、PDA |
| 本行还没落位的 SN | `serialNos` 去掉各 `placements[].serialNos` | 录入页默认值、PDA 候选 |
| 实际返库明细 | 各行 `placements` 展开为 `{应返库行号, 商品, 目标库位, 数量, SN}`；无 `placements` 而有 `targetLocation` 的旧数据按一条处理 | 实际返库页签、已保存落位页签 |
| 是否未完成 | `status !== 'COMPLETED'` | 列表行操作、页头入口 |

`SAVE_PUTBACK` 增加可选 `serialNos`：SN 行传入时须条数等于数量、不重复、都在本行还没落位的 SN 里，否则 `outbound.error.serial`；不传时按清单顺序取。`RESET_PUTBACK_LINE`、`SUBMIT_PUTBACK` 不变。

## 三、列表页

页头：导出（Mock）。

### FilterBar（`columns={6}`，4 常显，无 advanced）

| 字段 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- |
| 返库上架单号 | `Input` | 包含；空格分词 | `outbound.ui.putbackNoPlaceholder` |
| 原出库单号 | `Input` | 包含 | `outbound.ui.noPlaceholder` |
| 退拣原因 | `OptionSelect` 含全部：取消、少件、残损 | 精确 | `common.selectPlaceholder` |
| 货主 | `OptionSelect` 含全部 | 精确 | `common.selectPlaceholder` |

### StatusTabs

`ALL`、`PENDING`、`PUTAWAYING`、`COMPLETED`，`outboundPutbackStatusMeta`；URL `?status=`。

### DataTable（`createDataColumns<OutboundPutback>()`，创建时间倒序）

| 列 | 展示 | meta |
| --- | --- | --- |
| 返库上架单号 | `<DocNo>` → 详情 | `pin:'left'` |
| 状态 | `<StatusBadge>` | — |
| 退拣原因 | `<TagLabel meta={unpickReasonMeta}>` | — |
| 原出库单 | `<DocNo>` → 出库单详情 | — |
| 货主 | `<CodeName>` | — |
| 应返库、已返库 | `<Num>` | 右对齐，可排序 |
| 创建时间、提交时间 | `<DateTime>` | 可排序 |
| 操作 | `RowActions`：Web 端返库（→ 录入页）、PDA返库上架（→ `/pda/return-putaway?step=work&no=`），均仅未完成时 | `pin:'right'` |

## 四、详情页

页头：`<DetailTitle title="返库上架单" code status>`；按钮：返回列表、Web 端返库、PDA返库上架（均 outline；后两个仅未完成时）。

| 区块 | 内容 |
| --- | --- |
| 基本信息 `Descriptions columns={3}` | 退拣原因（`TagLabel`）、原出库单（`DocNo`）、货主、仓库（`CodeName`）、来源库位、创建时间、提交人、提交时间、备注（`col-span-3`） |
| `SummaryCard`「返库进度」，description「整单提交后才计入已返库」 | `SummaryProgress` 已返库/应返库（green）；`SummaryMetrics`：应返库、已返库（green）、待返库（orange，已完成隐藏） |

页签（`DetailTabs param="tab"`）：

| 页签 | 列 |
| --- | --- |
| 应返库明细 | 行号、出库单行号、商品、品质（`TagLabel`）、批次号、序列号、建议库位、应返库 |
| 实际返库明细 | 应返库行号、商品、目标库位、返库数量、序列号；空表 `outbound.ui.noActual` |
| 操作日志 | `outboundLogColumns`；`refType='PUTBACK'` 且 `refNo` 为本单 |

## 五、Web 端返库（录入页）

页头：`<DetailTitle title="返库录入" code status>`；按钮：返回详情（outline）。

### 5.1 基本信息

`Descriptions columns={3}`：退拣原因、原出库单号（`DocNo`）、货主、来源库位。

### 5.2 录入落位表单（`<form>` + `FormGrid` 4 列，回车即保存）

| 字段 | 控件 | 默认 | 校验（不过则红字写在表单底部左侧） |
| --- | --- | --- | --- |
| 应返库行 * | `OptionSelect`（跨 2 列），选项为剩余大于 0 的行，按建议库位排序，文案 `#行号 · 商品 · 批次 · 品质 · 剩余 n` | 第一条 | 未选：`returnLineFirst` |
| 目标库位 * | `Input`；与建议库位不同时 hint 为 `ActionLink`「建议 X，点此填入」 | 本行建议库位 | 空：`targetRequired`；保存时转大写；不合规由动作返回 `outbound.error.target` |
| 本次数量 * | `Input type=number`；hint「剩余 n」 | 本行剩余 | 正整数：`qtyInvalid`；超剩余：`returnOver` |
| 序列号 * | `Textarea`（整行），仅 SN 行 | 本行还没落位的 SN，每行一个 | 条数等于本次数量：`serialCount`；不在本行或重复由动作拒绝 |

保存按钮（outline）「保存落位」→ `SAVE_PUTBACK`，成功 toast 写商品、件数与库位；本行没录满留在本行（数量带出新剩余），录满切到下一条。表单底部左侧无错误时显示提示：保存只记落位、不动库存，可重录；整单提交才移库。

### 5.3 录入进度卡

`SummaryProgress` 已保存/应返库；`SummaryMetrics`：应返库、已保存（blue）、剩余（有剩余时 orange）、落位处数。底部主按钮「提交返库上架（n 处落位）」：已保存 = 应返库时可点，否则 disabled 并写「还有 n 件没保存落位」；退拣原因为少件时再提示「少件仍按应返库量提交，再盘点扣差异」。提交走确认弹窗（与 PDA 同一文案）→ `SUBMIT_PUTBACK`；成功后单据已完成，页面自动回到详情。

### 5.4 页签

| 页签 | 列 |
| --- | --- |
| 应返库明细 | 行号、商品、品质、批次号、建议库位、应返库、已保存、剩余、操作「录入」（剩余为 0 隐藏） |
| 已保存落位 | 应返库行号、商品、目标库位、返库数量、序列号、操作「重录本行落位」（danger，确认后 `RESET_PUTBACK_LINE`，清掉该应返库行的全部落位） |

## 六、i18n

| key | zh-CN |
| --- | --- |
| `menu.outboundPutbacks` | 返库上架单 |
| `outbound.ui.putbackTitle` / `putbackNotFound` | 返库上架单 / 未找到返库上架单 |
| `outbound.ui.putbackNoPlaceholder` | 请输入返库上架单号 |
| `outbound.ui.planReturn` / `actualReturn` / `expected` / `returned` / `pendingReturn` / `stagingSource` / `suggested` / `noActual` / `putbackProgress` / `putbackProgressHint` | 应返库明细 / 实际返库明细 / 应返库 / 已返库 / 待返库 / 来源库位 / 建议库位 / 尚未保存返库落位 / 返库进度 / 整单提交后才计入已返库 |
| `outbound.ui.goPutback` | PDA返库上架 |
| `outbound.entry.returnAction` / `returnTitle` / `returnFormTitle` / `returnLine` | Web 端返库 / 返库录入 / 录入落位 / 应返库行 |
| `outbound.entry.useSuggestion` / `returnQty` / `returnSave` / `returnSubmit` / `returnSubmitBlocked` / `placementsTab` | 建议 X，点此填入 / 本次数量 / 保存落位 / 提交返库上架（n 处落位） / 还有 n 件没保存落位 / 已保存落位 |

## 七、Mock 与走查

种子见[出库单弹窗与 Mock 分册 §7.2](../出库单/前端Demo版PRD/出库单前端Demo版PRD_弹窗与Mock.md)：0008 取消生成 PB-…-0001（1 行，建议 A-01-01）；0020 拣后取消生成 PB-…-0002（2 行，建议 A-01-01、A-01-02，含 1 件 SN 商品）。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开列表 | 2 条待上架，原因取消，原出库单可点；行内有两个入口 |
| 2 | 打开 PB-…-0001 详情 | 页面正常渲染；应返库 2、已返库 0 |
| 3 | Web 端返库：数量改 1 保存，再把目标库位改成小写 `a-01-02` 保存 | 两条落位 A-01-01 × 1、A-01-02 × 1；状态上架中；提交按钮可点 |
| 4 | 已保存落位页签点「重录本行落位」并确认 | 两条落位都清掉，剩余回到 2；库存不变 |
| 5 | 重新录满并提交 | 已完成，页面回到详情；已返库 2；提交人、提交时间有值；入口按钮消失 |
| 6 | PB-…-0002 走 PDA 返库上架 | 见 PDA 返库上架 Demo PRD 走查；管理端详情同步 |
