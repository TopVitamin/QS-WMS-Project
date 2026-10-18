# 无主货登记前端Demo版PRD

> 用途：在 `qs-wms-demo` 实现[《无主货登记主PRD》](无主货登记主PRD.md)的管理端列表、登记弹窗与详情（PDA 登记见[《PDA无主货登记前端Demo版PRD》](../../7-PDA作业端/无主货登记作业/PDA无主货登记前端Demo版PRD.md)，共用 `registerUnclaimed`）；说明路由、类型、校验、Mock 动作与走查。不重复业务规则与验收表。
> 布局真源：[《无主货登记页面骨架》](无主货登记页面骨架.md)。字段真源：[《无主货登记（详细稿）》](../../../字段清单合集/02-入库管理/无主货登记/无主货登记（详细稿）.tsv)。
> 版本：WMS-V0.3｜日期：2026-10-15｜状态：演示已走查（2026-10-15）。V0.2 走查修订：登记不选库位（无主货统一放专门暂存区域），组件名与现状对齐。V0.3：详情 Sheet 标题与分组卡片对齐入库单详情写法，补照片；空值统一 `<Empty />`。

**样式与组件**：[《QS-WMS 前端设计与开发规范》](../../../../../09-产品原型/qs-wms-demo/docs/02-设计规范.md)。**布局与占位须符合[需求文档 PRD / AGENTS.md](../../AGENTS.md)「布局硬规则」一节**。列表参照 `warehouse-list-page.tsx`（5 常显、无展开）；弹窗参照 `carrier-form-dialog.tsx`；详情 Sheet 按[需求文档 PRD / AGENTS.md](../../AGENTS.md)「布局硬规则」第 3 条「只读记录抽屉」写（`DetailTitle` + 分组 `Section`）。

## 一、页面与路由

| 路由 / 容器 | 组件（建议） | 说明 |
| --- | --- | --- |
| `/wms/inbound/unclaimed` | `unclaimed-list-page.tsx` | `PageContainer fill` + 双 `Panel` |
| 登记 Dialog | `unclaimed-register-dialog.tsx` | 列表页头打开 |
| 详情 Sheet | `unclaimed-detail-sheet.tsx` | 列表登记号点击打开 |

**菜单**：`config/menu.ts` 已有 `/wms/inbound/unclaimed`（`menu.unclaimed`，M4 建设中）。实现时：

- 中文文案由「无主件认领」改为「无主货登记」（en-US「Unidentified Goods」），去掉“认领”含义；
- 里程碑改为与入库同批（M1）；
- `router.tsx`、`config/page-tabs.ts` 注册列表路由（详情为 Sheet，不占路由）。

数据范围：只取 `warehouseCode === 当前仓库` 的记录。

## 二、类型

```ts
// types/inbound.ts
export type UnclaimedStatus = 'HOLDING'   // 暂存中；后续 CONVERTED / DISPOSED 待 OMS 认领上线

export interface UnclaimedRecord {
  registerNo: string          // UG-YYYYMMDD-序号
  status: UnclaimedStatus
  warehouseCode: string
  trackingNos: string[]
  cartonMarks: string[]
  containerNo?: string        // 柜号
  cartonQty: number
  description?: string
  photos: string[]
  registeredBy: string
  registeredAt: string        // ISO UTC
  requestId: string           // 幂等键
}
```

`SeedData`（`mock/seed.ts`）增加 `unclaimedRecords: UnclaimedRecord[]`，`mock/db.ts` 的 persist 版本号加 1 以重置旧缓存；`config/status.ts` 增加 `unclaimedStatusMeta = { HOLDING: { tone: 'orange', labelKey: 'status.unclaimed.HOLDING' } }`。

## 三、列表页

### 页头

| 按钮 | 组件 | 行为 |
| --- | --- | --- |
| 登记无主货 | `Button`（primary）+ `Plus` | 打开登记 Dialog |
| 导出 | `Button variant="outline"` | `toast.info(t('common.exportMock'))` |

### FilterBar（`columns={6}`，5 常显，无 advanced）

| 字段 | 控件 | 匹配 | placeholder |
| --- | --- | --- | --- |
| 登记号 | `Input` | 包含 | `unclaimed.filters.registerNoPlaceholder` |
| 运单号 | `Input` | 任一运单号包含即命中 | `unclaimed.filters.trackingNoPlaceholder` |
| 箱唛号 | `Input` | 任一箱唛号包含即命中 | `unclaimed.filters.cartonMarkPlaceholder` |
| 柜号 | `Input` | 包含 | `unclaimed.filters.containerNoPlaceholder` |
| 登记时间 | `DateRangePickerField` | 范围 | `unclaimed.filters.registeredRangePlaceholder` |

### DataTable

`selectable={false}`；默认 `registeredAt` 降序；`pageSize=20`；无操作列；无 StatusTabs。

| 列 | 展示 | meta |
| --- | --- | --- |
| 登记号 | `<DocNo>`，点击打开详情 Sheet | `pin: 'left'` |
| 状态 | `<StatusBadge>`（暂存中） | — |
| 运单号 | 第一个 + `+N`（`Tooltip` 列全部）；空为 `<Empty />` | truncate |
| 箱唛号 | 同上 | truncate |
| 柜号 | `<BizCode>`；空为 `<Empty />` | — |
| 箱数 | `<Num>` | `align: 'right'` |
| 实物描述 | 单行截断 | 默认隐藏 |
| 登记人 | 文本 | — |
| 登记时间 | `<DateTime>` | 可排序 |

