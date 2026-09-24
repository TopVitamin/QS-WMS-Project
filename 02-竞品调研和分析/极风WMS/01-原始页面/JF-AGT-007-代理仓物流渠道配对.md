---
sourceId: "JF-AGT-007"
title: "代理仓物流渠道配对"
url: "https://help.jfwms.com/zh_CN/doc-article/7107630602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 代理仓 > 代理仓物流渠道配对"
category: "代理仓"
categoryId: 171
docId: 7107630602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-29T10:34:18.389Z"
---

# 代理仓物流渠道配对

**一、定义**

**代理仓物流配对分为三种情况：**

1、代理仓使用主仓物流：这种是最常见的场景，需要创建虚拟的自定义物流，和主仓真实线下物流完成配对；

2、代理仓使用自己的线下物流：有一定价格优势的代理仓使用自己的线下物流账号，和主仓的任何一条线上物流完成配对，代理仓出了面单后推送给主仓；

3、代理仓使用平台面单，推送给主仓打单发货。

## ** 二、操作路径**

## **1、场景一：代理仓使用主仓物流**

### **①创建自定义物流渠道**
仓库端WMS>物流>物流商管理>选择自定义物流商>添加物流商

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604111527/03d6cbfe86e45435afc27f5a8464cf79.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604111618/680fb4f0203cbb8e75ea73b945ecb758.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604111651/a5d68ca29bc8d13f296fcfeb7e550e44.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427102827/febf9749371be13cf1db49589636f482.jpg)

添加完成后，给客户添加物流渠道

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604111730/51202d6f9a0f65f7918d59d7525e6fbb.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604111825/185c25fc4a36dc7a2a3c8f41d5dfcadd.png)

### **②配对代理物流渠道：****把自己代理仓****w****MS给客户开通的物流渠道和主仓的物流渠道配对。**
仓库端WMS>设置>代理设置>配对>点击渠道配对>点击新增

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112042/306d4ad1fc81e84cf29e1708f3629807.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112209/415f1869cad6f6c9f31f6e503909c3bb.png)

这样就完成了渠道配对，可以进行编辑。

## **2、场景2：代理仓使用自己的线下物流**
操作可见文档：代理仓自有物流面单推送主仓

[https://help.jfwms.com/zh_CN/doc-article/7107590602-?edition=new](https://help.jfwms.com/zh_CN/doc-article/7107590602-?edition=new)

## **3、场景3：使用平台面单，推送给主仓打单发货。**
①配对代理仓渠道，线上物流配对线上物流。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112042/306d4ad1fc81e84cf29e1708f3629807.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260628175030/216c26479b9ebba3474652ce0dc78acb.png)

②如果代理仓和主仓使用的都是极风WMS，则平台面单推单不需要手动配对，直接推单即可。
