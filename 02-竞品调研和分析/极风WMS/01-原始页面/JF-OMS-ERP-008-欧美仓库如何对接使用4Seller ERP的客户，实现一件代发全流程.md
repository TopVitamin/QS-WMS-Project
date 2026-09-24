---
sourceId: "JF-OMS-ERP-008"
title: "欧美仓库如何对接使用4Seller ERP的客户，实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108500602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 欧美仓库如何对接使用4Seller ERP的客户，实现一件代发全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108500602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T12:16:06.467Z"
---

# 欧美仓库如何对接使用4Seller ERP的客户，实现一件代发全流程

**一、定义**

卖家通过4SellerERP授权店铺、处理订单、推送商品到海外仓。

** 二、操作流程**

**第一步：在4Seller上面授权店铺（授权店铺时要注意在店铺的网络IP环境下完成授权）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085016/493063723091f14c10304583400afb14.jpg)

#### 
**第二步：在4Seller上面开启库存扣减**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085018/e7abbe4c1cc170446200f1944ab3680f.jpg)

#### 
**第三步：设置第三方海外仓库（找到自己要使用海外仓进行设置）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085018/12abd8b0abca493337cf47377353e4a2.jpg)

**点击创建之后会弹出来一个框，按照图片完善信息后确认即可**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085019/da7d21eed4bf28e9f032128c096a7856.jpg)

#### 
**第四步：检查海外仓是否给您开启客户物流渠道**

**如果是线上平台面单，要提醒海外仓在WMS上面开启线上物流的专线**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602121556/fe807d6414f6f1eea7e9fb48a30c2386.png)

**如果是线下物流，那么就需要仓库WMS这边提前设置好线下物流渠道~**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602121510/fdf4294826af146339bfba06c4d18917.png)

**第五步：推送商品到WMS海外仓系统**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085021/e29ccb63cf2d9fc14a94194e2d5c6afa.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085022/6e19aebcb39f0289ea59530de7db6c54.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085022/991f0d5a26eda7c8864a9748f292c9e6.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085023/1c29df6254ed17231510c005dcace7e1.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085024/4bf1ccc9aa6d03870420b25c5d40cce4.jpg)

**Tips ：如果选择3PF商品的时候找不到商品怎么办？**

**需要到对应平台已发布的产品里面重新编辑，然后同步商品即可。操作如下**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085025/4374a4e8b22e33dc2ee4b59fa3aab4c7.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085026/08c0a4392c37c932d26035088f7be593.jpg)

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085026/478ed6f46eb6fd72de9fe37d6f9f52ea.jpg)

** **

#### 
**第六步：推送备货单（入库单）到WMS海外仓（操作这个步骤之前要确保自己OMS账号上面是有足够余额推送入库单的）**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085027/f2a7a9b600c0877761b9a6f984135cc4.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085028/fba743bd63362df804f2f2e78bf14433.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085028/f21c079d1db4a3b5361cab1620fc3d7c.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085029/4f4da29ffcec0d6e78b98579b657d451.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085030/cd09a5a1ed0ef7ee0523d90411c63056.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085031/0ab85137baabc5f8725b990aa3f24676.jpg)

#### 
**第七步：同步三方海外仓WMS的库存**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085031/10c19c945f55dfb8292f2b8fdff9f97a.jpg)

#### 
**第八步：如何在4seller设置面单加打SKU并推送给极风WMS？（此功能仅支持走平台官方物流的订单）**

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20240909030102/19cb26a9221e87e02b74b856ca757b8e.jpg)

## 

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20240909030334/0cc7f8487318983e0f02ea5b199c680d.jpg)

#### 
**第九步：推送订单到WMS海外仓系统**

**1、订单处理-待审核**

**点击订单模块，进入待审核页面，可勾选订单后点击批量修改下方的仓库可批量修改发货仓库**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085032/6f15aba9796802bddf33765f8ef982b3.jpg)

**选择相应的极风WMS仓库然后点击保存即可将订单的发货仓库批量修改为极风WMS的仓库**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085033/08220ca49908ad82fc7aa47c31e4863d.jpg)

