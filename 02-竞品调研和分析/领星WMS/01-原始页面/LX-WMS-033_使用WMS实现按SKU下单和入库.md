# 使用WMS实现按SKU下单和入库

- 来源编号: LX-WMS-033
- 原始URL: https://help.xlwms.com/12d0/d5f9/c574/dfd2
- 所属板块: WMS仓库端
- 面包屑路径: 首页 > WMS板块帮助文档 > WMS使用功能介绍 > 入库篇
- 页面类型: 操作说明
- 抓取日期: 2026-09-24
- 更新日期: 2026-08-12

---

# 使用WMS实现按SKU下单和入库


              
## 1.操作场景

**定义：**面向大件仓及卖家自建仓等场景，货物可不预先粘贴箱唛，仅按 SKU 和预报数量创建入库单，仓库端按SKU并完成收货、组托及上架作业。
## 2.操作指引


## 2.1 管理后台

（1）管理后台 - 全局设置的入库配置支持按仓开启“按 SKU 下入库单”，默认关闭；开启后，OMS 创建常规入库单时可选择预报方式“按 SKU”。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521071954/image.png)

## 2.2 OMS

（1）OMS 支持手动添加产品或批量导入 SKU、数量创建入库单；按 SKU 预报的入库单不维护箱唛信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521089745/image.png)
（2）OMS、管理后台、WMS 的入库单列表、筛选、导出和详情统一展示“预报方式”；详情仅展示按产品信息，去除箱数相关信息。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521103749/image.png)

![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521219349/image.png)

## 2.3 WMS

（1）收货页以 SKU 为操作维度，支持同一种SKU 在未达到预报数量前分多次收货，并可按需录入效期、维护新品。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521290143/image.png)
（2）启用托盘容器的仓库可按 SKU 组托收货：一个托盘可添加多个 SKU，同一 SKU 也可分配到多个托盘；系统记录托盘与 SKU 的收货数量关系。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521304432/image.png)
（3）组托收货时仅支持按 SKU 上架，也支持导入上架；已组托收货时仅支持按托盘上架。支持序列号导入、强制完结、整单收货及打印收货单、上架单。
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521321922/image.png)

## 2.4 PDA

（1）PDA 收货列表（常规入库都可以）支持扫描SKU/产品条码定位待入库或收货中的入库单；按单收货、按托盘收货均可扫描 SKU 完成收货和新品维护；兼容了入库单是否支持超收的配置项（2）按单（按SKU）收货，页面同常规入库的收货，进入收货页时，会展示所有待收货的SKU，支持扫码计数和手动输入收货数量和引用预报数量；收货中的入库单，支持强制完结
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521364126/image.png)
（3）组托收货，同常规入库的组托收货，支持扫托盘编码后，再扫描SKU绑定到托盘上
![图片](https://saas.bk-cdn01.com/t/a7eea466-35ce-488d-ba1e-c9c1fe9a6db4/u/36e61c34-115d-4aa0-be3f-486a0640abad/1786521384744/image.png)

              
                
                  
                
                2026-08-12
