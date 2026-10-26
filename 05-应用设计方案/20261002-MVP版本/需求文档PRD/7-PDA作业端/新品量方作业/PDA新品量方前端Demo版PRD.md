# PDA新品量方前端Demo版PRD

> **版本**：WMS-V0.1  
> **更新时间**：2026-10-15  
> **定位**：供 AI / 研发实现 PDA 收货中的新品量方屏：收货扫到新品时自动进入、可识别的码、量方录入与校验、返回、反馈与 Mock。  
> **业务真源**：[《新品维护主PRD》](../../2-入库管理/新品维护/新品维护主PRD.md)第二～五节（新品判断、量方录入、提交校验、入口）。管理端实现与 `submitNewSkuMeasure` 定义见[《新品维护前端Demo版PRD》](../../2-入库管理/新品维护/新品维护前端Demo版PRD.md)；收货步骤见[《PDA收货前端Demo版PRD》](../收货作业/PDA收货前端Demo版PRD.md)。  
> **边界**：PDA 不设首页「新品维护」入口，也不做独立量方；量方只在收货中发生，独立量方与记录查询只在管理端。不接电子秤、DWS，照片为模拟上传；不更正、不重新量方。

**样式与交互服从[《PDA作业端设计规范》](../PDA作业端设计规范.md)**；布局见[《PDA新品量方页面骨架》](PDA新品量方页面骨架.md)。

---

## 1. 能力概述

| 项目 | 内容 |
| --- | --- |
| 作业对象 | 收货中遇到的新品：入库单货主＋SKU没有维护记录。提交成功生成一条新品维护记录，写入该货主商品的仓内规格 |
| 路由 | 收货作业的一步：`/pda/receive?step=measure&box=<容器号>&sku=<SKU>`，货主与来源入库单取自收货作业 |
| 入口 | 只有一个：PDA 收货容器作业扫到或点选新品时自动进入（§3）。首页没有宫格 |
| 维护仓库 | 标题栏当前仓库；决定录入单位（公制 cm、kg，英制 inch、lb） |
| 数据动作 | `submitNewSkuMeasure`（与管理端量方弹窗共用，`mock/db.ts`），PDA 不另起动作 |
| 入口条件 | 新品必须先量方才能收；一期不配置用户账号、角色或本仓权限，页面按当前仓库上下文提供维护入口 |

## 2. 返回与草稿

| 屏幕 | 进入方式 | 安卓返回键 / 标题栏返回 |
| --- | --- | --- |
| 量方录入 | 收货容器作业扫到或点选新品 | 回收货容器作业；已填数值时先确认放弃 |

- 量方录入是收货作业压入的一条浏览历史：返回与提交成功都用历史后退回容器作业，收货暂存原样保留（见收货 PRD §6）。
- 返回后该商品仍不能收货，再扫仍自动进入量方录入；同单其他商品照常收货（主PRD 第二节第 3 条）。
- 量方录入**不进本机草稿**：货主、SKU、入库单都来自收货作业，刷新后按路由参数回到同一商品，只需重填四个数字。
- 路由参数里的商品已有维护记录（刷新前已在别处提交）→ 弹已有记录阻断，「知道了」后回容器作业，该商品可收。
- 提交成功即为业务记录；返回不影响已生成的记录。

## 3. 收货中的自动进入

收货容器作业扫到或点选本单商品时，先按本单货主判断是否新品（`isNewSku`）：

| 情况 | 处理 |
| --- | --- |
| 已有维护记录 | 照常进入本行录入 |
| 新品 | 业务阻断音 + 震动，直接进入量方录入，顶部一行橙色提示「{{skuCode}} 是新品，须先完成量方才能收货」；不弹确认、不提供跳过 |

- 触发进入的那次扫码不计数；量方完成回到容器作业后重新扫码收货。
- 收货提交仍由 `submitReceipt` 逐行校验新品（见新品维护 Demo PRD 第三节），自动进入只是把阻断提前到扫码时。
- 管理端独立量方过的商品，PDA 扫码时已不是新品，不会进入本屏。

