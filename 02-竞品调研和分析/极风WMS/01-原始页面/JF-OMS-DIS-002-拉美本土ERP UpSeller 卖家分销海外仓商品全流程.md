---
sourceId: "JF-OMS-DIS-002"
title: "拉美本土ERP UpSeller 卖家分销海外仓商品全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7107970602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 分销 > 拉美本土ERP UpSeller 卖家分销海外仓商品全流程"
module: "OMS帮助文档(新)"
category: "分销"
categoryId: 190
docId: 7107970602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-05T23:05:19.771Z"
---

# 拉美本土ERP UpSeller 卖家分销海外仓商品全流程

**一、定义**

拉美本土卖家，使用upseller分销极风海外仓系统的商品。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251209054527/4a0040673763b9a4b60485324312ff67.jpg)

### 
** 二、操作流程**

#### 
**第一步：卖家OMS端授权upseller**

##### 
**1. 登录UpSeller （建议使用Chrome/Firefox/Edge最新版浏览器打开UpSeller）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074311/7147ec553bbeb13dd5b8de006268c2a0.jpg)

##### 
**2.开启库存功能**

**需要开启库存功能之后才能授权三方仓，开启库存功能的入口如下：**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074337/b6d3a553f6cb34141b4e9dfd42640849.jpg)

##### 
**3.授权极风海外仓**

##### 
**（1）upseller中添加海外仓库**

**方法一：卖家Upseller中点击 “设置”>点击“服务授权”>选择 服务商> 点击“添加仓库”**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074417/cb966b662837fc92f3051aedf9922c49.jpg)

**方法二：当然也可以在点击“库存”模块>仓库管理>仓库列表，点击“添加仓库”**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074537/5309b29201b1428ca08fee19180c77ee.jpg)

##### 
**（2）完善授权信息**

**完善授权信息>> 点击“授权”即可完成三方仓授权**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074602/9103c547f41b526895496f1369e0b3b4.jpg)

**注意： 昵称：仅在UpSeller中使用，可与三方仓实际名称不一致，便于区分和管理**

**邮箱：三方仓的注册邮箱，并不是UpSeller的注册邮箱**

**（3）获取口令**

**Token：需要前往三方仓获取Token。如下图所示，卖家登录极风OMS获取Token**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030731/9220654a6e8df267b824adfe08b1dcc2.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030701/4d14e39225a05a350c8f241b3824ed24.png)

**第二步：卖家在OMS端认领分销产品**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602081649/b4364cb968a06ebc2f6bcb662acd4664.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605033104/9b41fa42b55a47d324f62c7cf9bdd713.png)

**第三步：卖家在upseller创建和分销产品一模一样的sku**

**upseller >产品 >商品列表 >创建商品> 创建的商品sku要和OMS认领分销商品一模一样**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074832/2409aaa54cbb4a43b2f9eee2131e64ba.jpg)

#### 
**第四步：卖家在upseller把创建的分销产品的sku推送到极风**

**upseller >产品 >三方仓商品 >选择需要推送的商品SKU > 点击“推送”即可（这样就完成了upseller的商品sku与海外仓商品配对）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074848/e0576495f66ba4d6cba6b862a599aedc.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074856/d77f1dee0cb19bdfa056247b8ffd1457.jpg)

#### 
**第五步：卖家在upseller处理分销商品订单**

##### 
**1.同步海外仓库存**

**将海外仓在WMS设置好的分销商品库存同步到upseller，避免在upseller处理订单显示库存不足**

**卖家登录upseller>点击“库存”模块>库存管理>库存清单> 选择三方仓 >点击“同步三方仓库存”**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074910/dabbd29be0ac1b2253df708fba00d66b.jpg)

##### 
**2.店铺在售商品与upseller产品配对**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074927/21fd90ae74fd18d5a4a94924d4504dfd.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074934/7c96a41dac57ec4cc69009659dfbde32.jpg)

**3.upseller订单推送海外仓**

**（1）同步海外仓物流渠道 使用UpSeller处理订单，首先需要确定海外仓有没有开启客户物流渠道。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826074951/f264109cae48846e54031287fc75a8ad.jpg)

**（2）为订单分配物流渠道**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826075257/893b40b09154ff3ad82ad0ca88edff29.jpg)

**安排订单后，订单将会自动推送三方仓。等待三方仓处理订单后，UpSeller自动同步订单最新状态**

**注意：已经推送给三方仓的订单，支持手动撤回。但需注意，三方仓已发货的订单不支持撤回**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250826075450/d406c2a139a4b0bdb7d8d4c698540807.jpg)
