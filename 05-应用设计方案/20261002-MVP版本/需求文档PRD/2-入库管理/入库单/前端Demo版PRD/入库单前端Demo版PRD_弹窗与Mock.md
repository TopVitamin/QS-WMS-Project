# 入库单前端Demo版PRD·弹窗与Mock

> **版本**：WMS-V0.4  
> **更新时间**：2026-10-14  
> **定位**：统一定义入库单**确认收货完结**、**模拟推送入库指令（Demo）**及 **Mock 数据/动作**；正式验收不以 Demo Mock 推单为准。  
> **业务规则**：[《入库单主PRD》](../入库单主PRD.md)（§6.5、R01～R02、R07～R08；F04、F06）。

列表/详情只写触发入口；**标题、正文、表单项、错误文案以本文为准**。

关联：[公共分册 §3.4](入库单前端Demo版PRD_公共与技术约定.md)。

---

## 1. 文档概述

| 章节 | 功能 | 内容 |
| --- | --- | --- |
| §2 | — | 容器选型与共用交互 |
| §3 | F04 | 确认收货完结 Dialog |
| §4 | F06 | 模拟推送入库指令 Dialog |
| §5 | — | i18n / 错误 key |
| §6 | — | Mock 种子与 `db` |
| §7 | — | 弹窗与 Mock 自检 |

### 1.1 演示验收场景（弹窗/Mock 侧）

| 场景 | AC | 要点 |
| --- | --- | --- |
| Mock 推送成功 | AC02 | 列表出现待收货单，数量正确 |
| 重复上游单号 | AC03 | `inbound.mockDuplicateUpstream`，不增单 |
| 确认收货完结 | AC08、AC12 | 弹窗列未收行；确认后状态/短少 |
| 并发/状态已变 | AC13 | 确认时 toast `receiptCloseStale` |
| 零实收取消 | AC06 | 种子0002展示终态；另从零实收单实际下发取消消息，核对受理、保留拒收与重复消息幂等 |

---

## 2. 容器与交互

| 场景 | 组件 |
| --- | --- |
| 确认收货完结、Mock 推单 | `Dialog`（遮罩 `bg-black/35`） |
| 查看单次收货/上架单 | `Sheet` 右侧 880px（见[详情分册 §5](入库单前端Demo版PRD_详情页.md)） |

- 风险确认：展示未收明细表时用**受控 Dialog**，不单用 `useConfirm`（AC12）。  
- 成功：`toast.success`；失败：`toast.error(errorKey)`。  
- 写库仅 `mock/db.ts` actions；成功后关闭弹窗并刷新列表/详情。

---

## 3. 确认收货完结（F04）

### 3.1 触发入口

| 入口 | 条件 |
| --- | --- |
| 列表行操作 | R07 |
| 详情页头 | R07 |

打开前 `recompute`；若已不满足 R07 → `toast.error(t('inbound.receiptCloseStale'))`，不展示弹窗。

### 3.2 弹窗规格

| 项 | 内容 |
| --- | --- |
| 标题 | `inbound.receiptCloseTitle` |
| 正文 | `inbound.receiptCloseDesc` |
| 明细区 | 未收>0 的行：商品编码、名称、未收数量；底部合计 |
| 按钮 | 取消（outline）、确认收货完结（default） |

### 3.3 提交逻辑

`confirmReceiptClose(inboundNo)`：

1. 再次校验 R07。  
2. 写 `receiptCloseFlag=CONFIRMED`、`receiptClosedBy`、`receiptClosedAt`。  
3. `recompute`；若已全部上架则 `completedAt`。  
4. 幂等：已确认则 `{ ok: true }` 不改人/时（主 PRD §11.2）。

并发：失败 key `inbound.receiptCloseStale`（AC13）。

---

## 4. 模拟推送入库指令（F06，仅 Demo）

### 4.1 触发

列表页头按钮；任意单据状态可用。

### 4.2 表单字段

| 字段 | 必填 | 控件 | i18n / 校验失败 |
| --- | --- | --- | --- |
| 货主 | ✅ | `Select`（默认 ANKR） | `common.selectPlaceholder`；未选 `inbound.mock.ownerRequired` |
| 仓库 | ✅ | 只读展示顶栏仓 | 默认顶栏仓 |
| 业务类型 | ✅ | `Select` | — |
| 上游单号 | ✅ | `Input` | `inbound.filters.upstreamNoPlaceholder`；空 `inbound.mock.upstreamRequired` |
| 明细商品 | ✅ | `Select`（该货主**启用**的商品资料 `skuMasters`） | 非本货主/未启用 SKU → `inbound.mock.skuInvalid` |
| 明细预计数量 | ✅ | `Input` number | ≤0 → `inbound.mock.qtyInvalid` |

