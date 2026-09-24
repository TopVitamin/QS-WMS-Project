---
sourceId: "JF-IN-016"
title: "标准入库流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7106660525-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 入库 > 标准入库流程"
category: "入库"
categoryId: 162
docId: 7106660525
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-16T04:29:29.228Z"
---

# 标准入库流程

## **一、定义**
卖家发货给仓库，为避免仓库人工沟通费时费力、或者怕仓库遗忘，卖家在【卖家端】（OMS）创建入库单，当发货后，自动推送发货单到仓库，仓库人员收到货后就清晰货主、商品，便于快速签收、收货（质检）、上架。

## ** 二、操作路径**

#### **1、仓库签收**
①登录仓库端（WMS）>入库>入库单管理>查看卖家发货到仓库的入库单信息>货到之后签收或者扫描签收

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260525084435/ea4897f416667f719854ff7237ea2902.png)

**扫描签收后，单据状态是【待入库】，可扫描入库单号/退货单号/运单号/ERP单号/平台订单号/箱唛/直邮单号/头程单号/自定义箱号进行签收**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701130628/28345d94093b2a6225a873b0111501a1.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701130703/280bad6e57e6509a79f27b440f706226.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701130748/f7e6dc6b5bf284a9532c0f5663d39ead.png)

#### **2、仓库收货**
①收货：在入库单列表页点击目标入库单的”收货“操作，或扫描入库单号、ERP单号或物流跟踪号收货

②登录仓库端（WMS）>入库>扫描收货>扫描>>确认商品到货数量、商品货架位>保存提交

③oms按自定义箱号入库备货仓库wms可按自定义箱号进行收货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701133416/151af0d4a47957ea0786481c47aad27a.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701133444/23117896fdba9e82dde6851b5c35b8eb.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701133544/cd6ec3b0b62a99c6c6650b8797dcf44e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701130311/d42e5ea50eaaf6440f13453cc5c89820.png)

#### **3、仓库上架**
上架：在待入库状态入库单需要去上架，商品库存-可用库存数则会添加

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701132215/0ab8dd197989e5140c5736e8f7c48072.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701132244/d6ba3873fc4dc2c596d984bf2a5d16d6.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701132435/84915f617ad2638646117bfe1a8b13bd.png)

可以批量清空推荐货架，重新选择实际货架进行上架

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260716023352/b3d60f842d0d54a191f5237a0d0dff07.png)

扫描上架页面可以批量打印货架位标签

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260716042905/d80ba89814ae41223e6d24d86fcee860.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260716042924/f801918118fef613f042ec62cab91468.png)

#### **箱唛模板设置**
箱唛模板可按自定义内容去设置，如需要添加自定义箱号、调整尺寸情况等

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701133004/e43c4d6208a75d5aa909c513ace1c1f3.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701133051/a520540e316162bd427edb42c4710045.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260701133120/d25db78c7ad08f8b6338501c9f495e2b.png)

**注意：**

**货主从ERP推送入库单时，在WMS获取到一个入库单，状态为“已预报”**

**货主在ERP中填写了物流跟踪号时，入库单状态置为“运输中”**

**仓库操作签收后，入库单状态为“待入库”**

**仓库在操作收货、上架的过程中，入库单状态为“入库中”**

**入库单中的所有商品都完成上架，或者仓库操作强制完成时，入库单状态为“已完成”**

**如上架过程中未填写上架数量或强制完成商品库存可用库存数则不会添加**
