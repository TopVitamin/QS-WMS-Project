---
sourceId: "JF-OFC-001"
title: "temu官方仓线上自测流程教学"
url: "https://help.jfwms.com/zh_CN/doc-article/7107830602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 官方仓申请资料 > temu官方仓线上自测流程教学"
category: "官方仓申请资料"
categoryId: 177
docId: 7107830602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T10:43:22.901Z"
---

# temu官方仓线上自测流程教学

**一、定义**

**Temu官方仓线上自测流程（服务商版）**

Temu合作仓申请后，官方仓线上自测需要做哪些准备工作，以及temu官方仓如何自测？

**温馨提示：**先看申请TEMU官方仓全流程操作[https://help.jfwms.com/zh_CN/doc-article/1001630305-](https://help.jfwms.com/zh_CN/doc-article/1001630305-)，待到自测环节看此教学

### 
 **二、操作流程**

**temu合作仓线上自测准备资料**

**（一）免费极风海外仓管理系统的OMS（卖家端）的准备资料**

  1、 1个测试用OMS账号2、 2个测试用SKU，重量必须大于1g

  3、初始化库存至少>100，自测时会大量推单，测试失败也要重试推单4、给新账号充值

**（二）免费极风海外仓管理系统的极风WMS（卖家端）的准备资料**

** ****1、极风WSM的仓库编号**

Temu物流门户->仓库配置->仓库ID（WMS->仓库->仓库管理->仓库->**仓库编号**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602064617/f8e1522afed0260053c4d0cd50070636.png)

**2、极风WMS客户物流渠道**

 Temu物流门户->物流产品配置->物流产品code（WMS->物流->物流产品->物流产品代码）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602064744/be286e6c0f11cbfa69fa00849ffa22c4.png)

**3、Temu物流门户配置参数****Temu物流门户配置参数：WMS->设置->服务授权->TEMU合作仓申请

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604103410/1f2e6d6ffb1cd1e0ec10786263e86c6c.png)

temu合作仓线上自测准备工作**

** 以下步骤都必须要做，否则自测不通过！**

**（一）极风WMS仓库截单设置**

1、 极风海外仓系统允许截单【开启全部状态】

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602064925/7003d01ecc26f5db88592d0eed7c90be.png)

 2、 卖家截单需海外仓系统人工审核状态设置【部分状态勾选取消，无需海外仓审批】

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602065038/423a5a56f50c50154bf663e75ce6a2d1.png)

##### 
**（二）极风WMS新建一个用于自测的【自定义物流商】**

**  1、新建物流商**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602065141/d1a58513cbc751a814f5bf429fcdce34.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604103542/1828cd279f7fa9ef8b309e7bbf06f801.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604103653/6588a5b222c8cb3a8ba0ac40f1e3ff9f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604103736/fe72220da551a635664a4f66960cff84.png)

**  ****2、新建一个测试用的【客户物流渠道】**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602065238/edfbef553eaea4765c268ac9732f9428.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604104019/151af0d4a47957ea0786481c47aad27a.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604104103/63e2f61041a527645ae933033f4bcbc3.png)

**（三）极风WMS新增一个测试用的【分区规则】**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602065330/c8b3f4706b1796f9b64aa0a48516ee09.png)

** **

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604104139/edfbef553eaea4765c268ac9732f9428.png)

**（四）极风WMS新增一个测试用的【按规则计费的物流计费策略】**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602065431/1c98081c90540d32d5f8df45d1dc1003.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604104207/73544a90c8cd1b46c57c15adbefad6dd.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073319/81bff01047c4b16853821e575f469454.jpg)

#### 
三**. 物流门户线上自测**

##### 
**（一）登录极风测试的OMS（卖家端）获取temu授权码**

 

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604104247/e77cef70f1b1c5d53bf6322836362d27.png)

 

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604104311/58e4bbf6ac7761ff71c49cb302ac6ffd.png)

**（二）合作仓接入测试**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073321/08ddaa99722ffbc072d66b9a189e99f2.jpg)

- 货主ID=货主ID（OMS/获取TEMU授权码）

- 货主token=授权码（OMS/获取TEMU授权码）

- 货主授权key=授权key（OMS/获取TEMU授权码）

- 仓库ID=【WMS/设置/仓库设置/仓库管理列表/仓库编号】

- 物流产品CODE=【WMS/物流/物流商管理/客户物流渠道】

