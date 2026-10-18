# 上架单前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《上架单主PRD》](上架单主PRD.md)的**管理端查询与 Web 端上架**；说明路由、组件、派生口径、Mock 与走查。不重复业务规则与验收表。
> 布局真源：[《上架单页面骨架》](上架单页面骨架.md)。字段真源：[《上架单（详细稿）》](../../../字段清单合集/02-入库管理/上架单/上架单（详细稿）.tsv)。PDA 保存与提交见[《PDA上架前端Demo版PRD》](../../7-PDA作业端/上架作业/PDA上架前端Demo版PRD.md)，PDA、Web 端上架读写同一份 `putawayOrders`，共用保存、撤销、提交动作。
> 版本：WMS-V0.3｜日期：2026-10-15｜状态：演示已走查（2026-10-15）。V0.2 走查修订：管理端不展示「已录」、按 `planLineNo` 派生。V0.3：详情改为与入库单相同的「概览卡 + 多页签」并增加操作日志页签；新增 Web 端上架录入页（第六节）。

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)、[《业务组件与主数据页面》](../../../../../09-产品原型/qs-wms-demo/docs/03-业务组件与主数据页面.md)。**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)「布局硬规则」一节**。列表参照 `inbound-order-list-page.tsx`（StatusTabs + 双 Panel），详情参照 `inbound-order-detail-page.tsx`（概览卡 + 多页签）；子表列共用 `putaway-line-columns.tsx`。

## 一、页面与路由

| 路由 | 组件（建议） | 容器 |
| --- | --- | --- |
| `/wms/inbound/putaway` | `putaway-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| `/wms/inbound/putaway/:putawayNo` | `putaway-detail-page.tsx` | `PageContainer` + `DetailOverview` + `DetailTabs` |
| `/wms/inbound/putaway/:putawayNo/entry` | `putaway-entry-page.tsx` | Web 端上架录入页，见第六节 |

**菜单**：`config/menu.ts` 已有 `/wms/inbound/putaway`（`menu.putawayTasks`，M1 建设中）。实现时：

- 中文文案由「上架任务」改为「上架单」（en-US「Putaway Orders」），key 可沿用；
- `router.tsx`、`config/page-tabs.ts` 注册列表、`:putawayNo` 详情与 `:putawayNo/entry` 录入页；
- 同组的 `/wms/inbound/receipts`（收货记录）与宏观架构「收货记录不设独立菜单」冲突，应从菜单移除，收货记录只在入库单详情页签查看。

**入库单详情联动**：上架单页签的单号改为 `<DocNo>` 链到本详情；行内「查看」Sheet 保留作快览。

数据范围：顶栏当前仓库；`warehouseCode` 不等于当前仓的单据不出现，直接访问详情 URL 时显示「未找到上架单」空态。

## 二、类型补齐

现有 `PutawayOrder`（`types/inbound.ts`）缺主PRD与字段稿要求的追溯字段。实现本页前先补齐，PDA 上架同步使用：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sourceType` | `'INBOUND' \| 'RETURN'` | 来源业务；Demo 种子全部 `INBOUND` |
| `sourceNo` | `string` | 来源单号；替代仅入库可用的 `inboundNo`（`inboundNo` 可保留为兼容别名） |
| `receiptNo` | `string` | 改为必填；入库来源为 RC 号 |
| `stagingLocationCode` | `string` | 来源暂存库位，取自收货记录，生成后不变 |
| `remark` | `string?` | PDA 可录 |
| `PutawayPlanLine.receiptLineNo` | `number` | 对应收货明细行号 |
| `PutawayPlanLine.productionDate` | `string?` | 启用效期时有值 |
| `PutawayActualLine.lineNo` | `number` | 本单内唯一 |
| `PutawayActualLine.planLineNo` | `number` | 关联应上架行；同SKU不同批次靠它区分 |
| `PutawayActualLine.serialNos` | `string[]?` | SN商品落位的序列号，条数等于 `qty` |

`PutawayActualLine.submitted` 保留：Demo 内部用它区分未提交与已提交明细（占用判定、PDA 撤销按钮），业务判定一律按单头 `status`，不用它推导「已上架」。

