---
sourceId: "JF-OMS-OUT-018"
title: "卖家在temu后台购买面单同步OMS并推送极风WMS发货"
url: "https://help.jfwms.com/zh_CN/doc-article/7108370602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 出库 > 卖家在temu后台购买面单同步OMS并推送极风WMS发货"
module: "OMS帮助文档(新)"
category: "出库"
categoryId: 183
docId: 7108370602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-05T09:56:32.383Z"
---

# 卖家在temu后台购买面单同步OMS并推送极风WMS发货

**一、定义**

temu卖家没有使用erp、也没有使用极风OMS获取平台线上面单，而是通过在店铺后台获取面单，但是卖家的订单又需要极风海外仓系统仓库发货，就需要把temu平台的面单同步到OMS系统，然后推给极风WMS海外仓发货。

功能亮点：极风OMS会告诉客户哪些订单卖家已经在temu后台获取面单。

### 
** 二、操作路径**

**卖家登录卖家端（OMS）——平台订单——待处理——获取运单号——弹窗新增个勾选“TEMU订单支持使用在卖家中心或其他系统购买的面单生成出库单到WMS”——保存**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602114018/a33024d3fd90d230b80b1cfbfdb33e66.png)

![ca76aabbbd8840936dd12d8302e4862b.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605095629/7f0fd44bee916acebd57d4be62c9ba5b.png)

面单推送极风后，就在极风WMS的待打单页面，剩下极风海外仓系统的仓库就可以拣货、打单、发货啦

温馨提示：如果卖家已经在temu后台已经购买面单，没有勾选“TEMU订单支持使用在卖家中心或其他系统购买的面单生成出库单到WMS”，还在OMS获取运单号，这个订单会仍然留在待处理，并展示报错：订单已在卖家中心或其他系统操作获取运单号！这个就需要勾选后再获取平台面单。