- sku=自测sku（OMS/商品）

##### 
**（三）合作仓接入测试**

本测试如果以下两步设置无误，可以一次性通过

- 【上一步的获取Temu授权码】

- 【自测的准备工作（WMS端）】

- 未通过处理办法：截图，并复制未通过项的【接口参数】给开发人员排查，务必发文本，否则不好排查

- 通过后必须要截图！！！！（只需要截一张图）

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073321/fe6cf577e26daf52e7265e1ba3e31528.jpg)

 

3.4 **自测【服务商推送API】**

通过后必须要截图！！！！（6项每一项都需要截图）

3.4.1 **验证：推送可达物流产品**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073322/51e4646c5f8d1c3301c0d7cc0005dfb5.jpg)

- 获取测试单号

- 确认已完成推送

- 未通过处理办法：按3.3~3.5流程仔细配置**【物流计费策略】**。重试未通过后，再找开发人员排查bg.certified.warehouse.delivery.fee.calc.push日志3.4.2 **验证：推送订单状态至异常(99)**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073322/ec8870c18f0ac751dd9fcb2288045fe7.jpg)

- 获取测试单号

- 在【OMS/出库/全部订单/待发货】的【ERP包裹号】搜索【测试单号】，勾选后点击【截单】

- 确认已完成推送

- 未通过处理办法：复制【测试单号】，找开发人员排查bg.certified.warehouse.order.status.change日志3.4.3 **验证：推送订单状态至异常(60)**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073322/a0a871fe55128d8b3a1fa2e8dd536a3d.jpg)

- 获取测试单号

- 确认已完成推送

- 未通过处理办法：复制【测试单号】，找开发人员bg.certified.warehouse.order.status.change日志3.4.4 **验证：推送运单**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073323/0ba280fa05fbdd7555a5b1d2d13e1d14.jpg)

- 获取测试单号

- 在【WMS/出库】

- 出库单列表，填写运单号（可随机填写），必须在发货前填写

- 简易打单

- 发货

- 确认已完成推送

- 未通过处理办法：复制【测试单号】，找开发人员bg.certified.warehouse.order.shippingInfo.push日志3.4.5 **验证：推送服务器面单状态至发运（50），含运单信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073323/1f60e48f479ee0ee02cdd4f7bfcedcf1.jpg)

- 获取测试单号

- 在【WMS/出库】

- 出库单列表，填写运单号（可随机填写），必须在发货前填写

- 简易打单

- 发货

- 确认已完成推送

- 未通过处理办法：复制【测试单号】，找开发人员bg.certified.warehouse.order.shippingInfo.push日志3.4.6 **验证：推送服务器面单状态至发运（50），不含运单信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073323/8d70ec7fb30008fce79de71ccd053b87.jpg)

- 获取测试单号

- 在【WMS/出库】

- 简易打单

- 发货

- 确认已完成推送

- 未通过处理办法：复制【测试单号】，找开发人员bg.certified.warehouse.order.shippingInfo.push日志3.4.7 **验证：推送token自动验证（****本接口一定要最后测试！！因为会刷新temu授权token****）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073324/c69ab1335dd93db9e151cb40a41e5c47.jpg)

- 复制【授权信息推送ticket】粘贴到：极风WMS》TEMU合作仓申请》授权信息推送自测，页面链接

- 跳转到授权页面，输入自测OMS账号和密码，点击授权（如果有报错无需理会）

- 确认已完成推送

- 未通过处理办法：确认【授权信息推送ticket】复制正确3.5 **自测【订单发运结果测试】**

- 通过后必须要截图！！！！（只需要截一张图）

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073324/497b197727a1cefe868793ab693b3f7c.jpg)

- 复制第4项【4.4.5验证：推送服务器面单状态至发运（50），含运单信息】阶段的测试单号，填写到【已发运CW单号】

- 用【已发运CW单号】在【WMS/出库】查询运单号，填写到【已发运CW单号】

- 开始测试

- 未通过处理办法：截图，并复制【已发运CW单号】给开发人员排查3.6 **自测【temu调用服务器API】**

本测试如果以下两步设置无误，可以一次性通过

- 【4.1获取Temu授权码】

- 【3.自测的准备工作（WMS端）】

- 未通过处理办法：截图，并复制未通过项的【接口参数】给开发人员排查

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250718073325/9b8731907c76ecdbae177cfbed743bf6.jpg)
