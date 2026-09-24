---
sourceId: "JF-OMS-ERP-004"
title: "多个店小秘ERP对接同一个OMS系统处理订单流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7108460602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > ERP授权 > 多个店小秘ERP对接同一个OMS系统处理订单流程"
module: "OMS帮助文档(新)"
category: "ERP授权"
categoryId: 180
docId: 7108460602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-10T13:01:21.501Z"
---

# 多个店小秘ERP对接同一个OMS系统处理订单流程

## 一、定义
店小秘免费版只支持免费授权1个店铺，不限采集上品数量，不限单量，所以有许多卖家使用免费版。如果使用多个店小秘ERP推单到同一个OMS处理订单，就需要把多个店小秘账号授权到同一个OMS账号处理订单，具体的操作流程如下

如果一个卖家的OMS的商品需要多个店小秘配对和处理订单，就需要把OMS账号同时授权多个店小秘。如果卖家客户使用店小秘ERP批量管理多平台多店铺，创建备货单到海外仓，处理订单自动推送到海外仓和海外仓库存自动同步到多个店铺，需要看这个操作。

**适合角色：**

1.卖家开通多个免费店小秘账号（售卖的都是同一批商品SKU），海外仓给卖家开户只有一个OMS（卖家端），但是订单分散在各个店小秘ERP，需要把各个店小秘订单汇总到一个OMS，统一推送给海外仓。

2.培训机构或者货盘：海外仓给货盘或者培训机构开通一个OMS（卖家端账号），结果货盘或者培训机构下有很多卖家，每一个卖家都在用各自的店小秘账号，对于货盘或者培训机构来说，希望OMS账号的商品能够给所有卖家使用，帮他们处理订单。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250818093851/f447e1b36c165ba77232113328203313.jpg)

## ** **二、操作路径

### 第一步：登录OMS获取授权口令
登录OMS后，鼠标移到右上角账号名处，点击“获取token”即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030918/cdfebaf55582c1854830763905c88169.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260605030701/4d14e39225a05a350c8f241b3824ed24.png)

### 第二步：海外仓授权店小秘
在店小秘-仓库-海外仓库-仓库设置-添加授权，

登录店小秘>仓库>海外仓库>仓库设置>添加授权>选择要授权海外仓>填写信息>保存授权

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032248/a3fc72d834bef9b0b28c5f37a6a1925e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032354/7075aa8aaf5f8bc6fbd89836ab13dec9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032542/9dd93ff028ab158930aa90bf30068546.png)

注意：

自定义名称：填写便于自己区分记住的就好email：必填，卖家端的账号邮箱token：卖家可以登录OMS系统自行获取，也可以是海外仓管理人员在WMS系统中获取之后发给买家

开启仓库：选择要开启的仓库即可

**授权成功后，要点击“开启备货建议”，才可以向授权的海外仓推送采购单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032812/a0d57fe0150ac145d691049d12cd9046.png)

使用同样的授权方法，把所有的店小秘ERP都授权到同一个OMS里即可。

### 第三步：不同店小秘里的商品与OMS里同一个商品SKU配对
不同的店小秘ERP分别与同一个OMS授权后，再把不同店小秘里的商品（售卖的都是同一批SKU货盘）与OMS里同一个商品SKU配对，这样就能在OMS里集中处理分散在各个erp上的订单，集中管理同一个SKU的库存，避免库存混乱。

#### **step1：首个授权的店小秘ERP商品与海外仓商品配对（这种情况一般极风OMS里还没有商品）**
操作以下步骤的前提是店小秘ERP已经与店铺授权

![店小秘产品映射.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260807060431/3b6eb2c8ba4ac0e3fb47b07b9083220a.png)

![店小秘产品映射1.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260807060505/1cc75c2043c3b302d6a1852cdc100db7.png)

![店小秘产品映射2.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260807060521/6324f892b26b1afb654c45a5432975f4.png)

PS：从店小秘ERP推送商品到极风OMS，会自动生成配对关系，无需再进行手动配对

#### **step2：第二个及之后授权的店小秘ERP商品与海外仓商品配对（这种情况极风OMS里已经有商品SKU了）**
**①此时，店小秘里还没有商品，所以先把平台店铺的SKU拉到店小秘ERP里**

![店小秘产品映射.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260807060431/3b6eb2c8ba4ac0e3fb47b07b9083220a.png)

**②因为在前面的步骤里，已经把商品推到极风OMS了，所以在这里，直接点同步库存，就可以把OMS里的商品SKU拉取到店小秘海外仓库里**

注意：点同步库存能把OMS里的SKU拉取到店小秘的前提是，OMS里的商品要有库存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810121925/330ef74d95b37f1f22b08556309323d7.png)

#### ③通过导入形式创建商品配对关系
把第一个授权的店小秘里的商品配对关系导出

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810122540/937b58cfafd8d7c867da6f41a67b07b6.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810123847/36c9c40614969814ccee2ceed8c5dfef.png)

回到当下要做配对的店小秘账号里，下载“导入更新配对”的表格

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810123724/140217f0b879b767dd8655ffddf6e147.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810123947/90f822d373e47d030d0bcbf884a7390d.png)

把前面导出的“海外仓商品SKU”和“商品SKU（对应店小秘SKU）”复制到导入表格里即可，完善表格后，再点击导入，上传该表格文件即可完成配对关系

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810124302/92b0da1da34328e2c7354a753ad43115.png)

根据step2的流程，完成第三个及后续店小秘ERP的商品配对

### 第四步：在各个店小秘启用海外仓物流渠道

#### **Step1.按海外仓库名称搜索出物流**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810081905/4e2c0b6a599694f4a364ac1056e3ce15.png)

**Step2.开启物流渠道**

如果要走官方平台面单，就选择线上物流渠道；如果是使用仓库合作的物流，启用对应的物流专线即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810082057/e47175a64a6e92419b96f4c836edecac.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090437/49dfed9318de1565933143c7988dee10.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090438/67cb7393ab59f5eb90223d6f7001832c.jpg)

### 第五步：在各个免费的店小秘上处理订单，推送到同一个海外仓
**Step1.点击店小秘-订单-订单处理，先审核订单，然后订单进入待处理**

待处理—勾选订单—批量操作—批量选择物流方式，选择海外仓物流渠道

（如果用的是官方平台面单就选择用海外仓命名的线上物流渠道，如果是使用海外仓合作的物流，就选择海外仓合作的已经启用的物流专线），最后选择 保存/保存并申请运单号

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810125525/64f5862e1bd3b807b34cd74263ddf13f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810130036/c9d57b63e8f955f7e6ebf5352c2c7f3b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810083431/51de5d1af7bf7c245699313cc4a68b4e.png)

可在运单号申请-海外仓库列表查看运单号获取情况

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810083728/ab52c191b197d00c6e2c7ef37dad0bc5.png)

**Step2.运单号申请成功后，需要手动点击发货，将运单号提交给平台**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090440/f381301d5454c0fa5399c4cda931b0b1.jpg)
