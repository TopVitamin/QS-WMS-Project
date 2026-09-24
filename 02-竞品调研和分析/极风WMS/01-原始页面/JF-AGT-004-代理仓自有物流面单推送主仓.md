---
sourceId: "JF-AGT-004"
title: "代理仓自有物流面单推送主仓"
url: "https://help.jfwms.com/zh_CN/doc-article/7107590602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 代理仓 > 代理仓自有物流面单推送主仓"
category: "代理仓"
categoryId: 171
docId: 7107590602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T11:08:35.725Z"
---

# 代理仓自有物流面单推送主仓

**一、定义**

支持代理仓所有自有物流下单后推送主仓，完成发货。

首先，代理仓自己有价格优势的物流账号授权到海外仓（线上物流直接开启）；

其次，代理仓自有物流渠道配对主仓线上渠道；

然后，卖家使用代理仓自有物流渠道，获取运单号。或者卖家创建或者导入创建手工订单到代理仓。

最后，代理仓自有物流渠道面单或者手工订单面单，自动推送主仓，主仓负责拣货、打包发货。​​

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251119025219/6f16b5132f633c7910d66a839e5e2d5b.jpg)

### 
** 二、操作路径**

**第一步：第一步：物流商授权【以Gofo为例】**

**1、极风WMS系统添加物流商**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602024941/95f82927c66ade6c734826e2cf4a3797.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602025033/1bb43e5ade0214d7cc6477bc6b0d0edc.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602025111/3a5fe5baed92a242865f165e42cb5f22.png)

**2、开启物流商渠道**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602025145/3fc59a8dfe62535e15bcd5a5ee1803c8.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251119024849/bf0b193db649009387ce2303bdefcbb1.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251119024854/760f9f51dec224d68fe007323801f3e1.jpg)

**3、新建客户开启物流渠道（开启后卖家可在OMS卖家端、ERP端看到这个渠道）**

#### 
**第二步代理仓物流渠道配对主仓物流渠道**

**把自己代理仓wMS给客户开通的物流渠道和主仓的物流渠道配对**

仓库端WMS>设置>代理设置>配对>点击渠道配对>点击新增

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602025310/36db7cc64c0a286ba395008942336f71.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604110617/5d4dd5f61eb3d2478d753b74c547ff1a.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604110833/9b41fa42b55a47d324f62c7cf9bdd713.png)

这样就完成了渠道配对，卖家就可以使用代理仓的所有物流渠道获取面单，推送到主仓啦。