> 页面可保留单行快速推单，但完整Mock收发台须支持一张单1～多SKU、到货方式、预计到仓时间、柜号、运单及箱唛线索。同一SKU不重复行；多SKU不能通过多次新建指令冒充一张单。现有原型是否支持完整表单需按实现核验。

校验 R02：货主/仓/SKU/数量；按来源＋业务类型＋上游单号定位对象、消息标识去重（AC03）→ `inbound.mockDuplicateUpstream`。

### 4.3 提交流程

```text
点击「推送」 → 前端校验 R02 → mockPushInboundInstruction
  → 重复上游：toast.error(mockDuplicateUpstream)，不关窗
  → 成功：toast.success(mockPushSuccess) → 关窗 → 刷新列表（定位新单可选）
```

`mockPushInboundInstruction` → 生成 `IB-yyyymmdd-####`，`recompute`，关闭 Dialog。

---

## 5. i18n 与错误 key

| key | 中文 |
| --- | --- |
| `inbound.receiptClose` | 确认收货完结 |
| `inbound.receiptCloseTitle` | 确认收货完结？ |
| `inbound.receiptCloseDesc` | 确认后不再接收到货；已收货物可继续上架。未收数量将记为最终短少。 |
| `inbound.receiptCloseSuccess` | 已确认收货完结 |
| `inbound.receiptCloseStale` | 单据状态已变化，请刷新 |
| `inbound.mockPush` | 模拟推送入库指令（Demo） |
| `inbound.mockPushSuccess` | 入库指令已接收，已生成入库单 {{no}} |
| `inbound.mockDuplicateUpstream` | 该货主下上游单号已接收 |
| `inbound.mock.ownerRequired` | 请选择货主 |
| `inbound.mock.upstreamRequired` | 请填写上游单号 |
| `inbound.mock.skuInvalid` | 商品不属于当前货主或未启用 |
| `inbound.mock.qtyInvalid` | 预计数量须大于 0 |
| `inbound.shortage` | 短少 |
| `inbound.bulkPiece` | 无容器收货 |
| `inbound.receive.containerAlreadyUsedNo` | 该作业容器在本单已确认收货，请更换作业容器 |

`zh-CN.ts` / `en-US.ts` 同步。

---

## 6. Mock 数据

### 6.1 文件

| 路径 | 职责 |
| --- | --- |
| `mock/inbound-seed.ts` | 固定场景单 |
| `lib/inbound-derive.ts` | 派生（状态、进度、暂存库位） |
| `lib/doc-no.ts` | 单号生成 `IB/RC/PA/EX-yyyyMMdd-四位流水` |
| `mock/db.ts` | actions；改种子 `persist version +1` |

### 6.2 固定种子（`US-LA-01` / `ANKR`）

| 后四位 | 场景 |
| --- | --- |
| 0001 | 待收货 |
| 0002 | 全部拒收 S06 → 上游取消受理，已取消（AC06） |
| 0003 | 分批 + 可确认完结 |
| 0004 | 上架中仅保存 AC09 |
| 0005 | 已完成 + 短少 AC10（不良品已上架到不良隔离库位） |
| 0006 | 批次效期 AC18 |
| 0007 | 整行未到货 AC11 |
| 0008 | 无容器收货上架 AC19 |
| 0009 | 调拨 + 快递、双 SKU、分批收货中（列表 Web/PDA 收货走查） |

其它顶栏仓库：`IB-20261001-*` 填充单；`US-NJ-01` 第二条为部分实收（收货中）。
种子自洽：已完成单均带收货记录与上架单；入库异常的收货记录号均指向真实收货记录。

AC02 推送：`OMS-IN-DEMO-001` + CABLE-01×500。  
主 PRD AC 表括号内后四位对应本表。

---

## 7. 自检

- [ ] 弹窗文案只维护于本文  
- [ ] 列表/详情仅引用 §3、§4 入口  
- [ ] 种子与附录示例 A/B 数量自洽  
