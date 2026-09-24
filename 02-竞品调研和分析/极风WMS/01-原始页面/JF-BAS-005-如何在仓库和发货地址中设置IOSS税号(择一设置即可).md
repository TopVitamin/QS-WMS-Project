---
sourceId: "JF-BAS-005"
title: "如何在仓库和发货地址中设置IOSS税号(择一设置即可)"
url: "https://help.jfwms.com/zh_CN/doc-article/7113810724-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 基础设置 > 如何在仓库和发货地址中设置IOSS税号(择一设置即可)"
category: "基础设置"
categoryId: 159
docId: 7113810724
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-03T06:12:37.671Z"
---

# 如何在仓库和发货地址中设置IOSS税号(择一设置即可)

## **一、背景**
**欧盟针对部分跨境电商订单设立了相关税收规则，当订单满足以下所有条件时，WMS端在获取运单号时物流商会强制校验IOSS（欧盟进口一站式增值税申报系统） 编码，具体条件如下：**

- 售卖商品时已经收取增值税VAT，或是物流渠道选用IOSS模式清关；

- 收货地址在欧盟境内，并且货物从欧盟以外的地区发出；

- 属于商家直接卖给个人的B2C零售订单；

- 这一单商品总价值不超过150欧元。

**如果符合条件的订单未在WMS系统设置IOSS编码，对应的订单在获取运单号时则会弹出报错信息，导致获取运单号失败，无法正常发货，****报错信息如图：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/156/20260727075640/e070b73ddb04de80ce0ebe3aeb19df75.png)

**具体的IOSS编码设置操作流程如下：**

## **二、操作流程**
①点击仓库-->>仓库管理-->>仓库点击编辑进入到仓库的管理界面（仓库设置IOSS税号）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/156/20260727110228/05acbc5563570522f3256569a09b2c95.png)

②在仓库列表点击编辑，进入仓库详情，输入IOSS税号点确认即可。（仓库设置IOSS税号）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/156/20260727110251/fe0ad5697a3fbb0dc09cd66e521cca28.png)

③点击设置-->>基础设置-->>发货地址设置-->>点击编辑进入到发货地址编辑页面（发货地址设置IOSS税号）

![图片3.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/156/20260724092459/50004516a34dc432a1fad0dd741883e1.png)

④在发货地址的编辑页面输入IOSS税后后点击确定即可。（发货地址设置IOSS税号）

![图片4.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/156/20260724092513/631db138e229116a8a8538928e722a29.png)