PDA 的 `savePutawayLine`、`removePutawayLine` 入参同步按 `planLineNo` 定位（见[PDA上架前端Demo版PRD](../../7-PDA作业端/上架作业/PDA上架前端Demo版PRD.md) §7），不能再按 `skuCode` 合并；同SKU两个批次的应上架行必须各落各的。

## 三、派生口径（`lib/putaway.ts`）

| 名称 | 公式 | 用于 |
| --- | --- | --- |
| 应上架总数量 | `Σ planLines.planQty` | 列表、详情 |
| 已上架数量 | `status === 'COMPLETED' ? 应上架总数量 : 0` | 列表、详情 |
| 已录数量 | `Σ actualLines.qty`（含已提交） | 只在作业页展示（PDA、Web 端上架页）；判断能否提交 |
| 行已录（内部） | `Σ actualLines.qty where planLineNo = 该行` | 同上；按 `planLineNo` 算，同SKU多批次不串行 |
| 行剩余 | `planQty − 行已录` | 作业页落位上限 |
| SKU数 | `planLines` 去重 `skuCode` 计数 | 列表 |

现有 `recordedQty` / `remainingQty` 按 `skuCode` 汇总，同SKU多批次会串行；改为按 `planLineNo` 汇总（`undefined` 时汇总全单）。这两个数与 `isFullyRecorded` 只服务作业页与提交校验，列表与详情不出现「已录」。

## 四、列表页

### 页头

| 按钮 | 组件 | 行为 |
| --- | --- | --- |
| 导出 | `Button variant="outline"` | `toast.info(t('common.exportMock'))` |

无新增、导入、批量按钮。

### FilterBar（`columns={6}`，5 常显 + 3 advanced）

`draft` / `filters` 双 state；查询回第一页；重置清空两者。

| 字段 | 位置 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- | --- |
| 上架单号 | 常显 | `Input` | 包含；空格分词多号 | `putaway.filters.putawayNoPlaceholder` |
| 来源单号 | 常显 | `Input` | 包含 | `putaway.filters.sourceNoPlaceholder` |
| 容器号 | 常显 | `Input` | 包含；无容器单不命中 | `putaway.filters.containerNoPlaceholder` |
| 货主 | 常显 | `OptionSelect`（含「全部」） | 精确 | `common.selectPlaceholder` |
| 品质 | 常显 | `OptionSelect` 全部/良品/不良品 | 精确 | `common.selectPlaceholder` |
| 来源业务 | advanced | `OptionSelect` 全部/入库/退货 | 精确 | `common.selectPlaceholder` |
| 创建时间 | advanced | `DateRangePickerField` | 范围 | `putaway.filters.createdRangePlaceholder` |
| 提交时间 | advanced | `DateRangePickerField` | 范围；未提交单不命中 | `putaway.filters.submittedRangePlaceholder` |

### StatusTabs

`ALL`、`PENDING`、`PUTAWAYING`、`COMPLETED`，标签用 `putawayOrderStatusMeta`；计数取 filters 之后的数据。URL 可带 `?status=`，切换页签不重置筛选。

### DataTable

`selectable={false}`；默认 `createdAt` 降序；`pageSize=20`。

| # | 列 | 展示 | meta |
| --- | --- | --- | --- |
| 1 | 上架单号 | `<DocNo>` → 详情 | `pin: 'left'` |
| 2 | 单据状态 | `<StatusBadge>` | — |
| 3 | 品质 | `<StatusBadge>`（`qualityMeta`） | — |
| 4 | 来源业务 | `<TagLabel>` | 默认隐藏 |
| 5 | 来源单号 | 入库来源 `<DocNo>` → 入库单详情；退货来源纯文本 | — |
| 6 | 容器号 | `<BizCode>`；空值显示 `putaway.noContainer`（无容器收货） | — |
| 7 | 货主 | 编码小字 + 名称 | truncate |
| 8 | SKU数 | `<Num>` | `align: 'right'` |
| 9～10 | 应上架、已上架 | `<Num>` | `align: 'right'` |
| 12 | 创建时间 | `<DateTime>` | 可排序 |
| 13 | 提交时间 | `<DateTime>`（空值自动显示 `-`） | 可排序 |
| 14 | 操作 | 见下 | `pin: 'right'` |

