---
sourceId: "JF-OMS-GEN-006"
title: "shopify店铺免费授权极风OMS处理订单流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108930603-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > shopify店铺免费授权极风OMS处理订单流程"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7108930603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-17T04:22:47.624Z"
---

# shopify店铺免费授权极风OMS处理订单流程

## **一、定义**

卖家客户可以直接把多个shopify店铺授权极风OMS（卖家端），一个账号同时管理多个shopify店铺，免费处理订单。

## ** 二、操作流程**

### **1、授权店铺**

![26dbf213c7afd2846de9ad35e756befc.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603071736/1953b3ba1cad556ecf8ad1527bd28a14.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603074022/3bbbb426445ece46af1a561247b890cd.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250917093143/f732b5ee35e79d4d2f74d0b35ddd6f0c.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250917093147/c1f01ca112bf5448d79b2713cb4f1365.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250917093152/e6952ab032ec28974ad14f541c9a20b4.jpg)

#### 

### **2、shopify平台商品配对极风OMS商品**

#### ①、创建商品SKU/导入商品SKU

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260629113325/1d7426acbc074229a7ae94a9f19bf48f.png)

#### ②创建产品映射关系

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603071726/cdda91e7a85cfb6749c19891036cbd37.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605064837/fe0ad5697a3fbb0dc09cd66e521cca28.png)

#### **3、订单推送**
订单——平台订单——待处理。勾选需要处理订单——点击批量操作——分配仓库——获取运单号。订单进入发货中即成功推送到WMS端。

也可以设置平台订单规则，自动推动订单

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603071636/9718e05c30775db765e831e8c55ad6cd.png)

### **4、订单标发——同步平台。**
订单在发货中后，可关注仓库是否已发货，发货后点击标发即可。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260629114048/f5103e1bfb2a746e6d1072309111996a.png)

也可以设置订单流程为仓库发货后，OMS自动标发。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260629114223/680a9356488fbe65ccf2d0f01f66b92e.png)
