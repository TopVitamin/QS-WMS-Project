---
sourceId: "JF-OMS-GEN-020"
title: "平台订单规则设置"
url: "https://help.jfwms.com/zh_CN/doc-article/7109050603-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > 平台订单规则设置"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7109050603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-07-21T02:43:06.831Z"
---

# 平台订单规则设置

**一、定义**

平台订单规则用于自动处理平台订单的物流、仓库分配，自动获取运单号、自动推送到WMS等业务，使用后，可加速订单数据的推送和流转，简单大量对常规订单的审核工作，提高工作效率。

** 二、操作说明**

**1、列表查看**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605073817/6c451c54cedaba6d407192434913a8dc.png)

（1）订单规则列表支持查看规则优先级、规则名称、规则状态，支持编辑规则以及更改规则状态。

（2）鼠标移入到优先级icon处，可拖拽调整优先级，也可以点击置顶icon快速将此规则调整到优先级1。

（3）规则执行逻辑：每个平台订单根据优先级顺序，有且仅执行1次，禁用状态自动忽略。

**2、新建订单规则**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603081547/1c488fc479cc07a1c3bb76ee31fe4f10.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/6/20260705125513/9ef321c644238fe6f95f200881b91ab4.png)

**如果规则应用范围设置了一定条件的订单，可以设置订单平台、订单站点、订单店铺、订单收件信息的国家、省、州、订单商品sku、重量、商品数量等。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260720104929/266e76d239d947d73e6bb1f648cefb98.png)

**平台订单规则在开启智能分仓后，可以开启运费试算金额范围限制功能，在设置的试算金额范围内的会自动推送，不在范围内的则会自动拦截。**

![企业微信截图_17845438738715.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260720103934/c5b8b67644f6cc3e73ecb1d43b0abb35.png)

![企业微信截图_17845438899727.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/84/20260720103945/8816361ff840f6a33793372683966da8.png)
