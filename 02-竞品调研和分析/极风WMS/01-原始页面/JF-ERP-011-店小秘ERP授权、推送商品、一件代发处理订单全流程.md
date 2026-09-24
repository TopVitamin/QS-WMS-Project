---
sourceId: "JF-ERP-011"
title: "店小秘ERP授权、推送商品、一件代发处理订单全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7114440810-"
breadcrumb: "帮助中心 > WMS帮助文档(新) > ERP授权 > 店小秘ERP授权、推送商品、一件代发处理订单全流程"
category: "ERP授权"
categoryId: 178
docId: 7114440810
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-11T07:40:52.103Z"
---

# 店小秘ERP授权、推送商品、一件代发处理订单全流程

## 一、定义：
店小秘——跨境电商ERP行业领军者；

店小秘超130万卖家选择的跨境电商免费ERP，深度连接了70+跨境电商平台端、物流端和商家端，为您提供产品刊登、打单发货、数据采集、店铺搬家、数据统计、采购管理、库存管理、客服管理等一站式服务。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250427120820/59abf808f0ac6ae59aaf6b40571de500.jpg)

##  二、操作路径：

### 第一步：卖家登录OMS获取授权口令
操作路径：卖家端OMS>登录后>获取授权ERP口令>复制口令信息

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604115722/81cf8dc06e1909aa99d4e00140fb06ae.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/143/20260604115751/1c6a6218862b64baaca662c7ea69deed.png)

### 第二步：海外仓授权店小秘
登录店小秘>仓库>海外仓库>仓库设置>添加授权>选择要授权海外仓>填写信息>保存授权

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032248/a3fc72d834bef9b0b28c5f37a6a1925e.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032354/7075aa8aaf5f8bc6fbd89836ab13dec9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032542/9dd93ff028ab158930aa90bf30068546.png)

注意：

自定义名称：填写便于自己区分记住的就好email：必填，卖家端的账号邮箱token：卖家可以登录OMS系统自行获取，也可以是海外仓管理人员在WMS系统中获取之后发给买家

开启仓库：选择要开启的仓库即可

**授权成功后，要点击“开启备货建议”，才可以向授权的海外仓推送采购单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810032812/a0d57fe0150ac145d691049d12cd9046.png)

### 第三步：店小秘ERP推送商品至海外仓Step1.登录店小秘ERP系统，找到仓库>海外仓库>仓库清单>添加商品

点击“添加商品”，打开选择商品弹窗，选择要推送到海外仓的商品即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033045/1972adbe28bf2ab0998994024f4250a9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033124/7a56a3dd23cee77684a91e83e49f1bbb.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033259/dd003bc58eb40430c862175de20f697a.png)

 若没有商品可选择，则需要先在店小秘中添加商品（仓库>商品管理>添加商品）

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033437/35c8d05109aa5b763d6b2b12db937209.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033535/31f44afc2c0a4efbb1178399ba9ad4d4.png)

Tips:

1.如果完成了商品的创建，就直接点击保存。如果觉得单个创建商品比较麻烦，也可以用表格导入上传商品。

2.如果需要打印商品标签，可在OMS-商品板块里打印

### 第四步：推送入库单至海外仓
(或者用OMS创建入库单，更加方便快捷，可以参考文档：OMS如何创建入库单推送到海外仓WMS系统[https://help.jfwms.com/zh_CN/doc-article/7109110603-?edition=new](https://help.jfwms.com/zh_CN/doc-article/7109110603-?edition=new)）

前提：已授权的海外仓要先开启备货建议（仓库>海外仓库>仓库设置>开启备货建议）

**Step1.登录店小秘ERP系统，找到仓库>海外仓库>备货单**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810073259/db141600b3407442ea25b77ddfeadc9b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810073512/3b2a4f7083051083541586e959e83769.png)

审核通过后，备货单会进入待发货，点击发货即可推送至海外仓

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810073935/c164f27e34f05e296bdd2637c481df1a.png)

若备货单进入缺货列表的话，需要先手动补足海外仓库存，备货单才会进入“待发货”列表，手动点击发货后才能推送至海外仓

**补库存方式：创建一个手动入库单（仓库>入库管理>手动入库）**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810074519/dd9e645d19fda07be1831bfb3d27e2bd.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810075020/39b48f1d7d8a00a3adcc504ae5c6c004.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080210/d7f595e042d45bc369600074438987d9.png)

 

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080342/93e29e842cbedd4af7a4d3ae9f1f0b6f.png)

最后点击创建入库单，入库单价不需要管

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080442/151af0d4a47957ea0786481c47aad27a.png)

然后可以回到备货单的位置-缺货-- 移入发货---最后发货就好了（一定要写运单号哦）

#### Step2.同步海外仓库存
当WMS系统入库完成后，可以同步海外仓库存

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810080904/fdda89f394dbb004f280bfb01685c702.png)

### 第五步：开启海外仓物流渠道
（如果使用的是官方平台物流面单，就需要启用以海外仓命名的那条线上渠道。如果要是用海外仓合作的物流，那么就启用该海外仓下面的一些线下专线）

物流>选择物流方式>海外仓物流

#### Step1.按海外仓库名称搜索出物流

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810081905/4e2c0b6a599694f4a364ac1056e3ce15.png)

#### Step2.开启物流渠道
如果要走官方平台面单，就选择线上物流渠道；如果是使用仓库合作的物流，启用对应的物流专线即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810082057/e47175a64a6e92419b96f4c836edecac.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090437/49dfed9318de1565933143c7988dee10.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090438/67cb7393ab59f5eb90223d6f7001832c.jpg)

### 第六步：推送订单至海外仓
**Step1.点击店小秘-订单-订单处理，先审核订单，然后订单进入待处理**

待处理—勾选订单—批量操作—批量选择物流方式，选择海外仓物流渠道

（如果用的是官方平台面单就选择用海外仓命名的线上物流渠道，如果是使用海外仓合作的物流，就选择海外仓合作的已经启用的物流专线），最后选择 保存/保存并申请运单号

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810082930/fc4c894cdc3e4588f59406b579e5aa7e.png)

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810130036/c9d57b63e8f955f7e6ebf5352c2c7f3b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810083431/51de5d1af7bf7c245699313cc4a68b4e.png)

可在运单号申请-海外仓库列表查看运单号获取情况

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810083728/ab52c191b197d00c6e2c7ef37dad0bc5.png)

**Step2.运单号申请成功后，需要手动点击发货，将运单号提交给平台**

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090440/f381301d5454c0fa5399c4cda931b0b1.jpg)
