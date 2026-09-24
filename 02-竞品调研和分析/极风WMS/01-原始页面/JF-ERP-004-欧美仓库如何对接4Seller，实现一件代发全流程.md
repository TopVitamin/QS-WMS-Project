---
sourceId: "JF-ERP-004"
title: "欧美仓库如何对接4Seller，实现一件代发全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108870603-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > ERP授权 > 欧美仓库如何对接4Seller，实现一件代发全流程"
category: "ERP授权"
categoryId: 178
docId: 7108870603
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-06-03T06:21:13.458Z"
---

# 欧美仓库如何对接4Seller，实现一件代发全流程

### 一、在4Seller上面授权店铺（授权店铺时要注意在店铺的网络IP环境下完成授权）

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092730/d1d8eea84f23f0f77bd6b5fec483d8e8.jpg)

### 二、在4seller上面开启库存扣减

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092731/051044ecbce02e5c562a402814361a77.jpg)

### 三、设置第三方海外仓库（找到自己要使用海外仓进行设置）

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092731/4bf1ccc9aa6d03870420b25c5d40cce4.jpg)

点击创建之后会弹出来一个框，按照图片完善信息后确认即可

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092732/8c5a05d236ce2f8dad0afbe568abd44c.jpg)

### 四、物流商
如果是线上平台面单，要提醒海外仓在WMS上面开启线上物流的专线

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260603061654/e133ce60e05b18775a70abfda93de090.png)

如果是线下物流，那么就需要仓库WMS这边提前设置好线下物流渠道~

### 五、推送商品到WMS海外仓系统

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092734/87f61dbb36dad1c80a551b5d6b4bc3e5.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092735/a1696e8f3ff3dca75875671f3d5413ff.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092735/14d12e3b62c66d7d7c5b643b280b7386.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092736/cfcae761cdd5f941d1cc2c72c5efb240.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092736/2d9d2ca83138425fa6299574c31dcd5a.jpg)

##### Tips ：如果选择3PF商品的时候找不到商品怎么办？
需要到对应平台已发布的产品里面重新编辑，然后同步商品即可。操作如下

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092737/3da2792c387d30551e13096300733458.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092738/76099ab7992026df5e21561b4d199169.jpg)

 

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092739/a5aea361a807843b8aefbf3ac50bf986.jpg)

 

### 六、推送备货单（入库单）到WMS海外仓（操作这个步骤之前要确保自己OMS账号上面是有足够余额推送入库单的）

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092739/8ae958733855ae82c795d7193e12fe2f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092740/4b62a64d56ea25179259ba0884b62fe2.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092741/24b27828f5c53c0fa00d9ce9de8cbab6.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092741/bb1315aa7ab2dd11e34185092d6e1f0f.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092742/4da8b6e06028e7c9b891f07b67cc4983.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092743/7ac633c7a9f29bedff70d3dda1ed9394.jpg)

### 七、同步三方海外仓WMS的库存

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092744/e8b74a7abc8d39a7d88a64e1dcbd1bad.jpg)

### 八、如何在面单上加打SKU信息推送给海外仓？

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092744/4dfda9687cabe97691c1cf2b34ca5a0e.jpg)

 

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092745/94d09463bd8e9d6314e704928ca610df.jpg)

 

### 九、如何推送线上平台官方订单到WMS海外仓系统

#### 1、**订单处理-待审核**
点击**订单**模块，进入**待审核**页面，可勾选订单后点击**批量修改**下方的**仓库**可批量修改发货仓库

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092746/b38a6d989b9706da81a2b88f94cf8c09.jpg)

选择相应的极风WMS仓库然后点击**保存**即可将订单的发货仓库批量修改为极风WMS的仓库

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092746/5467b1c089a3eaf03e981e2b5f34c0c4.jpg)

#### 2、订单处理-待处理
当订单的SKU已匹配且可用库存不缺货时，订单即会自动流转到待处理流程中

**1）单个操作**

单个点击TikTok Shipping订单的**购买订单**即可进入购买面单的页面

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092747/0f95bf0b30825e77d87957ef5cfacafb.jpg)

在订单的购买面单页面，可进行以下操作：

1.可更改发货仓库

**注意：**“平台发货”的订单，此处的仓库仅用于库存扣除，标签地址基于创建产品时选择的仓库地址2.可填写包裹信息，包括包裹重量和尺寸3.确认物流商为TIKTOK

4.可选择TIKTOK提供的物流计费服务

最后点击购买面单即可将订单推送至已选的极风WMS仓库并购买面单

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092748/e8ee2ab28117f95c3dc275b600f115e0.jpg)

 

**注意：**在批量处理TikTok Shipping的订单时，需先在**买家指定**筛选栏中筛选出**TikTok Shipping**的订单

**筛选订单**

**2)批量操作**

**更新包裹信息**

可批量勾选订单，点击**批量修改**下的**包裹**，即可批量编辑包裹信息

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092749/94d5df772c40e10007bdc03fd664c726.jpg)

 

在编辑包裹信息页面，可填写包裹重量，选择相应的尺寸模板或手动输入尺寸，最后点击**保存**即可为已选订单批量修改包裹信息

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092749/21742146a1f16f26d2eb7d2decf72d6a.jpg)

**更新物流信息**

勾选订单后，点击**批量修改**下方的**物流信息**即可批量修改物流信息

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092750/a1696e8f3ff3dca75875671f3d5413ff.jpg)

在修改物流信息页面，确认物流商为TIKTOK，然后选择一个**物流服务**，最后点击**保存**即可为已选订单批量修改物流信息

 

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092751/c6fafa074429b723140f2ce60f442fca.jpg)

更新完包裹和物流信息后可点击上方的**购买面单**，即可将已选订单推送至极风WMS并为其批量购买面单

 

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092752/b84394c2c622cfd6ab80050606133bea.jpg)

**3）快捷操作**

点击**包裹**和**物流**栏下方的**方框**可以快捷输入包裹的重量和尺寸以及选择物流服务

 

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092752/a0bbf67b7e1f450d0a975a544c3f5aff.jpg)

#### 3、订单处理-处理中-3PF仓库
已购买面单的订单即会流转到3PF仓库的处理中的流程中，订单会有三种状态：

**①.失败：**

**买面单失败：**即订单购买面单失败

**推送3PF失败：**即订单推送至极风WMS失败 **发货失败：**即将运单号推给订单所在平台发货时失败

**注意：**在失败流程中的订单可申请再次操作

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092753/4001d4d266c9515a3e3e552638850f9a.jpg)

**②处理中：**

**购买面单中：**即正在为订单购买面单中

**推单中：**即正在推送订单到极风WMS

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092754/e355c2c636212de88549448d5181ce19.jpg)

 

**③三方仓处理中：**面单购买成功但未返回运单号

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092754/616a74611cf1c648a5b1ccd2762f58d3.jpg)

当订单申请到运单号并且成功提交到订单所在平台后，订单会自动进入到**Shipped**状态，即发货成功。

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092755/c64d2cde0cd32265763d404dfa9e2554.jpg)

 

### 十、如何推送线下订单（需要仓库提供面单的订单）给WMS海外仓系统

#### 1.需要在4seller打开仓库已经配置好的线下物流渠道

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092756/bb615290a692bda7927228e3161fb0d9.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092757/b7c83de5f998045a312f05b57f2743d4.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092757/6da2ffb82f78ec5d3e9fe3c10213e390.jpg)

#### 2.进入订单处理环节进行操作（用单个订单推送举例，跟线上推送步骤一样，核对好物流商即可）

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240905092758/93e37569b58cd23d9f26fa9c1892182b.jpg)
