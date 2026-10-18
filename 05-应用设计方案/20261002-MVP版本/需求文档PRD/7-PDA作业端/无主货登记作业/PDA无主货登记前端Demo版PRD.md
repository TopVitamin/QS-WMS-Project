# PDA无主货登记前端Demo版PRD

> **版本**：WMS-V0.1  
> **更新时间**：2026-10-15  
> **定位**：供 AI / 研发实现 PDA 无主货登记（`/pda/unclaimed`）：单屏表单，业务员录入线索、箱数，拍照，提交登记。  
> **业务真源**：[《无主货登记主PRD》](../../2-入库管理/无主货登记/无主货登记主PRD.md)第一～四节。管理端实现与 `registerUnclaimed` 定义见[《无主货登记前端Demo版PRD》](../../2-入库管理/无主货登记/无主货登记前端Demo版PRD.md)。  
> **边界**：只登记，不查询、不认领、不指定货主、不转入库；无主货不涉及新品量方；照片为模拟上传。

**样式与交互服从[《PDA作业端设计规范》](../PDA作业端设计规范.md)**；布局见[《PDA无主货登记页面骨架》](PDA无主货登记页面骨架.md)。

---

## 1. 能力概述

| 项目 | 内容 |
| --- | --- |
| 作业对象 | 一批认不出货主、对不上单的同来源实物，登记一条；实物统一放本仓无主货暂存区域，登记不选库位 |
| 路由 | `/pda/unclaimed`；单屏，无步骤参数 |
| 入口 | 首页入库组「无主货登记」宫格；宫格只对有本仓无主货登记权限的用户显示，Demo 当前用户默认有权限 |
| 仓库 | 标题栏当前仓库，登记后不可改 |
| 数据动作 | `registerUnclaimed`（与管理端登记弹窗共用，`mock/db.ts`），PDA 不另起动作 |

## 2. 表单字段

字段与校验同管理端登记弹窗，PDA 只换控件。

| 字段 | 控件 | 规则 |
| --- | --- | --- |
| 运单号 | 多行文本，每行一个 | 去首尾空格、去空行、去重 |
| 箱唛号 | 多行文本，每行一个 | 同上 |
| 柜号 | 单行文本 | 去首尾空格 |
| 线索校验 | — | 三项处理后全空 → 柜号下方一行提示 `unclaimed.error.clueRequired` |
| 箱数 | 步进器，默认空，点「+」从 1 开始 | 必填，正整数 |
| 照片 | 「拍照」用文件选择（`accept="image/*" capture`） | 选填；Demo 存文件名并显示缩略图，一期不接附件服务、不校大小与张数 |
| 实物描述 | 多行文本 | 选填 |

页面顶部一行范围提示 `pdaUnclaimed.scopeHint`。

## 3. 扫码

不设专门的扫码框，扫码作为线索框和库位的快捷输入。

| 情况 | 处理 |
| --- | --- |
| 焦点在运单号或箱唛号框 | 追加为新的一行；同框已有同一号码 → 扫码错误 `pdaUnclaimed.duplicate` |
| 焦点在柜号框 | 填入，覆盖原值 |
| 焦点在箱数框 | 不写入箱数（规范 §4.2），忽略 |
| 扫到库位码 | 忽略（登记不选库位，无主货统一放专门暂存区域） |
| 没有焦点 | 记入运单号 |

- 进入页面自动聚焦运单号框。
- 模拟扫码候选（Demo）：一个运单号、一个箱唛号（按已录内容递增，不与任何入库单重复）、一个可用异常处理库位、一个存储库位（演示扫码错误）。

## 4. 提交与返回

| 项 | 规则 |
| --- | --- |
| 提交登记 | 线索至少一项、箱数为正整数时可点；不可点时底部写第一个缺失项。点按后弹提交确认：箱数，提示提交后不能修改或删除 |
| 幂等 | 进入页面时生成 `requestId`，确认提交期间按钮 loading，重复点击返回原 UG 号 |
| 成功 | 成功提示「登记成功，登记号 {{registerNo}}」；清空表单，换新的 `requestId`，留在本屏 |
| 失败 | 动作返回的 `errorKey` 用业务阻断弹窗提示，表单内容保留 |
| 返回 | 安卓返回键 = 标题栏返回 = 回首页；已填任何内容时先弹放弃确认 |
| 草稿 | 不存本机草稿：只是一屏信息录入；刷新后表单清空 |

## 5. 反馈与文案