## 四、登记 Dialog

顶部 `Alert`（info）：`unclaimed.scopeHint`。打开时生成 `requestId`。

| 字段 | 控件 | 校验 |
| --- | --- | --- |
| 仓库 | 只读文本 | 当前仓库 |
| 运单号 | `Textarea`，每行一个 | 去首尾空格、去空行、去重 |
| 箱唛号 | `Textarea`，每行一个 | 同上 |
| 柜号 | `Input` | 去首尾空格 |
| 箱数 | `Input type="number"` | 必填，正整数 |
| 实物描述 | `Textarea` | 选填 |
| 照片 | Mock 上传 | 选填，本地预览，存文件名 |

线索校验：运单号、箱唛号、柜号处理后全为空 → 在「识别线索」分组标题下显示 `unclaimed.error.clueRequired`。可编辑控件 placeholder 用 `common.inputPlaceholder` / `common.selectPlaceholder`。

登记不选库位：实物统一放本仓无主货暂存区域（异常处理库区），表单与详情都不出现库位字段；`lib/unclaimed.ts` 只保留运单号、箱唛号的文本处理。

提交按钮 loading 期间禁用；成功后 `toast.success(unclaimed.submitSuccess)`、关闭弹窗、列表回第一页。

## 五、详情 Sheet

`DetailSheet` 标题用 `<DetailTitle title="无主货登记" code={registerNo} status={unclaimedStatusMeta[status]} />`（「无主货登记 · UG-… [暂存中]」，登记号、状态不在正文重复）。正文两张 `Section` 卡：

| 卡片 | 栅格 | 字段 |
| --- | --- | --- |
| 识别线索 | `Descriptions columns={4}` | 运单号、箱唛号（各自逐行列出）、柜号、箱数；实物描述（`col-span-4`）；照片（`col-span-4`，`MockPhotoList` 列文件名） |
| 登记信息 | `columns={4}` | 仓库（`CodeName`）、登记人、登记时间 |

不出现库位；只有右上角关闭，不放任何业务按钮。

## 六、Mock 动作

| Action | 入参 | 结果 |
| --- | --- | --- |
| `registerUnclaimed` | `warehouseCode`、`trackingNos`、`cartonMarks`、`containerNo?`、`cartonQty`、`description?`、`photos`、`requestId`、`operator` | 已有同 `requestId` → 返回原记录；三项线索全空 → `unclaimed.error.clueRequired`；箱数非正整数 → `error.qtyInvalid`；否则生成 UG 号写入 `unclaimedRecords`，`status='HOLDING'` |

本动作**不得**改动 `inbounds`、`receiptRecords`、`putawayOrders`、`inboundExceptions`、`inventory`、`inventoryLogs` 等任何其他集合；`mock/db.test.ts` 加一条断言：登记前后这些集合深相等。

## 七、i18n

| key | zh-CN |
| --- | --- |
| `menu.unclaimed` | 无主货登记 |
| `unclaimed.create` | 登记无主货 |
| `unclaimed.scopeHint` | 仅登记认不出货主、对不上单的实物；能确定货主的请线下联系补单，不在此登记 |
| `unclaimed.clueGroup` | 识别线索（运单号、箱唛号、柜号至少填一项） |
| `unclaimed.cartonQtyHint` | 外箱或包裹数 |
| `unclaimed.submitSuccess` | 登记成功，登记号 {{registerNo}} |
| `unclaimed.error.clueRequired` | 运单号、箱唛号、柜号至少填写一项 |
| `status.unclaimed.HOLDING` | 暂存中 |
| `unclaimed.filters.*Placeholder` | 请输入登记号 / 运单号 / 箱唛号 / 柜号；登记时间 |

en-US 同步维护。

## 八、Mock 种子与走查

种子：美西仓 2 条、美东仓 1 条登记（`UG-20261008-0001`、`UG-20261009-0001`、`UG-20261009-0002`）；每个作业仓预置 `EX-01-01`、`EX-01-02` 两个异常处理库位，代表无主货、超收实物的统一暂存区域（登记不再选库位，也不参与上架目标）。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 顶栏美西仓，打开列表 | 只见美西仓记录；页头登记 + 导出；无状态页签、无操作列 |
| 2 | 登记：填 2 个运单号、箱数 3 | 生成 UG 号，状态暂存中；列表首行；运单号列显示「第一个 +1」；表单与详情都不出现库位 |
| 3 | 登记时线索全空 | 分组标题下报错，不提交 |
| 4 | 箱数填 0 | 字段报错 |
| 5 | 登记前后查看库存页 | 各货主库存与流水不变 |
| 6 | 打开详情 | 标题「无主货登记 · UG-… [暂存中]」；两张卡片全部只读，无库位，无认领、指定货主、转入库按钮 |
| 7 | 切到美东仓 | 看不到步骤 2 的记录 |

以上走查已于 2026-10-15 在 qs-wms-demo 执行通过（列表按仓过滤、登记弹窗校验、详情只读、PDA 登记屏）；V0.3 抽屉改版后复查了详情抽屉。
