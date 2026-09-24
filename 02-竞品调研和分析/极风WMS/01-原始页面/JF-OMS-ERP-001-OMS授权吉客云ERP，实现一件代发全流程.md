---
sourceId: "JF-OMS-ERP-001"
title: "OMS授权吉客云ERP，实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7113780720-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > OMS授权吉客云ERP，实现一件代发全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7113780720
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-22T03:22:31.150Z"
---

# OMS授权吉客云ERP，实现一件代发全流程

## 一、定义
卖家使用吉客云ERP来处理订单全流程。

注意：

推送货品sku：以69码（条码）做匹配的，如果系统同样的sku没有69码，那就会自动在oms系统新增。

## 二、操作流程

### 1、吉客云创建货品SKU

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720031542/90c15b836b7f44d3dc2c7f74a7424e13.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720031857/59ae3f62cff9fb41887469a6e9a3432e.png)

### 2、授权三方仓
**注意：需提前向海外仓在WMS获取开发者信息（ID、密钥、域名）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720032809/42fea66f8b3362958712ac67106a61b9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720032837/1735b7565b3385be937b5ef82be7a171.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720033156/58573c1c352b9cea97402a0e4470d371.png)

### 3、货品SKU推送至极风OMS

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720033914/006ebccb53266c40e382c357d1f6e0b8.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720034002/395fbcc20b8dddd5d12d763bf0f9168e.png)

### 4、吉客云ERP配置物流匹配
**需要注意匹配对应的物流渠道名称**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720033914/006ebccb53266c40e382c357d1f6e0b8.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260722030714/cd78768f80d2ff0d65345b4feaa8b60b.png)

### 5、同步三方仓库存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260720034640/453d7d06613a682c18bf901e0772dad6.png)

### 6、订单推送三方仓

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260722030157/05dc0b4cdeac8ccc1f44e02c38992913.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260722030246/fe2f686dc71295f78f2117f375a58290.png)
