# 新品维护前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《新品维护主PRD》](新品维护主PRD.md)的管理端列表、详情、量方弹窗，以及收货提交的新品阻断；说明路由、类型、Mock 动作与走查。不重复业务规则与验收表。
> 布局真源：[《新品维护页面骨架》](新品维护页面骨架.md)。字段真源：[《新品维护（详细稿）》](../../../字段清单合集/02-入库管理/新品维护/新品维护（详细稿）.tsv)。收货作业台见[收货与双端分册](../入库单/前端Demo版PRD/入库单前端Demo版PRD_收货与双端.md)，PDA收货见[《PDA收货前端Demo版PRD》](../../7-PDA作业端/收货作业/PDA收货前端Demo版PRD.md)。
> 版本：WMS-V0.1｜日期：2026-10-15｜状态：初稿，演示未验收

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)。**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)第四节**。列表参照 `warehouse-list-page.tsx`（FilterBar 6 列，去掉 StatusTabs）；弹窗参照 `carrier-form-dialog.tsx`；详情 Sheet 参照 `inbound-putaway-sheet.tsx` 的 `DetailSheet`。

## 一、页面与路由

| 路由 / 容器 | 组件（建议） | 说明 |
| --- | --- | --- |
| `/wms/inbound/new-sku` | `new-sku-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| 详情 Sheet | `new-sku-detail-sheet.tsx` | 列表单号点击打开 |
| 量方 Dialog | `new-sku-measure-dialog.tsx` | 列表页头与收货作业台共用；PDA 量方屏复用同一 Mock 动作，见[《PDA新品量方前端Demo版PRD》](../../7-PDA作业端/新品量方作业/PDA新品量方前端Demo版PRD.md) |

**菜单**：在 `config/menu.ts` 入库管理组增加 `{ path: '/wms/inbound/new-sku', titleKey: 'menu.newSku', milestone: 'M1' }`，位置在「上架单」之后；`router.tsx`、`config/page-tabs.ts` 同步注册。

数据范围：列表**不按**顶栏仓库过滤（NS记录四仓共用）；量方提交的维护仓库取顶栏当前仓库。

## 二、类型与单位

```ts
// types/inbound.ts
export interface NewSkuRecord {
  recordNo: string            // NS-YYYYMMDD-序号
  customerId: string
  skuCode: string
  warehouseCode: string       // 维护仓库
  sourceInboundNo?: string    // 独立维护为空
  lengthCm: number
  widthCm: number
  heightCm: number
  grossWeightKg: number
  photos: string[]            // Demo 存文件名或 objectURL
  remark?: string
  maintainedBy: string
  maintainedAt: string        // ISO UTC
  requestId: string           // 幂等键
}
```

`SeedData`（`mock/seed.ts`）增加 `newSkuRecords: NewSkuRecord[]`，`mock/db.ts` 的 persist 版本号加 1 以重置旧缓存。

单位：Demo 仓库只有 `unitSystem`（`metric` / `imperial`），映射为 metric = cm、kg，imperial = inch、lb；与仓库详细稿的长度单位、重量单位两字段对应，后续拆字段时只改映射。

`lib/unit.ts` 新增：

| 函数 | 规则 |
| --- | --- |
| `lengthToCm(v, unit)` | inch × 2.54，结果四舍五入 2 位 |
| `cmToLength(cm, unit)` | cm ÷ 2.54，展示 2 位 |
| `weightToKg(v, unit)` | lb × 0.45359237，结果四舍五入 3 位 |
| `kgToWeight(kg, unit)` | kg ÷ 0.45359237，展示 3 位 |

## 三、判断函数与收货阻断

`lib/new-sku.ts`：

```ts
export function findNewSkuRecord(records, customerId, skuCode): NewSkuRecord | undefined
export function isNewSku(records, customerId, skuCode): boolean   // 无记录即新品
```

收货接入（本模块负责补，收货分册同步引用）：

| 位置 | 改动 |
| --- | --- |
| `mock/inbound-receive-actions.ts` 收货提交校验 | 逐行检查 `isNewSku(order.customerId, line.skuCode)`，命中返回 `{ ok: false, errorKey: 'inbound.receive.newSkuBlocked', params: { skuCode } }`；整次提交不生效 |
| 收货作业台行内 | 选中新品SKU时行尾显示 `TagLabel tone="orange"`「新品待量方」+ `textLink`「去量方」，打开量方 Dialog（带 `customerId`、`skuCode`、`sourceInboundNo`）；提交成功后标签消失 |
| PDA 收货 | 容器作业扫到或点选新品时阻断并自动进入 PDA 量方屏，提交后回到收货；PDA 无独立量方入口。见[《PDA新品量方前端Demo版PRD》](../../7-PDA作业端/新品量方作业/PDA新品量方前端Demo版PRD.md) §3 |

## 四、列表页

### 页头

| 按钮 | 组件 | 行为 |
| --- | --- | --- |
| 新品量方 | `Button`（primary）+ `Plus` | 打开量方 Dialog，`mode='standalone'` |
| 导出 | `Button variant="outline"` | `toast.info(t('common.exportMock'))` |

### FilterBar（`columns={6}`，5 常显 + 1 advanced）

| 字段 | 位置 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- | --- |
| 维护记录号 | 常显 | `Input` | 包含 | `newSku.filters.recordNoPlaceholder` |
| 货主 | 常显 | `Select` 可搜索 + 全部 | 精确 | `common.selectPlaceholder` |
| 商品编码 | 常显 | `Input` | 包含 | `newSku.filters.skuPlaceholder` |
| 维护仓库 | 常显 | `Select` 全部 + 授权仓库 | 精确 | `common.selectPlaceholder` |
| 维护时间 | 常显 | `DateRangePickerField` | 范围 | `newSku.filters.maintainedRangePlaceholder` |
| 来源入库单号 | advanced | `Input` | 包含 | `newSku.filters.inboundNoPlaceholder` |

### DataTable

`selectable={false}`；默认 `maintainedAt` 降序；`pageSize=20`；无操作列。

| 列 | 展示 | meta |
| --- | --- | --- |
| 维护记录号 | `<DocNo>`，点击打开详情 Sheet | `pin: 'left'` |
| 货主 | 编码小字 + 名称 | truncate |
| 商品编码 | `<BizCode>` | — |
| 商品名称 | 文本 | truncate |
| 长×宽×高 | 按顶栏仓库单位换算，`11.81×7.87×3.94`；列头带单位 | `align: 'right'` |
| 毛重 | 同上，3 位小数 | `align: 'right'` |
| 维护仓库 | 仓库编码 | — |
| 来源入库单号 | `<DocNo>` → 入库单详情；空为 `—` | — |
| 维护人 | 文本 | 默认隐藏 |
| 维护时间 | `<DateTime>` | 可排序 |

## 五、详情 Sheet

`DetailSheet` 标题 `新品维护 · {recordNo}`；三组 `Descriptions columns={2}`：基本信息（记录号、货主、商品编码、条码、名称、维护仓库、来源入库单号）、实测规格（按顶栏仓库单位）、留底信息（照片缩略图、维护人、维护时间、备注）。无编辑入口。

## 六、量方 Dialog

Props：`mode: 'standalone' | 'receive'`、`customerId?`、`skuCode?`、`sourceInboundNo?`、`onSuccess(record)`。

| 字段 | 控件 | 规则 |
| --- | --- | --- |
| 维护仓库 | 只读文本 + 单位 | 顶栏当前仓库 |
| 货主 | `Select` | `receive` 模式只读；`standalone` 只列启用货主 |
| 商品 | `Select` 可搜索 | `receive` 模式只读；`standalone` 只列该货主启用且 `isNewSku` 为真的SKU；空列表时提示「该货主暂无待量方商品」 |
| 预报规格 | 只读 | 取 `skuMasters` 中该商品当前 `lengthCm` 等字段换算展示；无值显示 `—` |
| 长、宽、高 | `Input type="number"` | 必填，>0，≤2 位小数；placeholder `common.inputPlaceholder` |
| 毛重 | `Input type="number"` | 必填，>0，≤3 位小数 |
| 照片 | Mock 上传 | 选填，本地预览，存文件名 |
| 备注 | `Textarea` | 选填 |

打开弹窗时生成 `requestId`；提交按钮 loading 期间禁用。

## 七、Mock 动作

| Action | 入参 | 结果 |
| --- | --- | --- |
| `submitNewSkuMeasure` | `customerId`、`skuCode`、`warehouseCode`、`sourceInboundNo?`、四个实测值（按仓库单位）、`photos`、`remark?`、`requestId`、`operator` | 已有同 `requestId` 记录 → 返回原记录；货主或商品停用 → `newSku.error.inactive`；已有同货主SKU记录 → `{ ok: false, errorKey: 'newSku.error.exists', data: 已有记录 }`；否则换算为 cm、kg，生成 NS 号，写入 `newSkuRecords`，并把 `lengthCm`、`widthCm`、`heightCm`、`grossWeightKg` 写回 `skuMasters` 中该货主商品，更新其 `updatedAt`、`updatedBy` |

NS 号沿用 `mock/db.ts` 现有单号生成（UTC 日期 + 四仓共用序列）。

## 八、i18n

| key | zh-CN |
| --- | --- |
| `menu.newSku` | 新品维护 |
| `newSku.create` | 新品量方 |
| `newSku.forecast` / `newSku.measured` | 预报规格 / 实测规格 |
| `newSku.submit` | 提交量方 |
| `newSku.submitSuccess` | 量方完成，记录号 {{recordNo}} |
| `newSku.error.exists` | 该商品已于 {{warehouse}} 完成新品维护（{{recordNo}}），无需重复量方 |
| `newSku.error.inactive` | 货主或商品已停用，不能维护 |
| `newSku.noCandidate` | 该货主暂无待量方商品 |
| `newSku.pendingTag` / `newSku.goMeasure` | 新品待量方 / 去量方 |
| `inbound.receive.newSkuBlocked` | {{skuCode}} 为新品，请先完成新品维护再收货 |
| `newSku.filters.*Placeholder` | 请输入维护记录号 / 请输入商品编码 / 维护时间 / 请输入入库单号 |

en-US 同步维护。

## 九、Mock 种子与走查

种子：已有 2 条 NS 记录（一条公制仓维护、一条英制仓独立维护）；准备一张待收货入库单，含一个已维护SKU和一个新品SKU；另一货主下放一个同编码SKU且无记录。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 顶栏切到英制仓，打开新品维护列表 | 列头为 inch、lb；公制仓维护的记录按英制换算展示 |
| 2 | 进入种子入库单收货作业台，录新品SKU后提交 | 整次提交被阻断，提示新品；只录已维护SKU则可提交 |
| 3 | 新品行点「去量方」，录数提交 | 生成 NS 记录，来源入库单号为该单；标签消失，可以收货；入库数量与库存不因量方变化 |
| 4 | 列表页头「新品量方」，选另一货主同编码SKU | 该SKU在候选内，可独立量方，来源入库单号为空 |
| 5 | 切到另一仓，对步骤3的货主SKU发起独立量方 | 商品候选里不再出现；该仓收货不再阻断 |
| 5a | 单元测试（`mock/db.test.ts`）：以不同 `requestId` 连续两次提交同货主SKU | 第二次返回 `newSku.error.exists` 及已有记录；浏览器内跨标签页不作为并发验证手段 |
| 6 | 快速双击「提交量方」 | 只有一条记录 |

以上为演示走查要求，页面尚未实现和验证。