行操作：

| 按钮 | 显示条件 | 行为 |
| --- | --- | --- |
| Web 端上架 | `status !== 'COMPLETED'` | `RowActions`；进入录入页（第六节），带回列表筛选 |
| PDA上架 | `status !== 'COMPLETED'` | `RowActions`；进入 `/pda/putaway` 并直达该单的上架单作业步骤（参数写法沿用 `use-pda-step`） |

已完成单单元格留空，不渲染 disabled 按钮。

## 五、详情页

版式与入库单详情一致（[《02-设计规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md) §5.2 业务单据详情）：上方「基本信息 + 上架进度」双栏，下方页签。样板 `inbound-order-detail-page.tsx`，实现 `putaway-detail-page.tsx`。

### 页头

`<DetailTitle title="上架单" code={putawayNo} status>`（渲染为「上架单 · PA-… [状态]」）。右侧按钮：

| 按钮 | 显示条件 | 样式 | 行为 |
| --- | --- | --- | --- |
| 返回列表 | 始终 | outline | 回列表并带回筛选（`state.listSearch`） |
| Web 端上架 | 未完成 | outline | 跳 `/wms/inbound/putaway/:putawayNo/entry`（第六节） |
| PDA上架 | 未完成 | outline | 跳 `/pda/putaway` 并直达该单 |

页头没有主按钮：本页只读，主操作在录入页。

### 概览（`DetailOverview`）

| 区块 | 内容 |
| --- | --- |
| 左：`Section`「基本信息」+ `Descriptions columns={3}` | 品质（`TagLabel`）、来源业务、来源单号（入库来源 `<DocNo>` 跳入库单详情）、货主（`CodeName`）、仓库（`CodeName`）、来源收货记录号、作业容器（空为「无容器收货」）、来源暂存库位、创建时间、提交人、提交时间、备注（`col-span-3`） |
| 右：`SummaryCard`「上架进度」 | `SummaryProgress` 上架进度（green，`已上架/应上架`，只有 0% 或 100%）；`SummaryMetrics`：SKU 种类、应上架、已上架（green）、待上架（orange，已完成单隐藏） |

单号与状态已在标题里，基本信息不再重复。不展示「已录」。

### 页签（`DetailTabs param="tab"`，带条数）

| 页签 | 列 |
| --- | --- |
| 应上架明细 | 行号、收货明细行号、商品编码、商品条码、商品名称、批次号、生产日期、失效日期、应上架数量 |
| 实际上架明细 | 行号、应上架行号、商品编码、批次号（按应上架行带出）、目标库位、上架数量、序列号、商品名称；空表文案 `putaway.noActualLines` |
| 操作日志 | 操作时间、操作、操作人、说明；取 `auditLogs` 中 `refType = 'PUTAWAY'` 且 `refNo` 为本单的记录（保存落位、撤销落位、提交上架），两端操作都在这里 |

- 列定义写在 `putaway-line-columns.tsx`，详情页与入库单详情里的上架单抽屉共用；日志列写在 `audit-log-columns.tsx`，与入库单详情共用。
- 序列号列：详情页显示 `textLink`「查看(n)」，打开 `DetailSheet` 列出序列号；入库单详情的上架单抽屉里只显示条数（不再叠抽屉）。
- 未找到单据或不属当前仓：空态「未找到上架单」+「返回列表」。

本页不调用保存、撤销、提交动作；PDA 或录入页提交后按 `useDb` 订阅自动刷新。

### 入库单详情里的上架单抽屉

`inbound-putaway-sheet.tsx`：标题「单号 [状态] [品质]」；单头 `Descriptions columns={4}`：作业容器、来源收货记录号、应上架、已上架；内层 `DetailTabs`（不写 URL）：应上架明细 / 实际上架明细，列与详情页相同。入库单详情的「操作日志」页签同时列出本单各上架单的日志，说明前带上架单号。

