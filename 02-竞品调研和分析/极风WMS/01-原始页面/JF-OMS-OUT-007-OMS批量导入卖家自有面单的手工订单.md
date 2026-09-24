---
sourceId: "JF-OMS-OUT-007"
title: "OMS批量导入卖家自有面单的手工订单"
url: "https://help.jfwms.com/zh_CN/doc-article/7108270602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > OMS批量导入卖家自有面单的手工订单"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108270602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T09:50:52.637Z"
---

# OMS批量导入卖家自有面单的手工订单

**一、定义**

无法使用ERP推送的订单且卖家自己有面单的场景下，可以在OMS批量导入手工订单，然后在上传物流面单，最后提交至WMS后由仓库处理出库

** 二、操作流程**

**step1：登录OMS，进入出库-全部订单-批量导入**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602105909/4c3ba64cfadab7a7afe8bb0ec25d7b93.png)

**step2：点击”导入“，打开导入订单弹窗，点击下载模板**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605094848/c81b1d329689c013cbfe142b6cf16b2d.png)

**面单类型是自有面单”时，导入的信息需要必填的是：**

**（1）订单号：填写订单号，订单号不允许重复**

**（2）平台：下拉选择订单所在平台**

**（3）发货仓库：填写发货仓库名称**

**（4）面单类型：下拉选择自有面单**

**（5）物流：填写发货的物流名称（OMS中的物流模块可查询线上物流名称，如果没有，可联系仓库开启线上物流）**

**（6）运单号：填写运单号**

**（7）商品SKU：填写SKU，如果一个订单有多个SKU，则每个SKU以及对应的数量填写一行，其他信息需要填写一样的（见示例）**

**（8）数量：填写SKU对应的数量，如果一个订单有多个SKU，则每个SKU以及对应的数量填写一行，其他信息需要填写一样的（见示例）**

**（8）收件人：填写收件人姓名**

**（9）国家/地区：填写订单收件国家/地区**

**示例**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241015015539/02b2ec8c8c4505ca8f5c2c73c3c899be.jpg)

**step3：点击”导入“，打开导入订单弹窗，选择文件，点击导入**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605094909/b886e7a270fca1c24a9f7afc3ec44c70.png)

**step4：导入时如有失败的，可下载失败文件查看原因，修改之后重新导入即可**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605094936/5574cc98772b35a77d83efa38b8a797c.png)

**step5：导入成功之后，可以单个上传订单的面单PDF文件，也可以批量导入面单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110018/d255ba054cafb541a04310d88b9df166.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605095048/b54eab592c7388090345dc80cb5000e3.png)

**step6：面单上传后，可单个提交，也可以进行批量提交**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110059/2787d4dda4a8fe3f338bb71d5fd3790d.png)

**step7：面单上传后，海外仓就会收到订单，海外仓就可以在WMS系统出库模块进行拣货，打包发货啦**
