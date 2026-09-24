---
sourceId: "JF-OUT-036"
title: "面单加打SKU快速打单发货（支持面单缩放多平台+物流渠道设置一个水印）"
url: "https://help.jfwms.com/zh_CN/doc-article/7107570602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 面单加打SKU快速打单发货（支持面单缩放多平台+物流渠道设置一个水印）"
category: "出库"
categoryId: 170
docId: 7107570602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-28T16:29:25.842Z"
---

# 面单加打SKU快速打单发货（支持面单缩放多平台+物流渠道设置一个水印）

## **一、定义**
简易打单，使用在面单上加打sku和货架位的面单，根据面单的sku货架位拣货，然后由打包人员打包好商品直接贴面单。

注意：面单加打sku水印有2个方式

方法一：面单可以根据物流渠道，在特定的区域加打SKU和货架位信息

方法二：使用面单缩放，即多个物流渠道面单缩放，在面单缩放后的空白区域加打sku和货架位信息。

## ** 二、操作路径：**

### **1、设置面单加单sku**
方法一：单个物流渠道加打sku信息

仓库端WMS>设置>打印中心>面单水印>新建>填写模版名称，选择面单来源，物流商和渠道信息>上传物流渠道面单>设置面单水印模版或者自定义水印>保存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602023140/243f154327929a375d53acbb37f115ea.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250425123126/c2211ab38c7c22122ef2811d9a26da43.jpg)

支持调整水印大小

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604125311/c5b325f2fb5bdc7b59881273b304a31e.png)

支持调整表格水印列宽调整和切换语种

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260605070230/cd8baec08291116b20c89c9dd12a95b7.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260605070331/c0cc368afa7d2c8460d443d3dd3499d6.png)

## **方法二：多个渠道面单缩放加打sku信息**
仓库端WMS>物流>面单水印>新建>自定义面单缩放类型>选择面单来源和渠道>上传面单、缩放面单>添加水印>保存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602023204/05ad9c2a9d0cc6235229d621e6d13562.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604125339/58573c1c352b9cea97402a0e4470d371.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251031072735/50e63081087ae5dbb67046e6e728ee69.jpg)

## **2：打印面单**
**①打单入口：出库——一件代发出库——待打单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602023406/84838511b2e43382b26def84f1f178f3.png)

 如何提升配货速度——可按包裹类型以及SKU排序进行筛选，打印面单，若订单数量较多，可不做这一步。

首先筛选包裹类型，从简单到容易，先打单品单数，再打单品多数，最后打多品混包。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628161058/c094011e01d9acf80daff5d7b8808c8b.png)

再按SKU/货架位排序，面单打印顺序会按照订单排序出来，相同SKU订单会汇聚在一起打印，并且进行排序。支持按SKU排序、按货架位排序、按货架位/SKU排序（先按货架位排序，相同货架位多个SKU再排序）、按SKU*数量排序。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628162129/772742f9155b7c05eaf450644ad960a3.png)

### **②勾选订单，单个打印或者勾选批量打印。此处建议使用浏览器预览打印，插件打印容易受网络和设备影响。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602023452/ab52c191b197d00c6e2c7ef37dad0bc5.png)

注意：如果选择了包材出库计费，则选择选择包材再打印（如果没有开启包材出库则不需要操作此步骤）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602023900/9651507fcbdf70daa5ead0f7dbc82ad7.png)

点击开始打印后，弹窗显示打印进度以及打印失败详情

### **③打印成功后，包裹进入待发货列表（出库-包裹管理-待发货），面单打印标识为绿色（打印失败的会在简易打单列表，可以重新打印）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602024007/a003be1ba0856ff355af3792238ee525.png)

### **④发货——扫描发货或者是手动点击发货**

- 如果是使用扫描枪扫描出库，则进入出库-发货管理-扫描验货发货，进行扫描面单出库即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602024159/a935abf34bf4c693d4fce972b5c18cd2.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827091340/eac099f8adc4bb7351595b5deca9160f.jpg)

- 如果是手动点击发货，则进入包裹管理-待发货列表，点击发货即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602024233/28345d94093b2a6225a873b0111501a1.png)
