---
sourceId: "JF-DRS-002"
title: "代理仓推送temuY2直邮订单给主仓，主仓海外仓一键扫码换单"
url: "https://help.jfwms.com/zh_CN/doc-article/7107210526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 跨境直邮 > 代理仓推送temuY2直邮订单给主仓，主仓海外仓一键扫码换单"
category: "跨境直邮"
categoryId: 169
docId: 7107210526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T02:31:28.984Z"
---

# 代理仓推送temuY2直邮订单给主仓，主仓海外仓一键扫码换单

**一、定义**

极风WMS海外仓系统支持代理仓推送TemuY2直邮订单到主仓，主仓一键扫码换单。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251111053957/951d13809c2f40f2e00af5be16c0fd7e.jpg)

温馨提示：这篇教学主要讲OMS客户如何创建直邮单，海外仓如何扫码打单。卖家可以使用店小秘erp或者OMS来创建直邮单，但是前面都需要做店铺授权、商品配对、仓库配对，这个参照系统操作帮助教学。

** 二、操作说明**

**第一步：代理仓的卖家客户在OMS创建直邮单temuY2直邮面单**

方法一：店铺授权极风后，平台订单批量创建直邮单（适合店铺免费授权极风OMS的卖家）

卖家端（OMS）—平台订单—待处理—选中订单—批量操作—分配仓库、选择物流、创建直邮单——获取运单号

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526122716/0b1ceea9427b2a87be584999d3cb4a40.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526122858/40ef8a9c0a1d55cb5ed862e18b81788b.png)

选择物流时，支持OMS自动比价

注意：获取运单号后，极风海外仓系统会自动判断订单最早获取面单时间，自动获取面单推送极风WMS

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526123113/63c1107f502a61cb084800f2d0adedd2.png)

方法二、单个创建直邮单（手工创建，适合没有使用极风OMS创建直邮单的卖家）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526123223/12e63e06681ac81f180b34884eb818f9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604022653/39c6e3be09582623277dd1b1ebff2365.png)

方法三：批量导入创建直邮单（手工创建，适合没有使用极风OMS创建直邮单的卖家且订单比较多）

导入面单（导入面单支持pdf直邮单号、平台订单号、运单号，直接匹配直邮订单）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526123313/316d26bc9c6e9f195c8d67ab9a5d367c.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526123352/74a32cac2aecbce187909e9408add66f.png)

第二步：【卖家打印直邮标签】

卖家在OMS打印直邮标签，支持自定义直邮标签，可以以直邮单号、运单号、平台订单号作为标签条码

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604022819/6bdbe74a00a46094a7c6f0216b15b077.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604023038/4472050fd504879903db029021306cf6.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604023122/0a88f0f8f5b464dd226ec63d8b72fe5a.png)

第三步：海外仓扫描直邮标签，自动打印面单，一键换单查看所有temu直邮订单（可以看订单的创建时间、是否有面单）

##### 
**1、查看包裹的面单最早获取时间（方便对收到的包裹进行分类，哪些有面单，哪些没有面单）**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250624133048/660b2b8dd7bab795406b0171caea6430.jpg)

##### 
**2、扫描验货**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526123504/59bbdb17f69a689757336cb0a818b829.png)

** **

**3、扫描自动打单**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250815023242/feb237665cf565f906521758d734ddad.jpg)

**【扫描设置】**

** 1.扫描包裹自动完成验货：扫描包裹号或者运单号成功，则此包裹自动完成验货，这个模式不需要扫描商品标签。**

** 2.扫描商品自动完成验货：当扫描商品成功，则当前扫描SKU自动完成验货**

**3.常规验货：先扫单据再扫商品，完成验货。**

**【打印面单】**

**1.验货完成打印面单：当包裹完成验货（包裹内所有SKU的已扫），打印面单**

**2.开始验货打印面单：当扫描某个包裹的第一个SKU时，打印面单。**

**3. 不打印面单：设置这一项，不打印面单**
