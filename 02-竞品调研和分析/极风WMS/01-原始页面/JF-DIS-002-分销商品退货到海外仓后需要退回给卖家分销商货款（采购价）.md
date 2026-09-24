---
sourceId: "JF-DIS-002"
title: "分销商品退货到海外仓后需要退回给卖家分销商货款（采购价）"
url: "https://help.jfwms.com/zh_CN/doc-article/7107700602-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > 产品分销 > 分销商品退货到海外仓后需要退回给卖家分销商货款（采购价）"
category: "产品分销"
categoryId: 174
docId: 7107700602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-04T11:28:53.021Z"
---

# 分销商品退货到海外仓后需要退回给卖家分销商货款（采购价）

**一、定义**

当海外仓有商品需要其他卖家客户（卖家）分销，可以使用极风WMS分销功能：

1、先设置哪些客户有权限分销，分销商星级设置2、然后设置哪些产品可以分销3、并为不同的星级的客户设置不同价格，如果分销产品不设置分销等级客户价格，那么该星级客户就看不到这个分销产品。

4、卖家客户在OMS系统查看分销产品和认领分销，

5、出单后，海外仓帮忙打包发货，并自动扣减商品库存、商品分销价格和仓库打包费等费用。​

6、当分销商（卖家）分销的商品，被消费者退货到海外仓后，海外仓检查商品没有问题可以二次销售，海外仓可以设置系统自动退回卖家分销这个商品的采购价。

这个帮助主要讲极风WMS设置分销商品退货后系统自动退回商品分销价。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223073014/359bd40daa02b68d77c0019c0f2ba266.jpg)

### 
** 二、操作路径**

**第一步：海外仓设置分销客户计费方案，退货分销商品返还货款**

**仓库端WMS>计费>应收模版，针对分销客户的计费模版，编辑**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602043102/f276cc49c43253aced0e1f40c8da8fe0.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251223073143/d60d53ac0ba96faa715eea0a8d9bb32a.jpg)

**第二步：买家签收包裹退货，卖家要在极风OMS创建退货单关联之前订单号**

**【买家没有签收退回包裹无需创建退货单】**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602043150/58e4bbf6ac7761ff71c49cb302ac6ffd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602043225/99a1a4f210b9d4345c0fcff57c84c84e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604112849/39c6e3be09582623277dd1b1ebff2365.png)

**分销商品退货后，海外仓就可以在费用业务费用模块列表、详情查看关于“分销商品退款”费用相关数据，应收账单、例如按计算模块也是如此。**