## 六、Web 端上架（录入页）

| 项 | 内容 |
| --- | --- |
| 路由 | `/wms/inbound/putaway/:putawayNo/entry`，组件 `putaway-entry-page.tsx`；`page-tabs` 登记页签名「Web 端上架」 |
| 入口 | 上架单详情页头、上架单列表行操作（未完成单） |
| 进入条件 | 单据属当前仓且未完成；已完成（含 PDA 刚提交）直接 `replace` 回详情；找不到单回列表 |
| 密度 | 管理端密度（32px 控件），不是扫码作业台：场景是事后按纸单补录，键盘录入、回车保存 |

### 布局

```
PageContainer（DetailTitle「上架录入 · PA-… [状态]」 + 返回详情）
├─ DetailOverview
│   ├─ Section「基本信息」 Descriptions columns={3}：品质、来源单号、货主、作业容器、来源暂存库位、来源收货记录号
│   ├─ Section「录入落位」 FormGrid：应上架行（span 2）| 目标库位 | 上架数量；SN 商品多一行序列号（span full）；右下「保存落位」
│   └─ SummaryCard「录入进度」：已录进度条（blue）；应上架、已录、剩余（orange）、落位行数；卡片底部主按钮「提交上架（N 条落位）」
└─ DetailTabs param="tab"
    ├─ 应上架明细：行号、SKU（CodeName）、批次号、失效日期、应上架、已录、剩余、操作「录入」
    └─ 已录落位：行号、应上架行号、SKU、目标库位、上架数量、序列号、操作「撤销」（危险，仅未提交行）
```

### 字段与交互

| 字段 | 控件 | 规则 |
| --- | --- | --- |
| 应上架行 | `OptionSelect`，选项 `#行号 · SKU · 批次 · 剩余 n` | 只列剩余 > 0 的行；只有一条时默认选中；表格行内「录入」也会选中该行 |
| 目标库位 | `Input`，placeholder「请输入目标库位」 | 选行后预填推荐库位（`suggestPutawayLocation`），下方 `ActionLink`「推荐 X，点此填入」可还原；无推荐时提示扫可用货位 |
| 上架数量 | `Input type="number"` | 预填该行剩余；提示「剩余 n」 |
| 序列号 | `Textarea`，每行一个 | 仅商品资料启用 SN 时出现且必填；条数须等于数量 |

- 保存调用 `savePutawayLine`（与 PDA 同一动作），失败时在表单底部红字显示错误文案（与 PDA 同一组 `pdaPutaway.error.*`），保留已填值；成功 `toast.success` 并：本行没录满就留在本行、数量改为新剩余；录满就跳到下一条未录满的行；全部录满后表单清空。
- 撤销调用 `removePutawayLine`，先 `useConfirm`（destructive）二次确认。
- 提交按钮在全部应上架行录满前 `disabled`，下方写「还有 n 件未落位」；点击后 `useConfirm` 确认，调用 `submitPutawayOrder`，成功后单据已完成，页面自动回到详情。
- 已录 / 剩余写进表格行数据再渲染（表格按行对象缓存单元格），保存或撤销后两列立即刷新。
- 不做本机暂存：每条保存即写入上架单，刷新、切页签不丢。

## 七、i18n

