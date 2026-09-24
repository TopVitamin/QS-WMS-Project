---
sourceId: "JF-OUT-031"
title: "仓库发货标记订单发货设置"
url: "https://help.jfwms.com/zh_CN/doc-article/7107520601-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 仓库发货标记订单发货设置"
category: "出库"
categoryId: 170
docId: 7107520601
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-01T09:45:44.337Z"
---

# 仓库发货标记订单发货设置

**一、定义**

为减轻仓库工作量，提升发货效率，仓库打包发货，有以下几个设置：

1.手动点发货2.打印面单时自动点发货3.扫描验货时自动发货4.逐个包裹扫描发货

需要根据海外仓使用场景，选择合适的发货模式。实现提高效率，同时避免包裹重发。

注意：**所有订单，只有点发货，才会扣减库存，卖家端（OMS）的订单状态也才会进入已发货。所以订单打包好，一定要点发货。**

### 
 **二、操作路径**

方式一：手动点发货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094109/31ecd541d034f566634855adf70260f1.png)

#### 
方式二：打印面单自动点发货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601094333/3654768a983c4482a357058f52bbc5bf.png)

#### 
方式三：扫描验货自动点发货设置

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075317/e9c5449da69796b208908b2cd0688cef.png)

#### 
方式四：扫描发货

在扫描发货环节，有三种扫描发货模式：先扫描单号后称重、先称重后扫描单号、不称重

**第一步：设置扫描发货规则**

**设置**>业务设置>出库设置>扫描发货>先扫描单号后称重或者先称重后扫描单号，或者不称重

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601075431/0e83556956295bb5d1094f1d55ce2535.png)

**第二步：扫描发货**

**操作路径：出库**>扫描发货>扫描包裹

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601080807/edaba62ff4a19bc4346fd2ce4dad373b.png)

1.先扫描单号后称重

（1）第一步：扫描面单号

（2）第二步：称重，确认称重

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090638/f42a8271999296e65de925322ff1b453.jpg)

2.先称重后扫描单号

（1）第一步：称重

（2）第二步：扫描单号

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090639/a6854d27e069f6bbf51fb3fa2cf72e7f.jpg)

（1）仓库：可以选择仓库，也可以不选择，但扫描一个包裹后，识别到包裹的所在仓库，就会锁定仓库选项，不可更改，该仓库的包裹扫描出库完成后，可以刷新页面切换仓库

（2）称重：可以连接称重机，包裹放置称重机上即可自动填入重量值3.不称重

（1）第一步：扫描单号，扫描成功即发货成功

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090639/fae5225478d951f368a1369eccd81d07.jpg)

**发货成功后生成一条扫描记录**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090640/a193f207f8051c7c3b63702d9b4e78e5.jpg)

如有需要可以在扫描发货完成之后，打印签单，可以在快递员上门揽收时签字，作为发货的凭证

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827090641/bda36f1f5478876422d75092fc4c32d4.jpg)
