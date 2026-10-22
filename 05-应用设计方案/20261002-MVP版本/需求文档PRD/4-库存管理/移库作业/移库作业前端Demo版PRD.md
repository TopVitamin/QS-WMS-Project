# 移库作业前端Demo版PRD

> 用途：实现[移库作业主PRD](移库作业主PRD.md)的管理端记录查询。PDA执行见[PDA移库前端Demo版PRD](../../7-PDA作业端/移库作业/PDA移库前端Demo版PRD.md)，布局见[移库作业页面骨架](移库作业页面骨架.md)，字段见[移库作业详细稿](../../../字段清单合集/04-库存与库内/移库作业/移库作业（详细稿）.tsv)。
> 版本：WMS-V0.1｜日期：2026-10-15。

**样式与组件**：布局与占位须符合[需求文档PRD／AGENTS.md](../../AGENTS.md)“布局硬规则”。本页不提供新建移库。

## 一、页面与路由

| 路由 | 页面 |
| --- | --- |
| `/wms/inventory/moves` | 移库作业列表 |
| `/wms/inventory/moves/:moveNo` | 移库作业详情 |

当前仓库过滤；无权限或不存在显示统一未找到态。

## 二、列表

`FilterBar columns={6}`。

| 筛选项 | 区域 | 控件 | 匹配／取值 | Placeholder key |
| --- | --- | --- | --- | --- |
| 移库作业号 | 常显 | Input | 精确或前缀匹配 | `common.inputPlaceholder` |
| SKU | 常显 | Input | 编码／名称空格分词包含 | `common.inputPlaceholder` |
| 货主 | 常显 | Select | 精确匹配 | `common.selectPlaceholder` |
| 源库位 | 常显 | Input | 编码／名称包含 | `common.inputPlaceholder` |
| 目标库位 | 常显 | Input | 编码／名称包含 | `common.inputPlaceholder` |
| 提交时间 | advanced | DateRangePickerField | 时间范围 | `inventory.move.submittedRangePlaceholder` |
| 操作者 | advanced | Select | 精确匹配 | `common.selectPlaceholder` |

DataTable列与顺序以[移库作业页面骨架](移库作业页面骨架.md)为准。作业号进入详情，页头仅导出。

源／目标摘要：单一库位显示编码＋名称，多库位显示“首个库位等n个”，悬停或无障碍文本列全。移库总数为各行数量合计，详情仍按SKU分行。

## 三、详情

使用“基本信息＋汇总卡＋多页签”：移库明细、库存流水、操作日志。每条明细展示商品、源／目标库位、批次、SN清单、品质、数量和两条流水链接。详情无编辑、撤销、再次执行按钮。

## 四、Mock与走查

每仓至少两条记录：单行普通SKU、多行含批次／SN。PDA提交成功后管理端立即能查到同一MV号、操作者和两条独立流水；重复提交不新增记录。走查筛选、跨仓、详情、流水跳转、未授权仓和导出。
