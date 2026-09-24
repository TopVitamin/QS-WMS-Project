---
sourceId: "JF-LOG-005"
title: "如何注册、授权、使用Fedex"
url: "https://help.jfwms.com/zh_CN/doc-article/7106860526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 如何注册、授权、使用Fedex"
category: "物流渠道管理"
categoryId: 163
docId: 7106860526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-30T02:33:22.940Z"
---

# 如何注册、授权、使用Fedex

**一、定义**

**FedEx是国际常用的物流商之一。如果您注册有FedEx官方物流账号，按照这个文档来授权、开通渠道、设置客户物流渠道。**

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092243/a6c8b3b5d10795e763282c3d4e421f8f.jpg)

### 
** 二、操作流程**

**第一步：Fedex物流注册开通**

若您还未注册联邦账户，点击链接注册账户：[https://weblets.dmz.apac.fedex.com/BaC/zh-cn/account/details?leadid=DXMCN](https://weblets.dmz.apac.fedex.com/BaC/zh-cn/account/details?leadid=DXMCN)

**第二步：授权获取的口令**

【授权FedEx需要以下信息】

Key

Password

AccountNumber

MeterNumber

**【下面演示如何获取这些信息】**

**1、登录FedEx账号中，进入开发者中心**

访问链接：[https://www.fedex.com/en-us/developer/web-services/process.html#production](https://www.fedex.com/en-us/developer/web-services/process.html#production)

点击按钮“FedEx开发者资源中心”，开始获取授权信息。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092244/cb2a9307b11cbb77b55db099df99366e.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092245/8acb363cf508127b214ea44973ddebed.jpg)

2、 点击获取生产环境Key，出现下图所示页面，填写相关信息，点击“Continue”。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092246/955b2b8189f7e158eb0be8b06b302763.jpg)

3、点击“Continue”后，出现以下页面，点击“I Accept”即可。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092247/074156ee1cbc051339bc3ae22a430028.jpg)

 

输入相关信息，填写邮件地址

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092247/3fb4f0ff89af4268b652ceb022c51fab.jpg)

点击“Continue”后，显示以下页面，点击“Continue”。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092248/a1fe0378e7d6ca2e3e536dea25b0089f.jpg)

点击“Continue”后，出现以下页面，

提交成功后会显示key和meter number复制保存下来，在授权时需要使用。申请成功后，

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092256/0d1a148df4f888cf71e17c1e7be1fb2b.jpg)

同时你会收到一封邮件，FedEx会将当前授权账户的Password以邮件方式发送到上面填写的邮箱中。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250521092257/72a1b1bccfceecd5988109bf48b41043.jpg)

 

#### 
第三步：海外仓系统添加物流商

![cd17890b7347edefa74cab4bb7871bfa.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526071710/d27c3de32e33eb0b00f5c64a1a4aff79.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526071841/098441039cf8e94c58080d8488d52b82.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526071931/f03a83c06631c67c9b14ff0c3d025cf2.png)

如果使用的是卖家的FEDEX账号授权，则需要勾选使用第三方支付，并且填写第三方支付账号。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/7/20260730023306/d1b4ce69ae31b5a8c8a69f3f97606611.png)

第四步：启用FedEx下的物流渠道

![b70ac8ae41b9fdb8a488eea01a91c9f7.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526071955/e6f204f1537b0c3cc56e2b59bde0a238.png)

![863578e17253fd5d2b4d8ea8f3fb51ea.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526072005/bbbe3e71b7c42dbf943bdfce377c0a09.png)

第五步：开启客户FedEx下的物流渠道（卖家端OMS和ERP才能看见）

![80290bcec287ca3a7cb3701a60ed8ee8.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526072029/91307db0ec2db7c6d4bbc0cd6261822b.png)
