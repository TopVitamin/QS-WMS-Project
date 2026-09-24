---
sourceId: "JF-OMS-GEN-018"
title: "快速了解平台订单页面"
url: "https://help.jfwms.com/zh_CN/doc-article/7109060603-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > 快速了解平台订单页面"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7109060603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T07:33:26.687Z"
---

# 快速了解平台订单页面

**一、定义**

展示全部已授权平台店铺的订单数据，用于操作同步过来的订单数据进行编辑、分配仓库、分配物流、获取运单号，再推送到WMS系统进行发货。

** 二、操作说明**

**1、订单同步**

（1）更新频率：三分钟自动同步一次。

（2）同步订单处理逻辑

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241206095854/519ed426f87a70a76754aa7523f1dedf.jpg)

** **

#### 
**2、订单状态说明**

（1）全部：展示全部状态订单数据。

（2）异常：展示同步过来的有异常的订单数据，包含产品未配对、地址信息不完整等订单。

（3）待处理：展示同步过来待处理的订单数据。

（4）获取平台面单：展示获取线上平台面单的订单数据。

（4.1）获取异常：展示获取面单失败的订单数据。

（4.2）获取中：展示正在获取平台面单的订单数据。

（4.3）生成出库单失败：展示获取平台面单成功，但是生成出库单失败的订单数据。

（5）发货中：展示已经获取面单成功，成功推送到WMS的订单数据。

（6）已发货：展示已经发货的订单数据。

（7）已搁置：展示由于订单各种情况，暂时搁置不处理的订单数据。

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241204074027/f1fa374d9f57113e74b53414d1b77ac5.jpg)

** **

**3、全部**

（1）页面说明：展示全部状态订单数据。

（2）卖家在电商平台取消的订单也会在此展示，平台状态展示为：已取消。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072033/5d1b76650f9cd79cff1602c2f93c0b63.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241206095944/88b5d92b411ababd7064277e29188633.jpg)

** **

#### 
**4、异常**

（1）页面说明：展示同步过来的有异常的订单，包含产品未配对、地址信息不完整等。

（2）详情页说明：可针对异常原因，编辑收货地址、更改SKU配对。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072152/34e9792a6f528cdcd086db6e6b25e757.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241206100027/ffaca056af39a18d351e630d38e7b2cf.jpg)

** **

#### 
**5、待处理**

（1）页面说明：展示同步过来待处理的订单。

（2）详情页说明：可编辑订单信息收货地址、更改SKU配对，物流信息物流渠道、发货仓库，再获取运单号。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072311/28c9659ddaa802a91a162857aa145199.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241206100104/6fd1b2c87e732fc93a2ee9f6bfee82c3.jpg)

** **

#### 
**6、待获取平台面单：展示获取线上平台面单的订单数据。**

##### 
**6.1、获取异常**

（1）页面说明：展示获取面单失败的订单数据。

（2）详情页说明：基于获取异常原因，进行重新获取平台面单。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072434/4fe3c0867704b4b1472194a3f4879077.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241206100139/cd9b681b6de26e3d7dcbc249576bc480.jpg)

** **

##### 
**6.2、获取中**

（1）页面说明：展示正在获取平台面单的订单数据。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072506/12e63e06681ac81f180b34884eb818f9.png)

**6.3、生成出库单失败**

（1）页面说明：展示获取平台面单成功，但是生成出库单失败的订单数据。

（2）详情页说明：基于生成出库单失败原因，更改发货仓库，SKU配对，再重新生成。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072608/1828cd279f7fa9ef8b309e7bbf06f801.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/31/20241206100229/9890c7e2e1d7be0952c5e98bf2fad014.jpg)

** **

#### 
**7、发货中**

（1）页面说明：展示已经获取面单成功，成功推送到WMS的订单数据。

（2）发货逻辑：系统每5分钟更新一次数据，自动将已出库数据标记发货。

（3）标发：当该订单有运单号时，可手动点击标发。

（4）撤回：当该订单在WMS系统处于未出库时，可点击撤回，根据条件判断是否撤回成功。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605072845/bc71f664e2d2e36a7ef6123adae05d3f.png)

** **

**8、已发货**

（1）页面说明：展示已经发货的订单数据。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605073019/67646611010c055a0806a7faec5cc699.png)

** **

**9、已搁置**

（1）页面说明展示由于订单各种情况，暂时搁置不处理的订单数据。

（2）搁置订单状态有：待处理、待获取平台面单-获取异常、待获取平台面单-生成出库单失败、发货中。取消撤回后，该订单回到对应的状态列表。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605073122/32beaaaa8d16ad086310a29e89e94dd3.png)

** **

常见问题Q：“平台sku不能为空”提示，没有入口编辑？

A：极风OMS平台端当前无法编辑，需到对应平台店铺处编辑。完成后系统会会自动同步最新产品信息。
