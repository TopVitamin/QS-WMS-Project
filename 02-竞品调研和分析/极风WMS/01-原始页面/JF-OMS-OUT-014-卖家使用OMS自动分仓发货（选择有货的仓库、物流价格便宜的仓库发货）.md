---
sourceId: "JF-OMS-OUT-014"
title: "卖家使用OMS自动分仓发货（选择有货的仓库、物流价格便宜的仓库发货）"
url: "https://help.jfwms.com/zh_CN/doc-article/7108350602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > 卖家使用OMS自动分仓发货（选择有货的仓库、物流价格便宜的仓库发货）"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108350602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T09:55:35.505Z"
---

# 卖家使用OMS自动分仓发货（选择有货的仓库、物流价格便宜的仓库发货）

**一、定义**

1.多个仓库库存，就近发货

卖家客户经常会根据区域，把商品分散存储2个及以上仓库，当店铺出订单时，根据收件人邮编或者城市，把订单分配到距离客户最近的仓库发货，实现大幅提升包裹派送时效和降低派送成本。

2、多个仓库库存，按照仓库优先级，自动选择有库存的仓库发货。

3、多个仓库，部分平台订单选择最便宜的仓库渠道（支持最低物流价格渠道的平台）。

订单分仓可以人工手动选择发货仓库，也可以使用极风wms客户端设置自动分仓规则，也可以使用erp设置物流规则。本篇帮助讲解极风WMS客户端分仓操作

** 二、操作路径**

**第一种：手动选择订单就近仓库发货**

平台订单>待处理>选中订单>分配仓库>获取运单号后，就可以把订单直接分配到收件人就近的仓库啦。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602113353/a0e28603e1aa8e02c71b32b5d4941a22.png)

#### 
第二种：设置订单规则，自动根据收件人地址分配仓库

平台订单>平台订单规则>创建规则>自定义规则>就可以自动根据规则把订单直接分配到收件人就近的仓库，选择对应的物流，只需要卖家点申请运单号即可。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602113437/cd6ec3b0b62a99c6c6650b8797dcf44e.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250509020527/5ef2aad64d9939a3cc6746ad6827b8e1.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250509020527/8d5f08b4b543fc126625694f9469b081.jpg)

**美国邮政服务编码**[**https://help.jfwms.com/zh_CN/doc-article/1002650428-**](https://help.jfwms.com/zh_CN/doc-article/1002650428-)

#### 
第三种：设置智能分仓规则，选择有货的仓库或者价格最低的仓库发货

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602113448/324fab8b8a86714b7bcc77abb0f39080.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605095522/2f3a967dfc8c119a16cab3116247728e.png)

注意：物流渠道支持线上和线下混选，但是：

1、若选择了线上物流比价渠道，则不支持继续选择其他线上物流渠道2、若选择了线下物流比价渠道,则不支持继续选择其他线下物流渠道

平台订单分仓成功后，就可以在智能分仓记录查看订单分仓情况。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602113529/74a32cac2aecbce187909e9408add66f.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251203123050/9943114ab76f46ceb6216a2e81006d62.jpg)
