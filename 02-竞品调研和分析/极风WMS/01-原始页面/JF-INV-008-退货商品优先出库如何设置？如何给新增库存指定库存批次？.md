---
sourceId: "JF-INV-008"
title: "退货商品优先出库如何设置？如何给新增库存指定库存批次？"
url: "https://help.jfwms.com/zh_CN/doc-article/7113720713-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 库存管理 > 退货商品优先出库如何设置？如何给新增库存指定库存批次？"
category: "库存管理"
categoryId: 161
docId: 7113720713
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-15T10:53:47.735Z"
---

# 退货商品优先出库如何设置？如何给新增库存指定库存批次？

## **一、需求场景**
之前极风退货入库的商品会产生新的批次，导致仓库拦截发货的商品会重新计库龄，仓库会少收取一部分仓租费；再加上系统先进先出原则，退货商品都默认是最晚批次，但部分海外仓需要退货商品优先出库，因此我们上线了退货商品优先出库需求。

## **二、操作步骤**

# **1.设置-入库设置-入库流程设置 中开启退货商品优先出库**

![退货商品优先出库.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260713120239/b73720abac6918054ef691d21a5a7021.png)

**（开启后，针对物流商退货入库单，系统会追溯原出库单的批次库存，继续计算库龄；针对非物流商退货入库单，非新品SKU插入最远批次，新品SKU默认当天入库）**

# **2.仓库-库存调整 可指定批次进行调整**

![库存调整指定批次调整1.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260713120517/d6917d98bfef0632eea9a0c6a86014a6.png)

![库存调整指定批次号2.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260713120529/2348a6f4c799e26eaf6d5fa38dcb963f.png)

# **3.库存盘点时 可指定库存批次**

![库存盘点1.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260713120709/10cd52b6a7b703192a13b57420581c86.png)

![库存盘点2.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260713120721/31d93034b60c5db9e3e71812e7fe09bd.png)

![库存盘点3.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/77/20260713120731/25429d9adc73049b2ec1449aa6c24325.png)