**2、订单处理-待处理**

**当订单的SKU已匹配且可用库存不缺货时，订单即会自动流转到待处理流程中**

**1）单个操作**

**单个点击TikTok Shipping订单的购买订单即可进入购买面单的页面**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085034/02b2c0ce06ab3dd7fa366182d5554117.jpg)

**在订单的购买面单页面，可进行以下操作：**

**1.可更改发货仓库**

**注意：“平台发货”的订单，此处的仓库仅用于库存扣除，标签地址基于创建产品时选择的仓库地址**

**2.可填写包裹信息，包括包裹重量和尺寸**

**3.确认物流商为TIKTOK**

**4.可选择TIKTOK提供的物流计费服务**

**最后点击购买面单即可将订单推送至已选的极风WMS仓库并购买面单**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085034/02b2c0ce06ab3dd7fa366182d5554117.jpg)

** **

**注意：在批量处理TikTok Shipping的订单时，需先在买家指定筛选栏中筛选出TikTok Shipping的订单**

**筛选订单**

**2)批量操作**

**更新包裹信息**

**可批量勾选订单，点击批量修改下的包裹，即可批量编辑包裹信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085035/93926e3f9db4ba21f61150cea7f59891.jpg)

** **

** **

**在编辑包裹信息页面，可填写包裹重量，选择相应的尺寸模板或手动输入尺寸，最后点击保存即可为已选订单批量修改包裹信息**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085036/ed2eba92045dd8caa04a6996ce311536.jpg)

**更新物流信息**

**勾选订单后，点击批量修改下方的物流信息即可批量修改物流信息**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085036/0a01b8f35fbad89e70dde1d30b4e8191.jpg)

**在修改物流信息页面，确认物流商为TIKTOK，然后选择一个物流服务，最后点击保存即可为已选订单批量修改物流信息**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085037/79734f91237830a320032b7851b2de14.jpg)

**更新完包裹和物流信息后可点击上方的购买面单，即可将已选订单推送至极风WMS并为其批量购买面单**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085038/5b23ef93228d8fae23f8fb98b133da8a.jpg)

**3）快捷操作**

**点击包裹和物流栏下方的方框可以快捷输入包裹的重量和尺寸以及选择物流服务**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085038/cb00713e42c963343fa4bb5092a14036.jpg)

**3、订单处理-处理中-3PF仓库**

**已购买面单的订单即会流转到3PF仓库的处理中的流程中，订单会有三种状态：**

**①.失败：**

**买面单失败：即订单购买面单失败**

**推送3PF失败：即订单推送至极风WMS失败 发货失败：即将运单号推给订单所在平台发货时失败**

**注意：在失败流程中的订单可申请再次操作**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085039/2cbcd77d8243b255f0071bc6f47a1a88.jpg)

**②处理中：**

**购买面单中：即正在为订单购买面单中**

**推单中：即正在推送订单到极风WMS**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085040/e70171fd3d1380133312a16172b9a3b5.jpg)

** **

**③三方仓处理中：面单购买成功但未返回运单号**

** **

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085041/2c07c559a5911c5973c0ab5da421da2f.jpg)

**当订单申请到运单号并且成功提交到订单所在平台后，订单会自动进入到Shipped状态，即发货成功。**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240827085042/5a5d762d52a2d6f4978556b1c914bf89.jpg)

#### 
**第十步：如何推送线下订单（需要仓库提供面单的订单）给WMS海外仓系统？**

**1.需要在4seller打开仓库已经配置好的线下物流渠道**

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20240909030713/98f20ff0bac8f92b271475c5fbeb9e13.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20240909030719/4804fd16b916eceb4eab51d363e65462.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20240909030725/2b78b4d13567aada32de1ac669ebd0ba.jpg)

**2.进入订单处理环节进行操作（用单个订单推送举例，跟线上推送步骤一样，核对好物流商即可）**

![图片](https://download.jfwms.com/prod/static/back_help/img/6/20240909030739/8b7f5c902dd3d2ede11be8f1a6aca606.jpg)

** **
