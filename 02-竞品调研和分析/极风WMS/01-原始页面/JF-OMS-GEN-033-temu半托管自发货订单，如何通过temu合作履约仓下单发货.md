---
sourceId: "JF-OMS-GEN-033"
title: "temu半托管自发货订单，如何通过temu合作履约仓下单发货"
url: "https://help.jfwms.com/zh_CN/doc-article/7108610602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > temu半托管自发货订单，如何通过temu合作履约仓下单发货"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7108610602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T09:20:22.721Z"
---

# temu半托管自发货订单，如何通过temu合作履约仓下单发货

**一、定义**

Temu卖家使用temu面单推给海外仓可以直接使用temu线上物流渠道获取面单，也可以使用temu合作履约仓下单。第一种Temu线上面单下单适合任何卖家的使用场景。

但卖家如果使用第二种temu合作履约仓下单发货，需要卖家在后台绑定temu合作仓，temu会向对应的temu合作履约仓下单，temu合作履约仓会平台面单先推送给temu，然后temu向海外仓推面单发货。

温馨提示：通过极风OMS或者其他ERP处理订单，是否使用“合作仓流程”，取决于卖家在店铺后台是否启用“我希望获得商品专属流量扶持”（同意ERP通过平台向合作仓下单），关闭后则不会走合作仓流程。

### 
** 二、操作路径：**

[**TEMU店铺直接授权卖家端（OMS）**](https://help.jfwms.com/zh_CN/doc-article/1001351204-)

**第一步：在temu后台添加合作仓**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251028013203/36d5cc6903ad18ef66cde71328c4e046.jpg)

#### 
**第二步：开启“我希望获得商品专属流量扶持”（同意ERP通过平台向合作仓下单）（如果使用极风WMS认证的合作履约仓，可以开启该开关，如果不是极风WMS认证的合作履约仓，需要关闭该开关）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251028013210/8e1245330caa3563c40c81d03e3a0c7b.jpg)

#### 
**第三步：卖家在OMS建立仓库商品与temu在售商品的配对关系**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602124840/0ba7e7888200ea07b3dc64ae6d0a9cc6.png)

![279d88811ad316b9071d3716a66c660e.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605092018/837f00b23ba58568405687f5de37d226.png)

**第四步：在极风WMS处理订单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602124939/97c15354dd41a03182a6aacfca1bfe54.png)
