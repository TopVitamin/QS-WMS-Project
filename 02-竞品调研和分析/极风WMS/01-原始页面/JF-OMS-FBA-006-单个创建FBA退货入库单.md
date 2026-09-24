---
sourceId: "JF-OMS-FBA-006"
title: "单个创建FBA退货入库单"
url: "https://help.jfwms.com/zh_CN/doc-article/7108160602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > FBA退货 > 单个创建FBA退货入库单"
module: "OMS帮助文档(新)"
category: "FBA退货"
categoryId: 186
docId: 7108160602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-16T21:03:30.295Z"
---

# 单个创建FBA退货入库单

**一、定义**

FBA退仓，主要是因为FBA库存超龄需要节省成本存储海外仓，或者卖家店铺或者链接的原因，需要换个店铺或者链接销售，就需要将货件退回海外仓，创建FBA退货入库单，仓库根据FBA入库单进行入库，等卖家创建FBA出库单，仓库再重新换标、贴标、暂存海外仓，然后在发FBA仓库。

** 二、操作路径**

**第一步：维护FNSKU商品信息**

**卖家端OMS登录>商品>单个添加或者批量导入创建商品信息>添加FNSKU信息**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602091719/0e6d964993dbdcdc2063ea1821005286.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428064353/64b55c7159aefbdc7a2de2caeef8cb9b.jpg)

#### 

#### 注：可在创建FBA退货单页面直接新增商品FNSKU条码

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/23/20260616210300/f304faa772d232dbbbe0dbdba2b151f0.png)

**第二步:创建FBA退货单**

**卖家端OMS登录>退货>FBA退货>退货单管理>新建或者导入>填写FBA退货单信息，保存并提交>进入FBA待入库，这样仓库就收到FBA入库信息啦。**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602091830/a0e28603e1aa8e02c71b32b5d4941a22.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250428064354/bde9fba6c73446f58474d00a137744f0.jpg)

**特殊说明：一个tacking number创建一个退货入库单，如果tracking number比较多，建议使用导入创建**

**    然后选择商品:先在EXCEL表中整理好本次tracking number包含的FNSKU以及数量**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206022201/84abb5ea59a5310b405092cf4d8e4208.jpg)

**将复制的FNSKU、数量粘贴到添加商品弹窗中**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206022355/497ad0f6a2113780040b3ef65515e3cd.jpg)

**填写完成即可点击“保存”或者“保存并提交”**

![图片](https://download.jfwms.com/prod/static/back_help/img/4/20241206022451/1e3cfec9c6f7701d169427820180105a.jpg)

**提交成功的退货入库单，可在“待入库”列表查看**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260602091856/4b7951a42f3568667c2752f831d96134.png)

提交成功的订单，WMS回收到单据信息，然后货件到仓后，会进行签收、收货、上架处理

完成签收的退货单会进入“入库中”列表，

完成收货和上架的退货单会进入“已完成”列表
