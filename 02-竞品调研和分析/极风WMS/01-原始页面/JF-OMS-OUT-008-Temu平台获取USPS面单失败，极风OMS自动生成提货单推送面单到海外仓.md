---
sourceId: "JF-OMS-OUT-008"
title: "Temu平台获取USPS面单失败，极风OMS自动生成提货单推送面单到海外仓"
url: "https://help.jfwms.com/zh_CN/doc-article/7108280602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > Temu平台获取USPS面单失败，极风OMS自动生成提货单推送面单到海外仓"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108280602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-02T11:10:34.303Z"
---

# Temu平台获取USPS面单失败，极风OMS自动生成提货单推送面单到海外仓

**一、定义**

Temu跨境电商平台使用USPS获取面单，需要给USPS物流支付物流费。

平台给USPS支付物流费不是实时支付，按约定时间支付。而平台面单需要已缴费才能打印。

对于temu平台新出订单，处理订单，会出现【获取异常】，【平台错误】请检查包裹交付信息是否正确。错误原因:shipDate必须是当前日期或之后（PLATFORlM ERRoR] please check whether the package delivery information is correct. Eror reason: shipate must be the curent date or later.）。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250903052948/5c97b67caeb0bae554a47c85e4e8dfbf.jpg)

Temu卖家如何通过极风WMS，自动生成提货单，获取面单推送海外仓发货？

从而杜绝后台获取面单，创建手工单发货，造成订单发货重复！

** 二、操作路径**

**（一）卖家自主生成提货单，推送订单到海外仓**

**第一步：卖家在OMS处理Temu平台订单**

Temu平台订单，卖家根据极风OMS线上物流自动比价，根据价格和物流时效，选择合适的物流渠道下单。

如果选择的是非USPS的渠道，直接获取订单成功，进入发货中，推送海外仓。

如果选择的是USPS渠道，系统根据平台政策，提示【距离可打印面单还剩多长时间】，进入获取异常。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110448/35f598a3ca14abe827f78861d29706c0.png)

##### 
**第二步：卖家如果想立即获取可打印面单，在temu后台生成提货单**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250905075648/8ab552cf0d3bad66b0d1dc74e7084cc1.jpg)

##### 
**第三步：卖家在获取异常，点击重新获取推送订单到海外仓，获取成功进入发货中**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110630/f39483d076ae69b9c68fa1999f3e394b.png)

##### 
**第四步：进入海外仓的订单进行拣货、打单、发货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110809/d75f5039454d4a94a3162150e4a6dec9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110900/59bbdb17f69a689757336cb0a818b829.png)

**（二）卖家配置OMS规则，系统自动生成提货单，推送订单到海外仓**

**极风OMS设置temu平台订单规则，按照按USPS “shipDate必须是当前日期或之后” 的政策，自动生成提货单，推送面单到OMS。**

**这个功能正在紧急开发中，敬请期待。**

**第一步：OMS配置temu平台订单规则**

**第二步：卖家在OMS处理Temu平台订单**

**Temu平台订单，卖家根据极风OMS线上物流自动比价，根据价格和物流时效，选择合适的物流渠道下单。**

**如果选择的是非USPS的渠道，直接获取订单成功，进入发货中，推送海外仓。**

**如果选择的是USPS渠道，系统自动判断并自动生成提货单和推送面单，进入发货中，推送海外仓。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110448/35f598a3ca14abe827f78861d29706c0.png)

##### 
**第三步：推送海外仓的订单，极风WMS进行打单发货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110809/d75f5039454d4a94a3162150e4a6dec9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602110900/59bbdb17f69a689757336cb0a818b829.png)
