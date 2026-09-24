---
sourceId: "JF-BAS-007"
title: "余额不足预警功能设置"
url: "https://help.jfwms.com/zh_CN/doc-article/7113650707-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 基础设置 > 余额不足预警功能设置"
category: "基础设置"
categoryId: 159
docId: 7113650707
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-07T12:48:35.619Z"
---

# 余额不足预警功能设置

**功能目的：当前业务场景中的出现的异常情况，以“事后呈现”为主，依赖人工巡检、人工对账、线下沟通等。库存不足、库存滞留、账户余额不足及仓内作业异常等风险往往在结果发生后才被发现，直接影响卖家补货节奏、订单履约时效、仓储成本控制和客户服务体验。——因此，我们极风WMS设计了预警功能，可以极大程度地提升海外仓的工作效率-本篇 文档介绍的是余额不足的功能预警设置（其他的预警功能可以在帮助中心搜索相关的预警功能即可）**

# 操作步骤

## 余额不足功能预警设置

### 1.首先这个功能需要我们海外仓先在客户板块维护客户的预警余额，点击客户-审核通过-批量勾选客户-批量设置预警金额即可
**注意： 预警金额：当低于预警值，且创建了余额不足的预警规则时，会产生预警**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707112826/73af0d5f9316da2a9ee7efa1546bb34e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707113209/2f78a3690e5d191338cce7f04c38b990.png)

**2.点击WMS-设置-基础设置-预警设置-添加规则-进入相关页面操作设置即可**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707112145/44c17bdef520c996dc6ad6d74c25e3be.png)

**注意： 通知设置- 重复提醒功能： 开启后异常每次触发均重复提醒。关闭后即即时仅一次提醒；定时仅当日已选时间节点提醒，次日不再重复。所以有时候不弹窗了，有可能是没有开启这个功能，系统提示过一次或者手动关掉了，就不会再提示了。但是可以去消息通知就是小铃铛的位置看历史的提示消息即可。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707123343/007a18e4d0da316bffc95bf72bf58966.png)

**WMS效果展示：**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707121206/784ce5893587425ff957cb21b766497d.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707121450/0a88f0f8f5b464dd226ec63d8b72fe5a.png)

**OMS效果展示如果勾选了通知OMS主账号，那么OMS主账号也会收到类似的弹窗，效果如下**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707122206/1704026727bf311813a6e378635fb308.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260707122343/94331a4986349f956b0c1a628c87b6b8.png)
