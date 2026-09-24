---
sourceId: "JF-LOG-008"
title: "物流追踪新增待追踪环节"
url: "https://help.jfwms.com/zh_CN/doc-article/7114850826-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 物流渠道管理 > 物流追踪新增待追踪环节"
category: "物流渠道管理"
categoryId: 163
docId: 7114850826
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-26T10:42:03.404Z"
---

# 物流追踪新增待追踪环节

**需求背景：****为了部分订单因为在追踪之前没有匹配运输商，注册失败，导致无法在正常追踪页面看到这部分订单数据，因此在WMS -出库-物流追踪板块新增了“待追踪”部分，允许注册失败后（也就是追踪失败后）根据失败原因修改后重试，操作步骤如下：**

## 一，关于待注册状态的订单包裹
**待注册状态的订单指的是：系统会自动定时批量拉取物流轨迹的订单，一般系统每间隔3分钟，都会自动拉取一次**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260826103849_d55885c34f454ccaa2d46c629200b1b2.png)

**PS ： 要注意，不是所有已发货的订单系统都会自动拉取物流轨迹，下图中的订单类型，系统将不会自动拉取**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260826103946_6c11ed029d6e43f1802191cd6a7cedeb.png)

## **二，关于注册失败状态下的订单包裹**
**注册失败状态指的是：系统在自动拉取物流轨迹过程中失败的订单，系统会显示失败原因，可以根据失败原因（比如没有匹配运输商）进行修改调整后，批量勾选订单进行二次追踪。操作如下图：**

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260826104058_c8cadf2a5c9949afb9ec858dd986f5cf.png)

![image.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/6/20260826104121_f02aa690461443c18d5f4a52abcc0e73.png)
