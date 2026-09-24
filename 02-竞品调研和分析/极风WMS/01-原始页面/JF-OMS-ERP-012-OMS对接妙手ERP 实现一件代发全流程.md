---
sourceId: "JF-OMS-ERP-012"
title: "OMS对接妙手ERP 实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108540602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > OMS对接妙手ERP 实现一件代发全流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108540602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-03T09:34:32.126Z"
---

# OMS对接妙手ERP 实现一件代发全流程

## **一、定义**
卖家使用妙手ERP处理订单推送到极风WMS全流程。

## **二、操作流程**

### 1、联系极风海外仓WMS获取参数
联系海外仓获取开发者ID、密钥、域名、海外仓名称给到妙手服务商配置海外仓

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703035733/f3e37b664a0575fc4c18146df638427e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703035811/15caf10b1ea4ad3a47c89b361378e58f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703040156/bcf1abb3e296c7d486aa267fac349c9e.png)

### 2、妙手ERP授权海外仓WMS在OMS获取极风WMS授权口令密码

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703053841/e68c8fc361aef6ebfe458a21c22ee966.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703053952/5acafa8702c0cee3fdd13f8848141d82.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703054021/9da020caebe44a320c9dc77bfadf96a0.png)

### **3、妙手ERP授权三方仓**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703081941/c2d77b3e5d5d62efa8c7e269c62884df.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703082051/83f43b40505107274438995955992751.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703082429/20991e385c0420635be3382705e0503b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703082529/7223c33c6a5c6fae6936e9dd9f1702eb.png)

**4、妙手ERP中将在线产品生成仓库商品**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703093312/75125c426557c9099277a30a5fac37bc.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703093402/11a787358bd516cc5e583f0085c9747f.png)

**5、将仓库商品sku推送到第三方仓库**

①未推送：从未推送给该服务商的商品

②推送中：正在推送给服务商的商品。有的商品需要服务商审核，审核通过前，也会停留在此状态。推送中的商品，不支持重复推送。

③推送成功：成功推送给第三方仓的商品。登录第三方后台，可看到相关商品信息。（推送成功后，如商品信息发生了变更，需再次推送）

④推送失败：推送给第三方仓时，推送失败的商品。可修改商品信息后，重新推送。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703083235/7003d01ecc26f5db88592d0eed7c90be.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703083513/786211a9f484b3ce84c0e70216652778.png)

### **6、库存同步**
**①把第三方仓库存同步到妙手ERP系统里**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703083808/267f3b0ffffd9c89dca407e0fc732e45.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703084140/88890f00c1b47f196269ec6cf74febbd.png)

### **7、****推送订单到三方仓**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703090151/45a6bb25c09e510cf0d60889430f8507.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703091226/90c15b836b7f44d3dc2c7f74a7424e13.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/59/20260703092125/c5dbf1b47accb3178d813533c47a3c99.png)