| 场景 | 级别（规范 §5） | key |
| --- | --- | --- |
| 同框号码重复 | 扫码错误 | `pdaUnclaimed.duplicate` |
| 提交确认、放弃确认 | 需确认 | `pdaUnclaimed.submitTitle`、`pdaUnclaimed.discardTitle` |
| 提交失败 | 业务阻断 | 动作返回的 `errorKey` |
| 提交成功 | 成功 | `unclaimed.submitSuccess` |

新增文案：

| key | zh-CN | en-US |
| --- | --- | --- |
| `pdaUnclaimed.title` | 无主货登记 | Unidentified Goods |
| `pdaUnclaimed.scopeHint` | 认得出货主的不在此登记，请联系补单 | Known customer? Don't register here |
| `pdaUnclaimed.trackingNos` / `cartonMarks` / `containerNo` | 运单号 / 箱唛号 / 柜号 | Tracking No. / Carton mark / Container No. |
| `pdaUnclaimed.onePerLine` | 每行一个 | One per line |
| `pdaUnclaimed.cartonQty` | 箱数 | Cartons |
| `pdaUnclaimed.photo` / `takePhoto` / `description` | 照片 / 拍照 / 实物描述 | Photo / Take photo / Description |
| `pdaUnclaimed.submit` | 提交登记 | Register |
| `pdaUnclaimed.submitTitle` | 提交无主货登记？ | Register these goods? |
| `pdaUnclaimed.submitBody` | 提交后不能修改或删除 | Cannot be edited or deleted later |
| `pdaUnclaimed.discardTitle` | 放弃本次登记？ | Discard this registration? |
| `pdaUnclaimed.discardBody` | 已填的内容和照片不会保存 | Entries and photos will be lost |
| `pdaUnclaimed.keepEditing` / `discard` | 继续填写 / 放弃 | Keep editing / Discard |
| `pdaUnclaimed.duplicate` | {{code}} 已录入 | {{code}} already added |
| `pdaUnclaimed.fillCartonQty` | 请填写箱数 | Enter cartons / Select a location |

沿用管理端：`unclaimed.cartonQtyHint`、`unclaimed.submitSuccess`、`unclaimed.error.clueRequired`、`error.qtyInvalid`。

## 6. Mock 动作

| Action | PDA 入参 | 结果 |
| --- | --- | --- |
| `registerUnclaimed` | `warehouseCode`（标题栏当前仓库）、`trackingNos`、`cartonMarks`、`containerNo?`、`cartonQty`、`description?`、`photos`、`requestId`、`operator` | 与管理端完全相同，见无主货登记 Demo PRD 第六节：同 `requestId` 返回原记录；生成 UG 号、状态暂存中；不改动任何其他集合 |

## 7. 实现说明

| 项 | 路径 |
| --- | --- |
| 页面 | `pages/pda/unclaimed-page.tsx` |
| 文本处理 | 运单号、箱唛号去空行去重，抽到 `lib/unclaimed.ts` |
| 页面级扫码 | `hooks/use-pda-scan-listener.ts` |
| 首页宫格 | `pages/pda/pda-home-page.tsx`：「无主货登记」由「待上线」改为可用 |

## 8. 走查

种子沿用无主货登记 Demo PRD 第八节：美西仓有 2 条登记、美东仓 1 条；登记不选库位。

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 首页 → 无主货登记，什么都不填 | 「提交登记」不可点，底部写缺失项 |
| 2 | 模拟扫两个运单号，再扫同一个 | 运单号两行；第三次扫码错误「已录入」 |
| 4 | 箱数点 + 三次，拍一张照片 | 「提交登记」可点 |
| 5 | 按安卓返回键 | 弹放弃确认；「继续填写」后内容仍在 |
| 6 | 提交登记 → 确认 | 成功提示 UG 号；表单清空 |
| 7 | 管理端无主货登记列表（美西仓） | 首行为该记录，运单号列「第一个 +1」，箱数 3；各货主库存与流水不变 |
| 8 | 确认弹窗里快速双击「确认提交」 | 只有一个 UG 号 |

## 9. 本文自检

- [ ] 线索至少一项、箱数正整数；登记不选库位，与管理端一致
- [ ] 与管理端共用 `registerUnclaimed`；登记不动库存与其他单据
- [ ] 360×560 下「提交登记」可见；有内容时返回需确认
- [ ] 无认领、指定货主、转入库入口
- [ ] 中英文完整
