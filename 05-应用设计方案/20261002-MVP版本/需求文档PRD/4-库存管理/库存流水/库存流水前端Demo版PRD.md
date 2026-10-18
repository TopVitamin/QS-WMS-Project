# 库存流水前端Demo版PRD

> 用途：实现[库存流水主PRD](库存流水主PRD.md)的只读查询。布局见[库存流水页面骨架](库存流水页面骨架.md)，字段见[库存流水详细稿](../../../字段清单合集/04-库存与库内/库存流水/库存流水（详细稿）.tsv)。本文不重复记账规则，不表示现有页面已经验收。
> 版本：WMS-V0.1｜日期：2026-10-15。

**样式与组件**：布局与占位须符合[需求文档PRD／AGENTS.md](../../AGENTS.md)“布局硬规则”。

## 一、路由与URL状态

`/wms/inventory/logs`。筛选、排序、分页写入URL；从库存查询跳转时带入仓库、货主、SKU以及可用的库位、批次或SN条件。

## 二、FilterBar

`columns={6}`。

| 筛选项 | 区域 | 控件 | 匹配／取值 | Placeholder key |
| --- | --- | --- | --- | --- |
| 流水号 | 常显 | Input | 精确或前缀匹配 | `common.inputPlaceholder` |
| 流水类型 | 常显 | Select | 单选；空值表示全部 | `common.selectPlaceholder` |
| 来源单号 | 常显 | Input | 包含 | `common.inputPlaceholder` |
| SKU | 常显 | Input | 编码／名称空格分词包含 | `common.inputPlaceholder` |
| 业务发生时间 | 常显 | DateRangePickerField | 时间范围 | `inventory.logs.occurredRangePlaceholder` |
| 货主 | advanced | Select | 精确匹配 | `common.selectPlaceholder` |
| 库位 | advanced | Input | 编码／名称包含 | `common.inputPlaceholder` |
| 批次 | advanced | Input | 包含 | `common.inputPlaceholder` |
| SN | advanced | Input | 精确匹配 | `common.inputPlaceholder` |

## 三、DataTable

默认业务发生时间倒序。列与顺序以[库存流水页面骨架](库存流水页面骨架.md)为准。流水号点开详情抽屉；来源单据为空时显示“—”，有值时按类型进入对应详情。

- 变化量使用带符号整数；排序按数值，不按格式化文本。
- 订单占用类的库位、批次、品质显示“—”；实际类必须关联库存明细。
- 页面不提供选中、批量编辑、删除或冲销。

## 四、详情抽屉

抽屉展示变动摘要、余额维度、来源关联、成对流水、SN清单、原因说明和操作留痕。成对流水按同一动作标识查询，移库、品质转换、上架等应同时返回减项和加项；找不到配对时显示数据异常提示，不在前端补造。

## 五、Mock与走查

样例覆盖10种流水类型；至少含一组收货入账、一组成对上架、一组成对移库、一组成对品质转换、一次预占与释放、一次盘点调整、一次确认出库扣减。走查从SKU、库存明细、SN和来源单据进入；验证重复业务提交不会多出流水。导出按当前筛选和仓库范围，时间列标注展示时区。