## 4. 可识别的码

| 屏幕 | 可识别 | 命中 | 不命中 |
| --- | --- | --- | --- |
| 量方录入 | 当前商品的 SKU 编码、货主条码、主条码 | 轻提示「已是当前商品」，不做其他处理 | 其他商品：扫码错误「正在量方 {{skuCode}}，请先提交或返回」 |

- 本屏没有扫码框，由页面级监听接收扫码；数字框获得焦点时收到扫码内容，不写入数值。判断扫码：含数字和小数点以外的字符，或整数部分超过 6 位（规范 §4.2 按小数放宽）。
- 模拟扫码候选：本屏不需要；收货容器作业的候选里加入本单的新品主条码，用于演示自动进入。

## 5. 量方录入

| 项 | 规则 |
| --- | --- |
| 商品卡片 | SKU 编码（大号等宽）、名称最多两行、主条码、货主编码与名称 |
| 预报规格 | 取商品当前长宽高、毛重，按当前仓库单位换算展示（`cmToLength`、`kgToWeight`）；无值显示「—」 |
| 长、宽、高 | 必填，大于 0，最多 2 位小数；`inputmode="decimal"`，默认空 |
| 毛重 | 必填，大于 0，最多 3 位小数；默认空 |
| 照片 | 选填；「拍照」用文件选择（`accept="image/*" capture`），Demo 存文件名并显示缩略图；一期不接附件服务，不校大小与张数 |
| 备注 | 选填；点按展开单行输入 |
| 字段校验 | 离开数字框时校验，错误写在该框下方一行；数字框不用步进器 |
| 提交量方 | 四个数值都合法时可点；不可点时底部写第一个缺失或不合法的字段（如「请填写毛重」） |
| 幂等 | 进入量方录入时生成 `requestId`；请求中按钮 loading，重复点击返回同一记录 |

提交结果：

| 结果 | 级别 | 去向 |
| --- | --- | --- |
| 成功 | 成功：「量方完成，记录号 {{recordNo}}」 | 历史后退回容器作业，提示重新扫码收货 |
| `newSku.error.exists` | 业务阻断：已有记录弹窗（记录号、维护仓库、维护人、时间） | 「知道了」后回容器作业；该商品已可收货 |
| `newSku.error.inactive` | 业务阻断 | 「知道了」后留在本屏 |
| 字段不合法（动作兜底） | 业务阻断 | 留在本屏，指出字段 |

## 6. 反馈与文案

| 场景 | 级别（规范 §5） | key |
| --- | --- | --- |
| 收货扫到新品 | 业务阻断音，自动进入本屏 | `pdaNewSku.blockedHint` |
| 量方中扫到其他商品 | 扫码错误 | `pdaNewSku.finishCurrentFirst` |
| 量方中扫到当前商品 | 轻提示 | `pdaNewSku.sameSku` |
| 已有维护记录 | 业务阻断 | `newSku.error.exists` |
| 货主或商品停用 | 业务阻断 | `newSku.error.inactive` |
| 放弃录入 | 需确认 | `pdaNewSku.discardTitle` |
| 提交成功 | 成功 | `newSku.submitSuccess` |

新增文案：

| key | zh-CN | en-US |
| --- | --- | --- |
| `pdaNewSku.title` | 新品量方 | Measure new SKU |
| `pdaNewSku.blockedHint` | {{skuCode}} 是新品，须先完成量方才能收货 | {{skuCode}} is new. Measure it before receiving |
| `pdaNewSku.forecast` | 预报 | Forecast |
| `pdaNewSku.length` / `width` / `height` / `grossWeight` | 长 / 宽 / 高 / 毛重 | Length / Width / Height / Gross weight |
| `pdaNewSku.photo` / `takePhoto` | 照片 / 拍照 | Photo / Take photo |
| `pdaNewSku.remark` | 备注 | Remark |
| `pdaNewSku.fillField` | 请填写{{field}} | Enter {{field}} |
| `pdaNewSku.fieldInvalid` | {{field}}须大于 0，最多 {{digits}} 位小数 | {{field}} must be > 0, up to {{digits}} decimals |
| `pdaNewSku.finishCurrentFirst` | 正在量方 {{skuCode}}，请先提交或返回 | Measuring {{skuCode}}. Submit or go back first |
| `pdaNewSku.sameSku` | 已是当前商品 | Already on this SKU |
| `pdaNewSku.discardTitle` | 放弃本次量方录入？ | Discard measurements? |
| `pdaNewSku.discardBody` | 已填的数值不会保存，该商品仍不能收货 | Values will be lost. This SKU stays blocked |
| `pdaNewSku.backToReceive` | 量方完成，请重新扫描商品收货 | Measured. Scan the SKU again to receive |

