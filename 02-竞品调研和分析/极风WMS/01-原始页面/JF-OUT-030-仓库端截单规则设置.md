---
sourceId: "JF-OUT-030"
title: "仓库端截单规则设置"
url: "https://help.jfwms.com/zh_CN/doc-article/7107500601-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 出库 > 仓库端截单规则设置"
category: "出库"
categoryId: 170
docId: 7107500601
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T12:49:51.908Z"
---

# 仓库端截单规则设置

**一、定义**

仓库需要对用户取消订单做相应的限制，不允许用户随意取消订单！

** 二、操作路径**

**设置-业务设置-出库设置-一件代发订单截单设置**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604124711/db141600b3407442ea25b77ddfeadc9b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604124812/83dfe5bb456ab8c6788752f8b696f959.png)

**1.是否允许截单**

**（1）允许截单：即OMS手工单、ERP订单推送至WMS后，允许用户操作取消**

**（2）不允许截单：即OMS手工单、ERP订单推送至WMS后，不允许用户操作取消**

**2.允许截单的状态：可以选择获取运单号、待移货、待生成/待打单、待拣货、待包装、待发货、异常这几个状态哪些状态下允许截单**

**3.是否需要人工审核：**

**（1）无需人工审核：即卖家客户操作取消订单时，系统判断该订单的状态属于允许截单的状态时，则系统自动取消订单成功**

**（2）需要人工审核：即卖家客户操作取消订单时，系统判断该订单的状态属于允许截单的状态时，则需要仓库人员在“截单”列表审核**

** **

**截单审核列表说明**

**入口：出库-订单管理-截单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604124908/076988540ad904d75b550f5b6db34cca.png)

**只有当设置截单需要人工审核时，卖家客户申请截单的订单才会在“待截单”列表**

**（1）标记成功：即允许卖家客户取消订单**

**（2）标记失败：即不允许卖家客户取消订单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260601093350/4e2c0b6a599694f4a364ac1056e3ce15.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604124949/06502cae73f3c50507665afddb73b92c.png)

** **
