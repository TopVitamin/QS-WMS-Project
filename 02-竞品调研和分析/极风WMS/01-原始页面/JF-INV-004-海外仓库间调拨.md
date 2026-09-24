---
sourceId: "JF-INV-004"
title: "海外仓库间调拨"
url: "https://help.jfwms.com/zh_CN/doc-article/7106380522-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 库存管理 > 海外仓库间调拨"
category: "库存管理"
categoryId: 161
docId: 7106380522
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-05-22T02:34:37.338Z"
---

# 海外仓库间调拨

**一、定义**

海外仓库间调拨，是指跨境电商卖家或者海外仓有多个实体仓库，当其中一个仓库商品即将缺货时，把其他仓库的商品调拨过去。

当原仓库调拨、配送后，原仓库将产生出库记录，原仓库库存自动减少

新仓库将产生入库记录，入库后新仓库库存自动增加。

注意：

1、调拨只会影响库存数量，即A仓库商品数量调拨至B仓库， A仓库原有商品信息还是会存在，不会删除商品sku信息；

2、仓库调拨后，商品库龄会按原库龄计算。

### 
** 二、操作路径**

##### 
**第一步：极风WMS创建调拨单**

**极风WMS-仓库-库内作业-库间调拨-创建调拨单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260522020543/20038d576ae484063446e2cf683dc38c.png)

##### 

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260522020608/c9dfe8862b734b0a6dc99a6d2d45538c.png)

**第二步：填写仓库调拨信息**

**选择发货仓库、收货仓库，调拨类型，添加商品和数量，保存，调拨单进入待出库**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260210111019/d928dfdecba5640452af5a542d838b07.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260210111052/e37e03689e8b223a13f3e5823dcaca11.jpg)

**创建调拨单后，调拨单进入待出库。 **

**第三步：调拨发货**

**待出库-选择调拨单-打印调拨单，已经发货后点击出库**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260522021642/e8601d9d68af0cb88a7cd62bc1bb1a4a.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20260210111117/7badda683fcd0eec733af2dcd02e3f7d.jpg)

##### 
**第四步：收货入库**

**调拨单进入目的仓库后，收货仓库可以收获和上架，填写到货数量、扫描条码录入数量，确定**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260522021731/a6d9e5ddac8d42c2a0190d4388be84a4.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260522023330/233356740132604bc9b6e91abb1b5ed2.png)

**第五查看调拨出入库信息**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260522023432/8256cb60c34cef1f07053ff9edf39a39.png)
