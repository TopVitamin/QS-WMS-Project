---
sourceId: "JF-OMS-DIS-001"
title: "店小秘ERP卖家分销海外仓商品全流程"
url: "https://help.jfwms.com/zh_CN/doc-article/7107960602-"
breadcrumb: "帮助中心 > OMS帮助文档(新) > 分销 > 店小秘ERP卖家分销海外仓商品全流程"
module: "OMS帮助文档(新)"
category: "分销"
categoryId: 190
docId: 7107960602
fetchDate: "2026-09-24"
status: "已抓取"
updateTime: "2026-08-11T07:35:51.266Z"
---

# 店小秘ERP卖家分销海外仓商品全流程

## 一、定义
店小秘ERP卖家，对接使用极风WMS海外仓的货盘，上架到自己店铺，出单后自动推送订单给海外仓发货，实现店小秘ERP快速上品、订单自动回传、分销自动结算、库存自动同步到多平台和多店铺，避免超卖。

温馨提示：如果极风WMS海外仓有货盘分销业务，请联系极风WMS服务人员开通分销功能。

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20251209053952/4fb4b3c06c5038d8388b3396cdf6211f.jpg)

##   二、操作流程

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

### 第二步：卖家在OMS端认领分销产品

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811034009/9220654a6e8df267b824adfe08b1dcc2.png)

可申请每个分销商品的专享库存，即可独占这部分库存，不再和其他分销商共用的同一批库存

点击查看详细教程：专享库存[https://help.jfwms.com/zh_CN/doc-article/7114400807-?edition=new](https://help.jfwms.com/zh_CN/doc-article/7114400807-?edition=new)

### 第三步：卖家通过店小秘ERP一键采集，把货盘商品搬家到自己店铺
卖家提供货盘在线商品链接，便于店小秘采集刊登，具体可以看产品刊登模块教学。

### 第四步：在店小秘ERP建立店铺商品和海外仓分销商品的配对关系，避免错发、漏发

#### **1.卖家在店小秘ERP创建自己仓库商品sku**
店小秘ERP仓库>商品管理>添加商品>创建的商品sku

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033437/35c8d05109aa5b763d6b2b12db937209.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810033535/31f44afc2c0a4efbb1178399ba9ad4d4.png)

#### **2.同步海外仓库存**
店小秘ERP>仓库>海外仓库>仓库清单>同步库存，将海外仓在WMS设置好的分销商品库存同步到店小秘

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811070835/a984bd95a9010b0e8a8cb673556e7468.png)

#### **3.建立海外仓分销商品与店小秘ERP商品配对关系**
店小秘ERP>仓库>海外仓库>仓库清单>匹配商品

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811071034/b50728836c9a6cc0fbf3f0bff30b83a9.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811071121/0bcf3279f353af97088ec1171a5c5928.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811071229/2b52cc4d5553b8d2ec8e7540942b1a13.png)

#### **4.建立平台店铺在售商品与店小秘ERP产品配对**
仓库>商品配对>平台产品与店小秘ERP产品配对关系，可以指定配对也可以手动自动识别配对

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811071859/a81d97fd53efaa5de76123da2d7aba0f.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811072128/65dcccddd1af1db77a16bd2065055bb0.png)

### **第五步：在店小秘ERP批量处理分销产品订单，自动推给海外仓发货**

#### 1.开启海外仓物流渠道
登录店小秘ERP系统>物流>海外仓物流>选择海外仓>启用物流渠道>设置平台映射关系>确认

注意：不是所有海外仓和渠道都支持推送线上面单，需要和海外仓确认清楚后，再启用。

**Step1.按海外仓库名称搜索出物流**

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810081905/4e2c0b6a599694f4a364ac1056e3ce15.png)

**Step2.开启物流渠道**

如果要走官方平台面单，就选择线上物流渠道；如果是使用仓库合作的物流，启用对应的物流专线即可

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810082057/e47175a64a6e92419b96f4c836edecac.png)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090437/49dfed9318de1565933143c7988dee10.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090438/67cb7393ab59f5eb90223d6f7001832c.jpg)

##### 案例：如果是temu线上面单，海外仓映射关系和仓配关系设置

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250827081225/c5c9879e396d272d7e6cc7cc003f079a.jpg)

#### 2.为订单分配物流渠道
在店小秘ERP>待处理>勾选订单>批量操作>批量选择物流方式，选择海外仓物流渠道>选择 保存/保存并申请运单号

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810082930/fc4c894cdc3e4588f59406b579e5aa7e.png)

![图片](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810130036/c9d57b63e8f955f7e6ebf5352c2c7f3b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260811072942/90b76dd9c1e5c5916ff13d72fda3475b.png)

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810083431/51de5d1af7bf7c245699313cc4a68b4e.png)

可在运单号申请-海外仓库列表查看运单号获取情况

![image.png](https://wms-1382655522-cos.jfwms.com/prod/temp/system/img/34/20260810083728/ab52c191b197d00c6e2c7ef37dad0bc5.png)

运单号申请成功后，需要手动点击发货，将运单号提交给平台

![图片](https://download.jfwms.com/prod/static/back_help/img/2/20240829090440/f381301d5454c0fa5399c4cda931b0b1.jpg)

【温馨提示】如果你需要分销多个海外仓商品，可以在店小秘设置多个海外仓产品物流规则，系统会自动根据产品分配海外仓和物流，自动处理订单，避免人工出错。看教学视频抖音号：dianxiaomi，海外仓管理模块，店小秘货盘分销教程。

### 第六步：设置海外仓分销商品库存同步多平台，避免超卖

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250827082308/a05b2ce0dc478ca0074b18d802ab4cde.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250827082313/1772904a4e477bdca51f5474f4c4222e.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250827082322/356952139bedd56a97fad667261e53ff.jpg)

![图片](https://download.jfwms.com/prod/static/back_help/img/74/20250827082331/147c77e113d00d93683e95110adbde7e.jpg)
