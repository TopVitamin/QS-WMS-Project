# PDA库存查询前端Demo版PRD

版本：WMS-V0.1｜2026-10-15。规则见[库存查询主PRD](../../4-库存管理/库存查询/库存查询主PRD.md)，布局见[PDA库存查询页面骨架](PDA库存查询页面骨架.md)，全局交互见[PDA作业端设计规范](../PDA作业端设计规范.md)。

路由`/pda/inventory`，当前仓库从PDA首页带入。进入后自动聚焦扫码框，支持库位编码、SKU编码、商品条码、SN；按“库位→SKU／商品条码→SN”顺序识别，存在多种身份时打开整屏选择，不静默猜测。

| 扫码类型 | 成功结果 | 不命中／阻断 | 模拟候选 |
| --- | --- | --- | --- |
| 库位 | 展示该位按商品、批次、品质的库存明细 | 非本仓、停用或不存在，提示具体原因 | 当前仓有库存库位 |
| SKU／商品条码 | 展示SKU三量和库位分布 | 多货主命中时要求选择货主；无库存显示空态 | 当前仓有库存商品 |
| SN | 展示单件当前状态与最近轨迹 | 未启用SN、无权限仓或不存在分别提示 | 在库、已出库各一件 |

结果屏保留“继续扫描”主按钮，安卓返回回扫描屏；查询条件不形成业务草稿。数据与管理端库存查询共用，不在PDA另存余额。数量、待核对、盘点中和暂存不可分配提示按主PRD展示。

## 动作与文案key

| 文案 | key | 中文 | 英文 |
| --- | --- | --- | --- |
| 扫码提示 | `pda.inventory.scanPrompt` | 扫库位、商品或SN | Scan Location, Item, or SN |
| 继续扫描 | `pda.inventory.action.scanAgain` | 继续扫描 | Scan Again |
| 多货主选择 | `pda.inventory.selectOwner` | 选择货主 | Select Owner |
| 无库存空态 | `pda.inventory.empty` | 当前仓库无匹配库存 | No Matching Stock |
| 暂存不可分配 | `pda.inventory.temporaryNotAllocatable` | 暂存库存不参与分配 | Temporary Stock Is Not Allocatable |

走查360×560和320×450：三类扫码、同条码多货主、可用为负、暂存库位、待核对、盘点中、已出库SN、未授权仓。全部文案提供中英文；编码使用等宽字体。
