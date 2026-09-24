---
sourceId: "JF-OMS-GEN-016"
title: "海外仓WMS的库存支持同步到TIKTOK平台"
url: "https://help.jfwms.com/zh_CN/doc-article/7115030901-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > OMS > 海外仓WMS的库存支持同步到TIKTOK平台"
module: "OMS帮助文档(新)"
category: "OMS"
categoryId: 189
docId: 7115030901
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-09-03T07:19:06.703Z"
---

# 海外仓WMS的库存支持同步到TIKTOK平台

# **一、需求背景**
部分平台对商家发货时效有严格要求，超卖会扣分并降低店铺权重。为保证平台库存和海外仓库存⼀致，需要将海外仓库存同步给店铺。

注意：目前因平台订单规则、智能分仓与库存同步都需要做仓配映射，可能会导致冲突，目前建议三种功能不要同时全部启用

# **二、操作步骤：**

## **1.SKU映射关系/组合商品映射关系**

![产品映射.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/77/20260901033129_08a7810882764862a62fc0931b6ee035.png)

具体产品映射关系的操作步骤请参考：

[https://help.jfwms.com/zh_CN/doc-article/7109020603-?edition=new](https://help.jfwms.com/zh_CN/doc-article/7109020603-?edition=new)

## **2.仓配映射**

![仓配映射1.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/77/20260901033142_8b84a424cd774709832a66f9c94d7aa9.png)

![仓配映射2.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/77/20260901033153_c61224911b0a44a3872f157bb9b01e30.png)

规则互斥说明：一旦配置了仓库映射，原有的平台订单规则和智能分仓将不再执行

唯一性约束：系统内的一个SKU加店铺组合，仅允许在同一条规则中启用，严禁重复开启

## 3.创建库存同步规则

![库存同步1_2026-08-25_15-56-53.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/77/20260901033450_6bb62db63f284277a2b637f6eaccf700.png)

![库存同步22026-08-25_19-50-57.png](https://wms-1382655522-cos.jfwms.com/public/help/prod/system/img/77/20260901033500_c444624d6f75415fad65eea61f5314a5.png)

**库存同步频率：**

自动同步：库存量大于500时，系统仅通过每日定时任务更新；低于500时，系统会在库存变化后实时推送，频率约为10-15分钟。

手动同步：每条启用的规则最多每2小时允许执行一次手动同步操作。

**同步策略设置：**

基础同步：常规补货可按固定比例进行同步；如需应对库存波动，可分段设置库存同步比例

特殊同步：防止商品下架，可设置库存为0自动推送固定值，但一定要警惕库存超卖的情况！！！