| key | zh-CN |
| --- | --- |
| `menu.putawayTasks` | 上架单 |
| `putaway.filters.putawayNoPlaceholder` | 请输入上架单号 |
| `putaway.filters.sourceNoPlaceholder` | 请输入来源单号 |
| `putaway.filters.containerNoPlaceholder` | 请输入容器号 |
| `putaway.filters.createdRangePlaceholder` / `submittedRangePlaceholder` | 创建时间 / 提交时间 |
| `putaway.putawayQty` / `putaway.pendingQty` | 已上架 / 待上架 |
| `putaway.sectionBasic` / `progressTitle` / `progressHint` | 基本信息 / 上架进度 / 整单提交后才计入已上架；落位可在 Web 端或 PDA 录入 |
| `putaway.noContainer` | 无容器收货 |
| `putaway.noActualLines` | 尚未保存上架明细 |
| `putaway.notFound` | 未找到上架单 |
| `putaway.openPda` | PDA上架 |
| `putaway.tabEntry` / `putaway.entry.action` | Web 端上架 |
| `putaway.entry.title` / `backToDetail` / `formTitle` | 上架录入 / 返回详情 / 录入落位 |
| `putaway.entry.progressTitle` / `progressHint` | 录入进度 / 保存只记落位，不动库存；每行录满后整单提交才移库 |
| `putaway.entry.recorded` / `remaining` / `actualLines` / `actualTab` | 已录 / 剩余 / 落位行数 / 已录落位 |
| `putaway.entry.submit` | 提交上架（{{count}} 条落位） |
| `audit.action.PUTAWAY_SAVE` / `PUTAWAY_REMOVE` / `PUTAWAY` | 保存落位 / 撤销落位 / 提交上架 |

en-US 同步维护。

## 八、Mock 种子与走查

沿用 `mock/inbound-seed.ts` 现有上架单，补齐第二节字段后应至少覆盖（已完成种子单须补 `submittedBy`，否则详情「提交人」为空）：

| 种子 | 状态 | 用途 |
| --- | --- | --- |
| 良品单 `PA-20261004-0001`，容器 C-A01，已提交 | 已完成 | 列表无操作；详情有提交人、时间 |
| 良品单 `PA-20261005-0001`，同SKU两个批次各一条应上架行（BATCH-2026-A/B），已保存 300 | 上架中 | 详情不出现「已录」；录入页按批次显示已录 300/500 与 0/300 |
| 不良品单 `PA-20261004-0002`，同容器 | 待上架 | 品质标签；实际明细空态 |
| SN商品单 `PA-20261010-0001`，两件分到 `A-01-02`／`A-01-03` 且已提交 | 已完成 | 序列号 Sheet（每行「查看(1)」） |
| 无容器收货合并单 `PA-20261009-0001` | 待上架 | 容器号显示「无容器收货」 |

Mock 动作：保存、撤销、提交的操作日志写 `refType = 'PUTAWAY'`、`refNo = 上架单号`（`mock/db.ts`，persist 版本 20）。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开上架单列表 | 页头只有导出；状态页签数量之和等于全部；未完成单行内有「Web 端上架」「PDA上架」 |
| 2 | 输入某入库单号查询 | 只剩该来源单的上架单 |
| 3 | 打开上架中的多批次单 | 左基本信息、右上架进度（已上架 0、待上架 800）；应上架明细两条批次行各 500／300，页面不出现「已录」 |
| 4 | 点「Web 端上架」，库位填暂存库位 `STAGE-IN-01` 保存 | 表单底部红字「不能上架到收货暂存库位」，不保存 |
| 5 | 点推荐库位填入，回车保存第 1 行剩余 200 | 第 1 行已录 500、剩余 0；表单自动切到第 2 行，数量预填 300 |
| 6 | 在「已录落位」撤销一条 | 二次确认后该行消失，对应应上架行剩余回升；提交按钮回到不可用 |
| 7 | 录满后点「提交上架」并确认 | 回到详情，状态已完成，已上架等于应上架，提交人为当前账号；「操作日志」页签有保存、撤销、提交记录 |
| 8 | 打开来源入库单详情的「操作日志」页签 | 同样列出这些记录，说明前带上架单号 |
| 9 | 另一张单点「PDA上架」，在PDA录满并提交，返回详情 | 状态已完成；Web 端上架与 PDA上架按钮消失 |
| 10 | 切换顶栏仓库后刷新详情 URL | 显示未找到上架单 |

以上走查已于 2026-10-15 在 qs-wms-demo 执行通过（列表、详情双栏与页签、Web 端上架录入/撤销/提交、入库单日志联动、序列号 Sheet）。SN 商品的 Web 录入已按第六节实现，但种子里没有未完成的 SN 上架单，未做浏览器走查。