沿用管理端：`newSku.submit`（提交量方）、`newSku.submitSuccess`、`newSku.error.exists`、`newSku.error.inactive`。字段名后的单位直接显示符号 cm、inch、kg、lb，不进语言包。

## 7. Mock 动作

| Action | PDA 入参 | 结果 |
| --- | --- | --- |
| `submitNewSkuMeasure` | `customerId`（入库单货主）、`skuCode`、`warehouseCode`（标题栏当前仓库）、`sourceInboundNo`（当前入库单号）、长宽高与毛重（按当前仓库单位）、`photos`、`remark?`、`requestId`、`operator` | 与管理端完全相同，见新品维护 Demo PRD 第七节：同 `requestId` 返回原记录；已有同货主SKU记录返回 `newSku.error.exists` 及已有记录；否则换算为 cm、kg，生成 NS 号并写回商品仓内规格 |

PDA 不改收货暂存：量方成功后，容器作业再次扫码时 `isNewSku` 为假，自然放行。

## 8. 实现说明

| 项 | 路径 |
| --- | --- |
| 量方屏 | `pages/pda/receive/new-sku-measure-step.tsx`，挂在 `receive-page.tsx` 的 `step=measure` |
| 新品判断 | `lib/new-sku.ts`（`isNewSku`、`findNewSkuRecord`，与管理端共用） |
| 单位换算 | `lib/unit.ts`（与管理端共用） |
| 自动进入 | `receive-page.tsx` 容器作业：扫到或点选商品前调用 `isNewSku`，命中则 `beep('error')` 并压入 `step=measure` |
| 步骤与返回 | `hooks/use-pda-step.ts` |

## 9. 走查

种子沿用新品维护 Demo PRD 第九节：待收货入库单含一个已维护SKU和一个新品SKU。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | PDA 首页 | 入库组没有「新品维护」宫格 |
| 2 | 收货 → 选种子入库单 → 扫容器 → 模拟扫新品主条码 | 阻断音；直接进入量方录入，顶部提示是新品；上下文条显示入库单与容器；单位与标题栏仓库一致 |
| 3 | 不填，按安卓返回键 | 回到容器作业，本容器明细不变；再扫该商品又自动进入量方录入；扫已维护商品照常收货 |
| 4 | 只填长宽高 | 「提交量方」不可点，底部写「请填写毛重」 |
| 5 | 点开毛重框后扫一个其他商品条码 | 毛重不变；扫码错误「正在量方…」 |
| 6 | 填毛重 → 提交量方 | 成功提示记录号；回到容器作业，已录明细不变；再扫该商品进入本行录入 |
| 7 | 管理端新品维护列表 | 出现该记录，来源入库单号为该单 |
| 8 | 量方录入页填了长度后按安卓返回键 | 弹放弃确认；放弃后回容器作业 |
| 9 | 快速双击「提交量方」 | 只有一条记录 |

## 10. 本文自检

- [ ] 判断只看维护记录，按入库单货主判断
- [ ] 首页无入口；新品在收货中自动进入，无跳过
- [ ] 与管理端共用 `submitNewSkuMeasure`，单位按当前仓库换算
- [ ] 提交或返回后回到收货，收货暂存不丢
- [ ] 量方页扫码不写入数字框
- [ ] 360×616 下四个数字框与「提交量方」可见
- [ ] 中英文完整
