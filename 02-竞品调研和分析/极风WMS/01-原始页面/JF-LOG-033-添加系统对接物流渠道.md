---
sourceId: "JF-LOG-033"
title: "添加系统对接物流渠道"
url: "https://help.jfwms.com/zh_CN/doc-article/7107130526-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 添加系统对接物流渠道"
category: "物流渠道管理"
categoryId: 163
docId: 7107130526
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-20T19:52:51.443Z"
---

# 添加系统对接物流渠道

### **一、定义**
极风WMS对接了全球多个主流物流渠道，实现物流商和WMS数据实时交互，直接获取物流商面单、运单号信息，通过wms直接打印不同物流商面单，仓库使用的物流渠道如果是系统对接的，可以直接添加系统对接物流渠道。

** 二、操作路径**

**第一步：添加物流商**

仓库端WMS>物流>物流商管理>对接物流商>添加物流商>选择极风系统已经对接好的物流商，填写物流商信息和口令，授权不同物流商填写信息不同，填写完成后>点击授权

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526103650/57e99e34540c3c29dae45d22c0eaf23b.png)

搜索需要授权的物流商，例如USPS，UPS、FEDEX、&T CARGO (BR)等等。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604053042/3b71a1e30739c1b865d96ce6ef6befaf.png)

**第二步：添加物流商渠道**

**操作路径：物流商管理>渠道管理>添加渠道>填写渠道代码、名称，选择运输商>确认**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526103752/8d5b47e0e61db7132ebb15f1912c0ce7.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526103831/5f01b70e5fc11f9aa2abf83d466cb482.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526103913/a88b190016e80a3879bcba71cbce8de4.png)

若涉及同一个注入口岸，不同物流商有不同的注入口岸编号的情况，可在具体物流渠道添加注册口岸。

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260526104031/0d7497e5877ef0648fca12c57c9e2cd6.png)

附：物流商对接情况

目前已对接的主流尾程物流平台：USPS、UPS、DHL、AmazonShipping、CORREIOS（巴邮）、GLS（IT、DE）、J&T EXPRESS（MX）、iMile、Shippo、ShipSaving、ShipStation、菜鸟国际、华磊、中达云、海豚云、PostPony、易抵达、J&T CARGO (BR)等等

注意：不同的物流商，需要填写的授权信息不相同，根据要求填写即可
